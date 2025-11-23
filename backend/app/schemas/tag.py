from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.enums.language import Language

# Base schemas
class TagBase(BaseModel):
    name: str
    slug: str

# Create schemas
class TagCreate(TagBase):
    color: Optional[str] = None  # Hex color

# Update schemas
class TagUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

# Response schemas
class TagResponse(TagBase):
    id: UUID
    color: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TagListResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    color: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# Tag Translation
class TagTranslationCreate(BaseModel):
    language: Language
    name: str

class TagTranslationResponse(BaseModel):
    id: UUID
    tag_id: UUID
    language: Language
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

