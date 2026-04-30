import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import (
    require_client,
    require_specialist,
    require_any
)
from src.backend.app.db.models.enums import ServiceType, OrderStatus, LogType
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.exceptions.Base import NotFoundException, ForbiddenException
from src.backend.app.schemas.OrderRequestsSchema import OrderRequestCreate
from src.backend.app.schemas.OrderSchema import OrderCreate, OrderUpdate, OrderDto
from src.backend.app.services.OrderService import OrderService
from src.backend.app.services.OrderRequestsService import OrderRequestsService
from src.backend.app.services.SpecialistService import SpecialistService

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("/create", response_model=OrderDto)
async def create_order(
    data: OrderCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    return await OrderService.create(session, current_user.id, data)


@router.get("/get/{order_id}", response_model=OrderDto)
async def get_order(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    order = await OrderService.get_by_id(session, order_id)
    if not order:
        raise NotFoundException("Order not found")
    return order


@router.get("/my", response_model=list[OrderDto])
async def get_my_orders(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client),
):
    return await OrderService.get_user_orders(session, current_user.id)


@router.get("/active", response_model=list[OrderDto])
async def get_active_orders(
    session: AsyncSession = Depends(get_session),
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    current_user: User = Depends(require_specialist),
):
    return await OrderService.get_active_orders(session, limit, offset)


@router.get("/specialist/my", response_model=list[OrderDto])
async def get_specialist_orders(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist:
        raise NotFoundException("Specialist profile not found")
    return await OrderService.get_specialist_orders(session, specialist.id)


@router.put("/update/{order_id}", response_model=OrderDto)
async def update_order(
    order_id: uuid.UUID,
    data: OrderUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client),
):
    order = await OrderService.get_by_id(session, order_id)
    if not order:
        raise NotFoundException("Order not found")
    if order.user_id != current_user.id:
        raise ForbiddenException("Not allowed to update this order")
    return await OrderService.update(session, order, data)


@router.post("/take/{order_id}", response_model=dict[str, str])
async def take_order(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist),
):
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist:
        raise NotFoundException("Specialist profile not found")

    order = await OrderService.get_by_id(session, order_id)
    if not order:
        raise NotFoundException("Order not found")
    if order.status != OrderStatus.open:
        raise ForbiddenException("Order is not available")
    if order.user_id == current_user.id:
        raise ForbiddenException("Cannot take your own order")

    data = OrderRequestCreate(
        user_id=order.user_id,
        specialist_id=specialist.id,
        order_id=order.id,
    )
    await OrderRequestsService.try_to_take_order(session, data)
    return {"message": "Thank you for your interest. Please wait for approval."}


@router.post("/complete/{order_id}", response_model=dict[str, str])
async def complete_order(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client),
):
    order = await OrderService.get_by_id(session, order_id)
    if not order:
        raise NotFoundException("Order not found")
    if order.user_id != current_user.id:
        raise ForbiddenException("Not allowed to complete this order")

    result = await OrderService.complete_order(session, order, current_user.id)
    return {"message": f"Order completed at {result.completed_at}"}


@router.post("/cancel/{order_id}", response_model=dict[str, str])
async def cancel_order(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client),
):
    order = await OrderService.get_by_id(session, order_id)
    if not order:
        raise NotFoundException("Order not found")
    if order.user_id != current_user.id:
        raise ForbiddenException("Not allowed to cancel this order")

    await OrderService.cancel_order(session, order, current_user.id)
    return {"message": "Order cancelled successfully"}


@router.delete("/delete/{order_id}", response_model=dict[str, str])
async def delete_order(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client),
):
    order = await OrderService.get_by_id(session, order_id)
    if not order:
        raise NotFoundException("Order not found")
    if order.user_id != current_user.id:
        raise ForbiddenException("Not allowed to delete this order")

    await OrderService.delete(session, order)
    return {"message": "Order deleted"}