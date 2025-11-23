from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartResponse, CartItemResponse
from app.schemas.common import MessageResponse
from app.service.cart_service import CartService
from app.models.user import User
from app.models.product import Product, ProductImage
from decimal import Decimal

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's cart"""
    cart_items = CartService.get_cart_items(db, current_user.id)
    
    # Get products with images
    product_ids = [item.product_id for item in cart_items]
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
    total_price = Decimal('0.00')
    for cart_item in cart_items:
        product = product_dict.get(cart_item.product_id)
        if product:
            items.append(CartItemResponse(
                id=cart_item.id,
                user_id=cart_item.user_id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                created_at=cart_item.created_at,
                updated_at=cart_item.updated_at,
                product=product
            ))
            total_price += product.price * cart_item.quantity
    
    return CartResponse(
        items=items,
        total_items=sum(item.quantity for item in items),
        total_price=total_price
    )

@router.post("/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    cart_data: CartItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add item to cart"""
    cart_item = CartService.add_to_cart(db, current_user.id, cart_data)
    
    # Get product with image
    product = db.query(Product).filter(Product.id == cart_item.product_id).first()
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
    
    return CartItemResponse(
        id=cart_item.id,
        user_id=cart_item.user_id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at,
        product=product
    )

@router.put("/items/{product_id}", response_model=CartItemResponse)
async def update_cart_item(
    product_id: UUID,
    cart_data: CartItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update cart item quantity"""
    cart_item = CartService.update_cart_item(db, current_user.id, product_id, cart_data)
    
    # Get product with image
    product = db.query(Product).filter(Product.id == cart_item.product_id).first()
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
    
    return CartItemResponse(
        id=cart_item.id,
        user_id=cart_item.user_id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at,
        product=product
    )

@router.delete("/items/{product_id}", response_model=MessageResponse)
async def remove_from_cart(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove item from cart"""
    CartService.remove_from_cart(db, current_user.id, product_id)
    return MessageResponse(message="Item removed from cart")

@router.delete("", response_model=MessageResponse)
async def clear_cart(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Clear cart"""
    CartService.clear_cart(db, current_user.id)
    return MessageResponse(message="Cart cleared")

@router.post("/sync", response_model=MessageResponse)
async def sync_cart(
    items: list[dict],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Sync cart from frontend (merge localStorage with backend)"""
    CartService.sync_cart_from_items(db, current_user.id, items)
    return MessageResponse(message="Cart synced successfully")

