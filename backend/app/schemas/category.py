from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.enums.language import Language

# Base schemas
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

# Create schemas
class CategoryCreate(CategoryBase):
    parent_id: Optional[UUID] = None
    image_url: Optional[str] = None
    icon_url: Optional[str] = None
    sort_order: int = 0

# Update schemas
class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    image_url: Optional[str] = None
    icon_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

# Response schemas
class CategoryResponse(CategoryBase):
    id: UUID
    parent_id: Optional[UUID] = None
    image_url: Optional[str] = None
    icon_url: Optional[str] = None
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CategoryListResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    parent_id: Optional[UUID] = None
    image_url: Optional[str] = None
    sort_order: int
    is_active: bool

    class Config:
        from_attributes = True

# Category Translation
class CategoryTranslationCreate(BaseModel):
    language: Language
    name: str
    description: Optional[str] = None

class CategoryTranslationResponse(BaseModel):
    id: UUID
    category_id: UUID
    language: Language
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Category with children
class CategoryTreeResponse(CategoryResponse):
    children: List['CategoryTreeResponse'] = []

    class Config:
        from_attributes = True

CategoryTreeResponse.model_rebuild()

