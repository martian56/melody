from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.models.user import User
from app.models.enums.user_role import UserRole
from app.schemas.user import UserCreate, UserCreateOAuth, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.core.exceptions import NotFoundError, ConflictError

class UserService:
    @staticmethod
    def get_by_id(db: Session, user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create(db: Session, user_data: UserCreate) -> User:
        """Create a new user"""
        # Check if user already exists
        existing_user = UserService.get_by_email(db, user_data.email)
        if existing_user:
            raise ConflictError(f"User with email {user_data.email} already exists")
        
        # Create user
        user = User(
            email=user_data.email,
            password=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            role=UserRole.USER,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def create_oauth(db: Session, user_data: UserCreateOAuth) -> User:
        """Create a new user from OAuth"""
        # Check if user already exists
        existing_user = UserService.get_by_email(db, user_data.email)
        if existing_user:
            return existing_user
        
        # Create user without password
        user = User(
            email=user_data.email,
            password=None,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            avatar_url=user_data.avatar_url,
            role=UserRole.USER,
            is_verified=True,  # OAuth users are pre-verified
            email_verified_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update(db: Session, user_id: UUID, user_data: UserUpdate) -> User:
        """Update user"""
        user = UserService.get_by_id(db, user_id)
        if not user:
            raise NotFoundError("User", f"id={user_id}")
        
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_password(db: Session, user_id: UUID, current_password: str, new_password: str) -> User:
        """Update user password"""
        user = UserService.get_by_id(db, user_id)
        if not user:
            raise NotFoundError("User", f"id={user_id}")
        
        if not user.password:
            raise ConflictError("User does not have a password set (OAuth user)")
        
        if not verify_password(current_password, user.password):
            raise ConflictError("Current password is incorrect")
        
        user.password = get_password_hash(new_password)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def verify_email(db: Session, user_id: UUID) -> User:
        """Verify user email"""
        user = UserService.get_by_id(db, user_id)
        if not user:
            raise NotFoundError("User", f"id={user_id}")
        
        user.is_verified = True
        user.email_verified_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def deactivate(db: Session, user_id: UUID) -> User:
        """Deactivate user"""
        user = UserService.get_by_id(db, user_id)
        if not user:
            raise NotFoundError("User", f"id={user_id}")
        
        user.is_active = False
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def activate(db: Session, user_id: UUID) -> User:
        """Activate user"""
        user = UserService.get_by_id(db, user_id)
        if not user:
            raise NotFoundError("User", f"id={user_id}")
        
        user.is_active = True
        db.commit()
        db.refresh(user)
        return user

