"""PDF upload + lab value extraction."""
import os
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models import UploadedReport, User
from app.services.pdf_parser import parse_pdf

router = APIRouter(prefix="/api/reports", tags=["reports"])

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class UploadOut(BaseModel):
    id: int
    filename: str
    extracted_values: dict
    text_preview: str

    class Config:
        from_attributes = True


@router.post("/upload", response_model=UploadOut)
async def upload_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Save with a unique server-side name
    ext = ".pdf"
    server_name = f"{uuid.uuid4().hex}{ext}"
    user_dir = UPLOAD_DIR / str(user.id)
    user_dir.mkdir(parents=True, exist_ok=True)
    storage_path = user_dir / server_name

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB cap
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")
    storage_path.write_bytes(contents)

    try:
        parsed = parse_pdf(storage_path)
    except Exception as e:
        # don't delete — let user re-try parsing later
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {e}")

    record = UploadedReport(
        user_id=user.id,
        filename=file.filename,
        storage_path=str(storage_path),
        extracted_text=parsed["text"][:50000],
        extracted_values=parsed["values"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return UploadOut(
        id=record.id,
        filename=record.filename,
        extracted_values=parsed["values"],
        text_preview=parsed["text"][:1500],
    )


class ReportListOut(BaseModel):
    id: int
    filename: str
    extracted_values: dict | None
    uploaded_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[ReportListOut])
def list_reports(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(UploadedReport)
        .filter(UploadedReport.user_id == user.id)
        .order_by(UploadedReport.uploaded_at.desc())
        .all()
    )
    return [
        ReportListOut(
            id=r.id,
            filename=r.filename,
            extracted_values=r.extracted_values or {},
            uploaded_at=r.uploaded_at.isoformat(),
        )
        for r in rows
    ]


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(UploadedReport)
        .filter(UploadedReport.id == report_id, UploadedReport.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    try:
        if os.path.exists(row.storage_path):
            os.remove(row.storage_path)
    except Exception:
        pass
    db.delete(row)
    db.commit()
    return {"ok": True}
