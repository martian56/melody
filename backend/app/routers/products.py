from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_admin_user
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductImageCreate, ProductImageUpdate, ProductImageResponse, ProductTranslationCreate,
    ProductVariantCreate, ProductVariantResponse
)
from app.schemas.common import PaginatedResponse, MessageResponse, PaginationParams
from app.service.product_service import ProductService
from app.models.user import User

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=PaginatedResponse[ProductListResponse])
async def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[UUID] = None,
    brand_id: Optional[UUID] = None,
    status: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all products with filters"""
    from app.models.product import ProductImage
    
    pagination = PaginationParams(page=page, page_size=page_size)
    products, total = ProductService.get_all(
        db,
        pagination,
        category_id=category_id,
        brand_id=brand_id,
        status=status,
        is_active=is_active,
        is_featured=is_featured,
        search=search
    )
    
    # Add primary image URL to each product
    for product in products:
        primary_image = db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.is_primary == True,
            ProductImage.is_active == True
        ).order_by(ProductImage.sort_order).first()
        
        if not primary_image:
            # Fallback to first active image
            primary_image = db.query(ProductImage).filter(
                ProductImage.product_id == product.id,
                ProductImage.is_active == True
            ).order_by(ProductImage.sort_order).first()
        
        # Set image_url on product object for serialization
        if primary_image:
            product.image_url = primary_image.image_url
        else:
            product.image_url = None
    
    return PaginatedResponse.create(products, total, pagination.page, pagination.page_size)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """Get product by ID"""
    from app.models.product import ProductImage
    
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Add primary image URL
    primary_image = db.query(ProductImage).filter(
        ProductImage.product_id == product.id,
        ProductImage.is_primary == True,
        ProductImage.is_active == True
    ).order_by(ProductImage.sort_order).first()
    
    if not primary_image:
        primary_image = db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.is_active == True
        ).order_by(ProductImage.sort_order).first()
    
    product.image_url = primary_image.image_url if primary_image else None
    return product

@router.get("/slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get product by slug"""
    from app.models.product import ProductImage
    
    product = ProductService.get_by_slug(db, slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Add primary image URL
    primary_image = db.query(ProductImage).filter(
        ProductImage.product_id == product.id,
        ProductImage.is_primary == True,
        ProductImage.is_active == True
    ).order_by(ProductImage.sort_order).first()
    
    if not primary_image:
        primary_image = db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.is_active == True
        ).order_by(ProductImage.sort_order).first()
    
    product.image_url = primary_image.image_url if primary_image else None
    return product

@router.get("/{product_id}/related", response_model=PaginatedResponse[ProductListResponse])
async def get_related_products(
    product_id: UUID,
    limit: int = Query(12, ge=1, le=24),
    db: Session = Depends(get_db)
):
    """Get related products (same category, brand, tags)"""
    from app.models.product import ProductImage
    
    related_products = ProductService.get_related_products(db, product_id, limit)
    
    # Add primary image URL to each product
    for product in related_products:
        primary_image = db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.is_primary == True,
            ProductImage.is_active == True
        ).order_by(ProductImage.sort_order).first()
        
        if not primary_image:
            primary_image = db.query(ProductImage).filter(
                ProductImage.product_id == product.id,
                ProductImage.is_active == True
            ).order_by(ProductImage.sort_order).first()
        
        product.image_url = primary_image.image_url if primary_image else None
    
    return PaginatedResponse.create(related_products, len(related_products), 1, limit)

# Admin endpoints
@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new product (admin only)"""
    product = ProductService.create(db, product_data)
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a product (admin only)"""
    product = ProductService.update(db, product_id, product_data)
    return product

@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a product (admin only)"""
    ProductService.delete(db, product_id)
    return MessageResponse(message="Product deleted successfully")

# Product Images
@router.get("/{product_id}/images", response_model=PaginatedResponse[ProductImageResponse])
async def get_product_images(
    product_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all images for a product"""
    from app.models.product import ProductImage
    
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    query = db.query(ProductImage).filter(ProductImage.product_id == product_id)
    total = query.count()
    images = query.order_by(ProductImage.sort_order, ProductImage.created_at).all()
    
    return PaginatedResponse.create(images, total, page, page_size)

@router.post("/{product_id}/images", response_model=ProductImageResponse, status_code=status.HTTP_201_CREATED)
async def add_product_image(
    product_id: UUID,
    image_data: ProductImageCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add image to product (admin only)"""
    image = ProductService.add_image(db, product_id, image_data)
    return image

@router.patch("/{product_id}/images/{image_id}", response_model=ProductImageResponse)
async def update_product_image(
    product_id: UUID,
    image_id: UUID,
    image_data: ProductImageUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update product image (admin only)"""
    image = ProductService.update_image(db, product_id, image_id, image_data)
    return image

@router.delete("/{product_id}/images/{image_id}", response_model=MessageResponse)
async def delete_product_image(
    product_id: UUID,
    image_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete product image (admin only)"""
    ProductService.delete_image(db, product_id, image_id)
    return MessageResponse(message="Image deleted successfully")

# Product Translations
@router.post("/{product_id}/translations", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_product_translation(
    product_id: UUID,
    translation_data: ProductTranslationCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add translation to product (admin only)"""
    translation = ProductService.add_translation(db, product_id, translation_data)
    return {"id": translation.id, "message": "Translation added successfully"}

# Product Variants
@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
async def add_product_variant(
    product_id: UUID,
    variant_data: ProductVariantCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add variant to product (admin only)"""
    variant = ProductService.add_variant(db, product_id, variant_data)
    return variant

# Product Tags
@router.post("/{product_id}/tags/{tag_id}", response_model=MessageResponse)
async def add_product_tag(
    product_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add tag to product (admin only)"""
    ProductService.add_tag(db, product_id, tag_id)
    return MessageResponse(message="Tag added to product successfully")

@router.delete("/{product_id}/tags/{tag_id}", response_model=MessageResponse)
async def remove_product_tag(
    product_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Remove tag from product (admin only)"""
    ProductService.remove_tag(db, product_id, tag_id)
    return MessageResponse(message="Tag removed from product successfully")

