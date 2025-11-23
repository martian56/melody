from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from uuid import UUID
from decimal import Decimal

from app.core.database import get_db
from app.schemas.product import ProductListResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.models.product import Product, ProductAttribute, ProductTag
from app.models.category import Category
from app.models.brand import Brand
from app.models.tag import Tag
from app.models.attribute import Attribute, AttributeValue
from app.models.enums.product_status import ProductStatus

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/products", response_model=PaginatedResponse[ProductListResponse])
async def search_products(
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[UUID] = None,
    brand_id: Optional[UUID] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    in_stock: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    tags: Optional[List[UUID]] = Query(None, description="Filter by tag IDs"),
    attributes: Optional[List[UUID]] = Query(None, description="Filter by attribute value IDs"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Advanced product search with multiple filters:
    - Text search (name, description, SKU)
    - Category, brand filters
    - Price range
    - Stock availability
    - Tags
    - Attributes (skin type, hair type, etc.)
    """
    pagination = PaginationParams(page=page, page_size=page_size)
    
    # Start with base query
    query = db.query(Product).filter(Product.is_active == True)
    
    # Text search
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.sku.ilike(search_term),
                Product.short_description.ilike(search_term)
            )
        )
    
    # Category filter
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    # Brand filter
    if brand_id:
        query = query.filter(Product.brand_id == brand_id)
    
    # Price range
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Stock filter
    if in_stock is not None:
        if in_stock:
            query = query.filter(Product.stock_quantity > 0)
        else:
            query = query.filter(Product.stock_quantity == 0)
    
    # Featured filter
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    
    # Status filter (only active products)
    query = query.filter(Product.status == ProductStatus.ACTIVE)
    
    # Tag filter
    if tags:
        query = query.join(ProductTag).filter(ProductTag.tag_id.in_(tags))
    
    # Attribute filter
    if attributes:
        query = query.join(ProductAttribute).filter(
            ProductAttribute.attribute_value_id.in_(attributes)
        )
    
    # Remove duplicates if joins were used
    if tags or attributes:
        query = query.distinct()
    
    # Count and paginate
    total = query.count()
    products = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size).all()
    
    return PaginatedResponse.create(products, total, pagination.page, pagination.page_size)

@router.get("/filters")
async def get_search_filters(
    category_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """
    Get available filters for search:
    - Categories
    - Brands
    - Price range
    - Tags
    - Attributes and their values
    """
    filters = {}
    
    # Categories
    categories = db.query(Category).filter(Category.is_active == True).all()
    filters["categories"] = [{"id": str(c.id), "name": c.name, "slug": c.slug} for c in categories]
    
    # Brands
    brands = db.query(Brand).filter(Brand.is_active == True).all()
    filters["brands"] = [{"id": str(b.id), "name": b.name, "slug": b.slug} for b in brands]
    
    # Price range
    price_stats = db.query(
        func.min(Product.price).label("min_price"),
        func.max(Product.price).label("max_price")
    ).filter(Product.is_active == True, Product.status == ProductStatus.ACTIVE).first()
    
    filters["price_range"] = {
        "min": float(price_stats.min_price) if price_stats.min_price else 0,
        "max": float(price_stats.max_price) if price_stats.max_price else 0
    }
    
    # Tags
    tags = db.query(Tag).filter(Tag.is_active == True).all()
    filters["tags"] = [{"id": str(t.id), "name": t.name, "slug": t.slug, "color": t.color} for t in tags]
    
    # Attributes (filterable only)
    attributes = db.query(Attribute).filter(
        Attribute.is_active == True,
        Attribute.is_filterable == True
    ).all()
    
    filters["attributes"] = []
    for attr in attributes:
        values = db.query(AttributeValue).filter(
            AttributeValue.attribute_id == attr.id,
            AttributeValue.is_active == True
        ).order_by(AttributeValue.sort_order).all()
        
        filters["attributes"].append({
            "id": str(attr.id),
            "name": attr.name,
            "slug": attr.slug,
            "attribute_type": attr.attribute_type.value,
            "values": [
                {"id": str(v.id), "value": v.value, "slug": v.slug}
                for v in values
            ]
        })
    
    return filters

