from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.models.enums.order_status import OrderStatus

# Order Item Schemas
class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int
    unit_price: Decimal

class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_id: Optional[UUID] = None
    product_name: str
    product_sku: Optional[str] = None
    product_image_url: Optional[str] = None
    unit_price: Decimal
    quantity: int
    total_price: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

# Order Schemas
class OrderFromCartCreate(BaseModel):
    """Schema for creating order from cart (items come from cart, not request body)"""
    # Customer information
    customer_email: str
    customer_phone: str  # Required
    customer_first_name: Optional[str] = None
    customer_last_name: Optional[str] = None
    
    # Delivery information
    delivery_address: str
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_postal_code: Optional[str] = None
    delivery_country: Optional[str] = "Azerbaijan"  # Default to Azerbaijan
    
    # Pricing (calculated on backend, but can be overridden)
    subtotal: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    shipping: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    
    # Notes
    notes: Optional[str] = None

class OrderCreate(BaseModel):
    """Schema for creating order directly (for unauthenticated users)"""
    # Customer information
    customer_email: str
    customer_phone: str  # Required
    customer_first_name: Optional[str] = None
    customer_last_name: Optional[str] = None
    
    # Delivery information
    delivery_address: str
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_postal_code: Optional[str] = None
    delivery_country: Optional[str] = "Azerbaijan"  # Default to Azerbaijan
    
    # Order items
    items: list[OrderItemCreate]
    
    # Pricing (calculated on backend, but can be overridden)
    subtotal: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    shipping: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    
    # Notes
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    admin_notes: Optional[str] = None
    payment_status: Optional[str] = None
    payment_transaction_id: Optional[str] = None

class OrderResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    order_number: str
    status: OrderStatus
    customer_email: str
    customer_phone: str
    customer_first_name: Optional[str] = None
    customer_last_name: Optional[str] = None
    delivery_address: str
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_postal_code: Optional[str] = None
    delivery_country: Optional[str] = None
    subtotal: Decimal
    tax: Decimal
    shipping: Decimal
    discount: Decimal
    total: Decimal
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    payment_transaction_id: Optional[str] = None
    notes: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    id: UUID
    order_number: str
    status: OrderStatus
    customer_email: str
    customer_phone: str
    total: Decimal
    created_at: datetime
    item_count: int = 0

    class Config:
        from_attributes = True

