from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.wishlist import WishlistResponse, WishlistItemResponse
from app.schemas.common import MessageResponse
from app.service.wishlist_service import WishlistService
from app.models.user import User
from app.models.product import Product, ProductImage

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

@router.get("", response_model=WishlistResponse)
async def get_wishlist(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's wishlist"""
    wishlist_items = WishlistService.get_wishlist_items(db, current_user.id)
    
    # Get products with images
    product_ids = [item.product_id for item in wishlist_items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    product_dict = {p.id: p for p in products}
    
    # Get primary images
    for product in products:
        primary_image = db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.is_primary == True,
            ProductImage.is_active == True
        ).first()
        
        if not primary_image:
            primary_image = db.query(ProductImage).filter(
                ProductImage.product_id == product.id,
                ProductImage.is_active == True
            ).first()
        
        if primary_image:
            product.image_url = primary_image.image_url
    
    # Build response items
    items = []
    for wishlist_item in wishlist_items:
        product = product_dict.get(wishlist_item.product_id)
        if product:
            items.append(WishlistItemResponse(
                id=wishlist_item.id,
                user_id=wishlist_item.user_id,
                product_id=wishlist_item.product_id,
                created_at=wishlist_item.created_at,
                product=product
            ))
    
    return WishlistResponse(
        items=items,
        total_items=len(items)
    )

@router.post("/items/{product_id}", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add product to wishlist"""
    try:
        wishlist_item = WishlistService.add_to_wishlist(db, current_user.id, product_id)
    except Exception as e:
        if "already in wishlist" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise
    
    # Get product with image
    product = db.query(Product).filter(Product.id == wishlist_item.product_id).first()
    if product:
        primary_image = db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.is_primary == True,
            ProductImage.is_active == True
        ).first()
        
        if not primary_image:
            primary_image = db.query(ProductImage).filter(
                ProductImage.product_id == product.id,
                ProductImage.is_active == True
            ).first()
        
        if primary_image:
            product.image_url = primary_image.image_url
    
    return WishlistItemResponse(
        id=wishlist_item.id,
        user_id=wishlist_item.user_id,
        product_id=wishlist_item.product_id,
        created_at=wishlist_item.created_at,
        product=product
    )

@router.delete("/items/{product_id}", response_model=MessageResponse)
async def remove_from_wishlist(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove product from wishlist"""
    WishlistService.remove_from_wishlist(db, current_user.id, product_id)
    return MessageResponse(message="Item removed from wishlist")

@router.delete("", response_model=MessageResponse)
async def clear_wishlist(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Clear wishlist"""
    WishlistService.clear_wishlist(db, current_user.id)
    return MessageResponse(message="Wishlist cleared")

@router.get("/items/{product_id}/check", response_model=dict)
async def check_wishlist(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check if product is in wishlist"""
    is_in_wishlist = WishlistService.is_in_wishlist(db, current_user.id, product_id)
    return {"is_in_wishlist": is_in_wishlist}

@router.post("/sync", response_model=MessageResponse)
async def sync_wishlist(
    product_ids: list[UUID],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Sync wishlist from frontend (merge localStorage with backend)"""
    WishlistService.sync_wishlist_from_items(db, current_user.id, product_ids)
    return MessageResponse(message="Wishlist synced successfully")

