"""Generate doctor-style PDF reports from saved predictions."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.ml.predictor import registry
from app.models import Prediction, User
from app.services.pdf_generator import build_report_pdf

router = APIRouter(prefix="/api/pdf", tags=["pdf"])


@router.get("/prediction/{prediction_id}")
def download_prediction_pdf(
    prediction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pred = (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id, Prediction.user_id == user.id)
        .first()
    )
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")

    label = registry.metadata.get("diseases", {}).get(pred.disease, {}).get("label", pred.disease)
    pdf_bytes = build_report_pdf(
        user_email=user.email,
        user_full_name=user.full_name,
        disease_label=label,
        risk_score=pred.risk_score,
        risk_level=pred.risk_level,
        inputs=pred.inputs or {},
        explanation=pred.explanation or [],
        suggestions=pred.suggestions or [],
    )
    buf = BytesIO(pdf_bytes)
    headers = {"Content-Disposition": f'attachment; filename="health_report_{prediction_id}.pdf"'}
    return StreamingResponse(buf, media_type="application/pdf", headers=headers)
