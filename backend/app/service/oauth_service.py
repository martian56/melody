import httpx
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.models.user import User
from app.models.oauth_account import OAuthAccount
from app.models.enums.oauth_provider import OAuthProvider
from app.core.config import settings
from app.core.exceptions import UnauthorizedError, ConflictError
from app.service.user_service import UserService
from app.schemas.user import UserCreateOAuth

class OAuthService:
    @staticmethod
    async def get_google_user_info(access_token: str) -> dict:
        """Get user info from Google using access token"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code != 200:
                raise UnauthorizedError("Failed to get user info from Google")
            return response.json()
    
    @staticmethod
    async def exchange_google_code(code: str, redirect_uri: str) -> dict:
        """Exchange Google authorization code for tokens"""
        async with httpx.AsyncClient() as client:
            data = {
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=data
            )
            if response.status_code != 200:
                raise UnauthorizedError("Failed to exchange code for tokens")
            return response.json()
    
    @staticmethod
    def get_or_create_oauth_account(
        db: Session,
        provider: OAuthProvider,
        provider_account_id: str,
        provider_email: str,
        access_token: Optional[str] = None,
        refresh_token: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        user_data: Optional[dict] = None
    ) -> tuple[User, OAuthAccount, bool]:
        """
        Get or create OAuth account and user
        Returns: (user, oauth_account, is_new_user)
        """
        # Check if OAuth account exists
        oauth_account = db.query(OAuthAccount).filter(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_account_id == provider_account_id
        ).first()
        
        if oauth_account:
            # Update tokens
            if access_token:
                oauth_account.access_token = access_token
            if refresh_token:
                oauth_account.refresh_token = refresh_token
            if expires_at:
                oauth_account.expires_at = expires_at
            oauth_account.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(oauth_account)
            
            user = UserService.get_by_id(db, oauth_account.user_id)
            return user, oauth_account, False
        
        # Check if user exists by email
        user = UserService.get_by_email(db, provider_email)
        is_new_user = False
        
        if not user:
            # Create new user
            user_create = UserCreateOAuth(
                email=provider_email,
                provider=provider.value,
                provider_account_id=provider_account_id,
                first_name=user_data.get("given_name") if user_data else None,
                last_name=user_data.get("family_name") if user_data else None,
                avatar_url=user_data.get("picture") if user_data else None,
            )
            user = UserService.create_oauth(db, user_create)
            is_new_user = True
        
        # Create OAuth account
        oauth_account = OAuthAccount(
            user_id=user.id,
            provider=provider,
            provider_account_id=provider_account_id,
            provider_email=provider_email,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
        )
        db.add(oauth_account)
        db.commit()
        db.refresh(oauth_account)
        
        return user, oauth_account, is_new_user

