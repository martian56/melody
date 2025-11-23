from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from uuid import UUID

from app.models.brand import Brand, BrandTranslation
from app.schemas.brand import BrandCreate, BrandUpdate, BrandTranslationCreate
from app.core.exceptions import NotFoundError, ConflictError
from app.schemas.common import PaginationParams

class BrandService:
    @staticmethod
    def get_by_id(db: Session, brand_id: UUID) -> Optional[Brand]:
        """Get brand by ID"""
        return db.query(Brand).filter(Brand.id == brand_id).first()
    
    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Brand]:
        """Get brand by slug"""
        return db.query(Brand).filter(Brand.slug == slug).first()
    
    @staticmethod
    def get_all(
        db: Session,
        pagination: PaginationParams,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Brand], int]:
        """Get all brands with filters and pagination"""
        query = db.query(Brand)
        
        if is_active is not None:
            query = query.filter(Brand.is_active == is_active)
        if search:
            query = query.filter(
                or_(
                    Brand.name.ilike(f"%{search}%"),
                    Brand.description.ilike(f"%{search}%")
                )
            )
        
        query = query.order_by(Brand.name)
        total = query.count()
        brands = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size).all()
        
        return brands, total
    
    @staticmethod
    def create(db: Session, brand_data: BrandCreate) -> Brand:
        """Create a new brand"""
        # Check if slug already exists
        existing = BrandService.get_by_slug(db, brand_data.slug)
        if existing:
            raise ConflictError(f"Brand with slug {brand_data.slug} already exists")
        
        brand = Brand(**brand_data.model_dump())
        db.add(brand)
        db.commit()
        db.refresh(brand)
        return brand
    
    @staticmethod
    def update(db: Session, brand_id: UUID, brand_data: BrandUpdate) -> Brand:
        """Update brand"""
        brand = BrandService.get_by_id(db, brand_id)
        if not brand:
            raise NotFoundError("Brand", f"id={brand_id}")
        
        update_data = brand_data.model_dump(exclude_unset=True)
        
        # Check slug uniqueness if updating
        if "slug" in update_data:
            existing = BrandService.get_by_slug(db, update_data["slug"])
            if existing and existing.id != brand_id:
                raise ConflictError(f"Brand with slug {update_data['slug']} already exists")
        
        for field, value in update_data.items():
            setattr(brand, field, value)
        
        db.commit()
        db.refresh(brand)
        return brand
    
    @staticmethod
    def delete(db: Session, brand_id: UUID) -> None:
        """Delete brand"""
        brand = BrandService.get_by_id(db, brand_id)
        if not brand:
            raise NotFoundError("Brand", f"id={brand_id}")
        
        db.delete(brand)
        db.commit()
    
    @staticmethod
    def add_translation(db: Session, brand_id: UUID, translation_data: BrandTranslationCreate) -> BrandTranslation:
        """Add translation to brand"""
        brand = BrandService.get_by_id(db, brand_id)
        if not brand:
            raise NotFoundError("Brand", f"id={brand_id}")
        
        # Check if translation already exists
        existing = db.query(BrandTranslation).filter(
            and_(
                BrandTranslation.brand_id == brand_id,
                BrandTranslation.language == translation_data.language
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Translation for language {translation_data.language} already exists")
        
        translation = BrandTranslation(brand_id=brand_id, **translation_data.model_dump())
        db.add(translation)
        db.commit()
        db.refresh(translation)
        return translation

