from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.schemas.common import MessageResponse
from app.service.file_service import FileService
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["File Upload"])

@router.post("/product-image", response_model=dict)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload product image (admin only)"""
    try:
        image_url = await FileService.upload_product_image(file)
        return {"url": image_url, "message": "Image uploaded successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/product-images", response_model=dict)
async def upload_product_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload multiple product images (admin only)"""
    try:
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided"
            )
        
        uploaded_urls = []
        errors = []
        
        for file in files:
            try:
                image_url = await FileService.upload_product_image(file)
                uploaded_urls.append(image_url)
            except Exception as e:
                errors.append(f"{file.filename}: {str(e)}")
        
        return {
            "urls": uploaded_urls,
            "errors": errors,
            "message": f"Uploaded {len(uploaded_urls)} image(s) successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/category-image", response_model=dict)
async def upload_category_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload category image (admin only)"""
    try:
        image_url = await FileService.upload_category_image(file)
        return {"url": image_url, "message": "Image uploaded successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/brand-logo")
async def upload_brand_logo(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload brand logo (admin only)"""
    try:
        logger.info(f"Upload request received: filename={file.filename}, content_type={file.content_type}")
        
        if not file or not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided or filename is missing"
            )
        
        logo_url = await FileService.upload_brand_logo(file)
        return {"url": logo_url, "message": "Logo uploaded successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload user avatar (admin only)"""
    try:
        avatar_url = await FileService.upload_user_avatar(file)
        return {"url": avatar_url, "message": "Avatar uploaded successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

