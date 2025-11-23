from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_admin_user, get_optional_user
from app.schemas.order import OrderCreate, OrderFromCartCreate, OrderUpdate, OrderResponse, OrderListResponse
from app.schemas.common import PaginatedResponse, MessageResponse, PaginationParams
from app.service.order_service import OrderService
from app.models.user import User
from app.models.enums.order_status import OrderStatus

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Create order (authenticated users can create from cart, unauthenticated users can create directly)"""
    if current_user:
        # Create from cart
        order = OrderService.create_order_from_cart(db, current_user.id, order_data)
    else:
        # Create direct order (for unauthenticated users)
        order = OrderService.create_order(db, order_data, user_id=None)
    
    return order

@router.post("/from-cart", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order_from_cart(
    order_data: OrderFromCartCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create order from user's cart (requires authentication)"""
    # Convert OrderFromCartCreate to OrderCreate for service layer
    order_create = OrderCreate(
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        customer_first_name=order_data.customer_first_name,
        customer_last_name=order_data.customer_last_name,
        delivery_address=order_data.delivery_address,
        delivery_city=order_data.delivery_city,
        delivery_state=order_data.delivery_state,
        delivery_postal_code=order_data.delivery_postal_code,
        delivery_country=order_data.delivery_country,
        items=[],  # Items come from cart, not request body
        subtotal=order_data.subtotal,
        tax=order_data.tax,
        shipping=order_data.shipping,
        discount=order_data.discount,
        notes=order_data.notes
    )
    order = OrderService.create_order_from_cart(db, current_user.id, order_create)
    return order

@router.get("/my-orders", response_model=list[OrderResponse])
async def get_my_orders(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's orders"""
    orders = OrderService.get_user_orders(db, current_user.id)
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get order by ID (users can only see their own orders, admins can see all)"""
    order = OrderService.get_order(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check permissions
    if current_user:
        if current_user.role.value != "admin" and order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this order"
            )
    
    return order

@router.get("/number/{order_number}", response_model=OrderResponse)
async def get_order_by_number(
    order_number: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get order by order number"""
    order = OrderService.get_order_by_number(db, order_number)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check permissions
    if current_user:
        if current_user.role.value != "admin" and order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this order"
            )
    
    return order

# Admin endpoints
@router.get("/admin/all", response_model=PaginatedResponse[OrderListResponse])
async def get_all_orders(
    status: Optional[OrderStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all orders (admin only)"""
    pagination = PaginationParams(page=page, page_size=page_size)
    orders, total = OrderService.get_all_orders(db, status=status, page=page, page_size=page_size)
    
    # Convert to list response
    order_list = []
    for order in orders:
        order_list.append(OrderListResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            customer_email=order.customer_email,
            customer_phone=order.customer_phone,
            total=order.total,
            created_at=order.created_at,
            item_count=len(order.items)
        ))
    
    return PaginatedResponse.create(order_list, total, pagination.page, pagination.page_size)

@router.put("/admin/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_data: OrderUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update order (admin only)"""
    order = OrderService.update_order(db, order_id, order_data)
    return order

@router.post("/{order_id}/payment", response_model=OrderResponse)
async def process_payment(
    order_id: UUID,
    payment_method: str = Query("mock", description="Payment method"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Process payment for order (mock implementation)"""
    order = OrderService.get_order(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check permissions
    if current_user:
        if current_user.role.value != "admin" and order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to process payment for this order"
            )
    
    order = OrderService.process_payment(db, order_id, payment_method)
    return order

