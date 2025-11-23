from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_admin_user
from app.schemas.tag import (
    TagCreate, TagUpdate, TagResponse, TagListResponse,
    TagTranslationCreate
)
from app.schemas.common import PaginatedResponse, MessageResponse, PaginationParams
from app.service.tag_service import TagService
from app.models.user import User

router = APIRouter(prefix="/tags", tags=["Tags"])

@router.get("", response_model=PaginatedResponse[TagListResponse])
async def get_tags(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all tags with filters"""
    pagination = PaginationParams(page=page, page_size=page_size)
    tags, total = TagService.get_all(
        db,
        pagination,
        is_active=is_active,
        search=search
    )
    return PaginatedResponse.create(tags, total, pagination.page, pagination.page_size)

@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: UUID,
    db: Session = Depends(get_db)
):
    """Get tag by ID"""
    tag = TagService.get_by_id(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    return tag

@router.get("/slug/{slug}", response_model=TagResponse)
async def get_tag_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get tag by slug"""
    tag = TagService.get_by_slug(db, slug)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    return tag

# Admin endpoints
@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new tag (admin only)"""
    tag = TagService.create(db, tag_data)
    return tag

@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: UUID,
    tag_data: TagUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a tag (admin only)"""
    tag = TagService.update(db, tag_id, tag_data)
    return tag

@router.delete("/{tag_id}", response_model=MessageResponse)
async def delete_tag(
    tag_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a tag (admin only)"""
    TagService.delete(db, tag_id)
    return MessageResponse(message="Tag deleted successfully")

@router.post("/{tag_id}/translations", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_tag_translation(
    tag_id: UUID,
    translation_data: TagTranslationCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add translation to tag (admin only)"""
    translation = TagService.add_translation(db, tag_id, translation_data)
    return {"id": translation.id, "message": "Translation added successfully"}

