from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from app.models.user import User
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.exceptions import UnauthorizedError, NotFoundError
from app.service.user_service import UserService

class AuthService:
    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = UserService.get_by_email(db, email)
        if not user:
            return None
        
        if not user.password:
            return None  # OAuth user, cannot login with password
        
        if not verify_password(password, user.password):
            return None
        
        if not user.is_active:
            return None
        
        return user
    
    @staticmethod
    def create_tokens(user: User) -> dict:
        """Create access and refresh tokens for user"""
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role.value}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> dict:
        """Refresh access token using refresh token"""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token payload")
        
        user = UserService.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("User not found or inactive")
        
        return AuthService.create_tokens(user)
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify and decode token"""
        return decode_token(token)

