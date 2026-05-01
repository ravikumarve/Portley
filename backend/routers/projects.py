"""
Projects and Tasks Router
Handles all project and task management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from backend.models.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    ErrorResponse,
)
from backend.services.supabase import supabase_service
from backend.middleware.auth import get_current_user, UserContext

router = APIRouter()


# ============================================================================
# PROJECT ENDPOINTS
# ============================================================================

# AGENT: projects-tasks-router | STATUS: complete
@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    status_filter: Optional[str] = Query(None, alias="status"),
    client_id: Optional[UUID] = Query(None),
    current_user: UserContext = Depends(get_current_user),
):
    """
    List agency's projects with optional filters
    
    Args:
        status_filter: Filter by project status
        client_id: Filter by client ID
        current_user: Authenticated user context
        
    Returns:
        List[ProjectResponse]: List of projects
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Build filters
    filters = {}
    if status_filter:
        filters['status'] = status_filter
    if client_id:
        filters['client_id'] = client_id
    
    # Get projects from database
    projects = await supabase_service.get_projects_by_agency(
        UUID(current_user.agency_id),
        filters
    )
    
    # Build response with counts
    response = []
    for project in projects:
        # Get task counts
        tasks = await supabase_service.get_tasks_by_project(UUID(project['id']))
        task_count = len(tasks)
        completed_task_count = len([t for t in tasks if t.get('completed', False)])
        progress_pct = (completed_task_count / task_count * 100) if task_count > 0 else 0
        
        # Get unread messages count (placeholder - will be implemented with messages router)
        unread_messages = 0
        
        # Get pending approvals count (placeholder - will be implemented with approvals router)
        pending_approvals = 0
        
        # Get client summary if exists
        client = None
        if project.get('client_id'):
            # Fetch client details
            client_response = supabase_service.client.table('clients').select('*').eq('id', project['client_id']).execute()
            if client_response.data:
                client_data = client_response.data[0]
                client = {
                    'id': client_data['id'],
                    'name': client_data['name'],
                    'email': client_data['email']
                }
        
        response.append(ProjectResponse(
            id=UUID(project['id']),
            name=project['name'],
            description=project.get('description'),
            status=project['status'],
            due_date=project.get('due_date'),
            client=client,
            task_count=task_count,
            completed_task_count=completed_task_count,
            progress_pct=progress_pct,
            unread_messages=unread_messages,
            pending_approvals=pending_approvals,
            created_at=project['created_at'],
            updated_at=project['updated_at']
        ))
    
    return response


# AGENT: projects-tasks-router | STATUS: complete
@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Create a new project
    
    Args:
        project_data: Project creation data
        current_user: Authenticated user context
        
    Returns:
        ProjectResponse: Created project
        
    Raises:
        HTTPException: If plan limit exceeded
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
        existing_projects = await supabase_service.get_projects_by_agency(UUID(current_user.agency_id))
        if len(existing_projects) >= 3:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "plan_limit",
                    "message": "Free plan allows maximum 3 projects",
                    "upgrade_url": "/settings/billing"
                },
            )
    
    # Create project
    project_dict = {
        'agency_id': current_user.agency_id,
        'name': project_data.name,
        'description': project_data.description,
        'client_id': str(project_data.client_id) if project_data.client_id else None,
        'due_date': project_data.due_date.isoformat() if project_data.due_date else None,
        'status': 'active'
    }
    
    created_project = await supabase_service.create_project(project_dict)
    
    if not created_project:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project",
        )
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'project.created',
        'entity_type': 'project',
        'entity_id': created_project['id'],
        'entity_name': created_project['name']
    })
    
    # Build response
    client = None
    if created_project.get('client_id'):
        client_response = supabase_service.client.table('clients').select('*').eq('id', created_project['client_id']).execute()
        if client_response.data:
            client_data = client_response.data[0]
            client = {
                'id': client_data['id'],
                'name': client_data['name'],
                'email': client_data['email']
            }
    
    return ProjectResponse(
        id=UUID(created_project['id']),
        name=created_project['name'],
        description=created_project.get('description'),
        status=created_project['status'],
        due_date=created_project.get('due_date'),
        client=client,
        task_count=0,
        completed_task_count=0,
        progress_pct=0.0,
        unread_messages=0,
        pending_approvals=0,
        created_at=created_project['created_at'],
        updated_at=created_project['updated_at']
    )


# AGENT: projects-tasks-router | STATUS: complete
@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Get full project detail with counts
    
    Args:
        project_id: Project UUID
        current_user: Authenticated user context
        
    Returns:
        ProjectResponse: Project details
        
    Raises:
        HTTPException: If project not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get project
    project = await supabase_service.get_project_by_id(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    # Verify user has access to this project
    if project['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )
    
    # Get task counts
    tasks = await supabase_service.get_tasks_by_project(project_id)
    task_count = len(tasks)
    completed_task_count = len([t for t in tasks if t.get('completed', False)])
    progress_pct = (completed_task_count / task_count * 100) if task_count > 0 else 0
    
    # Get unread messages count (placeholder)
    unread_messages = 0
    
    # Get pending approvals count (placeholder)
    pending_approvals = 0
    
    # Get client summary if exists
    client = None
    if project.get('client_id'):
        client_response = supabase_service.client.table('clients').select('*').eq('id', project['client_id']).execute()
        if client_response.data:
            client_data = client_response.data[0]
            client = {
                'id': client_data['id'],
                'name': client_data['name'],
                'email': client_data['email']
            }
    
    return ProjectResponse(
        id=UUID(project['id']),
        name=project['name'],
        description=project.get('description'),
        status=project['status'],
        due_date=project.get('due_date'),
        client=client,
        task_count=task_count,
        completed_task_count=completed_task_count,
        progress_pct=progress_pct,
        unread_messages=unread_messages,
        pending_approvals=pending_approvals,
        created_at=project['created_at'],
        updated_at=project['updated_at']
    )


# AGENT: projects-tasks-router | STATUS: complete
@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Update project status, name, due_date
    
    Args:
        project_id: Project UUID
        project_data: Project update data
        current_user: Authenticated user context
        
    Returns:
        ProjectResponse: Updated project
        
    Raises:
        HTTPException: If project not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get project
    project = await supabase_service.get_project_by_id(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    # Verify user has access to this project
    if project['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )
    
    # Build update data
    update_data = {}
    if project_data.name is not None:
        update_data['name'] = project_data.name
    if project_data.description is not None:
        update_data['description'] = project_data.description
    if project_data.status is not None:
        update_data['status'] = project_data.status.value
    if project_data.due_date is not None:
        update_data['due_date'] = project_data.due_date.isoformat()
    
    # Update project
    updated_project = await supabase_service.update_project(project_id, update_data)
    
    if not updated_project:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project",
        )
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'project.updated',
        'entity_type': 'project',
        'entity_id': str(project_id),
        'entity_name': updated_project['name']
    })
    
    # Get task counts
    tasks = await supabase_service.get_tasks_by_project(project_id)
    task_count = len(tasks)
    completed_task_count = len([t for t in tasks if t.get('completed', False)])
    progress_pct = (completed_task_count / task_count * 100) if task_count > 0 else 0
    
    # Get client summary if exists
    client = None
    if updated_project.get('client_id'):
        client_response = supabase_service.client.table('clients').select('*').eq('id', updated_project['client_id']).execute()
        if client_response.data:
            client_data = client_response.data[0]
            client = {
                'id': client_data['id'],
                'name': client_data['name'],
                'email': client_data['email']
            }
    
    return ProjectResponse(
        id=UUID(updated_project['id']),
        name=updated_project['name'],
        description=updated_project.get('description'),
        status=updated_project['status'],
        due_date=updated_project.get('due_date'),
        client=client,
        task_count=task_count,
        completed_task_count=completed_task_count,
        progress_pct=progress_pct,
        unread_messages=0,
        pending_approvals=0,
        created_at=updated_project['created_at'],
        updated_at=updated_project['updated_at']
    )


# AGENT: projects-tasks-router | STATUS: complete
@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Soft delete project (set status='deleted')
    
    Args:
        project_id: Project UUID
        current_user: Authenticated user context
        
    Raises:
        HTTPException: If project not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get project
    project = await supabase_service.get_project_by_id(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    # Verify user has access to this project
    if project['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )
    
    # Soft delete by setting status to 'deleted'
    # Note: We need to add 'deleted' to the status enum in the schema
    await supabase_service.update_project(project_id, {'status': 'deleted'})
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'project.deleted',
        'entity_type': 'project',
        'entity_id': str(project_id),
        'entity_name': project['name']
    })


# ============================================================================
# TASK ENDPOINTS
# ============================================================================

# AGENT: projects-tasks-router | STATUS: complete
@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def list_tasks(
    project_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    List tasks for a project ordered by position
    
    Args:
        project_id: Project UUID
        current_user: Authenticated user context
        
    Returns:
        List[TaskResponse]: List of tasks
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
    
    # Get tasks
    tasks = await supabase_service.get_tasks_by_project(project_id)
    
    return [
        TaskResponse(
            id=UUID(task['id']),
            title=task['title'],
            completed=task['completed'],
            position=task['position'],
            created_at=task['created_at']
        )
        for task in tasks
    ]


# AGENT: projects-tasks-router | STATUS: complete
@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: UUID,
    task_data: TaskCreate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Create a new task
    
    Args:
        project_id: Project UUID
        task_data: Task creation data
        current_user: Authenticated user context
        
    Returns:
        TaskResponse: Created task
        
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
    
    # Create task
    task_dict = {
        'project_id': str(project_id),
        'title': task_data.title,
        'position': task_data.position,
        'completed': False
    }
    
    created_task = await supabase_service.create_task(task_dict)
    
    if not created_task:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task",
        )
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'task.created',
        'entity_type': 'task',
        'entity_id': created_task['id'],
        'entity_name': created_task['title']
    })
    
    return TaskResponse(
        id=UUID(created_task['id']),
        title=created_task['title'],
        completed=created_task['completed'],
        position=created_task['position'],
        created_at=created_task['created_at']
    )


# AGENT: projects-tasks-router | STATUS: complete
@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Update task (toggle complete, edit title)
    
    Args:
        task_id: Task UUID
        task_data: Task update data
        current_user: Authenticated user context
        
    Returns:
        TaskResponse: Updated task
        
    Raises:
        HTTPException: If task not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get task
    task_response = supabase_service.client.table('tasks').select('*').eq('id', str(task_id)).execute()
    if not task_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    task = task_response.data[0]
    
    # Verify user has access to this task's project
    project = await supabase_service.get_project_by_id(UUID(task['project_id']))
    if not project or project['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this task",
        )
    
    # Build update data
    update_data = {}
    if task_data.completed is not None:
        update_data['completed'] = task_data.completed
    if task_data.title is not None:
        update_data['title'] = task_data.title
    if task_data.position is not None:
        update_data['position'] = task_data.position
    
    # Update task
    updated_task = await supabase_service.update_task(task_id, update_data)
    
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task",
        )
    
    # Log activity
    action = 'task.completed' if task_data.completed else 'task.updated'
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': action,
        'entity_type': 'task',
        'entity_id': str(task_id),
        'entity_name': updated_task['title']
    })
    
    return TaskResponse(
        id=UUID(updated_task['id']),
        title=updated_task['title'],
        completed=updated_task['completed'],
        position=updated_task['position'],
        created_at=updated_task['created_at']
    )


# AGENT: projects-tasks-router | STATUS: complete
@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Delete task
    
    Args:
        task_id: Task UUID
        current_user: Authenticated user context
        
    Raises:
        HTTPException: If task not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Get task
    task_response = supabase_service.client.table('tasks').select('*').eq('id', str(task_id)).execute()
    if not task_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    task = task_response.data[0]
    
    # Verify user has access to this task's project
    project = await supabase_service.get_project_by_id(UUID(task['project_id']))
    if not project or project['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this task",
        )
    
    # Delete task
    supabase_service.client.table('tasks').delete().eq('id', str(task_id)).execute()
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'task.deleted',
        'entity_type': 'task',
        'entity_id': str(task_id),
        'entity_name': task['title']
    })


# AGENT: projects-tasks-router | STATUS: complete
@router.patch("/projects/{project_id}/tasks/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_tasks(
    project_id: UUID,
    task_positions: List[dict],  # [{"id": UUID, "position": int}, ...]
    current_user: UserContext = Depends(get_current_user),
):
    """
    Update task positions array
    
    Args:
        project_id: Project UUID
        task_positions: List of task IDs with new positions
        current_user: Authenticated user context
        
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
    
    # Update each task position
    for task_pos in task_positions:
        task_id = task_pos.get('id')
        position = task_pos.get('position')
        
        if task_id and position is not None:
            await supabase_service.update_task(UUID(task_id), {'position': position})
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'tasks.reordered',
        'entity_type': 'project',
        'entity_id': str(project_id),
        'entity_name': project['name']
    })
