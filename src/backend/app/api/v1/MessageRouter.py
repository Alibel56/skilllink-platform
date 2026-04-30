import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import require_any
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session

from src.backend.app.schemas.MessageSchema import MessageCreate, MessageDto
from src.backend.app.services.MessageService import MessageService

router = APIRouter(
    prefix="/message",
    tags=["Message"]
)

# ─────────────────────────────────────────
# CREATE MESSAGE
# ─────────────────────────────────────────

@router.post("/write", response_model=MessageDto)
async def create_message(
        data: MessageCreate,
        order_id: uuid.UUID,
        request: Request,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_any)
):
    item = await MessageService.create(
        session,
        order_id,
        current_user.id,
        data
    )

    return item


# ─────────────────────────────────────────
# GET ALL MESSAGES
# ─────────────────────────────────────────

@router.get("/get/chat/{order_id}", response_model=list[MessageDto])
async def get_chat(
        order_id: uuid.UUID,
        request: Request,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_any)
):
    item = await MessageService.get_by_order_id(
        session,
        order_id,
        current_user.id
    )

    return item
