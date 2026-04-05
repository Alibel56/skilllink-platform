import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.schemas.OrderRequestsSchema import OrderRequestCreate
from backend.app.db.models.order_request import OrderRequest
from backend.app.dao.OrderRequestsDao import OrderRequestsDao
from backend.app.services.OrderService import OrderService


class OrderRequestsService:

    @staticmethod
    async def try_to_take_order(
            session: AsyncSession,
            data: OrderRequestCreate
    ) -> Optional[OrderRequest]:
        order_request =  OrderRequest(
            **data.model_dump()
        )
        result = await OrderRequestsDao.create(session, order_request)
        return result

    @staticmethod
    async def approve(
            session: AsyncSession,
            specialist_id: uuid.UUID,
            order_id: uuid.UUID
    ) -> None:
        await OrderRequestsDao.approve(session, order_id, specialist_id)
        await OrderService.take_order(session,  order_id, specialist_id)

    @staticmethod
    async def get_by_id(
            session: AsyncSession,
            request_id: uuid.UUID
    ) ->Optional[OrderRequest]:
        result = await OrderRequestsDao.get_by_id(session, request_id)
        return result

    @staticmethod
    async def get_all_requests(
            session: AsyncSession,
            user_id: uuid.UUID
    ) -> list[OrderRequest]:
        result = await OrderRequestsDao.get_all(session, user_id)
        return result

    @staticmethod
    async def delete_request(
            session: AsyncSession,
            request: OrderRequest
    ) -> None:
        await OrderRequestsDao.delete(session, request)

    @staticmethod
    async def deleteAllByChoose(
            session: AsyncSession,
            requests: list[OrderRequest]
    ) -> None:
        await OrderRequestsDao.deleteAllByChoose(session, requests)

    @staticmethod
    async def deleteAll(
            session: AsyncSession,
            user_id: uuid.UUID
    ) -> None:
        await OrderRequestsDao.deleteAll(session, user_id)