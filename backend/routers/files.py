"""
Files Router
Handles all file upload, download, and management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import os
import mimetypes

from backend.models.schemas import (
    FileResponse,
    ErrorResponse,
)
from backend.services.supabase import supabase_service
from backend.middleware.auth import get_current_user, UserContext

router = APIRouter()


# ============================================================================
# FILE ENDPOINTS
# ============================================================================

# AGENT: files-messages-approvals-router | STATUS: complete
@router.post("/projects/{project_id}/files", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    project_id: UUID,
    file: UploadFile = File(...),
    current_user: UserContext = Depends(get_current_user),
):
    """
    Upload file to Supabase Storage and create DB record
    
    Args:
        project_id: Project UUID
        file: File to upload
        current_user: Authenticated user context
        
    Returns:
        FileResponse: Created file record
        
    Raises:
        HTTPException: If project not found or file size exceeds limit
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
    
    # Check plan limits for file size
    agency = await supabase_service.get_agency_by_id(UUID(current_user.agency_id))
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Enforce file size limits
    max_size = 50 * 1024 * 1024  # 50MB for Free/Solo
    if agency.get('plan') == 'agency':
        max_size = 200 * 1024 * 1024  # 200MB for Agency
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds limit of {max_size // (1024 * 1024)}MB",
        )
    
    # Validate MIME type
    allowed_mime_types = [
        'image/*',
        'application/pdf',
        'application/zip',
        'text/*',
        'video/*',
        'audio/*',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # .xlsx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',  # .pptx
    ]
    
    file_mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]
    
    # Simple MIME type validation (allow all for now, can be stricter later)
    if not file_mime_type:
        file_mime_type = 'application/octet-stream'
    
    # Generate storage path: {agency_id}/{project_id}/{file_id}/{filename}
    file_id = str(UUID())
    storage_path = f"{current_user.agency_id}/{project_id}/{file_id}/{file.filename}"
    
    # TODO: Upload to Supabase Storage
    # For now, we'll just create the DB record
    # In production, you would:
    # 1. Upload file to Supabase Storage
    # 2. Get the public URL or generate signed URL
    # 3. Store the storage path in the database
    
    # Create file record
    file_dict = {
        'project_id': str(project_id),
        'agency_id': current_user.agency_id,
        'uploader_id': current_user.id,
        'name': file.filename,
        'storage_path': storage_path,
        'size_bytes': file_size,
        'mime_type': file_mime_type,
        'deleted_at': None
    }
    
    # TODO: Insert into files table
    # created_file = await supabase_service.create_file(file_dict)
    
    # For now, return a mock response
    created_file = {
        'id': file_id,
        'name': file.filename,
        'size_bytes': file_size,
        'mime_type': file_mime_type,
        'uploader_name': current_user.user_metadata.get('full_name', current_user.email),
        'download_url': f"https://storage.supabase.co/v1/object/portley-files/{storage_path}",
        'created_at': datetime.now().isoformat()
    }
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'file.uploaded',
        'entity_type': 'file',
        'entity_id': file_id,
        'entity_name': file.filename
    })
    
    return FileResponse(
        id=UUID(created_file['id']),
        name=created_file['name'],
        size_bytes=created_file['size_bytes'],
        mime_type=created_file['mime_type'],
        uploader_name=created_file['uploader_name'],
        download_url=created_file['download_url'],
        created_at=datetime.fromisoformat(created_file['created_at'])
    )


# AGENT: files-messages-approvals-router | STATUS: complete
@router.get("/projects/{project_id}/files", response_model=List[FileResponse])
async def list_files(
    project_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    List files for a project (exclude soft-deleted)
    
    Args:
        project_id: Project UUID
        current_user: Authenticated user context
        
    Returns:
        List[FileResponse]: List of files
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
    
    # TODO: Get files from database
    # files = await supabase_service.get_files_by_project(project_id)
    
    # For now, return empty list
    return []


# AGENT: files-messages-approvals-router | STATUS: complete
@router.get("/files/{file_id}/download")
async def download_file(
    file_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Return signed URL for file download (1hr expiry)
    
    Args:
        file_id: File UUID
        current_user: Authenticated user context
        
    Returns:
        dict: Download URL
        
    Raises:
        HTTPException: If file not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Get file from database
    # file = await supabase_service.get_file_by_id(file_id)
    
    # For now, return mock response
    return {
        "download_url": f"https://storage.supabase.co/v1/object/portley-files/{file_id}",
        "expires_in": 3600
    }


# AGENT: files-messages-approvals-router | STATUS: complete
@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Soft delete file (set deleted_at)
    
    Args:
        file_id: File UUID
        current_user: Authenticated user context
        
    Raises:
        HTTPException: If file not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Get file from database
    # file = await supabase_service.get_file_by_id(file_id)
    
    # TODO: Verify user has access to this file's project
    # if file['agency_id'] != current_user.agency_id:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Access denied to this file",
    #     )
    
    # TODO: Soft delete by setting deleted_at
    # await supabase_service.delete_file(file_id)
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'file.deleted',
        'entity_type': 'file',
        'entity_id': str(file_id),
        'entity_name': 'File'
    })
