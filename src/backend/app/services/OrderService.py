import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.SpecialistDao import SpecialistDao
from src.backend.app.db.models.orders import Order
from src.backend.app.db.models.enums import OrderStatus
from src.backend.app.exceptions.Base import NotFoundException
from src.backend.app.schemas.OrderSchema import OrderCreate, OrderUpdate
from src.backend.app.dao.OrderDao import OrderDao
from src.backend.app.services.H3zonestatsservice import H3ZoneStatsService
from src.backend.app.validation.OrderValidator import OrderValidator

class OrderService:

    @staticmethod
    async def create(
            session: AsyncSession,
            user_id: uuid.UUID,
            data: OrderCreate,
    ) -> Order:
        order = Order(user_id=user_id, **data.model_dump())
        if order.specialist_id:
            specialist = await SpecialistDao.get_by_id(session, order.specialist_id)
            if specialist is None:
                raise NotFoundException("Specialist not found")
            order.status = OrderStatus.in_progress

        result = await OrderDao.create(session, order)
        await H3ZoneStatsService.on_order_created(session, result)
        return result

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        order_id: uuid.UUID
    ) -> Optional[Order]:
        result = await OrderDao.get_by_id(session, order_id)
        return result

    @staticmethod
    async def get_user_orders(
        session: AsyncSession,
        user_id: uuid.UUID
    ) -> list[Order]:
        result = await OrderDao.get_user_orders(session, user_id)
        return result

    @staticmethod
    async def get_active_orders(
            session: AsyncSession,
            limit: Optional[int] = None,
            offset: Optional[int] = None
    ) -> list[Order]:
        result = await OrderDao.get_active_orders(session,limit,offset)
        return result

    @staticmethod
    async def get_specialist_orders(
        session: AsyncSession,
        specialist_id: uuid.UUID
    ) -> list[Order]:
        result = await OrderDao.get_specialist_orders(session, specialist_id)
        return result

    @staticmethod
    async def update(
        session: AsyncSession,
        order: Order,
        data: OrderUpdate,
    ) -> Order:
        update_data = data.model_dump(exclude_none=True)
        OrderValidator.ensure_can_update(order, update_data)
        return await OrderDao.update(session, order, update_data)

    @staticmethod
    async def deactivate(session: AsyncSession, order: Order) -> Order:
        OrderValidator.ensure_can_deactivate(order)
        result = await OrderDao.deactivate(session, order)
        return result

    @staticmethod
    async def delete(session: AsyncSession, order: Order) -> None:
        OrderValidator.ensure_can_delete(order)
        await OrderDao.delete(session, order)

    @staticmethod
    async def take_order(
            session: AsyncSession,
            order_id: uuid.UUID,
            specialist_id: uuid.UUID,
    ) -> Order:
        order = await OrderDao.get_by_id_for_update(session, order_id)
        if order is None:
            raise NotFoundException("Order not found")

        specialist = await SpecialistDao.get_by_id(session, specialist_id)
        specialist_order = await OrderDao.get_specialist_active_order(session, specialist_id)

        # Было: OrderValidation.take_validation(order, specialist, specialist_order)
        OrderValidator.ensure_can_take(order, specialist, specialist_order)

        result = await OrderDao.take_order(session, order, specialist_id)
        await H3ZoneStatsService.on_order_taken(session, result, specialist_id)
        return result

    @staticmethod
    async def complete_order(
        session: AsyncSession,
        order: Order,
        user_id: uuid.UUID,
    ) -> Order:
        OrderValidator.ensure_can_complete(order, user_id)
        result = await OrderDao.complete_order(session, order)
        await H3ZoneStatsService.on_order_completed(session, result)
        return result

    @staticmethod
    async def cancel_order(
        session: AsyncSession,
        order: Order,
        user_id: uuid.UUID,
    ) -> Order:
        OrderValidator.ensure_can_cancel(order, user_id)
        result = await OrderDao.cancel_order(session, order)
        await H3ZoneStatsService.on_order_cancelled(session, result)
        return result
