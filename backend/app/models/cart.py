from uuid import UUID, uuid4
from sqlalchemy import Integer, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.types import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from datetime import datetime

class CartItem(Base):
    """Shopping cart items for users"""
    __tablename__ = "cart_item"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("product.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Ensure one cart item per user-product combination
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='uq_cart_user_product'),
    )

