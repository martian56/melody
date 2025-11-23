from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, Text, Boolean, Enum, Integer, UniqueConstraint
from sqlalchemy import ForeignKey
from sqlalchemy.types import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from datetime import datetime
from .enums.language import Language



class Category(Base):
    __tablename__ = "category"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    parent_id: Mapped[UUID | None] = mapped_column(SQLUUID, ForeignKey("category.id"), nullable=True, index=True)  # Nullable for root categories
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    icon_url: Mapped[str] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)  # For ordering in admin/frontend
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class CategoryTranslation(Base):
    __tablename__ = "category_translation"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    category_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("category.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[Language] = mapped_column(Enum(Language, native_enum=False), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: one translation per language per category
    __table_args__ = (
        UniqueConstraint('category_id', 'language', name='uq_category_translation_category_language'),
    )