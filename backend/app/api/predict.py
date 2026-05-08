"""Prediction endpoints."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.ml.predictor import registry
from app.models import Prediction, User
from app.schemas.prediction import PredictionOut, PredictionRequest, PredictionResponse

router = APIRouter(prefix="/api/predict", tags=["predict"])


@router.get("/diseases")
def list_diseases():
    """Returns metadata used by the frontend to render dynamic forms."""
    return {
        "available": registry.diseases(),
        "metadata": registry.metadata,
    }


@router.post("", response_model=PredictionResponse)
def predict(
    payload: PredictionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        model = registry.get(payload.disease)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    try:
        result = model.predict(payload.inputs)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    record = Prediction(
        user_id=user.id,
        disease=result["disease"],
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        inputs=payload.inputs,
        explanation=result["explanation"],
        suggestions=result["suggestions"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PredictionResponse(
        id=record.id,
        disease=record.disease,
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        explanation=result["explanation"],
        suggestions=result["suggestions"],
        created_at=record.created_at,
    )


@router.get("/history", response_model=List[PredictionOut])
def history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(Prediction)
        .filter(Prediction.user_id == user.id)
        .order_by(Prediction.created_at.desc())
        .limit(100)
        .all()
    )
    return rows
