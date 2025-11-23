from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.schemas.product import ProductListResponse

# Wishlist Item Schemas
class WishlistItemResponse(BaseModel):
    id: UUID
    user_id: UUID
    product_id: UUID
    created_at: datetime
    product: Optional[ProductListResponse] = None

    class Config:
        from_attributes = True

class WishlistResponse(BaseModel):
    items: list[WishlistItemResponse]
    total_items: int

