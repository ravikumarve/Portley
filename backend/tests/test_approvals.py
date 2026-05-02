"""
Tests for approval workflow and client responses
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from uuid import uuid4

from backend.main import app


client = TestClient(app)


@pytest.fixture
def mock_auth():
    """Mock authentication middleware"""
    with patch('backend.middleware.auth.get_current_user') as mock:
        mock.return_value = Mock(
            id="00000000-0000-0000-0000-000000000001",
            email="test@example.com",
            agency_id="00000000-0000-0000-0000-000000000000",
            plan="solo"
        )
        yield mock


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    with patch('backend.services.supabase.supabase') as mock:
        mock.table.return_value.select.return_value.execute.return_value = Mock(data=[])
        mock.table.return_value.insert.return_value.execute.return_value = Mock(data=[{
            'id': str(uuid4()),
            'title': 'Test Approval',
            'description': 'Please review this deliverable',
            'status': 'pending',
            'project_id': str(uuid4()),
            'agency_id': '00000000-0000-0000-0000-000000000000',
            'file_id': None,
            'client_note': None,
            'created_at': '2025-01-01T00:00:00Z',
            'responded_at': None
        }])
        yield mock


def test_agency_creates_approval(mock_auth, mock_supabase):
    """Test that agency can create approval requests"""
    project_id = str(uuid4())
    
    approval_data = {
        "project_id": project_id,
        "title": "Test Approval",
        "description": "Please review this deliverable",
        "file_id": None
    }
    
    response = client.post(
        f"/api/projects/{project_id}/approvals",
        json=approval_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Approval"
    assert data["status"] == "pending"
    assert data["agency_id"] == "00000000-0000-0000-0000-000000000000"


def test_client_approves(mock_auth, mock_supabase):
    """Test that client can approve an approval request"""
    approval_id = str(uuid4())
    
    # Mock approval lookup
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
        'id': approval_id,
        'title': 'Test Approval',
        'description': 'Please review this deliverable',
        'status': 'pending',
        'project_id': str(uuid4()),
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'file_id': None,
        'client_note': None,
        'created_at': '2025-01-01T00:00:00Z',
        'responded_at': None
    }])
    
    # Mock update
    mock_supabase.table.return_value.update.return_value.execute.return_value = Mock(data=[{
        'id': approval_id,
        'title': 'Test Approval',
        'description': 'Please review this deliverable',
        'status': 'approved',
        'project_id': str(uuid4()),
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'file_id': None,
        'client_note': 'Looks great!',
        'created_at': '2025-01-01T00:00:00Z',
        'responded_at': '2025-01-15T00:00:00Z'
    }])
    
    response_data = {
        "status": "approved",
        "client_note": "Looks great!"
    }
    
    response = client.patch(
        f"/api/approvals/{approval_id}/respond",
        json=response_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["client_note"] == "Looks great!"
    assert data["responded_at"] is not None


def test_client_requests_changes(mock_auth, mock_supabase):
    """Test that client can request changes on an approval"""
    approval_id = str(uuid4())
    
    # Mock approval lookup
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
        'id': approval_id,
        'title': 'Test Approval',
        'description': 'Please review this deliverable',
        'status': 'pending',
        'project_id': str(uuid4()),
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'file_id': None,
        'client_note': None,
        'created_at': '2025-01-01T00:00:00Z',
        'responded_at': None
    }])
    
    # Mock update
    mock_supabase.table.return_value.update.return_value.execute.return_value = Mock(data=[{
        'id': approval_id,
        'title': 'Test Approval',
        'description': 'Please review this deliverable',
        'status': 'changes_requested',
        'project_id': str(uuid4()),
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'file_id': None,
        'client_note': 'Please update the colors',
        'created_at': '2025-01-01T00:00:00Z',
        'responded_at': '2025-01-15T00:00:00Z'
    }])
    
    response_data = {
        "status": "changes_requested",
        "client_note": "Please update the colors"
    }
    
    response = client.patch(
        f"/api/approvals/{approval_id}/respond",
        json=response_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "changes_requested"
    assert data["client_note"] == "Please update the colors"


def test_non_client_cannot_respond(mock_auth, mock_supabase):
    """Test that non-clients cannot respond to approvals (auth test)"""
    approval_id = str(uuid4())
    
    # Mock approval lookup
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
        'id': approval_id,
        'title': 'Test Approval',
        'description': 'Please review this deliverable',
        'status': 'pending',
        'project_id': str(uuid4()),
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'file_id': None,
        'client_note': None,
        'created_at': '2025-01-01T00:00:00Z',
        'responded_at': None
    }])
    
    response_data = {
        "status": "approved",
        "client_note": "Looks great!"
    }
    
    response = client.patch(
        f"/api/approvals/{approval_id}/respond",
        json=response_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    # Agency user should not be able to respond to their own approval
    # This would be enforced by RLS policies
    assert response.status_code in [403, 404]
