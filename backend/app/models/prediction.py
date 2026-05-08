from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    disease = Column(String(64), nullable=False, index=True)
    risk_score = Column(Float, nullable=False)  # probability 0..1
    risk_level = Column(String(16), nullable=False)  # low / moderate / high
    inputs = Column(JSON, nullable=False)
    explanation = Column(JSON, nullable=True)  # SHAP feature contributions
    suggestions = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="predictions")
