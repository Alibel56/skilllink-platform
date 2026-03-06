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


class AuditAction(str, Enum):
    signup = "signup"
    login = "login"
    update_profile = "update_profile"
    create_specialist = "create_specialist"
    deactivate_specialist = "deactivate_specialist"
    delete_specialist = "delete_specialist"
    create_order = "create_order"
    deactivate_order = "deactivate_order"
    delete_order = "delete_order"
    take_order = "take_order"
    complete_order = "complete_order"
    rate_specialist = "rate_specialist"
    comment_specialist = "comment_specialist"
    write_specialist = "write_specialist"
    write_client = "write_client"