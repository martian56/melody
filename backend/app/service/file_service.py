from typing import Optional
from fastapi import UploadFile
import logging

from app.core.config import settings
from app.service.s3_service import get_s3_service

logger = logging.getLogger(__name__)

class FileService:
    """Service for handling file uploads to S3"""
    
    ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".tiff", ".tif", ".ico", ".avif"}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @classmethod
    def _get_file_extension(cls, filename: str) -> str:
        """Get file extension"""
        from pathlib import Path
        return Path(filename).suffix.lower()
    
    @classmethod
    def _is_valid_image(cls, filename: str) -> bool:
        """Check if file is a valid image"""
        ext = cls._get_file_extension(filename)
        return ext in cls.ALLOWED_IMAGE_EXTENSIONS
    
    @classmethod
    async def upload_product_image(cls, file: UploadFile) -> str:
        """Upload product image to S3 and return URL"""
        if not file.filename:
            raise ValueError("Filename is required")
        
        if not cls._is_valid_image(file.filename):
            raise ValueError(f"Invalid image format. Allowed: {cls.ALLOWED_IMAGE_EXTENSIONS}")
        
        s3_service = get_s3_service()
        content = await file.read()
        
        if len(content) > cls.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds {cls.MAX_FILE_SIZE / 1024 / 1024}MB")
        
        # Reset file pointer for potential reuse
        await file.seek(0)
        
        return s3_service.upload_file(
            file_content=content,
            folder="products",
            original_filename=file.filename or "file",
            content_type=file.content_type
        )
    
    @classmethod
    async def upload_category_image(cls, file: UploadFile) -> str:
        """Upload category image to S3 and return URL"""
        if not file.filename:
            raise ValueError("Filename is required")
        
        if not cls._is_valid_image(file.filename):
            raise ValueError(f"Invalid image format. Allowed: {cls.ALLOWED_IMAGE_EXTENSIONS}")
        
        s3_service = get_s3_service()
        content = await file.read()
        
        if len(content) > cls.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds {cls.MAX_FILE_SIZE / 1024 / 1024}MB")
        
        await file.seek(0)
        
        return s3_service.upload_file(
            file_content=content,
            folder="categories",
            original_filename=file.filename or "file",
            content_type=file.content_type
        )
    
    @classmethod
    async def upload_brand_logo(cls, file: UploadFile) -> str:
        """Upload brand logo to S3 and return URL"""
        if not file.filename:
            raise ValueError("Filename is required")
        
        if not cls._is_valid_image(file.filename):
            raise ValueError(f"Invalid image format. Allowed: {cls.ALLOWED_IMAGE_EXTENSIONS}")
        
        s3_service = get_s3_service()
        content = await file.read()
        
        if len(content) > cls.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds {cls.MAX_FILE_SIZE / 1024 / 1024}MB")
        
        await file.seek(0)
        
        return s3_service.upload_file(
            file_content=content,
            folder="brands",
            original_filename=file.filename or "file",
            content_type=file.content_type
        )
    
    @classmethod
    async def upload_user_avatar(cls, file: UploadFile) -> str:
        """Upload user avatar to S3 and return URL"""
        if not file.filename:
            raise ValueError("Filename is required")
        
        if not cls._is_valid_image(file.filename):
            raise ValueError(f"Invalid image format. Allowed: {cls.ALLOWED_IMAGE_EXTENSIONS}")
        
        s3_service = get_s3_service()
        content = await file.read()
        
        if len(content) > cls.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds {cls.MAX_FILE_SIZE / 1024 / 1024}MB")
        
        await file.seek(0)
        
        return s3_service.upload_file(
            file_content=content,
            folder="users",
            original_filename=file.filename or "file",
            content_type=file.content_type
        )
    
    @classmethod
    def delete_file(cls, file_url: str) -> bool:
        """Delete file from S3 by URL"""
        try:
            if not file_url:
                logger.warning("Empty file URL provided for deletion")
                return False
            
            s3_service = get_s3_service()
            result = s3_service.delete_file(file_url)
            
            if result:
                logger.info(f"Successfully deleted file from S3: {file_url}")
            else:
                logger.warning(f"Failed to delete file from S3: {file_url}")
            
            return result
        except Exception as e:
            logger.error(f"Error deleting file from S3: {e}", exc_info=True)
            return False
    
    @classmethod
    def file_exists(cls, file_url: str) -> bool:
        """Check if file exists in S3"""
        try:
            if not file_url:
                return False
            
            s3_service = get_s3_service()
            return s3_service.file_exists(file_url)
        except Exception as e:
            logger.error(f"Error checking file existence: {e}")
            return False
