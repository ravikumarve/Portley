"""
Tests for file upload, download, and management endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from uuid import uuid4
from io import BytesIO

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
            'name': 'test.pdf',
            'size_bytes': 1024,
            'mime_type': 'application/pdf',
            'storage_path': 'test/path/test.pdf',
            'project_id': str(uuid4()),
            'agency_id': '00000000-0000-0000-0000-000000000000',
            'uploader_id': '00000000-0000-0000-0000-000000000001',
            'deleted_at': None,
            'created_at': '2025-01-01T00:00:00Z'
        }])
        yield mock


@pytest.fixture
def mock_storage():
    """Mock Supabase Storage"""
    with patch('backend.services.storage.supabase_storage') as mock:
        mock.upload.return_value = Mock(path='test/path/test.pdf')
        mock.get_public_url.return_value = Mock(public_url='https://example.com/test.pdf')
        mock.create_signed_url.return_value = Mock(signedUrl='https://example.com/signed-url')
        yield mock


def test_file_upload_creates_db_record(mock_auth, mock_supabase, mock_storage):
    """Test that file upload creates a database record"""
    project_id = str(uuid4())
    
    # Create a mock file
    file_content = b"test file content"
    files = {"file": ("test.pdf", BytesIO(file_content), "application/pdf")}
    
    response = client.post(
        f"/api/projects/{project_id}/files",
        files=files,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "test.pdf"
    assert data["size_bytes"] == len(file_content)
    assert data["mime_type"] == "application/pdf"


def test_file_download_returns_signed_url(mock_auth, mock_supabase, mock_storage):
    """Test that file download returns a signed URL"""
    file_id = str(uuid4())
    
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
        'id': file_id,
        'name': 'test.pdf',
        'size_bytes': 1024,
        'mime_type': 'application/pdf',
        'storage_path': 'test/path/test.pdf',
        'project_id': str(uuid4()),
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'uploader_id': '00000000-0000-0000-0000-000000000001',
        'deleted_at': None,
        'created_at': '2025-01-01T00:00:00Z'
    }])
    
    response = client.get(
        f"/api/files/{file_id}/download",
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "download_url" in data
    assert data["download_url"].startswith("https://")


def test_file_soft_delete(mock_auth, mock_supabase):
    """Test that file deletion is a soft delete (sets deleted_at)"""
    file_id = str(uuid4())
    
    mock_supabase.table.return_value.update.return_value.execute.return_value = Mock(data=[{
        'id': file_id,
        'name': 'test.pdf',
        'size_bytes': 1024,
        'mime_type': 'application/pdf',
        'storage_path': 'test/path/test.pdf',
        'project_id': str(uuid4()),
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'uploader_id': '00000000-0000-0000-0000-000000000001',
        'deleted_at': '2025-01-01T00:00:00Z',
        'created_at': '2025-01-01T00:00:00Z'
    }])
    
    response = client.delete(
        f"/api/files/{file_id}",
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    # Verify that deleted_at was set
    mock_supabase.table.return_value.update.assert_called_once()


def test_file_size_limit_enforced(mock_auth, mock_supabase, mock_storage):
    """Test that file size limits are enforced based on plan"""
    project_id = str(uuid4())
    
    # Create a large file (51MB - exceeds free plan limit of 50MB)
    large_file = b"x" * (51 * 1024 * 1024)
    files = {"file": ("large.pdf", BytesIO(large_file), "application/pdf")}
    
    response = client.post(
        f"/api/projects/{project_id}/files",
        files=files,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "size" in data.get("error", "").lower()


def test_unauthorized_file_access_rejected(mock_auth, mock_supabase):
    """Test that users cannot access files from other agencies (IDOR test)"""
    file_id = str(uuid4())
    
    # Mock file belonging to a different agency
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
        'id': file_id,
        'name': 'test.pdf',
        'size_bytes': 1024,
        'mime_type': 'application/pdf',
        'storage_path': 'test/path/test.pdf',
        'project_id': str(uuid4()),
        'agency_id': '99999999-9999-9999-9999-999999999999',  # Different agency
        'uploader_id': '00000000-0000-0000-0000-000000000001',
        'deleted_at': None,
        'created_at': '2025-01-01T00:00:00Z'
    }])
    
    response = client.get(
        f"/api/files/{file_id}/download",
        headers={"Authorization": "Bearer test-token"}
    )
    
    # Should be rejected due to RLS
    assert response.status_code == 403 or response.status_code == 404
