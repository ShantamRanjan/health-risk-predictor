from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: Optional[str] = None
    # Optional demographics — nice-to-have at signup so we can pre-fill predictions
    age: Optional[int] = Field(default=None, ge=0, le=120)
    sex: Optional[Literal["male", "female"]] = None
    height_cm: Optional[float] = Field(default=None, ge=30, le=260)
    weight_kg: Optional[float] = Field(default=None, ge=2, le=400)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    """All fields optional — only the supplied fields get updated."""
    full_name: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=0, le=120)
    sex: Optional[Literal["male", "female"]] = None
    height_cm: Optional[float] = Field(default=None, ge=30, le=260)
    weight_kg: Optional[float] = Field(default=None, ge=2, le=400)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    age: Optional[int] = None
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
