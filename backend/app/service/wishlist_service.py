from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from uuid import UUID

from app.models.wishlist import WishlistItem
from app.models.product import Product
from app.core.exceptions import NotFoundError, ConflictError

class WishlistService:
    @staticmethod
    def get_wishlist_items(db: Session, user_id: UUID) -> List[WishlistItem]:
        """Get all wishlist items for a user"""
        return db.query(WishlistItem).filter(WishlistItem.user_id == user_id).all()
    
    @staticmethod
    def get_wishlist_item(db: Session, user_id: UUID, product_id: UUID) -> WishlistItem | None:
        """Get a specific wishlist item"""
        return db.query(WishlistItem).filter(
            and_(WishlistItem.user_id == user_id, WishlistItem.product_id == product_id)
        ).first()
    
    @staticmethod
    def add_to_wishlist(db: Session, user_id: UUID, product_id: UUID) -> WishlistItem:
        """Add product to wishlist"""
        # Verify product exists and is active
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.is_active == True
        ).first()
        
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        # Check if already in wishlist
        existing_item = WishlistService.get_wishlist_item(db, user_id, product_id)
        if existing_item:
            raise ConflictError(f"Product {product_id} is already in wishlist")
        
        wishlist_item = WishlistItem(
            user_id=user_id,
            product_id=product_id
        )
        db.add(wishlist_item)
        db.commit()
        db.refresh(wishlist_item)
        return wishlist_item
    
    @staticmethod
    def remove_from_wishlist(db: Session, user_id: UUID, product_id: UUID) -> None:
        """Remove product from wishlist"""
        wishlist_item = WishlistService.get_wishlist_item(db, user_id, product_id)
        if not wishlist_item:
            raise NotFoundError("Wishlist item", f"user_id={user_id}, product_id={product_id}")
        
        db.delete(wishlist_item)
        db.commit()
    
    @staticmethod
    def clear_wishlist(db: Session, user_id: UUID) -> None:
        """Clear all items from wishlist"""
        db.query(WishlistItem).filter(WishlistItem.user_id == user_id).delete()
        db.commit()
    
    @staticmethod
    def is_in_wishlist(db: Session, user_id: UUID, product_id: UUID) -> bool:
        """Check if product is in wishlist"""
        return WishlistService.get_wishlist_item(db, user_id, product_id) is not None
    
    @staticmethod
    def sync_wishlist_from_items(db: Session, user_id: UUID, product_ids: List[UUID]) -> None:
        """Sync wishlist items from frontend (for merging localStorage with backend)"""
        # Get existing wishlist items
        existing_items = {str(item.product_id) for item in WishlistService.get_wishlist_items(db, user_id)}
        
        for product_id in product_ids:
            # Verify product exists
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                continue
            
            if str(product_id) not in existing_items:
                # Create new item
                wishlist_item = WishlistItem(
                    user_id=user_id,
                    product_id=product_id
                )
                db.add(wishlist_item)
        
        db.commit()

