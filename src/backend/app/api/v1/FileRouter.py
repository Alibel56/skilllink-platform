import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import Response

from src.backend.app.core.dependencies import (
    require_any, require_specialist
)
import base64
from fastapi import UploadFile, File

from src.backend.app.db.session import get_session
from src.backend.app.exceptions.Base import NotFoundException
from src.backend.app.services.FileService import FileService
from src.backend.app.services.SpecialistService import SpecialistService
from src.backend.app.tasks.image_tasks import compress_and_store_image
from src.backend.app.tasks.pdf_tasks import compress_and_store_pdf
from src.backend.app.core.config import settings
from src.backend.app.db.models.user import User
from src.backend.app.validation.FileValidator import FileValidator

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)

@router.post("/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    raw = await file.read()
    FileValidator.ensure_image(file.content_type, len(raw))

    compress_and_store_image.delay(
        user_id=str(current_user.id),
        image_b64=base64.b64encode(raw).decode(),
        db_url=settings.DATABASE_URL_SYNC,
    )
    return {"message": "Image queued for compression.", "original_size_bytes": len(raw)}


@router.get("/get/avatar/{user_id}")
async def get_avatar(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    row = await FileService.get_avatar(session, user_id)
    if not row:
        raise NotFoundException("Avatar not found")

    image_data, content_type = row
    return Response(content=image_data, media_type=content_type or "image/jpeg")


@router.delete("/delete/avatar/{user_id}", response_model=dict[str, str])
async def delete_avatar(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    await FileService.delete_avatar(session, user_id)
    return {"message": "Image deleted successfully."}