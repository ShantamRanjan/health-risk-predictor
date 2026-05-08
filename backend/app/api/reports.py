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
from app.services.pdf_parser import extract_all, parse_pdf

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


@router.get("/aggregated")
def aggregated_lab_values(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns the most-recent lab value the user has across all their uploaded
    reports. Used by the Predict page to pre-fill matching form fields.

    Output:
    {
      "values": {"glucose": 142.0, "creatinine": 1.1, ...},
      "sources": {"glucose": {"report_id": 7, "filename": "labs_oct_2025.pdf"}, ...}
    }
    """
    rows = (
        db.query(UploadedReport)
        .filter(UploadedReport.user_id == user.id)
        .order_by(UploadedReport.uploaded_at.desc())
        .all()
    )
    values: dict = {}
    sources: dict = {}
    for r in rows:  # most-recent first; only set the key if not already set
        for k, v in (r.extracted_values or {}).items():
            if k not in values:
                values[k] = v
                sources[k] = {"report_id": r.id, "filename": r.filename}
    return {"values": values, "sources": sources}


@router.post("/{report_id}/reparse")
def reparse_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Re-runs extraction on a previously uploaded report.
    Useful after upgrading the parser or when the original upload missed values.
    """
    row = (
        db.query(UploadedReport)
        .filter(UploadedReport.id == report_id, UploadedReport.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    # If we still have the original PDF on disk, re-extract from it; else
    # re-run the LLM/regex extractor on the cached text.
    text = row.extracted_text or ""
    if row.storage_path and os.path.exists(row.storage_path):
        try:
            parsed = parse_pdf(row.storage_path)
            text = parsed["text"]
            new_values = parsed["values"]
        except Exception:
            new_values = extract_all(text)
    else:
        new_values = extract_all(text)

    row.extracted_text = (text or row.extracted_text or "")[:50000]
    row.extracted_values = new_values
    db.commit()
    db.refresh(row)

    return {
        "id": row.id,
        "filename": row.filename,
        "extracted_values": new_values,
        "count": len(new_values),
    }


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
