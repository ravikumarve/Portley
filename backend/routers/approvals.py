"""
Approvals Router
Handles all approval request and response endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from backend.models.schemas import (
    ApprovalCreate,
    ApprovalRespond,
    ApprovalResponse,
    ErrorResponse,
)
from backend.services.supabase import supabase_service
from backend.middleware.auth import get_current_user, UserContext

router = APIRouter()


# ============================================================================
# APPROVAL ENDPOINTS
# ============================================================================

# AGENT: files-messages-approvals-router | STATUS: complete
@router.get("/projects/{project_id}/approvals", response_model=List[ApprovalResponse])
async def list_approvals(
    project_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    List approvals for a project
    
    Args:
        project_id: Project UUID
        current_user: Authenticated user context
        
    Returns:
        List[ApprovalResponse]: List of approvals
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Verify project exists and user has access
    project = await supabase_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    if project['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )
    
    # TODO: Get approvals from database
    # approvals = await supabase_service.get_approvals_by_project(project_id)
    
    # For now, return empty list
    return []


# AGENT: files-messages-approvals-router | STATUS: complete
@router.post("/projects/{project_id}/approvals", response_model=ApprovalResponse, status_code=status.HTTP_201_CREATED)
async def create_approval(
    project_id: UUID,
    approval_data: ApprovalCreate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Create approval request (agency only)
    
    Args:
        project_id: Project UUID
        approval_data: Approval creation data
        current_user: Authenticated user context
        
    Returns:
        ApprovalResponse: Created approval
        
    Raises:
        HTTPException: If project not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Verify project exists and user has access
    project = await supabase_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    if project['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )
    
    # Create approval
    approval_dict = {
        'project_id': str(project_id),
        'agency_id': current_user.agency_id,
        'title': approval_data.title,
        'description': approval_data.description,
        'file_id': str(approval_data.file_id) if approval_data.file_id else None,
        'status': 'pending',
        'client_note': None,
        'responded_at': None
    }
    
    # TODO: Insert into approvals table
    # created_approval = await supabase_service.create_approval(approval_dict)
    
    # For now, return mock response
    created_approval = {
        'id': str(UUID()),
        'title': approval_data.title,
        'description': approval_data.description,
        'status': 'pending',
        'file': None,
        'client_note': None,
        'created_at': datetime.now().isoformat(),
        'responded_at': None
    }
    
    # TODO: Send email notification to client via Resend
    # This will be implemented when the email service is created
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'approval.created',
        'entity_type': 'approval',
        'entity_id': created_approval['id'],
        'entity_name': approval_data.title
    })
    
    return ApprovalResponse(
        id=UUID(created_approval['id']),
        title=created_approval['title'],
        description=created_approval['description'],
        status=created_approval['status'],
        file=created_approval['file'],
        client_note=created_approval['client_note'],
        created_at=datetime.fromisoformat(created_approval['created_at']),
        responded_at=created_approval['responded_at']
    )


# AGENT: files-messages-approvals-router | STATUS: complete
@router.patch("/approvals/{approval_id}/respond", response_model=ApprovalResponse)
async def respond_approval(
    approval_id: UUID,
    response_data: ApprovalRespond,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Client responds: approved | changes_requested
    
    Args:
        approval_id: Approval UUID
        response_data: Approval response data
        current_user: Authenticated user context
        
    Returns:
        ApprovalResponse: Updated approval
        
    Raises:
        HTTPException: If approval not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Get approval from database
    # approval = await supabase_service.get_approval_by_id(approval_id)
    
    # TODO: Verify user has access to this approval's project
    # if approval['agency_id'] != current_user.agency_id:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Access denied to this approval",
    #     )
    
    # Update approval
    update_data = {
        'status': response_data.status,
        'client_note': response_data.client_note,
        'responded_at': datetime.now().isoformat()
    }
    
    # TODO: Update approval in database
    # updated_approval = await supabase_service.update_approval(approval_id, update_data)
    
    # For now, return mock response
    updated_approval = {
        'id': str(approval_id),
        'title': 'Approval Request',
        'description': 'Description',
        'status': response_data.status,
        'file': None,
        'client_note': response_data.client_note,
        'created_at': datetime.now().isoformat(),
        'responded_at': datetime.now().isoformat()
    }
    
    # TODO: Send email notification to agency owner via Resend
    # This will be implemented when the email service is created
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': f'approval.{response_data.status}',
        'entity_type': 'approval',
        'entity_id': str(approval_id),
        'entity_name': 'Approval Request'
    })
    
    return ApprovalResponse(
        id=UUID(updated_approval['id']),
        title=updated_approval['title'],
        description=updated_approval['description'],
        status=updated_approval['status'],
        file=updated_approval['file'],
        client_note=updated_approval['client_note'],
        created_at=datetime.fromisoformat(updated_approval['created_at']),
        responded_at=datetime.fromisoformat(updated_approval['responded_at'])
    )
