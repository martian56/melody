from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, Text, Boolean, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.types import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from datetime import datetime
from .enums.language import Language

class Brand(Base):
    __tablename__ = "brand"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class BrandTranslation(Base):
    __tablename__ = "brand_translation"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    brand_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("brand.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[Language] = mapped_column(Enum(Language, native_enum=False), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: one translation per language per brand
    __table_args__ = (
        UniqueConstraint('brand_id', 'language', name='uq_brand_translation_brand_language'),
    )

