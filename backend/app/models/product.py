from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, Numeric, Text, Enum, Integer, UniqueConstraint
from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.types import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from datetime import datetime
from .enums.language import Language
from .enums.product_status import ProductStatus

class Product(Base):
    __tablename__ = "product"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    sku: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)  # Stock Keeping Unit
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    short_description: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Pricing
    price: Mapped[Decimal] = mapped_column(Numeric[Decimal], nullable=False)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric[Decimal], nullable=True)  # Original price for discounts
    cost_price: Mapped[Decimal | None] = mapped_column(Numeric[Decimal], nullable=True)  # For admin profit calculation
    
    # Relationships
    category_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("category.id"), nullable=False, index=True)
    brand_id: Mapped[UUID | None] = mapped_column(SQLUUID, ForeignKey("brand.id"), nullable=True, index=True)
    
    # Inventory
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10)  # Alert when stock is below this
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Status and visibility
    status: Mapped[ProductStatus] = mapped_column(Enum(ProductStatus, native_enum=False), default=ProductStatus.DRAFT, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)  # Featured products on homepage
    
    # SEO
    meta_title: Mapped[str] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Additional info
    weight: Mapped[Decimal | None] = mapped_column(Numeric[Decimal], nullable=True)  # For shipping
    dimensions: Mapped[str] = mapped_column(String(100), nullable=True)  # e.g., "10x5x3"
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class ProductImage(Base):
    __tablename__ = "product_image"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("product.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[str] = mapped_column(String(255), nullable=True)  # For accessibility and SEO
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)  # Main product image
    sort_order: Mapped[int] = mapped_column(Integer, default=0)  # For ordering images
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class ProductTranslation(Base):
    __tablename__ = "product_translation"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("product.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[Language] = mapped_column(Enum(Language, native_enum=False), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    short_description: Mapped[str] = mapped_column(String(500), nullable=True)
    meta_title: Mapped[str] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: one translation per language per product
    __table_args__ = (
        UniqueConstraint('product_id', 'language', name='uq_product_translation_product_language'),
    )

class ProductAttribute(Base):
    """Links products to attributes and their values (e.g., Product -> Skin Type -> Oily)"""
    __tablename__ = "product_attribute"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("product.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("attribute.id"), nullable=False, index=True)
    attribute_value_id: Mapped[UUID | None] = mapped_column(SQLUUID, ForeignKey("attribute_value.id"), nullable=True, index=True)  # For predefined values
    custom_value: Mapped[str] = mapped_column(String(255), nullable=True)  # For text/number attributes without predefined values
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: one value per attribute per product
    __table_args__ = (
        UniqueConstraint('product_id', 'attribute_id', name='uq_product_attribute_product_attr'),
    )

class ProductTag(Base):
    """Many-to-many relationship between products and tags"""
    __tablename__ = "product_tag"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("product.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("tag.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Unique constraint: prevent duplicate product-tag pairs
    __table_args__ = (
        UniqueConstraint('product_id', 'tag_id', name='uq_product_tag_product_tag'),
    )

class ProductVariant(Base):
    """Product variants for different sizes, colors, etc."""
    __tablename__ = "product_variant"
    id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(SQLUUID, ForeignKey("product.id", ondelete="CASCADE"), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., "Red - 50ml"
    
    # Pricing (if different from base product)
    price: Mapped[Decimal | None] = mapped_column(Numeric[Decimal], nullable=True)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric[Decimal], nullable=True)
    
    # Inventory
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Variant attributes (e.g., size, color)
    variant_data: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string: {"size": "50ml", "color": "red"}
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
