from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from uuid import UUID

from app.models.tag import Tag, TagTranslation
from app.schemas.tag import TagCreate, TagUpdate, TagTranslationCreate
from app.core.exceptions import NotFoundError, ConflictError
from app.schemas.common import PaginationParams

class TagService:
    @staticmethod
    def get_by_id(db: Session, tag_id: UUID) -> Optional[Tag]:
        """Get tag by ID"""
        return db.query(Tag).filter(Tag.id == tag_id).first()
    
    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Tag]:
        """Get tag by slug"""
        return db.query(Tag).filter(Tag.slug == slug).first()
    
    @staticmethod
    def get_all(
        db: Session,
        pagination: PaginationParams,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Tag], int]:
        """Get all tags with filters and pagination"""
        query = db.query(Tag)
        
        if is_active is not None:
            query = query.filter(Tag.is_active == is_active)
        if search:
            query = query.filter(Tag.name.ilike(f"%{search}%"))
        
        query = query.order_by(Tag.name)
        total = query.count()
        tags = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size).all()
        
        return tags, total
    
    @staticmethod
    def create(db: Session, tag_data: TagCreate) -> Tag:
        """Create a new tag"""
        # Check if slug already exists
        existing = TagService.get_by_slug(db, tag_data.slug)
        if existing:
            raise ConflictError(f"Tag with slug {tag_data.slug} already exists")
        
        tag = Tag(**tag_data.model_dump())
        db.add(tag)
        db.commit()
        db.refresh(tag)
        return tag
    
    @staticmethod
    def update(db: Session, tag_id: UUID, tag_data: TagUpdate) -> Tag:
        """Update tag"""
        tag = TagService.get_by_id(db, tag_id)
        if not tag:
            raise NotFoundError("Tag", f"id={tag_id}")
        
        update_data = tag_data.model_dump(exclude_unset=True)
        
        # Check slug uniqueness if updating
        if "slug" in update_data:
            existing = TagService.get_by_slug(db, update_data["slug"])
            if existing and existing.id != tag_id:
                raise ConflictError(f"Tag with slug {update_data['slug']} already exists")
        
        for field, value in update_data.items():
            setattr(tag, field, value)
        
        db.commit()
        db.refresh(tag)
        return tag
    
    @staticmethod
    def delete(db: Session, tag_id: UUID) -> None:
        """Delete tag"""
        tag = TagService.get_by_id(db, tag_id)
        if not tag:
            raise NotFoundError("Tag", f"id={tag_id}")
        
        db.delete(tag)
        db.commit()
    
    @staticmethod
    def add_translation(db: Session, tag_id: UUID, translation_data: TagTranslationCreate) -> TagTranslation:
        """Add translation to tag"""
        tag = TagService.get_by_id(db, tag_id)
        if not tag:
            raise NotFoundError("Tag", f"id={tag_id}")
        
        existing = db.query(TagTranslation).filter(
            and_(
                TagTranslation.tag_id == tag_id,
                TagTranslation.language == translation_data.language
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Translation for language {translation_data.language} already exists")
        
        translation = TagTranslation(tag_id=tag_id, **translation_data.model_dump())
        db.add(translation)
        db.commit()
        db.refresh(translation)
        return translation

