import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import (
    get_current_user,
    require_any,
    require_client
)
from backend.app.db.models import OrderRequest
from backend.app.db.models.enums import ServiceType, RequestStatus, LogType
from backend.app.db.models.user import User
from backend.app.db.session import get_session
from backend.app.services.OrderRequestsService import OrderRequestsService
from backend.app.services.a.AuditService import AuditService

router = APIRouter(
    prefix="/requests",
    tags=["Requests"]
)

# =========================
# GET ALL REQUESTS
# =========================

@router.get("/get/all/{user_id}", response_model=list[OrderRequest])
async def get_all_requests(
        user_id: uuid.UUID,
        request: Request,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_client)
):
    if current_user.id != user_id:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.REQUEST,
            detail=f"{request.client.host} - GET - /get/all/{user_id} - 403 - not allowed to view"
        )
        raise HTTPException(403, "Not allowed to view requests")

    result = await OrderRequestsService.get_all_requests(session, user_id)

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.REQUEST,
        detail=f"{request.client.host} - GET - /get/all/{user_id} - 200"
    )

    return result

# =========================
# APPROVE ORDER REQUEST
# =========================

@router.put("/approve/{request_id}", response_model=dict[str, str])
async def approve_request(
    request_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any)
) -> dict[str, str]:
    order_req = await OrderRequestsService.get_by_id(session, request_id)

    if not order_req:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.REQUEST,
            detail=f"{request.client.host} - PUT - /approve/{request_id} - 404 - request not found"
        )
        raise HTTPException(404, "Request not found")
    if order_req.user_id != current_user.id:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.REQUEST,
            detail=f"{request.client.host} - PUT - /approve/{request_id} - 403 - not allowed to approve"
        )
        raise HTTPException(403, "Only the order owner can approve requests")
    if order_req.status != RequestStatus.PENDING:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.REQUEST,
            detail=f"{request.client.host} - PUT - /approve/{request_id} - 400 - request not pending"
        )
        raise HTTPException(400, "Request is no longer pending")

    await OrderRequestsService.approve(session, order_req.specialist_id, order_req.order_id)

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.REQUEST,
        detail=f"{request.client.host} - PUT - /approve/{request_id} - 200"
    )

    return {"message": "User approved Specialist"}

