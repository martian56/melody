from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from uuid import UUID

from app.models.attribute import Attribute, AttributeValue, AttributeTranslation, AttributeValueTranslation
from app.schemas.attribute import (
    AttributeCreate, AttributeUpdate, AttributeValueCreate,
    AttributeTranslationCreate, AttributeValueTranslationCreate
)
from app.core.exceptions import NotFoundError, ConflictError
from app.schemas.common import PaginationParams

class AttributeService:
    @staticmethod
    def get_by_id(db: Session, attribute_id: UUID) -> Optional[Attribute]:
        """Get attribute by ID"""
        return db.query(Attribute).filter(Attribute.id == attribute_id).first()
    
    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Attribute]:
        """Get attribute by slug"""
        return db.query(Attribute).filter(Attribute.slug == slug).first()
    
    @staticmethod
    def get_all(
        db: Session,
        pagination: PaginationParams,
        is_filterable: Optional[bool] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Attribute], int]:
        """Get all attributes with filters and pagination"""
        query = db.query(Attribute)
        
        if is_filterable is not None:
            query = query.filter(Attribute.is_filterable == is_filterable)
        if is_active is not None:
            query = query.filter(Attribute.is_active == is_active)
        if search:
            query = query.filter(
                or_(
                    Attribute.name.ilike(f"%{search}%"),
                    Attribute.description.ilike(f"%{search}%")
                )
            )
        
        query = query.order_by(Attribute.sort_order, Attribute.name)
        total = query.count()
        attributes = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size).all()
        
        return attributes, total
    
    @staticmethod
    def create(db: Session, attribute_data: AttributeCreate) -> Attribute:
        """Create a new attribute"""
        # Check if slug already exists
        existing = AttributeService.get_by_slug(db, attribute_data.slug)
        if existing:
            raise ConflictError(f"Attribute with slug {attribute_data.slug} already exists")
        
        attribute = Attribute(**attribute_data.model_dump())
        db.add(attribute)
        db.commit()
        db.refresh(attribute)
        return attribute
    
    @staticmethod
    def update(db: Session, attribute_id: UUID, attribute_data: AttributeUpdate) -> Attribute:
        """Update attribute"""
        attribute = AttributeService.get_by_id(db, attribute_id)
        if not attribute:
            raise NotFoundError("Attribute", f"id={attribute_id}")
        
        update_data = attribute_data.model_dump(exclude_unset=True)
        
        # Check slug uniqueness if updating
        if "slug" in update_data:
            existing = AttributeService.get_by_slug(db, update_data["slug"])
            if existing and existing.id != attribute_id:
                raise ConflictError(f"Attribute with slug {update_data['slug']} already exists")
        
        for field, value in update_data.items():
            setattr(attribute, field, value)
        
        db.commit()
        db.refresh(attribute)
        return attribute
    
    @staticmethod
    def delete(db: Session, attribute_id: UUID) -> None:
        """Delete attribute"""
        attribute = AttributeService.get_by_id(db, attribute_id)
        if not attribute:
            raise NotFoundError("Attribute", f"id={attribute_id}")
        
        db.delete(attribute)
        db.commit()
    
    @staticmethod
    def add_value(db: Session, attribute_id: UUID, value_data: AttributeValueCreate) -> AttributeValue:
        """Add value to attribute"""
        attribute = AttributeService.get_by_id(db, attribute_id)
        if not attribute:
            raise NotFoundError("Attribute", f"id={attribute_id}")
        
        value = AttributeValue(attribute_id=attribute_id, **value_data.model_dump())
        db.add(value)
        db.commit()
        db.refresh(value)
        return value
    
    @staticmethod
    def add_translation(db: Session, attribute_id: UUID, translation_data: AttributeTranslationCreate) -> AttributeTranslation:
        """Add translation to attribute"""
        attribute = AttributeService.get_by_id(db, attribute_id)
        if not attribute:
            raise NotFoundError("Attribute", f"id={attribute_id}")
        
        existing = db.query(AttributeTranslation).filter(
            and_(
                AttributeTranslation.attribute_id == attribute_id,
                AttributeTranslation.language == translation_data.language
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Translation for language {translation_data.language} already exists")
        
        translation = AttributeTranslation(attribute_id=attribute_id, **translation_data.model_dump())
        db.add(translation)
        db.commit()
        db.refresh(translation)
        return translation
    
    @staticmethod
    def add_value_translation(db: Session, value_id: UUID, translation_data: AttributeValueTranslationCreate) -> AttributeValueTranslation:
        """Add translation to attribute value"""
        value = db.query(AttributeValue).filter(AttributeValue.id == value_id).first()
        if not value:
            raise NotFoundError("AttributeValue", f"id={value_id}")
        
        existing = db.query(AttributeValueTranslation).filter(
            and_(
                AttributeValueTranslation.attribute_value_id == value_id,
                AttributeValueTranslation.language == translation_data.language
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Translation for language {translation_data.language} already exists")
        
        translation = AttributeValueTranslation(attribute_value_id=value_id, **translation_data.model_dump())
        db.add(translation)
        db.commit()
        db.refresh(translation)
        return translation

