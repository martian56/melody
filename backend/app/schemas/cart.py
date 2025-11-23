from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.schemas.product import ProductListResponse

# Cart Item Schemas
class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: UUID
    user_id: UUID
    product_id: UUID
    quantity: int
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductListResponse] = None

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_items: int
    total_price: Decimal

