from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, Text, Boolean, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.types import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from datetime import datetime
from .enums.language import Language
from .enums.attribute_type import AttributeType

class Attribute(Base):
    """Attributes like 'Skin Type', 'Hair Type', 'Concern', etc."""
    __tablename__ = "attribute"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    attribute_type: Mapped[AttributeType] = mapped_column(Enum(AttributeType, native_enum=False), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_filterable: Mapped[bool] = mapped_column(Boolean, default=True)  # Can users filter by this?
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)  # Is this required for products?
    sort_order: Mapped[int] = mapped_column(Integer, default=0)  # For ordering in admin/filters
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class AttributeTranslation(Base):
    __tablename__ = "attribute_translation"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    attribute_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("attribute.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[Language] = mapped_column(Enum(Language, native_enum=False), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: one translation per language per attribute
    __table_args__ = (
        UniqueConstraint('attribute_id', 'language', name='uq_attribute_translation_attribute_language'),
    )

class AttributeValue(Base):
    """Predefined values for attributes like 'Oily', 'Dry', 'Combination' for Skin Type"""
    __tablename__ = "attribute_value"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    attribute_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("attribute.id"), index=True)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class AttributeValueTranslation(Base):
    __tablename__ = "attribute_value_translation"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    attribute_value_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("attribute_value.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[Language] = mapped_column(Enum(Language, native_enum=False), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: one translation per language per attribute value
    __table_args__ = (
        UniqueConstraint('attribute_value_id', 'language', name='uq_attribute_value_translation_value_language'),
    )

