from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.enums.attribute_type import AttributeType
from app.models.enums.language import Language

# Attribute Value
class AttributeValueBase(BaseModel):
    value: str
    slug: str

class AttributeValueCreate(AttributeValueBase):
    sort_order: int = 0

class AttributeValueResponse(AttributeValueBase):
    id: UUID
    attribute_id: UUID
    sort_order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Attribute
class AttributeBase(BaseModel):
    name: str
    slug: str
    attribute_type: AttributeType
    description: Optional[str] = None

class AttributeCreate(AttributeBase):
    is_filterable: bool = True
    is_required: bool = False
    sort_order: int = 0

class AttributeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    attribute_type: Optional[AttributeType] = None
    description: Optional[str] = None
    is_filterable: Optional[bool] = None
    is_required: Optional[bool] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class AttributeResponse(AttributeBase):
    id: UUID
    is_filterable: bool
    is_required: bool
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    values: List[AttributeValueResponse] = []

    class Config:
        from_attributes = True

# Product Attribute
class ProductAttributeCreate(BaseModel):
    attribute_id: UUID
    attribute_value_id: Optional[UUID] = None
    custom_value: Optional[str] = None

class ProductAttributeResponse(BaseModel):
    id: UUID
    product_id: UUID
    attribute_id: UUID
    attribute_value_id: Optional[UUID] = None
    custom_value: Optional[str] = None
    attribute: AttributeResponse
    attribute_value: Optional[AttributeValueResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Translations
class AttributeTranslationCreate(BaseModel):
    language: Language
    name: str
    description: Optional[str] = None

class AttributeValueTranslationCreate(BaseModel):
    language: Language
    value: str

