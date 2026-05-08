from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    history: List["ChatTurn"] = []


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatResponse(BaseModel):
    reply: str
    saved_id: int | None = None


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


ChatRequest.model_rebuild()
