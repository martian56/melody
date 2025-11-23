from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
import json

from app.models.product import Product, ProductImage, ProductTranslation, ProductVariant, ProductAttribute, ProductTag
from app.models.category import Category
from app.models.brand import Brand
from app.models.tag import Tag
from app.models.enums.product_status import ProductStatus
from app.schemas.product import ProductCreate, ProductUpdate, ProductImageCreate, ProductTranslationCreate, ProductVariantCreate
from app.core.exceptions import NotFoundError, ConflictError
from app.schemas.common import PaginationParams

class ProductService:
    @staticmethod
    def get_by_id(db: Session, product_id: UUID) -> Optional[Product]:
        """Get product by ID"""
        return db.query(Product).filter(Product.id == product_id).first()
    
    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Product]:
        """Get product by slug"""
        return db.query(Product).filter(Product.slug == slug).first()
    
    @staticmethod
    def get_by_sku(db: Session, sku: str) -> Optional[Product]:
        """Get product by SKU"""
        return db.query(Product).filter(Product.sku == sku).first()
    
    @staticmethod
    def get_all(
        db: Session,
        pagination: PaginationParams,
        category_id: Optional[UUID] = None,
        brand_id: Optional[UUID] = None,
        status: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_featured: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Product], int]:
        """Get all products with filters and pagination"""
        query = db.query(Product)
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if brand_id:
            query = query.filter(Product.brand_id == brand_id)
        if status:
            query = query.filter(Product.status == status)
        if is_active is not None:
            query = query.filter(Product.is_active == is_active)
        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)
        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.sku.ilike(f"%{search}%"),
                    Product.description.ilike(f"%{search}%")
                )
            )
        
        total = query.count()
        products = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size).all()
        
        return products, total
    
    @staticmethod
    def create(db: Session, product_data: ProductCreate) -> Product:
        """Create a new product"""
        # Check if SKU already exists
        existing = ProductService.get_by_sku(db, product_data.sku)
        if existing:
            raise ConflictError(f"Product with SKU {product_data.sku} already exists")
        
        # Check if slug already exists
        existing_slug = ProductService.get_by_slug(db, product_data.slug)
        if existing_slug:
            raise ConflictError(f"Product with slug {product_data.slug} already exists")
        
        # Verify category exists
        category = db.query(Category).filter(Category.id == product_data.category_id).first()
        if not category:
            raise NotFoundError("Category", f"id={product_data.category_id}")
        
        # Verify brand exists if provided
        if product_data.brand_id:
            brand = db.query(Brand).filter(Brand.id == product_data.brand_id).first()
            if not brand:
                raise NotFoundError("Brand", f"id={product_data.brand_id}")
        
        # Create product
        product = Product(**product_data.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def update(db: Session, product_id: UUID, product_data: ProductUpdate) -> Product:
        """Update product"""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        update_data = product_data.model_dump(exclude_unset=True)
        
        # Check SKU uniqueness if updating
        if "sku" in update_data:
            existing = ProductService.get_by_sku(db, update_data["sku"])
            if existing and existing.id != product_id:
                raise ConflictError(f"Product with SKU {update_data['sku']} already exists")
        
        # Check slug uniqueness if updating
        if "slug" in update_data:
            existing_slug = ProductService.get_by_slug(db, update_data["slug"])
            if existing_slug and existing_slug.id != product_id:
                raise ConflictError(f"Product with slug {update_data['slug']} already exists")
        
        # Verify category if updating
        if "category_id" in update_data:
            category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
            if not category:
                raise NotFoundError("Category", f"id={update_data['category_id']}")
        
        # Verify brand if updating
        if "brand_id" in update_data and update_data["brand_id"]:
            brand = db.query(Brand).filter(Brand.id == update_data["brand_id"]).first()
            if not brand:
                raise NotFoundError("Brand", f"id={update_data['brand_id']}")
        
        for field, value in update_data.items():
            setattr(product, field, value)
        
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def delete(db: Session, product_id: UUID) -> None:
        """Delete product"""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        db.delete(product)
        db.commit()
    
    @staticmethod
    def add_image(db: Session, product_id: UUID, image_data: ProductImageCreate) -> ProductImage:
        """Add image to product"""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        # If this image is set as primary, unset all other primary images for this product
        if image_data.is_primary:
            db.query(ProductImage).filter(
                and_(
                    ProductImage.product_id == product_id,
                    ProductImage.is_primary == True
                )
            ).update({"is_primary": False})
        
        image = ProductImage(product_id=product_id, **image_data.model_dump())
        db.add(image)
        db.commit()
        db.refresh(image)
        return image
    
    @staticmethod
    def update_image(db: Session, product_id: UUID, image_id: UUID, image_data) -> ProductImage:
        """Update product image"""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        image = db.query(ProductImage).filter(
            and_(
                ProductImage.id == image_id,
                ProductImage.product_id == product_id
            )
        ).first()
        
        if not image:
            raise NotFoundError("ProductImage", f"id={image_id}")
        
        # If setting this image as primary, unset all other primary images
        if image_data.is_primary is True:
            db.query(ProductImage).filter(
                and_(
                    ProductImage.product_id == product_id,
                    ProductImage.id != image_id,
                    ProductImage.is_primary == True
                )
            ).update({"is_primary": False})
        
        # Update image fields
        update_data = image_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(image, field, value)
        
        db.commit()
        db.refresh(image)
        return image
    
    @staticmethod
    def delete_image(db: Session, product_id: UUID, image_id: UUID) -> None:
        """Delete product image from database and S3"""
        from app.service.file_service import FileService
        import logging
        
        logger = logging.getLogger(__name__)
        
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        image = db.query(ProductImage).filter(
            and_(
                ProductImage.id == image_id,
                ProductImage.product_id == product_id
            )
        ).first()
        
        if not image:
            raise NotFoundError("ProductImage", f"id={image_id}")
        
        # Delete file from S3 before deleting from database
        if image.image_url:
            try:
                deleted = FileService.delete_file(image.image_url)
                if deleted:
                    logger.info(f"Successfully deleted image file from S3: {image.image_url}")
                else:
                    logger.warning(f"Failed to delete image file from S3: {image.image_url}. Continuing with database deletion.")
            except Exception as e:
                logger.error(f"Exception while deleting image file from S3: {e}", exc_info=True)
                logger.warning("Continuing with database deletion despite S3 deletion failure.")
                # Continue with database deletion even if file deletion fails
        
        # Delete from database
        db.delete(image)
        db.commit()
    
    @staticmethod
    def add_translation(db: Session, product_id: UUID, translation_data: ProductTranslationCreate) -> ProductTranslation:
        """Add translation to product"""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        # Check if translation already exists
        existing = db.query(ProductTranslation).filter(
            and_(
                ProductTranslation.product_id == product_id,
                ProductTranslation.language == translation_data.language
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Translation for language {translation_data.language} already exists")
        
        translation = ProductTranslation(product_id=product_id, **translation_data.model_dump())
        db.add(translation)
        db.commit()
        db.refresh(translation)
        return translation
    
    @staticmethod
    def add_variant(db: Session, product_id: UUID, variant_data: ProductVariantCreate) -> ProductVariant:
        """Add variant to product"""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        # Check if SKU already exists
        existing = db.query(ProductVariant).filter(ProductVariant.sku == variant_data.sku).first()
        if existing:
            raise ConflictError(f"Variant with SKU {variant_data.sku} already exists")
        
        variant_dict = variant_data.model_dump()
        if variant_dict.get("variant_data"):
            variant_dict["variant_data"] = json.dumps(variant_dict["variant_data"])
        variant = ProductVariant(product_id=product_id, **variant_dict)
        db.add(variant)
        db.commit()
        db.refresh(variant)
        return variant
    
    @staticmethod
    def add_tag(db: Session, product_id: UUID, tag_id: UUID) -> None:
        """Add tag to product"""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            raise NotFoundError("Tag", f"id={tag_id}")
        
        # Check if already exists
        existing = db.query(ProductTag).filter(
            and_(
                ProductTag.product_id == product_id,
                ProductTag.tag_id == tag_id
            )
        ).first()
        
        if existing:
            raise ConflictError("Tag already added to product")
        
        product_tag = ProductTag(product_id=product_id, tag_id=tag_id)
        db.add(product_tag)
        db.commit()
    
    @staticmethod
    def remove_tag(db: Session, product_id: UUID, tag_id: UUID) -> None:
        """Remove tag from product"""
        product_tag = db.query(ProductTag).filter(
            and_(
                ProductTag.product_id == product_id,
                ProductTag.tag_id == tag_id
            )
        ).first()
        
        if not product_tag:
            raise NotFoundError("ProductTag", f"product_id={product_id}, tag_id={tag_id}")
        
        db.delete(product_tag)
        db.commit()
    
    @staticmethod
    def get_related_products(
        db: Session,
        product_id: UUID,
        limit: int = 12
    ) -> List[Product]:
        """Get related products based on category, brand, and tags"""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise NotFoundError("Product", f"id={product_id}")
        
        related_products = []
        seen_ids = {product_id}
        
        # Priority 1: Same category products
        if product.category_id:
            category_products = db.query(Product).filter(
                and_(
                    Product.category_id == product.category_id,
                    Product.id != product_id,
                    Product.is_active == True,
                    Product.status == ProductStatus.ACTIVE
                )
            ).limit(limit).all()
            
            for p in category_products:
                if p.id not in seen_ids:
                    related_products.append(p)
                    seen_ids.add(p.id)
                    if len(related_products) >= limit:
                        return related_products
        
        # Priority 2: Same brand products
        if product.brand_id and len(related_products) < limit:
            remaining = limit - len(related_products)
            brand_products = db.query(Product).filter(
                and_(
                    Product.brand_id == product.brand_id,
                    Product.id != product_id,
                    Product.is_active == True,
                    Product.status == ProductStatus.ACTIVE
                )
            ).limit(remaining * 2).all()  # Get more to filter out duplicates
            
            for p in brand_products:
                if p.id not in seen_ids:
                    related_products.append(p)
                    seen_ids.add(p.id)
                    if len(related_products) >= limit:
                        return related_products
        
        # Priority 3: Products with same tags
        if len(related_products) < limit:
            # Get product tags
            product_tags = db.query(ProductTag).filter(
                ProductTag.product_id == product_id
            ).all()
            
            if product_tags:
                tag_ids = [pt.tag_id for pt in product_tags]
                remaining = limit - len(related_products)
                
                # Get products with same tags
                tagged_products = db.query(Product).join(ProductTag).filter(
                    and_(
                        ProductTag.tag_id.in_(tag_ids),
                        Product.id != product_id,
                        Product.is_active == True,
                        Product.status == 'active'
                    )
                ).distinct().limit(remaining * 2).all()  # Get more to filter out duplicates
                
                for p in tagged_products:
                    if p.id not in seen_ids:
                        related_products.append(p)
                        seen_ids.add(p.id)
                        if len(related_products) >= limit:
                            return related_products
        
        # Priority 4: Featured products if still need more
        if len(related_products) < limit:
            remaining = limit - len(related_products)
            featured_products = db.query(Product).filter(
                and_(
                    Product.is_featured == True,
                    Product.id != product_id,
                    Product.is_active == True,
                    Product.status == ProductStatus.ACTIVE
                )
            ).limit(remaining * 2).all()  # Get more to filter out duplicates
            
            for p in featured_products:
                if p.id not in seen_ids:
                    related_products.append(p)
                    seen_ids.add(p.id)
                    if len(related_products) >= limit:
                        return related_products
        
        return related_products

