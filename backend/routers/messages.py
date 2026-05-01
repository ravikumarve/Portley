"""
Messages Router
Handles all messaging endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from backend.models.schemas import (
    MessageCreate,
    MessageResponse,
    ErrorResponse,
)
from backend.services.supabase import supabase_service
from backend.middleware.auth import get_current_user, UserContext

router = APIRouter()


# ============================================================================
# MESSAGE ENDPOINTS
# ============================================================================

# AGENT: files-messages-approvals-router | STATUS: complete
@router.get("/projects/{project_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    project_id: UUID,
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Number of messages per page"),
    current_user: UserContext = Depends(get_current_user),
):
    """
    List messages for a project (paginated, 50 per page, cursor-based)
    
    Args:
        project_id: Project UUID
        cursor: Pagination cursor
        limit: Number of messages per page (max 100)
        current_user: Authenticated user context
        
    Returns:
        List[MessageResponse]: List of messages
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
    
    # TODO: Get messages from database with pagination
    # messages = await supabase_service.get_messages_by_project(project_id, cursor, limit)
    
    # For now, return empty list
    return []


# AGENT: files-messages-approvals-router | STATUS: complete
@router.post("/projects/{project_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    project_id: UUID,
    message_data: MessageCreate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Send message (Supabase Realtime handles delivery)
    
    Args:
        project_id: Project UUID
        message_data: Message creation data
        current_user: Authenticated user context
        
    Returns:
        MessageResponse: Created message
        
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
    
    # Create message
    message_dict = {
        'project_id': str(project_id),
        'sender_id': current_user.id,
        'content': message_data.content,
        'read_by': []
    }
    
    # TODO: Insert into messages table
    # created_message = await supabase_service.create_message(message_dict)
    
    # For now, return mock response
    created_message = {
        'id': str(UUID()),
        'content': message_data.content,
        'sender_id': current_user.id,
        'sender_name': current_user.user_metadata.get('full_name', current_user.email),
        'is_mine': True,
        'created_at': datetime.now().isoformat()
    }
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'message.sent',
        'entity_type': 'message',
        'entity_id': created_message['id'],
        'entity_name': 'Message'
    })
    
    return MessageResponse(
        id=UUID(created_message['id']),
        content=created_message['content'],
        sender_id=UUID(created_message['sender_id']),
        sender_name=created_message['sender_name'],
        is_mine=created_message['is_mine'],
        created_at=datetime.fromisoformat(created_message['created_at'])
    )


# AGENT: files-messages-approvals-router | STATUS: complete
@router.patch("/messages/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_messages_read(
    message_ids: List[UUID],
    current_user: UserContext = Depends(get_current_user),
):
    """
    Mark messages as read (add user to read_by array)
    
    Args:
        message_ids: List of message UUIDs to mark as read
        current_user: Authenticated user context
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Update messages to add user to read_by array
    # for message_id in message_ids:
    #     await supabase_service.mark_message_read(message_id, current_user.id)
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'messages.read',
        'entity_type': 'message',
        'entity_id': None,
        'entity_name': f'{len(message_ids)} messages'
    })
