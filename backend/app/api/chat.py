"""Health/diet chatbot endpoint backed by Groq."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import ChatMessage, User
from app.schemas.chat import ChatMessageOut, ChatRequest, ChatResponse, ChatTurn
from app.services.groq_chat import groq_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    history = [{"role": t.role, "content": t.content} for t in payload.history]
    try:
        reply = groq_service.chat(payload.message, history)
    except RuntimeError as e:
        # Missing key etc.
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Chat service failed: {e}")

    db.add(ChatMessage(user_id=user.id, role="user", content=payload.message))
    saved = ChatMessage(user_id=user.id, role="assistant", content=reply)
    db.add(saved)
    db.commit()
    db.refresh(saved)

    return ChatResponse(reply=reply, saved_id=saved.id)


@router.get("/history", response_model=List[ChatMessageOut])
def history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(200)
        .all()
    )
    return rows


@router.delete("/history")
def clear_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(ChatMessage).filter(ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"ok": True}
