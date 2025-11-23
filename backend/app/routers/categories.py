from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_admin_user
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryListResponse,
    CategoryTreeResponse, CategoryTranslationCreate
)
from app.schemas.common import PaginatedResponse, MessageResponse, PaginationParams
from app.service.category_service import CategoryService
from app.models.user import User

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=PaginatedResponse[CategoryListResponse])
async def get_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    parent_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all categories with filters"""
    pagination = PaginationParams(page=page, page_size=page_size)
    categories, total = CategoryService.get_all(
        db,
        pagination,
        parent_id=parent_id,
        is_active=is_active,
        search=search
    )
    return PaginatedResponse.create(categories, total, pagination.page, pagination.page_size)

@router.get("/tree", response_model=list[CategoryTreeResponse])
async def get_category_tree(
    parent_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Get category tree (hierarchical)"""
    categories = CategoryService.get_tree(db, parent_id)
    return categories

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: UUID,
    db: Session = Depends(get_db)
):
    """Get category by ID"""
    category = CategoryService.get_by_id(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

@router.get("/slug/{slug}", response_model=CategoryResponse)
async def get_category_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get category by slug"""
    category = CategoryService.get_by_slug(db, slug)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

# Admin endpoints
@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new category (admin only)"""
    category = CategoryService.create(db, category_data)
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a category (admin only)"""
    category = CategoryService.update(db, category_id, category_data)
    return category

@router.delete("/{category_id}", response_model=MessageResponse)
async def delete_category(
    category_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a category (admin only)"""
    CategoryService.delete(db, category_id)
    return MessageResponse(message="Category deleted successfully")

@router.post("/{category_id}/translations", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_category_translation(
    category_id: UUID,
    translation_data: CategoryTranslationCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add translation to category (admin only)"""
    translation = CategoryService.add_translation(db, category_id, translation_data)
    return {"id": translation.id, "message": "Translation added successfully"}

