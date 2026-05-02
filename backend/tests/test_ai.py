"""
Tests for AI features (brief summarizer and invoice nudge)
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
def mock_gemini():
    """Mock Gemini AI client"""
    with patch('backend.services.ai_service.genai') as mock:
        mock.GenerativeModel.return_value.generate_content.return_value = Mock(
            text='{"project_name": "Website Redesign", "deliverables": ["Homepage", "About Page", "Contact Form"], "timeline": "4 weeks", "budget": "$5000", "key_requirements": ["Mobile responsive", "SEO optimized"], "suggested_tasks": ["Design homepage", "Develop about page", "Create contact form"]}'
        )
        yield mock


def test_brief_summary_returns_valid_json(mock_auth, mock_gemini):
    """Test that brief summary returns valid JSON"""
    raw_text = """
    Hi,
    
    We need a new website for our company. We want it to be mobile responsive and SEO optimized.
    The project should include homepage, about page, and contact form.
    We have a budget of $5000 and need it done in 4 weeks.
    
    Thanks,
    John
    """
    
    request_data = {
        "raw_text": raw_text
    }
    
    response = client.post(
        "/api/ai/brief-summary",
        json=request_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify all required fields are present
    assert "project_name" in data
    assert "deliverables" in data
    assert isinstance(data["deliverables"], list)
    assert "timeline" in data
    assert "budget" in data
    assert "key_requirements" in data
    assert isinstance(data["key_requirements"], list)
    assert "suggested_tasks" in data
    assert isinstance(data["suggested_tasks"], list)
    
    # Verify extracted data
    assert data["project_name"] == "Website Redesign"
    assert len(data["deliverables"]) == 3
    assert "Homepage" in data["deliverables"]
    assert data["timeline"] == "4 weeks"
    assert data["budget"] == "$5000"


def test_nudge_returns_subject_body_whatsapp(mock_auth, mock_gemini):
    """Test that invoice nudge returns subject, body, and WhatsApp version"""
    invoice_id = str(uuid4())
    
    # Mock invoice lookup
    with patch('backend.services.supabase.supabase') as mock_supabase:
        mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
            'id': invoice_id,
            'invoice_number': 'INV-2025-001',
            'amount': 1000.00,
            'currency': 'INR',
            'status': 'unpaid',
            'due_date': '2025-01-15',
            'line_items': [],
            'agency_id': '00000000-0000-0000-0000-000000000000',
            'client_id': str(uuid4()),
            'project_id': None,
            'payment_id': None,
            'payment_url': None,
            'notes': None,
            'created_at': '2025-01-01T00:00:00Z',
            'paid_at': None
        }])
        
        # Mock client lookup
        mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
            'id': str(uuid4()),
            'name': 'John Smith',
            'email': 'john@example.com',
            'agency_id': '00000000-0000-0000-0000-000000000000',
            'user_id': None,
            'invite_token': None,
            'invite_status': 'accepted',
            'created_at': '2025-01-01T00:00:00Z'
        }])
        
        # Mock Gemini response
        mock_gemini.GenerativeModel.return_value.generate_content.return_value = Mock(
            text='{"subject": "Payment Reminder: Invoice #INV-2025-001", "body": "Hi John, Just a friendly reminder that invoice #INV-2025-001 for ₹1,000 is due on January 15, 2025. Please let me know if you have any questions. Thanks!", "whatsapp_version": "Hi John! Friendly reminder: Invoice #INV-2025-001 for ₹1,000 is due on Jan 15. Please let me know if you have any questions. Thanks!"}'
        )
        
        request_data = {
            "invoice_id": invoice_id,
            "tone": "friendly"
        }
        
        response = client.post(
            "/api/ai/invoice-nudge",
            json=request_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields are present
        assert "subject" in data
        assert "body" in data
        assert "whatsapp_version" in data
        
        # Verify content
        assert "INV-2025-001" in data["subject"]
        assert "₹1,000" in data["body"]
        assert "John" in data["body"]
        assert len(data["whatsapp_version"]) < len(data["body"])  # WhatsApp version should be shorter


def test_ai_timeout_returns_503(mock_auth, mock_gemini):
    """Test that AI timeout returns 503 with fallback flag"""
    # Mock Gemini timeout
    mock_gemini.GenerativeModel.return_value.generate_content.side_effect = TimeoutError("AI service timeout")
    
    request_data = {
        "raw_text": "Test brief"
    }
    
    response = client.post(
        "/api/ai/brief-summary",
        json=request_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 503
    data = response.json()
    assert "error" in data
    assert "ai_unavailable" in data.get("error", "")
    assert data.get("fallback") == True


def test_nudge_different_tones(mock_auth, mock_gemini):
    """Test that nudge generates different content for different tones"""
    invoice_id = str(uuid4())
    
    tones = ["friendly", "firm", "final"]
    
    for tone in tones:
        # Mock Gemini response for each tone
        mock_gemini.GenerativeModel.return_value.generate_content.return_value = Mock(
            text=f'{{"subject": "Payment Reminder ({tone})", "body": "This is a {tone} reminder.", "whatsapp_version": "{tone} reminder"}}'
        )
        
        request_data = {
            "invoice_id": invoice_id,
            "tone": tone
        }
        
        response = client.post(
            "/api/ai/invoice-nudge",
            json=request_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert tone in data["subject"]
        assert tone in data["body"]
