from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.auth import OAuthLoginRequest, Token
from app.schemas.user import UserResponse
from app.service.oauth_service import OAuthService
from app.service.auth_service import AuthService
from app.models.enums.oauth_provider import OAuthProvider

router = APIRouter(prefix="/oauth", tags=["OAuth"])

@router.post("/google", response_model=Token)
async def google_login(
    oauth_data: OAuthLoginRequest,
    db: Session = Depends(get_db)
):
    """Login with Google OAuth"""
    from app.service.email_service import EmailService
    import logging
    
    logger = logging.getLogger(__name__)
    
    if oauth_data.provider != "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid provider"
        )
    
    try:
        # Get redirect URI from settings if not provided
        redirect_uri = oauth_data.redirect_uri
        if not redirect_uri:
            from app.core.config import settings
            redirect_uri = settings.GOOGLE_REDIRECT_URI or (settings.CORS_ORIGINS[0] + "/oauth/callback" if settings.CORS_ORIGINS else "http://localhost:5173/oauth/callback")
        
        # Exchange code for tokens
        token_data = await OAuthService.exchange_google_code(
            code=oauth_data.code,
            redirect_uri=redirect_uri
        )
        
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)
        
        # Get user info from Google
        user_info = await OAuthService.get_google_user_info(access_token)
        
        # Get or create user and OAuth account
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        user, oauth_account, is_new_user = OAuthService.get_or_create_oauth_account(
            db=db,
            provider=OAuthProvider.GOOGLE,
            provider_account_id=user_info.get("id"),
            provider_email=user_info.get("email"),
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            user_data=user_info
        )
        
        # Send welcome email for new users
        if is_new_user:
            try:
                EmailService.send_welcome_email(user)
            except Exception as e:
                logger.error(f"Failed to send welcome email: {e}")
        else:
            # Send welcome back email for existing users
            try:
                EmailService.send_login_email(user)
            except Exception as e:
                logger.error(f"Failed to send login email: {e}")
        
        # Create JWT tokens
        tokens = AuthService.create_tokens(user)
        
        return tokens
        
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"OAuth authentication failed: {str(e)}"
        )

@router.get("/google/authorize")
async def google_authorize_url(redirect_uri: Optional[str] = Query(None)):
    """Get Google OAuth authorization URL"""
    from app.core.config import settings
    
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    # Use provided redirect_uri or default from settings
    if not redirect_uri:
        redirect_uri = settings.GOOGLE_REDIRECT_URI or (settings.CORS_ORIGINS[0] + "/oauth/callback" if settings.CORS_ORIGINS else "http://localhost:5173/oauth/callback")
    
    scope = "openid email profile"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    
    return {"authorization_url": auth_url}

