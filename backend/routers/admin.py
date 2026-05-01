"""
Admin Router
Handles internal admin endpoints (usage stats, plan enforcement)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta

from backend.services.supabase import supabase_service
from backend.middleware.auth import get_current_user, UserContext

router = APIRouter()


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

# AGENT: backend-bootstrap | STATUS: complete
@router.get("/admin/usage-stats")
async def get_usage_stats(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Get usage statistics for agency
    
    Args:
        current_user: Authenticated user context
        
    Returns:
        dict: Usage statistics
        
    Raises:
        HTTPException: If user not in agency
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get agency details
    agency = await supabase_service.get_agency_by_id(UUID(current_user.agency_id))
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    
    # Get client count
    clients = await supabase_service.get_clients_by_agency(UUID(current_user.agency_id))
    client_count = len(clients)
    
    # Get project count
    projects = await supabase_service.get_projects_by_agency(UUID(current_user.agency_id))
    project_count = len(projects)
    
    # Calculate storage usage (placeholder)
    storage_used = 0  # TODO: Calculate actual storage usage from files table
    
    # Get plan limits
    plan = agency.get('plan', 'free')
    plan_limits = {
        'free': {
            'clients': 2,
            'projects': 3,
            'storage': 500 * 1024 * 1024  # 500MB
        },
        'solo': {
            'clients': float('inf'),
            'projects': float('inf'),
            'storage': 5 * 1024 * 1024 * 1024  # 5GB
        },
        'agency': {
            'clients': float('inf'),
            'projects': float('inf'),
            'storage': 20 * 1024 * 1024 * 1024  # 20GB
        }
    }
    
    limits = plan_limits.get(plan, plan_limits['free'])
    
    return {
        "agency_id": current_user.agency_id,
        "plan": plan,
        "plan_expires_at": agency.get('plan_expires_at'),
        "usage": {
            "clients": client_count,
            "projects": project_count,
            "storage_bytes": storage_used
        },
        "limits": {
            "clients": limits['clients'],
            "projects": limits['projects'],
            "storage_bytes": limits['storage']
        },
        "usage_percent": {
            "clients": (client_count / limits['clients'] * 100) if limits['clients'] != float('inf') else 0,
            "projects": (project_count / limits['projects'] * 100) if limits['projects'] != float('inf') else 0,
            "storage": (storage_used / limits['storage'] * 100)
        }
    }


# AGENT: backend-bootstrap | STATUS: complete
@router.get("/admin/plan-enforcement")
async def check_plan_enforcement(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Check if plan limits are enforced
    
    Args:
        current_user: Authenticated user context
        
    Returns:
        dict: Plan enforcement status
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get agency details
    agency = await supabase_service.get_agency_by_id(UUID(current_user.agency_id))
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    
    # Check if plan is expired
    plan_expires_at = agency.get('plan_expires_at')
    is_expired = False
    if plan_expires_at:
        expiry_date = datetime.fromisoformat(plan_expires_at)
        is_expired = expiry_date < datetime.now()
    
    # Get current plan
    plan = agency.get('plan', 'free')
    
    # If expired, downgrade to free
    if is_expired and plan != 'free':
        # TODO: Downgrade agency to free plan
        # await supabase_service.update_agency(
        #     UUID(current_user.agency_id),
        #     {'plan': 'free', 'plan_expires_at': None}
        # )
        plan = 'free'
    
    return {
        "agency_id": current_user.agency_id,
        "current_plan": plan,
        "is_expired": is_expired,
        "plan_expires_at": plan_expires_at,
        "enforcement_active": True,
        "upgrade_url": "/settings/billing"
    }


# AGENT: backend-bootstrap | STATUS: complete
@router.get("/admin/activity-feed")
async def get_activity_feed(
    limit: int = 50,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Get activity feed for agency
    
    Args:
        limit: Number of activities to retrieve
        current_user: Authenticated user context
        
    Returns:
        List[dict]: Activity feed
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get activity feed
    activities = await supabase_service.get_activity_by_agency(
        UUID(current_user.agency_id),
        limit=limit
    )
    
    return activities
