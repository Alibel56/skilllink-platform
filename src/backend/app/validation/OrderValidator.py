from __future__ import annotations

import uuid
from typing import Any

from src.backend.app.db.models.enums import OrderStatus
from src.backend.app.db.models.orders import Order
from src.backend.app.db.models.specialist import Specialist
from src.backend.app.exceptions.Base import (
    NotFoundException,
    ValidationException,
)

from src.backend.app.validation.Validators import _raise_if_errors


class OrderValidator:
    """
    Валидации переходов состояния заказа.

    Все методы синхронные — они работают только с уже загруженными
    объектами, без дополнительных запросов к БД.
    """

    @staticmethod
    def ensure_can_update(order: Order, update_data: dict[str, Any]) -> None:
        errors: list[str] = []

        if order.status != OrderStatus.open:
            errors.append("Cannot update an order that is already in progress or completed")
        if not update_data:
            errors.append("No fields to update")

        _raise_if_errors(errors)

    @staticmethod
    def ensure_can_deactivate(order: Order) -> None:
        if order.status == OrderStatus.in_progress:
            raise ValidationException(["Cannot deactivate an order that is in progress"])

    @staticmethod
    def ensure_can_delete(order: Order) -> None:
        if order.status == OrderStatus.in_progress:
            raise ValidationException(["Cannot delete an order that is in progress"])

    @staticmethod
    def ensure_can_take(
        order: Order,
        specialist: Specialist | None,
        specialist_active_order: Order | None,
    ) -> None:
        # Сначала проверяем специалиста — если его нет, дальше нет смысла
        if specialist is None:
            raise NotFoundException("Specialist not found")

        errors: list[str] = []

        if specialist_active_order is not None:
            errors.append("Specialist already has an active order")
        if order.status != OrderStatus.open:
            errors.append("Order is no longer available")
        if not order.is_active:
            errors.append("Order is not active")
        if not specialist.is_verified:
            errors.append("Only verified specialists can take orders")
        if not specialist.is_active:
            errors.append("Specialist profile is not active")

        _raise_if_errors(errors)

    @staticmethod
    def ensure_can_complete(order: Order, user_id: uuid.UUID) -> None:
        errors: list[str] = []

        if order.user_id != user_id:
            errors.append("Only the client can complete the order")
        if order.status != OrderStatus.in_progress:
            errors.append("Order is not in progress")

        _raise_if_errors(errors)

    @staticmethod
    def ensure_can_cancel(order: Order, user_id: uuid.UUID) -> None:
        errors: list[str] = []

        if order.user_id != user_id:
            errors.append("Only the client can cancel the order")
        if order.status in (OrderStatus.completed, OrderStatus.cancelled):
            errors.append("Cannot cancel a completed or already cancelled order")

        _raise_if_errors(errors)