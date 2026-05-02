from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
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
from src.backend.app.tasks.pdf_tasks import compress_and_store_pdf
from src.backend.app.core.config import settings
from src.backend.app.db.models.user import User
from src.backend.app.validation.FileValidator import FileValidator

router = APIRouter(prefix="/files", tags=["Accreditation"])

@router.post("/upload/accreditation")
async def upload_accreditation(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist),
):
    raw = await file.read()
    FileValidator.ensure_pdf(file.content_type, len(raw))

    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist:
        raise NotFoundException("Specialist profile not found")

    compress_and_store_pdf.delay(
        specialist_id=str(specialist.id),
        pdf_b64=base64.b64encode(raw).decode(),
        db_url=settings.DATABASE_URL_SYNC,
    )
    return {"message": "PDF queued for processing.", "original_size_bytes": len(raw)}

@router.get("/get/accreditation")
async def get_my_accreditation(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    """Specialist's own accreditation."""
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)

    if not specialist:
        raise HTTPException(404, "Specialist not found")

    row = await FileService.get_accreditation(session, specialist.id)

    if not row:
        raise HTTPException(status_code=404, detail="Accreditation not found")

    pdf_data, content_type = row

    return Response(
        content=pdf_data,
        media_type=content_type or "application/pdf"
    )


@router.get("/get/accreditation/{specialist_id}")
async def get_specialist_accreditation(
    specialist_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    """Any logged-in user can view a specialist's accreditation —
    used by clients deciding whether to book."""
    import uuid as _uuid
    try:
        sid = _uuid.UUID(specialist_id)
    except ValueError:
        raise HTTPException(400, "Invalid specialist id")

    specialist = await SpecialistService.get_by_id(session, sid)
    if not specialist:
        raise HTTPException(404, "Specialist not found")

    row = await FileService.get_accreditation(session, specialist.id)
    if not row:
        raise HTTPException(status_code=404, detail="Accreditation not found")

    pdf_data, content_type = row
    return Response(
        content=pdf_data,
        media_type=content_type or "application/pdf",
    )


@router.delete("/delete/accreditation", response_model=dict[str, str])
async def delete_accreditation(
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_specialist)
):
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist:
        raise HTTPException(404, "Specialist not found")

    await FileService.delete_accreditation(session, specialist.id)
    return {"message": "Accreditation deleted successfully."}