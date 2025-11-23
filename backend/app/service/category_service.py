from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from uuid import UUID

from app.models.category import Category, CategoryTranslation
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryTranslationCreate
from app.core.exceptions import NotFoundError, ConflictError
from app.schemas.common import PaginationParams

class CategoryService:
    @staticmethod
    def get_by_id(db: Session, category_id: UUID) -> Optional[Category]:
        """Get category by ID"""
        return db.query(Category).filter(Category.id == category_id).first()
    
    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Category]:
        """Get category by slug"""
        return db.query(Category).filter(Category.slug == slug).first()
    
    @staticmethod
    def get_all(
        db: Session,
        pagination: PaginationParams,
        parent_id: Optional[UUID] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Category], int]:
        """Get all categories with filters and pagination"""
        query = db.query(Category)
        
        if parent_id is not None:
            query = query.filter(Category.parent_id == parent_id)
        if is_active is not None:
            query = query.filter(Category.is_active == is_active)
        if search:
            query = query.filter(
                or_(
                    Category.name.ilike(f"%{search}%"),
                    Category.description.ilike(f"%{search}%")
                )
            )
        
        query = query.order_by(Category.sort_order, Category.name)
        total = query.count()
        categories = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size).all()
        
        return categories, total
    
    @staticmethod
    def get_tree(db: Session, parent_id: Optional[UUID] = None) -> List[Category]:
        """Get category tree (hierarchical)"""
        query = db.query(Category).filter(Category.is_active == True)
        if parent_id is None:
            query = query.filter(Category.parent_id.is_(None))
        else:
            query = query.filter(Category.parent_id == parent_id)
        
        return query.order_by(Category.sort_order, Category.name).all()
    
    @staticmethod
    def create(db: Session, category_data: CategoryCreate) -> Category:
        """Create a new category"""
        # Check if slug already exists
        existing = CategoryService.get_by_slug(db, category_data.slug)
        if existing:
            raise ConflictError(f"Category with slug {category_data.slug} already exists")
        
        # Verify parent exists if provided
        if category_data.parent_id:
            parent = CategoryService.get_by_id(db, category_data.parent_id)
            if not parent:
                raise NotFoundError("Category", f"id={category_data.parent_id}")
        
        category = Category(**category_data.model_dump())
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    
    @staticmethod
    def update(db: Session, category_id: UUID, category_data: CategoryUpdate) -> Category:
        """Update category"""
        category = CategoryService.get_by_id(db, category_id)
        if not category:
            raise NotFoundError("Category", f"id={category_id}")
        
        update_data = category_data.model_dump(exclude_unset=True)
        
        # Check slug uniqueness if updating
        if "slug" in update_data:
            existing = CategoryService.get_by_slug(db, update_data["slug"])
            if existing and existing.id != category_id:
                raise ConflictError(f"Category with slug {update_data['slug']} already exists")
        
        # Verify parent if updating
        if "parent_id" in update_data and update_data["parent_id"]:
            parent = CategoryService.get_by_id(db, update_data["parent_id"])
            if not parent:
                raise NotFoundError("Category", f"id={update_data['parent_id']}")
            # Prevent circular reference
            if update_data["parent_id"] == category_id:
                raise ConflictError("Category cannot be its own parent")
        
        for field, value in update_data.items():
            setattr(category, field, value)
        
        db.commit()
        db.refresh(category)
        return category
    
    @staticmethod
    def delete(db: Session, category_id: UUID) -> None:
        """Delete category"""
        category = CategoryService.get_by_id(db, category_id)
        if not category:
            raise NotFoundError("Category", f"id={category_id}")
        
        # Check if has children
        children = db.query(Category).filter(Category.parent_id == category_id).count()
        if children > 0:
            raise ConflictError("Cannot delete category with child categories")
        
        db.delete(category)
        db.commit()
    
    @staticmethod
    def add_translation(db: Session, category_id: UUID, translation_data: CategoryTranslationCreate) -> CategoryTranslation:
        """Add translation to category"""
        category = CategoryService.get_by_id(db, category_id)
        if not category:
            raise NotFoundError("Category", f"id={category_id}")
        
        # Check if translation already exists
        existing = db.query(CategoryTranslation).filter(
            and_(
                CategoryTranslation.category_id == category_id,
                CategoryTranslation.language == translation_data.language
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Translation for language {translation_data.language} already exists")
        
        translation = CategoryTranslation(category_id=category_id, **translation_data.model_dump())
        db.add(translation)
        db.commit()
        db.refresh(translation)
        return translation

