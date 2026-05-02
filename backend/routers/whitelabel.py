"""
Whitelabel router for agency branding and custom domain management.

This router provides endpoints for:
- Getting agency branding configuration
- Updating agency branding (logo, color, custom domain)
- Resolving agency from slug or custom domain
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from backend.middleware.auth import get_current_user
from backend.services.whitelabel import (
    AgencyBranding,
    get_agency_branding,
    update_agency_branding,
    resolve_agency_from_request,
    generate_portal_css,
    validate_hex_color,
    validate_custom_domain,
)


router = APIRouter(prefix="/whitelabel", tags=["whitelabel"])


class BrandingUpdateRequest(BaseModel):
    """Request model for updating agency branding."""
    logo_url: Optional[str] = None
    brand_color: Optional[str] = None
    custom_domain: Optional[str] = None


class BrandingResponse(BaseModel):
    """Response model for agency branding."""
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    brand_color: str
    custom_domain: Optional[str] = None
    plan: str
    css_variables: str


@router.get("/agency", response_model=AgencyBranding)
async def get_agency(
    request: Request,
    current_user=Depends(get_current_user)
):
    """
    Get current user's agency branding.
    
    This endpoint returns the branding configuration for the current user's agency.
    """
    try:
        agency = await get_agency_branding(current_user.agency_id)
        return agency
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get agency branding: {str(e)}")


@router.get("/agency/{agency_id}", response_model=AgencyBranding)
async def get_agency_by_id(
    agency_id: str,
    current_user=Depends(get_current_user)
):
    """
    Get agency branding by ID.
    
    This endpoint allows fetching branding for any agency (useful for admin).
    """
    try:
        agency = await get_agency_branding(agency_id)
        return agency
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get agency branding: {str(e)}")


@router.get("/resolve", response_model=AgencyBranding)
async def resolve_agency(request: Request):
    """
    Resolve agency from request (slug or custom domain).
    
    This endpoint is used by the client portal to resolve agency branding
    from the request URL (either slug or custom domain).
    
    This is a public endpoint (no authentication required) as it's used
    by clients accessing their portal.
    """
    try:
        agency = await resolve_agency_from_request(request)
        return agency
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve agency: {str(e)}")


@router.get("/resolve/{slug}", response_model=AgencyBranding)
async def resolve_agency_by_slug(slug: str):
    """
    Resolve agency by slug.
    
    This is a public endpoint (no authentication required) as it's used
    by clients accessing their portal.
    
    Args:
        slug: Agency slug (e.g., "acme-studio")
    """
    try:
        from backend.services.whitelabel import resolve_agency_from_slug
        agency = await resolve_agency_from_slug(slug)
        return agency
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve agency: {str(e)}")


@router.patch("/agency", response_model=AgencyBranding)
async def update_branding(
    request: BrandingUpdateRequest,
    current_user=Depends(get_current_user)
):
    """
    Update agency branding.
    
    This endpoint allows updating the agency's logo, brand color, and custom domain.
    
    Args:
        request: Branding update request with optional fields
    
    Returns:
        Updated agency branding
    """
    try:
        # Check if user has permission to update branding
        # (Only agency owners can update branding)
        # This is enforced by RLS policies in the database
        
        # Validate custom domain is only available for Agency plan
        if request.custom_domain and current_user.plan != 'agency':
            raise HTTPException(
                status_code=403,
                detail="Custom domain is only available on Agency plan"
            )
        
        agency = await update_agency_branding(
            agency_id=current_user.agency_id,
            logo_url=request.logo_url,
            brand_color=request.brand_color,
            custom_domain=request.custom_domain,
        )
        
        return agency
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update branding: {str(e)}")


@router.get("/css/{agency_id}")
async def get_portal_css(agency_id: str):
    """
    Get CSS variables for client portal.
    
    This endpoint returns CSS custom properties for the client portal
    based on the agency's branding configuration.
    
    This is a public endpoint (no authentication required) as it's used
    by clients accessing their portal.
    
    Args:
        agency_id: Agency UUID
    
    Returns:
        CSS string with custom properties
    """
    try:
        agency = await get_agency_branding(agency_id)
        css = generate_portal_css(agency)
        
        return {
            "agency_id": agency_id,
            "css": css,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSS: {str(e)}")


@router.get("/validate/color/{color}")
async def validate_color(color: str):
    """
    Validate hex color format.
    
    This endpoint validates that a color string is a valid hex color.
    
    Args:
        color: Color string to validate
    
    Returns:
        Validation result
    """
    is_valid = validate_hex_color(color)
    
    return {
        "valid": is_valid,
        "color": color,
    }


@router.get("/validate/domain/{domain}")
async def validate_domain(domain: str):
    """
    Validate custom domain format.
    
    This endpoint validates that a domain string is a valid domain.
    
    Args:
        domain: Domain string to validate
    
    Returns:
        Validation result
    """
    is_valid = validate_custom_domain(domain)
    
    return {
        "valid": is_valid,
        "domain": domain,
    }
