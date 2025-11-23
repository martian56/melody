from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, Text, Boolean, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.types import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from datetime import datetime
from .enums.language import Language

class Tag(Base):
    """Tags for products like 'New', 'Bestseller', 'Vegan', 'Cruelty-Free', etc."""
    __tablename__ = "tag"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    color: Mapped[str] = mapped_column(String(7), nullable=True)  # Hex color for UI display
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class TagTranslation(Base):
    __tablename__ = "tag_translation"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    tag_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("tag.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[Language] = mapped_column(Enum(Language, native_enum=False), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: one translation per language per tag
    __table_args__ = (
        UniqueConstraint('tag_id', 'language', name='uq_tag_translation_tag_language'),
    )

