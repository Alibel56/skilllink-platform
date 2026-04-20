import uuid
from typing import Any, Sequence, Optional

from sqlalchemy import delete, update, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models import OrderStatus, order_request
from src.backend.app.db.models.enums import RequestStatus
from src.backend.app.db.models.order_request import OrderRequest

class OrderRequestsDao:

    @staticmethod
    async def create(
            session: AsyncSession,
            order_request: OrderRequest
    ) -> OrderRequest:
        session.add(order_request)
        await session.flush()
        return order_request

    @staticmethod
    async def approve(
            session: AsyncSession,
            order_id: uuid.UUID,
            specialist_id: uuid.UUID
    ) -> None:
        query1 = (
            update(OrderRequest)
            .where(
                OrderRequest.specialist_id != specialist_id,
                OrderRequest.order_id == order_id
            )
            .values(status=RequestStatus.REJECTED)
        )
        query2 = (
            update(OrderRequest)
            .where(
                OrderRequest.specialist_id == specialist_id,
                OrderRequest.order_id == order_id
            )
            .values(status=RequestStatus.ACCEPTED)
        )
        await session.execute(query1)
        await session.execute(query2)
        await session.flush()

    @staticmethod
    async def get_all(
            session: AsyncSession,
            user_id: uuid.UUID
    ) -> Sequence[OrderRequest]:
        result = await session.execute(
            select(OrderRequest).
            where(OrderRequest.user_id == user_id, OrderRequest.status == RequestStatus.PENDING)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_id(
            session: AsyncSession,
            request_id: uuid.UUID
    ) -> Optional[OrderRequest]:
        result = await session.execute(
            select(OrderRequest).
            where(OrderRequest.id == request_id)
        )
        return result.scalars().first()

    @staticmethod
    async def delete(
            session: AsyncSession,
            order_request: OrderRequest
    ) -> None:
        await session.delete(order_request)
        await session.flush()

    @staticmethod
    async def delete_batch(
        session: AsyncSession,
        requests: list[OrderRequest],
    ) -> None:
        for req in requests:
            await session.delete(req)
        await session.flush()

    @staticmethod
    async def deleteAll(
            session: AsyncSession,
            user_id: uuid.UUID
    ) -> None:
        query = (
            delete(OrderRequest)
            .where(OrderRequest.user_id == user_id)
        )
        await session.execute(query)
        await session.flush()
