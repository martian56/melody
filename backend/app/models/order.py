from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, Numeric, Text, Enum, Integer, ForeignKey
from sqlalchemy.types import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from .base import Base
from datetime import datetime
from .enums.order_status import OrderStatus

class Order(Base):
    """Customer orders"""
    __tablename__ = "order"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("user.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Order details
    order_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)  # e.g., "ORD-2024-001"
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus, native_enum=False), default=OrderStatus.PENDING, nullable=False, index=True)
    
    # Customer information (for unauthenticated users or different delivery address)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)  # Required
    customer_first_name: Mapped[str] = mapped_column(String(100), nullable=True)
    customer_last_name: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # Delivery information
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)  # Full address
    delivery_city: Mapped[str] = mapped_column(String(100), nullable=True)
    delivery_state: Mapped[str] = mapped_column(String(100), nullable=True)
    delivery_postal_code: Mapped[str] = mapped_column(String(20), nullable=True)
    delivery_country: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # Pricing
    subtotal: Mapped[Decimal] = mapped_column(Numeric[Decimal], nullable=False)
    tax: Mapped[Decimal] = mapped_column(Numeric[Decimal], default=Decimal('0.00'))
    shipping: Mapped[Decimal] = mapped_column(Numeric[Decimal], default=Decimal('0.00'))
    discount: Mapped[Decimal] = mapped_column(Numeric[Decimal], default=Decimal('0.00'))
    total: Mapped[Decimal] = mapped_column(Numeric[Decimal], nullable=False)
    
    # Payment information
    payment_method: Mapped[str] = mapped_column(String(50), nullable=True)  # e.g., "credit_card", "paypal"
    payment_status: Mapped[str] = mapped_column(String(50), nullable=True)  # e.g., "pending", "completed", "failed"
    payment_transaction_id: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Notes
    notes: Mapped[str] = mapped_column(Text, nullable=True)  # Customer notes
    admin_notes: Mapped[str] = mapped_column(Text, nullable=True)  # Admin internal notes
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    """Items in an order"""
    __tablename__ = "order_item"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    order_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("order.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("product.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Product snapshot (in case product is deleted or changed)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[str] = mapped_column(String(100), nullable=True)
    product_image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Pricing at time of order
    unit_price: Mapped[Decimal] = mapped_column(Numeric[Decimal], nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric[Decimal], nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")

