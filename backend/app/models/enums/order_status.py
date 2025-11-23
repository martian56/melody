import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"  # Order placed, awaiting payment
    PAID = "paid"  # Payment received
    PROCESSING = "processing"  # Order being prepared
    SHIPPED = "shipped"  # Order shipped
    DELIVERED = "delivered"  # Order delivered
    CANCELLED = "cancelled"  # Order cancelled
    REFUNDED = "refunded"  # Order refunded

