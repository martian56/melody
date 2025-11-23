from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token
from app.schemas.auth import (
    LoginRequest, Token, RefreshTokenRequest,
    PasswordResetRequest, PasswordResetConfirm, EmailVerificationRequest
)
from app.schemas.user import UserResponse, UserCreate
from app.schemas.common import MessageResponse
from app.service.auth_service import AuthService
from app.service.user_service import UserService
from app.service.email_service import EmailService
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    user = UserService.create(db, user_data)
    
    # Send welcome email
    try:
        EmailService.send_welcome_email(user)
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")
    
    # Send verification email
    try:
        verification_token = EmailService.generate_verification_token(user.id)
        EmailService.send_verification_email(user, verification_token)
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
    
    return user

@router.post("/login", response_model=Token)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    user = AuthService.authenticate(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    tokens = AuthService.create_tokens(user)
    
    # Send welcome back email
    try:
        EmailService.send_login_email(user)
    except Exception as e:
        logger.error(f"Failed to send login email: {e}")
    
    return tokens

@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    try:
        tokens = AuthService.refresh_access_token(db, token_data.refresh_token)
        return tokens
    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return current_user

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    verification_data: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify user email with token"""
    payload = decode_token(verification_data.token)
    if not payload or payload.get("type") != "email_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )
    
    from uuid import UUID
    try:
        user_id_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    user = UserService.verify_email(db, user_id_uuid)
    return MessageResponse(message="Email verified successfully")

@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Resend verification email"""
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    verification_token = EmailService.generate_verification_token(current_user.id)
    EmailService.send_verification_email(current_user, verification_token)
    
    return MessageResponse(message="Verification email sent")

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    user = UserService.get_by_email(db, reset_data.email)
    if user:
        # Always return success to prevent email enumeration
        reset_token = EmailService.generate_password_reset_token(user.id)
        EmailService.send_password_reset_email(user, reset_token)
    
    return MessageResponse(message="If the email exists, a password reset link has been sent")

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Reset password with token"""
    payload = decode_token(reset_data.token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )
    
    from uuid import UUID
    from app.core.security import get_password_hash
    try:
        user_id_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    user = UserService.get_by_id(db, user_id_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password = get_password_hash(reset_data.new_password)
    db.commit()
    
    return MessageResponse(message="Password reset successfully")

