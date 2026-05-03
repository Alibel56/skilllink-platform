import uuid
from datetime import datetime, date
from unittest.mock import AsyncMock, MagicMock

import pytest
from src.backend.app.core.dependencies import (
    require_any,
    require_specialist,
    require_client,
    require_admin,
    get_current_user,
)
from src.backend.app.db.session import get_session

# ──────────────────────────────────────────────────────────────────────────────
# Shared IDs
# ──────────────────────────────────────────────────────────────────────────────

FAKE_USER_ID       = uuid.uuid4()
FAKE_SPECIALIST_ID = uuid.uuid4()
FAKE_ORDER_ID      = uuid.uuid4()
FAKE_REQUEST_ID    = uuid.uuid4()
FAKE_CATALOG_ID    = uuid.uuid4()
FAKE_ADDRESS_ID    = uuid.uuid4()
FAKE_COMMENT_ID    = uuid.uuid4()
FAKE_RATE_ID       = uuid.uuid4()
FAKE_MESSAGE_ID    = uuid.uuid4()


# ──────────────────────────────────────────────────────────────────────────────
# Factory helpers
# ──────────────────────────────────────────────────────────────────────────────

def make_session():
    return AsyncMock()


def make_user(role: str = "client"):
    user = MagicMock()
    user.id         = FAKE_USER_ID
    user.role       = role
    user.name       = "John"
    user.surname    = "Doe"
    user.email      = "john@example.com"
    user.phone      = "77001234567"
    user.birth_date = date(1995, 1, 1)
    user.created_at = datetime.utcnow()
    user.is_verified = True
    return user


def make_specialist(user_id=None):
    s = MagicMock()
    s.id          = FAKE_SPECIALIST_ID
    s.user_id     = user_id or FAKE_USER_ID
    s.h3_index    = "8928308280fffff"
    s.is_active   = True
    s.is_verified = False
    s.created_at  = datetime.utcnow()
    s.name        = "John"
    s.surname     = "Doe"
    return s


def make_order(user_id=None, status="open", specialist_id=None):
    o = MagicMock()
    o.id            = FAKE_ORDER_ID
    o.user_id       = user_id or FAKE_USER_ID
    o.specialist_id = specialist_id or FAKE_SPECIALIST_ID
    o.job_type      = "plumbing"
    o.description   = "Fix pipe"
    o.price         = 5000.0
    o.is_active     = True
    o.status        = status
    o.created_at    = datetime.utcnow()
    o.completed_at  = None
    return o


def make_catalog_item(specialist_id=None):
    item = MagicMock()
    item.id            = FAKE_CATALOG_ID
    item.specialist_id = specialist_id or FAKE_SPECIALIST_ID
    item.job_type      = "plumbing"
    item.price         = 3000.0
    item.created_at    = datetime.utcnow()
    return item


def make_address():
    a = MagicMock()
    a.id         = FAKE_ADDRESS_ID
    a.user_id    = FAKE_USER_ID
    a.country    = "Kazakhstan"
    a.city       = "Almaty"
    a.street     = "Abay 1"
    a.h3_index   = "8928308280fffff"
    a.created_at = datetime.utcnow()
    return a


def make_comment():
    c = MagicMock()
    c.id            = FAKE_COMMENT_ID
    c.user_id       = FAKE_USER_ID
    c.specialist_id = FAKE_SPECIALIST_ID
    c.comment       = "Great work!"
    c.created_at    = datetime.utcnow()
    return c


def make_rate(value: int = 5):
    r = MagicMock()
    r.id            = FAKE_RATE_ID
    r.user_id       = FAKE_USER_ID
    r.specialist_id = FAKE_SPECIALIST_ID
    r.rate          = value
    r.created_at    = datetime.utcnow()
    return r


def make_message():
    m = MagicMock()
    m.id         = FAKE_MESSAGE_ID
    m.order_id   = FAKE_ORDER_ID
    m.sender_id  = FAKE_USER_ID
    m.message    = "Hello!"
    m.created_at = datetime.utcnow()
    return m


def make_order_request(user_id=None, status="pending"):
    req = MagicMock()
    req.id            = FAKE_REQUEST_ID
    req.user_id       = user_id or FAKE_USER_ID
    req.specialist_id = FAKE_SPECIALIST_ID
    req.order_id      = FAKE_ORDER_ID
    req.status        = status
    return req