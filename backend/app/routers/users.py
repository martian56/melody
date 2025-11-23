from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_admin_user
from app.schemas.user import UserResponse, UserUpdate, UserPasswordUpdate, UserPublic
from app.schemas.common import PaginatedResponse, MessageResponse
from app.service.user_service import UserService
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's profile"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    user = UserService.update(db, current_user.id, user_data)
    return user

@router.put("/me/password", response_model=MessageResponse)
async def update_my_password(
    password_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's password"""
    UserService.update_password(
        db,
        current_user.id,
        password_data.current_password,
        password_data.new_password
    )
    return MessageResponse(message="Password updated successfully")

@router.get("/{user_id}", response_model=UserPublic)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """Get user by ID (public info only)"""
    user = UserService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# Admin endpoints
@router.get("/admin/all", response_model=PaginatedResponse[UserResponse])
async def get_all_users(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    from app.schemas.common import PaginationParams
    
    pagination = PaginationParams(page=page, page_size=page_size)
    # TODO: Implement pagination in UserService
    users = db.query(User).offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size).all()
    total = db.query(User).count()
    
    return PaginatedResponse.create(users, total, pagination.page, pagination.page_size)

@router.put("/admin/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Activate a user (admin only)"""
    user = UserService.activate(db, user_id)
    return user

@router.put("/admin/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Deactivate a user (admin only)"""
    user = UserService.deactivate(db, user_id)
    return user

