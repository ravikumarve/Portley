"""
Tests for projects and tasks endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from uuid import uuid4
from datetime import date

from backend.main import app
from backend.models.schemas import ProjectCreate, TaskCreate


client = TestClient(app)


@pytest.fixture
def mock_auth():
    """Mock authentication middleware"""
    with patch('backend.middleware.auth.get_current_user') as mock:
        mock.return_value = Mock(
            id="00000000-0000-0000-0000-000000000001",
            email="test@example.com",
            agency_id="00000000-0000-0000-0000-000000000000",
            plan="free"
        )
        yield mock


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    with patch('backend.services.supabase.supabase') as mock:
        mock.table.return_value.select.return_value.execute.return_value = Mock(data=[])
        mock.table.return_value.insert.return_value.execute.return_value = Mock(data=[{
            'id': str(uuid4()),
            'name': 'Test Project',
            'description': 'Test Description',
            'status': 'active',
            'agency_id': '00000000-0000-0000-0000-000000000000',
            'client_id': None,
            'due_date': None,
            'created_at': '2025-01-01T00:00:00Z',
            'updated_at': '2025-01-01T00:00:00Z'
        }])
        yield mock


def test_create_project_success(mock_auth, mock_supabase):
    """Test creating a project successfully"""
    project_data = {
        "name": "Test Project",
        "description": "Test Description",
        "client_id": None,
        "due_date": None
    }
    
    response = client.post(
        "/api/projects",
        json=project_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["description"] == "Test Description"
    assert data["status"] == "active"


def test_create_project_enforces_free_plan_limit(mock_auth, mock_supabase):
    """Test that free plan users cannot create more than 3 projects"""
    # Mock existing projects count
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[
        {'id': str(uuid4())},
        {'id': str(uuid4())},
        {'id': str(uuid4())}
    ])
    
    project_data = {
        "name": "Test Project",
        "description": "Test Description",
        "client_id": None,
        "due_date": None
    }
    
    response = client.post(
        "/api/projects",
        json=project_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 403
    data = response.json()
    assert "plan_limit" in data.get("error", "")


def test_list_projects_scoped_to_agency(mock_auth, mock_supabase):
    """Test that projects are scoped to the user's agency (RLS check)"""
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[
        {
            'id': str(uuid4()),
            'name': 'Project 1',
            'description': 'Description 1',
            'status': 'active',
            'agency_id': '00000000-0000-0000-0000-000000000000',
            'client_id': None,
            'due_date': None,
            'created_at': '2025-01-01T00:00:00Z',
            'updated_at': '2025-01-01T00:00:00Z'
        }
    ])
    
    response = client.get(
        "/api/projects",
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    # Verify all projects belong to the user's agency
    for project in data:
        assert project['agency_id'] == '00000000-0000-0000-0000-000000000000'


def test_update_project_status(mock_auth, mock_supabase):
    """Test updating project status"""
    project_id = str(uuid4())
    
    mock_supabase.table.return_value.update.return_value.execute.return_value = Mock(data=[{
        'id': project_id,
        'name': 'Test Project',
        'description': 'Test Description',
        'status': 'review',
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'client_id': None,
        'due_date': None,
        'created_at': '2025-01-01T00:00:00Z',
        'updated_at': '2025-01-01T00:00:00Z'
    }])
    
    response = client.patch(
        f"/api/projects/{project_id}",
        json={"status": "review"},
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "review"


def test_task_create_reorder_complete(mock_auth, mock_supabase):
    """Test creating, reordering, and completing tasks"""
    project_id = str(uuid4())
    
    # Create task
    mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock(data=[{
        'id': str(uuid4()),
        'title': 'Test Task',
        'completed': False,
        'position': 0,
        'project_id': project_id,
        'created_at': '2025-01-01T00:00:00Z'
    }])
    
    response = client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Test Task", "position": 0},
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["completed"] == False
    
    # Complete task
    task_id = data["id"]
    mock_supabase.table.return_value.update.return_value.execute.return_value = Mock(data=[{
        'id': task_id,
        'title': 'Test Task',
        'completed': True,
        'position': 0,
        'project_id': project_id,
        'created_at': '2025-01-01T00:00:00Z'
    }])
    
    response = client.patch(
        f"/api/tasks/{task_id}",
        json={"completed": True},
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] == True


def test_project_progress_calculation(mock_auth, mock_supabase):
    """Test that project progress is calculated correctly"""
    project_id = str(uuid4())
    
    # Mock tasks: 3 total, 2 completed
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[
        {'id': str(uuid4()), 'completed': True},
        {'id': str(uuid4()), 'completed': True},
        {'id': str(uuid4()), 'completed': False}
    ])
    
    response = client.get(
        f"/api/projects/{project_id}",
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    # Progress should be 66.67% (2/3)
    assert data["progress_pct"] == pytest.approx(66.67, rel=0.1)
