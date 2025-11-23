from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_admin_user
from app.schemas.brand import (
    BrandCreate, BrandUpdate, BrandResponse, BrandListResponse,
    BrandTranslationCreate
)
from app.schemas.common import PaginatedResponse, MessageResponse, PaginationParams
from app.service.brand_service import BrandService
from app.models.user import User

router = APIRouter(prefix="/brands", tags=["Brands"])

@router.get("", response_model=PaginatedResponse[BrandListResponse])
async def get_brands(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all brands with filters"""
    pagination = PaginationParams(page=page, page_size=page_size)
    brands, total = BrandService.get_all(
        db,
        pagination,
        is_active=is_active,
        search=search
    )
    return PaginatedResponse.create(brands, total, pagination.page, pagination.page_size)

@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: UUID,
    db: Session = Depends(get_db)
):
    """Get brand by ID"""
    brand = BrandService.get_by_id(db, brand_id)
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )
    return brand

@router.get("/slug/{slug}", response_model=BrandResponse)
async def get_brand_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get brand by slug"""
    brand = BrandService.get_by_slug(db, slug)
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )
    return brand

# Admin endpoints
@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    brand_data: BrandCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new brand (admin only)"""
    brand = BrandService.create(db, brand_data)
    return brand

@router.put("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: UUID,
    brand_data: BrandUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a brand (admin only)"""
    brand = BrandService.update(db, brand_id, brand_data)
    return brand

@router.delete("/{brand_id}", response_model=MessageResponse)
async def delete_brand(
    brand_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a brand (admin only)"""
    BrandService.delete(db, brand_id)
    return MessageResponse(message="Brand deleted successfully")

@router.post("/{brand_id}/translations", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_brand_translation(
    brand_id: UUID,
    translation_data: BrandTranslationCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add translation to brand (admin only)"""
    translation = BrandService.add_translation(db, brand_id, translation_data)
    return {"id": translation.id, "message": "Translation added successfully"}

