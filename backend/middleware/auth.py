"""
Authentication Middleware for Portley Backend
Handles Supabase JWT verification and user context extraction
"""

from fastapi import Header, HTTPException, Depends, status
from typing import Optional
import jwt
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


class UserContext(BaseModel):
    """User context model"""
    id: str
    email: str
    agency_id: Optional[str] = None
    role: str = "user"
    user_metadata: dict = {}


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> UserContext:
    """
    Verify Supabase JWT and extract user context
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        UserContext: User information
        
    Raises:
        HTTPException: If authentication fails
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Extract token from Authorization header
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify JWT with Supabase
        try:
            # Decode JWT (Supabase uses RS256)
            decoded = jwt.decode(
                token,
                options={
                    "verify_signature": True,
                    "verify_aud": False,
                    "verify_exp": True
                }
            )
            
            # Extract user information
            user_id = decoded.get("sub")
            email = decoded.get("email")
            user_metadata = decoded.get("user_metadata", {})
            
            if not user_id or not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                )
            
            # Get agency_id from user metadata or database
            agency_id = user_metadata.get("agency_id")
            
            # Determine user role
            role = user_metadata.get("role", "user")
            
            return UserContext(
                id=user_id,
                email=email,
                agency_id=agency_id,
                role=role,
                user_metadata=user_metadata
            )
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    authorization: Optional[str] = Header(None)
) -> Optional[UserContext]:
    """
    Optionally verify Supabase JWT and extract user context
    Returns None if authentication fails instead of raising exception
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        Optional[UserContext]: User information or None
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


async def require_agency_member(
    current_user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Require user to be a member of an agency
    
    Args:
        current_user: Current user context
        
    Returns:
        UserContext: User information
        
    Raises:
        HTTPException: If user is not a member of an agency
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    return current_user


async def require_agency_owner(
    current_user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Require user to be an agency owner
    
    Args:
        current_user: Current user context
        
    Returns:
        UserContext: User information
        
    Raises:
        HTTPException: If user is not an agency owner
    """
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be an agency owner",
        )
    
    return current_user
