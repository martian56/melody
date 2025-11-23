from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.product import Product, ProductImage
from app.models.user import User
from app.models.enums.order_status import OrderStatus
from app.schemas.order import OrderCreate, OrderUpdate
from app.core.exceptions import NotFoundError
from app.service.cart_service import CartService

class OrderService:
    @staticmethod
    def _generate_order_number(db: Session) -> str:
        """Generate unique order number"""
        # Format: ORD-YYYY-MMDD-XXXX
        today = datetime.now()
        date_prefix = today.strftime("%Y-%m%d")
        
        # Get count of orders today
        count = db.query(Order).filter(
            func.date(Order.created_at) == today.date()
        ).count()
        
        order_number = f"ORD-{date_prefix}-{count + 1:04d}"
        
        # Ensure uniqueness
        while db.query(Order).filter(Order.order_number == order_number).first():
            count += 1
            order_number = f"ORD-{date_prefix}-{count + 1:04d}"
        
        return order_number
    
    @staticmethod
    def _calculate_totals(items: List[dict], subtotal: Optional[Decimal] = None) -> tuple[Decimal, Decimal, Decimal, Decimal]:
        """Calculate order totals"""
        if subtotal is None:
            subtotal = sum(Decimal(str(item['unit_price'])) * item['quantity'] for item in items)
        
        # Simple tax calculation (10% for now, can be made configurable)
        tax = subtotal * Decimal('0.10')
        
        # Simple shipping calculation (free shipping over $50, otherwise $5)
        shipping = Decimal('0.00') if subtotal >= Decimal('50.00') else Decimal('5.00')
        
        discount = Decimal('0.00')  # Can be calculated based on coupons, etc.
        
        total = subtotal + tax + shipping - discount
        
        return subtotal, tax, shipping, total
    
    @staticmethod
    def create_order_from_cart(
        db: Session,
        user_id: UUID,
        order_data: OrderCreate
    ) -> Order:
        """Create order from user's cart"""
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User", f"id={user_id}")
        
        # Get cart items
        cart_items = CartService.get_cart_items(db, user_id)
        if not cart_items:
            raise ValueError("Cart is empty")
        
        # Get products
        product_ids = [item.product_id for item in cart_items]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        product_dict = {p.id: p for p in products}
        
        # Prepare order items
        order_items_data = []
        for cart_item in cart_items:
            product = product_dict.get(cart_item.product_id)
            if not product or not product.is_active:
                continue
            
            # Get product image
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
            
            order_items_data.append({
                'product_id': product.id,
                'product_name': product.name,
                'product_sku': product.sku,
                'product_image_url': primary_image.image_url if primary_image else None,
                'unit_price': product.price,
                'quantity': cart_item.quantity,
                'total_price': product.price * cart_item.quantity
            })
        
        if not order_items_data:
            raise ValueError("No valid products in cart")
        
        # Calculate totals
        subtotal, tax, shipping, total = OrderService._calculate_totals(
            order_items_data,
            order_data.subtotal
        )
        
        # Override with provided values if any
        if order_data.tax is not None:
            tax = order_data.tax
        if order_data.shipping is not None:
            shipping = order_data.shipping
        if order_data.discount is not None:
            discount = order_data.discount
        else:
            discount = Decimal('0.00')
        
        total = subtotal + tax + shipping - discount
        
        # Create order
        order = Order(
            user_id=user_id,
            order_number=OrderService._generate_order_number(db),
            status=OrderStatus.PENDING,
            customer_email=order_data.customer_email or user.email,
            customer_phone=order_data.customer_phone or user.phone or "",
            customer_first_name=order_data.customer_first_name or user.first_name,
            customer_last_name=order_data.customer_last_name or user.last_name,
            delivery_address=order_data.delivery_address,
            delivery_city=order_data.delivery_city,
            delivery_state=order_data.delivery_state,
            delivery_postal_code=order_data.delivery_postal_code,
            delivery_country=order_data.delivery_country or "Azerbaijan",
            subtotal=subtotal,
            tax=tax,
            shipping=shipping,
            discount=discount,
            total=total,
            notes=order_data.notes,
            payment_status="pending"
        )
        db.add(order)
        db.flush()  # Flush to get order.id
        
        # Create order items
        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data['product_id'],
                product_name=item_data['product_name'],
                product_sku=item_data['product_sku'],
                product_image_url=item_data['product_image_url'],
                unit_price=item_data['unit_price'],
                quantity=item_data['quantity'],
                total_price=item_data['total_price']
            )
            db.add(order_item)
        
        # Clear cart
        CartService.clear_cart(db, user_id)
        
        db.commit()
        # Reload order with items for email
        order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order.id).first()
        
        # Send order confirmation email
        try:
            from app.service.email_service import EmailService
            EmailService.send_order_status_email(order)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send order confirmation email: {e}")
        
        return order
    
    @staticmethod
    def create_order(
        db: Session,
        order_data: OrderCreate,
        user_id: Optional[UUID] = None
    ) -> Order:
        """Create order (for unauthenticated users or direct order creation)"""
        # Calculate totals
        items_data = [
            {
                'unit_price': item.unit_price,
                'quantity': item.quantity
            }
            for item in order_data.items
        ]
        
        subtotal, tax, shipping, total = OrderService._calculate_totals(
            items_data,
            order_data.subtotal
        )
        
        # Override with provided values if any
        if order_data.tax is not None:
            tax = order_data.tax
        if order_data.shipping is not None:
            shipping = order_data.shipping
        if order_data.discount is not None:
            discount = order_data.discount
        else:
            discount = Decimal('0.00')
        
        total = subtotal + tax + shipping - discount
        
        # Get products for order items
        product_ids = [item.product_id for item in order_data.items]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        product_dict = {p.id: p for p in products}
        
        # Create order
        order = Order(
            user_id=user_id,
            order_number=OrderService._generate_order_number(db),
            status=OrderStatus.PENDING,
            customer_email=order_data.customer_email,
            customer_phone=order_data.customer_phone,
            customer_first_name=order_data.customer_first_name,
            customer_last_name=order_data.customer_last_name,
            delivery_address=order_data.delivery_address,
            delivery_city=order_data.delivery_city,
            delivery_state=order_data.delivery_state,
            delivery_postal_code=order_data.delivery_postal_code,
            delivery_country=order_data.delivery_country or "Azerbaijan",
            subtotal=subtotal,
            tax=tax,
            shipping=shipping,
            discount=discount,
            total=total,
            notes=order_data.notes,
            payment_status="pending"
        )
        db.add(order)
        db.flush()
        
        # Create order items
        for item_create in order_data.items:
            product = product_dict.get(item_create.product_id)
            product_name = product.name if product else "Unknown Product"
            product_sku = product.sku if product else None
            
            # Get product image
            product_image_url = None
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
                
                product_image_url = primary_image.image_url if primary_image else None
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_create.product_id,
                product_name=product_name,
                product_sku=product_sku,
                product_image_url=product_image_url,
                unit_price=item_create.unit_price,
                quantity=item_create.quantity,
                total_price=item_create.unit_price * item_create.quantity
            )
            db.add(order_item)
        
        db.commit()
        # Reload order with items for email
        order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order.id).first()
        
        # Send order confirmation email
        try:
            from app.service.email_service import EmailService
            EmailService.send_order_status_email(order)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send order confirmation email: {e}")
        
        return order
    
    @staticmethod
    def get_order(db: Session, order_id: UUID) -> Optional[Order]:
        """Get order by ID"""
        return db.query(Order).options(
            joinedload(Order.items)
        ).filter(Order.id == order_id).first()
    
    @staticmethod
    def get_order_by_number(db: Session, order_number: str) -> Optional[Order]:
        """Get order by order number"""
        return db.query(Order).options(
            joinedload(Order.items)
        ).filter(Order.order_number == order_number).first()
    
    @staticmethod
    def get_user_orders(db: Session, user_id: UUID) -> List[Order]:
        """Get all orders for a user"""
        return db.query(Order).options(
            joinedload(Order.items)
        ).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    
    @staticmethod
    def get_all_orders(
        db: Session,
        status: Optional[OrderStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Order], int]:
        """Get all orders (admin)"""
        query = db.query(Order)
        
        if status:
            query = query.filter(Order.status == status)
        
        total = query.count()
        orders = query.options(
            joinedload(Order.items)
        ).order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        
        return orders, total
    
    @staticmethod
    def update_order(db: Session, order_id: UUID, order_data: OrderUpdate) -> Order:
        """Update order (admin)"""
        from app.service.email_service import EmailService
        import logging
        
        logger = logging.getLogger(__name__)
        
        order = OrderService.get_order(db, order_id)
        if not order:
            raise NotFoundError("Order", f"id={order_id}")
        
        # Track if status changed
        old_status = order.status
        update_data = order_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(order, field, value)
        
        db.commit()
        # Reload order with items for email
        order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order.id).first()
        
        # Send email if status changed
        if 'status' in update_data and order.status != old_status:
            try:
                EmailService.send_order_status_email(order)
            except Exception as e:
                logger.error(f"Failed to send order status email: {e}")
        
        return order
    
    @staticmethod
    def process_payment(db: Session, order_id: UUID, payment_method: str = "mock") -> Order:
        """Process payment for order (mock implementation)"""
        order = OrderService.get_order(db, order_id)
        if not order:
            raise NotFoundError("Order", f"id={order_id}")
        
        if order.payment_status == "completed":
            raise ValueError("Order already paid")
        
        # Mock payment processing
        order.payment_method = payment_method
        order.payment_status = "completed"
        order.payment_transaction_id = f"MOCK-{order.order_number}-{datetime.now().timestamp()}"
        order.status = OrderStatus.PAID
        
        db.commit()
        # Reload order with items for email
        order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order.id).first()
        
        # Send order confirmation email
        try:
            from app.service.email_service import EmailService
            EmailService.send_order_status_email(order)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send order confirmation email: {e}")
        
        return order

