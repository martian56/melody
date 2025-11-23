from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, Boolean, Enum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.types import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from datetime import datetime
from .enums.oauth_provider import OAuthProvider

class OAuthAccount(Base):
    """OAuth accounts for social login - scalable for multiple providers"""
    __tablename__ = "oauth_account"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[OAuthProvider] = mapped_column(Enum(OAuthProvider, native_enum=False), nullable=False, index=True)
    provider_account_id: Mapped[str] = mapped_column(String(255), nullable=False)  # The ID from the provider
    provider_email: Mapped[str] = mapped_column(String(255), nullable=True)
    access_token: Mapped[str] = mapped_column(Text, nullable=True)  # Encrypted in production
    refresh_token: Mapped[str] = mapped_column(Text, nullable=True)  # Encrypted in production
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: one provider account per user per provider
    __table_args__ = (
        UniqueConstraint('user_id', 'provider', 'provider_account_id', name='uq_oauth_account_user_provider'),
    )

