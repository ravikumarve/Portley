"""
Whitelabel service for resolving agency branding and custom domains.

This service handles:
- Resolving agency from slug or custom domain
- Providing branding configuration for client portals
- Custom domain validation and resolution
"""

from typing import Optional
from fastapi import HTTPException, Request
from pydantic import BaseModel
import re

from backend.services.supabase import supabase


class AgencyBranding(BaseModel):
    """Agency branding configuration."""
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    brand_color: str = "#6366f1"
    custom_domain: Optional[str] = None
    plan: str = "free"


def darken_color(hex_color: str, percent: int = 10) -> str:
    """
    Darken a hex color by a given percentage.
    
    Args:
        hex_color: Hex color string (e.g., "#6366f1")
        percent: Percentage to darken (0-100)
    
    Returns:
        Darkened hex color string
    """
    # Remove # if present
    hex_color = hex_color.lstrip('#')
    
    # Parse hex values
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    
    # Darken each component
    factor = 1 - (percent / 100)
    r = int(r * factor)
    g = int(g * factor)
    b = int(b * factor)
    
    # Convert back to hex
    return f"#{r:02x}{g:02x}{b:02x}"


def lighten_color(hex_color: str, percent: int = 10) -> str:
    """
    Lighten a hex color by a given percentage.
    
    Args:
        hex_color: Hex color string (e.g., "#6366f1")
        percent: Percentage to lighten (0-100)
    
    Returns:
        Lightened hex color string
    """
    # Remove # if present
    hex_color = hex_color.lstrip('#')
    
    # Parse hex values
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    
    # Lighten each component
    factor = 1 + (percent / 100)
    r = min(255, int(r * factor))
    g = min(255, int(g * factor))
    b = min(255, int(b * factor))
    
    # Convert back to hex
    return f"#{r:02x}{g:02x}{b:02x}"


def validate_hex_color(color: str) -> bool:
    """
    Validate that a string is a valid hex color.
    
    Args:
        color: Color string to validate
    
    Returns:
        True if valid hex color, False otherwise
    """
    if not color:
        return False
    
    # Check hex color pattern
    pattern = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    return bool(pattern.match(color))


def validate_custom_domain(domain: str) -> bool:
    """
    Validate that a string is a valid custom domain.
    
    Args:
        domain: Domain string to validate
    
    Returns:
        True if valid domain, False otherwise
    """
    if not domain:
        return False
    
    # Basic domain validation
    pattern = re.compile(
        r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+'
        r'[a-zA-Z]{2,}$'
    )
    return bool(pattern.match(domain))


async def resolve_agency_from_slug(slug: str) -> AgencyBranding:
    """
    Resolve agency branding from slug.
    
    Args:
        slug: Agency slug (e.g., "acme-studio")
    
    Returns:
        AgencyBranding object with agency configuration
    
    Raises:
        HTTPException: If agency not found
    """
    try:
        response = supabase.table('agencies').select('*').eq('slug', slug).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Agency not found")
        
        agency_data = response.data[0]
        
        return AgencyBranding(
            id=agency_data['id'],
            name=agency_data['name'],
            slug=agency_data['slug'],
            logo_url=agency_data.get('logo_url'),
            brand_color=agency_data.get('brand_color', '#6366f1'),
            custom_domain=agency_data.get('custom_domain'),
            plan=agency_data.get('plan', 'free'),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve agency: {str(e)}")


async def resolve_agency_from_custom_domain(domain: str) -> AgencyBranding:
    """
    Resolve agency branding from custom domain.
    
    Args:
        domain: Custom domain (e.g., "portal.acme.com")
    
    Returns:
        AgencyBranding object with agency configuration
    
    Raises:
        HTTPException: If agency not found
    """
    try:
        response = supabase.table('agencies').select('*').eq('custom_domain', domain).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Agency not found")
        
        agency_data = response.data[0]
        
        return AgencyBranding(
            id=agency_data['id'],
            name=agency_data['name'],
            slug=agency_data['slug'],
            logo_url=agency_data.get('logo_url'),
            brand_color=agency_data.get('brand_color', '#6366f1'),
            custom_domain=agency_data.get('custom_domain'),
            plan=agency_data.get('plan', 'free'),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve agency: {str(e)}")


async def resolve_agency_from_request(request: Request) -> AgencyBranding:
    """
    Resolve agency branding from HTTP request.
    
    This function checks:
    1. Custom domain from Host header
    2. Slug from path parameter
    
    Args:
        request: FastAPI request object
    
    Returns:
        AgencyBranding object with agency configuration
    
    Raises:
        HTTPException: If agency not found
    """
    host = request.headers.get('host', '')
    
    # Remove port if present
    if ':' in host:
        host = host.split(':')[0]
    
    # Check if it's a custom domain (not portley.app)
    if not host.endswith('portley.app') and not host.endswith('localhost'):
        # Try to resolve by custom domain
        try:
            return await resolve_agency_from_custom_domain(host)
        except HTTPException:
            # If custom domain not found, continue to slug resolution
            pass
    
    # Try to resolve by slug from path
    path_parts = request.url.path.split('/')
    
    # Look for slug in path (e.g., /portal/{slug})
    if len(path_parts) > 2 and path_parts[1] == 'portal':
        slug = path_parts[2]
        return await resolve_agency_from_slug(slug)
    
    raise HTTPException(status_code=404, detail="Agency not found")


async def get_agency_branding(agency_id: str) -> AgencyBranding:
    """
    Get agency branding by agency ID.
    
    Args:
        agency_id: Agency UUID
    
    Returns:
        AgencyBranding object with agency configuration
    
    Raises:
        HTTPException: If agency not found
    """
    try:
        response = supabase_client.table('agencies').select('*').eq('id', agency_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Agency not found")
        
        agency_data = response.data[0]
        
        return AgencyBranding(
            id=agency_data['id'],
            name=agency_data['name'],
            slug=agency_data['slug'],
            logo_url=agency_data.get('logo_url'),
            brand_color=agency_data.get('brand_color', '#6366f1'),
            custom_domain=agency_data.get('custom_domain'),
            plan=agency_data.get('plan', 'free'),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get agency branding: {str(e)}")


async def update_agency_branding(
    agency_id: str,
    logo_url: Optional[str] = None,
    brand_color: Optional[str] = None,
    custom_domain: Optional[str] = None,
) -> AgencyBranding:
    """
    Update agency branding.
    
    Args:
        agency_id: Agency UUID
        logo_url: New logo URL (optional)
        brand_color: New brand color hex (optional)
        custom_domain: New custom domain (optional)
    
    Returns:
        Updated AgencyBranding object
    
    Raises:
        HTTPException: If update fails or validation fails
    """
    # Validate brand color if provided
    if brand_color and not validate_hex_color(brand_color):
        raise HTTPException(status_code=400, detail="Invalid hex color format")
    
    # Validate custom domain if provided
    if custom_domain and not validate_custom_domain(custom_domain):
        raise HTTPException(status_code=400, detail="Invalid domain format")
    
    try:
        update_data = {}
        if logo_url is not None:
            update_data['logo_url'] = logo_url
        if brand_color is not None:
            update_data['brand_color'] = brand_color
        if custom_domain is not None:
            update_data['custom_domain'] = custom_domain
        
        response = supabase_client.table('agencies').update(update_data).eq('id', agency_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Agency not found")
        
        agency_data = response.data[0]
        
        return AgencyBranding(
            id=agency_data['id'],
            name=agency_data['name'],
            slug=agency_data['slug'],
            logo_url=agency_data.get('logo_url'),
            brand_color=agency_data.get('brand_color', '#6366f1'),
            custom_domain=agency_data.get('custom_domain'),
            plan=agency_data.get('plan', 'free'),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update agency branding: {str(e)}")


def generate_portal_css(branding: AgencyBranding) -> str:
    """
    Generate CSS variables for client portal based on agency branding.
    
    Args:
        branding: AgencyBranding object
    
    Returns:
        CSS string with custom properties
    """
    base_color = branding.brand_color
    hover_color = darken_color(base_color, 10)
    light_color = lighten_color(base_color, 80)
    
    return f"""
:root {{
  --agency-color: {base_color};
  --agency-color-hover: {hover_color};
  --agency-color-light: {light_color};
  --agency-color-bg: {base_color}10;
  --agency-color-border: {base_color}30;
}}
"""
