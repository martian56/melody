# Import all models so Alembic can detect them
from .base import Base
from .user import User
from .product import Product, ProductImage, ProductTranslation, ProductAttribute, ProductTag, ProductVariant
from .category import Category, CategoryTranslation
from .brand import Brand, BrandTranslation
from .attribute import Attribute, AttributeValue, AttributeTranslation, AttributeValueTranslation
from .tag import Tag, TagTranslation
from .oauth_account import OAuthAccount
from .cart import CartItem
from .wishlist import WishlistItem
from .order import Order, OrderItem

__all__ = [
    "Base",
    "User",
    "Product",
    "ProductImage",
    "ProductTranslation",
    "ProductAttribute",
    "ProductTag",
    "ProductVariant",
    "Category",
    "CategoryTranslation",
    "Brand",
    "BrandTranslation",
    "Attribute",
    "AttributeValue",
    "AttributeTranslation",
    "AttributeValueTranslation",
    "Tag",
    "TagTranslation",
    "OAuthAccount",
    "CartItem",
    "WishlistItem",
    "Order",
    "OrderItem",
]

