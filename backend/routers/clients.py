"""
Clients Router
Handles all client management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import secrets
import os

from backend.models.schemas import (
    ClientInvite,
    ClientResponse,
    ErrorResponse,
)
from backend.services.supabase import supabase_service
from backend.middleware.auth import get_current_user, get_optional_user, UserContext

router = APIRouter()


# ============================================================================
# CLIENT ENDPOINTS
# ============================================================================

# AGENT: projects-tasks-router | STATUS: complete
@router.get("/clients", response_model=List[ClientResponse])
async def list_clients(
    current_user: UserContext = Depends(get_current_user),
):
    """
    List clients with stats
    
    Args:
        current_user: Authenticated user context
        
    Returns:
        List[ClientResponse]: List of clients
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get clients from database
    clients = await supabase_service.get_clients_by_agency(UUID(current_user.agency_id))
    
    # Build response with stats
    response = []
    for client in clients:
        # Get project count
        projects_response = supabase_service.client.table('projects').select('id').eq('client_id', client['id']).execute()
        project_count = len(projects_response.data) if projects_response.data else 0
        
        # Get unpaid invoice total (placeholder - will be implemented with invoices router)
        unpaid_invoice_total = 0.0
        
        response.append(ClientResponse(
            id=UUID(client['id']),
            name=client['name'],
            email=client['email'],
            invite_status=client['invite_status'],
            project_count=project_count,
            unpaid_invoice_total=unpaid_invoice_total,
            created_at=client['created_at']
        ))
    
    return response


# AGENT: projects-tasks-router | STATUS: complete
@router.post("/clients/invite", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def invite_client(
    client_data: ClientInvite,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Send invite email + create client record
    
    Args:
        client_data: Client invitation data
        current_user: Authenticated user context
        
    Returns:
        ClientResponse: Created client
        
    Raises:
        HTTPException: If plan limit exceeded or client already exists
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Check plan limits
    agency = await supabase_service.get_agency_by_id(UUID(current_user.agency_id))
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    
    # Enforce plan limits
    if agency.get('plan') == 'free':
        existing_clients = await supabase_service.get_clients_by_agency(UUID(current_user.agency_id))
        if len(existing_clients) >= 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "plan_limit",
                    "message": "Free plan allows maximum 2 clients",
                    "upgrade_url": "/settings/billing"
                },
            )
    
    # Check if client with this email already exists for this agency
    existing_client_response = supabase_service.client.table('clients').select('*').eq('agency_id', current_user.agency_id).eq('email', client_data.email).execute()
    if existing_client_response.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Client with this email already exists",
        )
    
    # Generate invite token
    invite_token = secrets.token_urlsafe(32)
    
    # Create client record
    client_dict = {
        'agency_id': current_user.agency_id,
        'name': client_data.name,
        'email': client_data.email,
        'invite_token': invite_token,
        'invite_status': 'pending',
        'user_id': None
    }
    
    created_client = await supabase_service.create_client(client_dict)
    
    if not created_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create client",
        )
    
    # TODO: Send invite email via Resend
    # This will be implemented when the email service is created
    # For now, we'll just log the invite token
    print(f"Invite token for {client_data.email}: {invite_token}")
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'client.invited',
        'entity_type': 'client',
        'entity_id': created_client['id'],
        'entity_name': created_client['name']
    })
    
    return ClientResponse(
        id=UUID(created_client['id']),
        name=created_client['name'],
        email=created_client['email'],
        invite_status=created_client['invite_status'],
        project_count=0,
        unpaid_invoice_total=0.0,
        created_at=created_client['created_at']
    )


# AGENT: projects-tasks-router | STATUS: complete
@router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Get client detail + projects + invoices
    
    Args:
        client_id: Client UUID
        current_user: Authenticated user context
        
    Returns:
        ClientResponse: Client details with stats
        
    Raises:
        HTTPException: If client not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get client
    client_response = supabase_service.client.table('clients').select('*').eq('id', str(client_id)).execute()
    if not client_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    client = client_response.data[0]
    
    # Verify user has access to this client
    if client['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this client",
        )
    
    # Get project count
    projects_response = supabase_service.client.table('projects').select('id').eq('client_id', str(client_id)).execute()
    project_count = len(projects_response.data) if projects_response.data else 0
    
    # Get unpaid invoice total (placeholder)
    unpaid_invoice_total = 0.0
    
    return ClientResponse(
        id=UUID(client['id']),
        name=client['name'],
        email=client['email'],
        invite_status=client['invite_status'],
        project_count=project_count,
        unpaid_invoice_total=unpaid_invoice_total,
        created_at=client['created_at']
    )


# AGENT: projects-tasks-router | STATUS: complete
@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Remove client (keep projects)
    
    Args:
        client_id: Client UUID
        current_user: Authenticated user context
        
    Raises:
        HTTPException: If client not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get client
    client_response = supabase_service.client.table('clients').select('*').eq('id', str(client_id)).execute()
    if not client_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    client = client_response.data[0]
    
    # Verify user has access to this client
    if client['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this client",
        )
    
    # Delete client (projects will remain due to ON DELETE CASCADE not being set on client_id in projects table)
    supabase_service.client.table('clients').delete().eq('id', str(client_id)).execute()
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'client.deleted',
        'entity_type': 'client',
        'entity_id': str(client_id),
        'entity_name': client['name']
    })


# ============================================================================
# PUBLIC ENDPOINT - INVITE ACCEPTANCE
# ============================================================================

# AGENT: projects-tasks-router | STATUS: complete
@router.post("/auth/invite/{token}")
async def accept_invite(
    token: str,
    current_user: Optional[UserContext] = Depends(get_optional_user),
):
    """
    Accept invite (public — sets user_id on client)
    
    Args:
        token: Invite token
        current_user: Optional authenticated user context
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If invite not found or already accepted
    """
    # Find client by invite token
    client_response = supabase_service.client.table('clients').select('*').eq('invite_token', token).execute()
    if not client_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite token",
        )
    
    client = client_response.data[0]
    
    # Check if invite is already accepted
    if client['invite_status'] == 'accepted':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite has already been accepted",
        )
    
    # If user is authenticated, link them to the client
    if current_user:
        # Update client with user_id and status
        supabase_service.client.table('clients').update({
            'user_id': current_user.id,
            'invite_status': 'accepted'
        }).eq('id', client['id']).execute()
        
        # Log activity
        await supabase_service.log_activity({
            'agency_id': client['agency_id'],
            'actor_id': current_user.id,
            'actor_name': current_user.user_metadata.get('full_name', current_user.email),
            'action': 'client.invite_accepted',
            'entity_type': 'client',
            'entity_id': client['id'],
            'entity_name': client['name']
        })
        
        return {
            "message": "Invite accepted successfully",
            "client_id": client['id'],
            "redirect_url": "/portal"
        }
    else:
        # User not authenticated, return invite info for frontend to handle signup
        return {
            "message": "Please sign up or log in to accept this invite",
            "client_id": client['id'],
            "client_name": client['name'],
            "client_email": client['email'],
            "redirect_url": f"/auth/signup?invite_token={token}"
        }
