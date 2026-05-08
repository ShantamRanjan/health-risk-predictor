from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Demographic fields used to auto-fill the prediction form
    age = Column(Integer, nullable=True)
    sex = Column(String(16), nullable=True)          # "male" / "female"
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)

    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("UploadedReport", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
