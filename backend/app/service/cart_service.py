from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List
from uuid import UUID
from decimal import Decimal

from app.models.cart import CartItem
from app.models.product import Product, ProductImage
from app.schemas.cart import CartItemCreate, CartItemUpdate
from app.core.exceptions import NotFoundError, ConflictError

class CartService:
    @staticmethod
    def get_cart_items(db: Session, user_id: UUID) -> List[CartItem]:
        """Get all cart items for a user with product details"""
        return db.query(CartItem).filter(CartItem.user_id == user_id).all()
    
    @staticmethod
    def get_cart_item(db: Session, user_id: UUID, product_id: UUID) -> CartItem | None:
        """Get a specific cart item"""
        return db.query(CartItem).filter(
            and_(CartItem.user_id == user_id, CartItem.product_id == product_id)
        ).first()
    
    @staticmethod
    def add_to_cart(db: Session, user_id: UUID, cart_data: CartItemCreate) -> CartItem:
        """Add or update item in cart"""
        # Verify product exists and is active
        product = db.query(Product).filter(
            Product.id == cart_data.product_id,
            Product.is_active == True
        ).first()
        
        if not product:
            raise NotFoundError("Product", f"id={cart_data.product_id}")
        
        # Check if item already exists in cart
        existing_item = CartService.get_cart_item(db, user_id, cart_data.product_id)
        
        if existing_item:
            # Update quantity
            existing_item.quantity += cart_data.quantity
            db.commit()
            db.refresh(existing_item)
            return existing_item
        else:
            # Create new cart item
            cart_item = CartItem(
                user_id=user_id,
                product_id=cart_data.product_id,
                quantity=cart_data.quantity
            )
            db.add(cart_item)
            db.commit()
            db.refresh(cart_item)
            return cart_item
    
    @staticmethod
    def update_cart_item(db: Session, user_id: UUID, product_id: UUID, cart_data: CartItemUpdate) -> CartItem:
        """Update cart item quantity"""
        cart_item = CartService.get_cart_item(db, user_id, product_id)
        if not cart_item:
            raise NotFoundError("Cart item", f"user_id={user_id}, product_id={product_id}")
        
        cart_item.quantity = cart_data.quantity
        db.commit()
        db.refresh(cart_item)
        return cart_item
    
    @staticmethod
    def remove_from_cart(db: Session, user_id: UUID, product_id: UUID) -> None:
        """Remove item from cart"""
        cart_item = CartService.get_cart_item(db, user_id, product_id)
        if not cart_item:
            raise NotFoundError("Cart item", f"user_id={user_id}, product_id={product_id}")
        
        db.delete(cart_item)
        db.commit()
    
    @staticmethod
    def clear_cart(db: Session, user_id: UUID) -> None:
        """Clear all items from cart"""
        db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        db.commit()
    
    @staticmethod
    def get_cart_total(db: Session, user_id: UUID) -> tuple[int, Decimal]:
        """Get total items and total price for cart"""
        cart_items = CartService.get_cart_items(db, user_id)
        total_items = sum(item.quantity for item in cart_items)
        
        # Get products with prices
        product_ids = [item.product_id for item in cart_items]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        product_prices = {p.id: p.price for p in products}
        
        total_price = Decimal('0.00')
        for item in cart_items:
            price = product_prices.get(item.product_id, Decimal('0.00'))
            total_price += price * item.quantity
        
        return total_items, total_price
    
    @staticmethod
    def sync_cart_from_items(db: Session, user_id: UUID, items: List[dict]) -> None:
        """Sync cart items from frontend (for merging localStorage with backend)"""
        # Get existing cart items
        existing_items = {str(item.product_id): item for item in CartService.get_cart_items(db, user_id)}
        
        for item_data in items:
            product_id = UUID(item_data['product_id']) if isinstance(item_data['product_id'], str) else item_data['product_id']
            quantity = item_data.get('quantity', 1)
            
            # Verify product exists
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                continue
            
            existing_item = existing_items.get(str(product_id))
            
            if existing_item:
                # Update quantity (use max of existing and new)
                existing_item.quantity = max(existing_item.quantity, quantity)
            else:
                # Create new item
                cart_item = CartItem(
                    user_id=user_id,
                    product_id=product_id,
                    quantity=quantity
                )
                db.add(cart_item)
        
        db.commit()

