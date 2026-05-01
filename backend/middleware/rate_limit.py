"""
Rate Limiting Middleware for Portley Backend
Implements rate limiting using slowapi
"""

from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from dotenv import load_dotenv

load_dotenv()

# Rate limiting configuration
RATE_LIMIT_AUTHENTICATED = int(os.getenv("RATE_LIMIT_AUTHENTICATED", "60"))
RATE_LIMIT_UNAUTHENTICATED = int(os.getenv("RATE_LIMIT_UNAUTHENTICATED", "10"))

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{RATE_LIMIT_UNAUTHENTICATED}/minute"],
    storage_uri="memory://"
)


def get_rate_limit_for_user(request: Request) -> str:
    """
    Get rate limit based on user authentication status
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Rate limit string (e.g., "60/minute")
    """
    # Check if user is authenticated
    authorization = request.headers.get("Authorization")
    if authorization:
        return f"{RATE_LIMIT_AUTHENTICATED}/minute"
    return f"{RATE_LIMIT_UNAUTHENTICATED}/minute"


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded
    
    Args:
        request: FastAPI request object
        exc: Rate limit exceeded exception
        
    Returns:
        JSONResponse: Error response
    """
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please try again later.",
            "limit": exc.detail,
        }
    )


# Export the limiter for use in routes
__all__ = ["limiter", "get_rate_limit_for_user", "rate_limit_exceeded_handler"]
