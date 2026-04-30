import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import (
    require_client
)
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session

from src.backend.app.schemas.CommentSchema import CommentDto, CommentCreate, CommentFilter
from src.backend.app.services.CommentService import CommentService
from src.backend.app.services.SpecialistService import SpecialistService

router = APIRouter(
    prefix="/comment",
    tags=["Comment"]
)


# ─────────────────────────────────────────
# CREATE COMMENT
# ─────────────────────────────────────────

@router.post("/write", response_model=CommentDto)
async def comment_specialist(
        data: CommentCreate,
        request: Request,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_client)
):
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)

    if specialist and specialist.id == data.specialist_id:
        raise HTTPException(400, "You can't comment your own specialist")

    item = await CommentService.create(
        session,
        current_user.id,
        data
    )

    return item


# ─────────────────────────────────────────
# GET SPECIALIST COMMENTS
# ─────────────────────────────────────────

@router.get("/get/comments", response_model=list[CommentDto])
async def get_specialist_comments(
        request: Request,
        filters: CommentFilter = Depends(),
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_client)
):
    item = await CommentService.get_all(
        session,
        filters,
        limit,
        offset
    )

    return item


# ─────────────────────────────────────────
# DELETE SPECIALIST COMMENT
# ─────────────────────────────────────────

@router.delete("/delete/{specialist_id}", response_model=dict[str, str])
async def delete_comment(
        specialist_id: uuid.UUID,
        request: Request,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_client)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)
    if not specialist:
        raise HTTPException(404, "Specialist not found")


    await CommentService.delete(session, current_user.id, specialist_id)

    return {"message": "Comment deleted successfully"}