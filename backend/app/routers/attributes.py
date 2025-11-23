from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_admin_user
from app.schemas.attribute import (
    AttributeCreate, AttributeUpdate, AttributeResponse,
    AttributeValueCreate, AttributeValueResponse,
    AttributeTranslationCreate, AttributeValueTranslationCreate
)
from app.schemas.common import PaginatedResponse, MessageResponse, PaginationParams
from app.service.attribute_service import AttributeService
from app.models.user import User

router = APIRouter(prefix="/attributes", tags=["Attributes"])

@router.get("", response_model=PaginatedResponse[AttributeResponse])
async def get_attributes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_filterable: Optional[bool] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all attributes with filters"""
    pagination = PaginationParams(page=page, page_size=page_size)
    attributes, total = AttributeService.get_all(
        db,
        pagination,
        is_filterable=is_filterable,
        is_active=is_active,
        search=search
    )
    return PaginatedResponse.create(attributes, total, pagination.page, pagination.page_size)

@router.get("/{attribute_id}", response_model=AttributeResponse)
async def get_attribute(
    attribute_id: UUID,
    db: Session = Depends(get_db)
):
    """Get attribute by ID"""
    attribute = AttributeService.get_by_id(db, attribute_id)
    if not attribute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attribute not found"
        )
    return attribute

# Admin endpoints
@router.post("", response_model=AttributeResponse, status_code=status.HTTP_201_CREATED)
async def create_attribute(
    attribute_data: AttributeCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new attribute (admin only)"""
    attribute = AttributeService.create(db, attribute_data)
    return attribute

@router.put("/{attribute_id}", response_model=AttributeResponse)
async def update_attribute(
    attribute_id: UUID,
    attribute_data: AttributeUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update an attribute (admin only)"""
    attribute = AttributeService.update(db, attribute_id, attribute_data)
    return attribute

@router.delete("/{attribute_id}", response_model=MessageResponse)
async def delete_attribute(
    attribute_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an attribute (admin only)"""
    AttributeService.delete(db, attribute_id)
    return MessageResponse(message="Attribute deleted successfully")

@router.post("/{attribute_id}/values", response_model=AttributeValueResponse, status_code=status.HTTP_201_CREATED)
async def add_attribute_value(
    attribute_id: UUID,
    value_data: AttributeValueCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add value to attribute (admin only)"""
    value = AttributeService.add_value(db, attribute_id, value_data)
    return value

@router.post("/{attribute_id}/translations", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_attribute_translation(
    attribute_id: UUID,
    translation_data: AttributeTranslationCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add translation to attribute (admin only)"""
    translation = AttributeService.add_translation(db, attribute_id, translation_data)
    return {"id": translation.id, "message": "Translation added successfully"}

@router.post("/values/{value_id}/translations", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_attribute_value_translation(
    value_id: UUID,
    translation_data: AttributeValueTranslationCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add translation to attribute value (admin only)"""
    translation = AttributeService.add_value_translation(db, value_id, translation_data)
    return {"id": translation.id, "message": "Translation added successfully"}

