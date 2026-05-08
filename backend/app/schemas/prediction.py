from datetime import datetime
from typing import Any, Dict, List, Literal
from pydantic import BaseModel


class PredictionRequest(BaseModel):
    disease: Literal["heart", "diabetes", "kidney", "liver", "stroke", "hypertension"]
    inputs: Dict[str, Any]


class FeatureContribution(BaseModel):
    feature: str
    value: Any
    shap_value: float


class PredictionResponse(BaseModel):
    id: int | None = None
    disease: str
    risk_score: float
    risk_level: str
    explanation: List[FeatureContribution]
    suggestions: List[str]
    created_at: datetime | None = None


class PredictionOut(BaseModel):
    id: int
    disease: str
    risk_score: float
    risk_level: str
    inputs: Dict[str, Any]
    explanation: List[FeatureContribution] | None
    suggestions: List[str] | None
    created_at: datetime

    class Config:
        from_attributes = True
