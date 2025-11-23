from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.enums.language import Language

# Base schemas
class BrandBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

# Create schemas
class BrandCreate(BrandBase):
    logo_url: Optional[str] = None
    website_url: Optional[str] = None

# Update schemas
class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    is_active: Optional[bool] = None

# Response schemas
class BrandResponse(BrandBase):
    id: UUID
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BrandListResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# Brand Translation
class BrandTranslationCreate(BaseModel):
    language: Language
    name: str
    description: Optional[str] = None

class BrandTranslationResponse(BaseModel):
    id: UUID
    brand_id: UUID
    language: Language
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

