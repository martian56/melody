from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from decimal import Decimal
from datetime import datetime
from uuid import UUID
import json

from app.models.enums.product_status import ProductStatus
from app.models.enums.language import Language

# Base schemas
class ProductBase(BaseModel):
    sku: str
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    category_id: UUID
    brand_id: Optional[UUID] = None

# Create schemas
class ProductCreate(ProductBase):
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    track_inventory: bool = True
    status: ProductStatus = ProductStatus.DRAFT
    is_featured: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    weight: Optional[Decimal] = None
    dimensions: Optional[str] = None

# Update schemas
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    category_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    track_inventory: Optional[bool] = None
    status: Optional[ProductStatus] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    weight: Optional[Decimal] = None
    dimensions: Optional[str] = None

# Response schemas
class ProductResponse(ProductBase):
    id: UUID
    cost_price: Optional[Decimal] = None
    stock_quantity: int
    low_stock_threshold: int
    track_inventory: bool
    status: ProductStatus
    is_active: bool
    is_featured: bool
    image_url: Optional[str] = None  # Primary image URL
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    weight: Optional[Decimal] = None
    dimensions: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    id: UUID
    sku: str
    name: str
    slug: str
    short_description: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    stock_quantity: int
    status: ProductStatus
    is_active: bool
    is_featured: bool
    image_url: Optional[str] = None  # Primary image URL
    created_at: datetime

    class Config:
        from_attributes = True

# Product Image
class ProductImageCreate(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0

class ProductImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    is_primary: Optional[bool] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class ProductImageResponse(BaseModel):
    id: UUID
    product_id: UUID
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool
    sort_order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Product Translation
class ProductTranslationCreate(BaseModel):
    language: Language
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class ProductTranslationResponse(BaseModel):
    id: UUID
    product_id: UUID
    language: Language
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Product Variant
class ProductVariantCreate(BaseModel):
    sku: str
    name: str
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    stock_quantity: int = 0
    track_inventory: bool = True
    variant_data: Optional[dict] = None

class ProductVariantResponse(BaseModel):
    id: UUID
    product_id: UUID
    sku: str
    name: str
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    stock_quantity: int
    track_inventory: bool
    variant_data: Optional[dict] = None
    is_active: bool
    created_at: datetime

    @field_validator('variant_data', mode='before')
    @classmethod
    def parse_variant_data(cls, v: Any) -> Optional[dict]:
        """Parse JSON string to dict"""
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return None

    class Config:
        from_attributes = True

# Product with relations
class ProductDetailResponse(ProductResponse):
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    translations: List[ProductTranslationResponse] = []

    class Config:
        from_attributes = True

