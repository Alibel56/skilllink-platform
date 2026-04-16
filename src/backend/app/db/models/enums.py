from enum import Enum

class UserRole(str, Enum):
    client = "client"
    specialist = "specialist"
    admin = "admin"

class OrderStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class RequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class LogType(str, Enum):
    INFO = "INFO"
    DEBUG = "DEBUG"
    ERROR = "ERROR"

class ServiceType(str, Enum):
    AUTH = "auth-service"
    CATALOG = "catalog-service"
    ORDER = "order-service"
    REQUEST = "request-service"
    SPECIALIST = "specialist-service"
    USER = "user-service"
    HTTP = "http-middleware"