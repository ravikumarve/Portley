"""
Tests for invoice creation, payment, and webhook handling
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from uuid import uuid4
from datetime import date

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
            'invoice_number': 'INV-2025-001',
            'amount': 1000.00,
            'currency': 'INR',
            'status': 'unpaid',
            'due_date': '2025-12-31',
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
        yield mock


def test_invoice_number_auto_generated(mock_auth, mock_supabase):
    """Test that invoice numbers are auto-generated in format INV-YYYY-XXX"""
    invoice_data = {
        "client_id": str(uuid4()),
        "amount": 1000.00,
        "currency": "INR",
        "due_date": "2025-12-31",
        "line_items": [],
        "notes": None
    }
    
    response = client.post(
        "/api/invoices",
        json=invoice_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "invoice_number" in data
    # Verify format: INV-2025-001
    assert data["invoice_number"].startswith("INV-2025-")
    assert len(data["invoice_number"]) == 12  # INV-2025-001


def test_invoice_create_success(mock_auth, mock_supabase):
    """Test creating an invoice successfully"""
    client_id = str(uuid4())
    invoice_data = {
        "client_id": client_id,
        "amount": 1000.00,
        "currency": "INR",
        "due_date": "2025-12-31",
        "line_items": [
            {
                "description": "Web Design",
                "quantity": 1,
                "rate": 1000.00,
                "amount": 1000.00
            }
        ],
        "notes": "Thank you for your business!"
    }
    
    response = client.post(
        "/api/invoices",
        json=invoice_data,
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 1000.00
    assert data["currency"] == "INR"
    assert data["status"] == "unpaid"
    assert len(data["line_items"]) == 1


def test_invoice_status_transitions(mock_auth, mock_supabase):
    """Test that invoice status transitions correctly"""
    invoice_id = str(uuid4())
    
    # Update status to paid
    mock_supabase.table.return_value.update.return_value.execute.return_value = Mock(data=[{
        'id': invoice_id,
        'invoice_number': 'INV-2025-001',
        'amount': 1000.00,
        'currency': 'INR',
        'status': 'paid',
        'due_date': '2025-12-31',
        'line_items': [],
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'client_id': str(uuid4()),
        'project_id': None,
        'payment_id': 'pay_123',
        'payment_url': None,
        'notes': None,
        'created_at': '2025-01-01T00:00:00Z',
        'paid_at': '2025-01-15T00:00:00Z'
    }])
    
    response = client.patch(
        f"/api/invoices/{invoice_id}",
        json={"status": "paid"},
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "paid"
    assert data["paid_at"] is not None


def test_razorpay_webhook_marks_paid(mock_auth, mock_supabase):
    """Test that Razorpay webhook marks invoice as paid"""
    invoice_id = str(uuid4())
    
    # Mock invoice lookup
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
        'id': invoice_id,
        'invoice_number': 'INV-2025-001',
        'amount': 1000.00,
        'currency': 'INR',
        'status': 'unpaid',
        'due_date': '2025-12-31',
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
    
    # Mock update
    mock_supabase.table.return_value.update.return_value.execute.return_value = Mock(data=[{
        'id': invoice_id,
        'invoice_number': 'INV-2025-001',
        'amount': 1000.00,
        'currency': 'INR',
        'status': 'paid',
        'due_date': '2025-12-31',
        'line_items': [],
        'agency_id': '00000000-0000-0000-0000-000000000000',
        'client_id': str(uuid4()),
        'project_id': None,
        'payment_id': 'pay_123',
        'payment_url': None,
        'notes': None,
        'created_at': '2025-01-01T00:00:00Z',
        'paid_at': '2025-01-15T00:00:00Z'
    }])
    
    webhook_data = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_123",
                    "amount": 100000,  # Razorpay uses paise
                    "currency": "INR",
                    "notes": {
                        "invoice_id": invoice_id
                    }
                }
            }
        }
    }
    
    response = client.post(
        "/api/webhooks/razorpay",
        json=webhook_data,
        headers={"x-razorpay-signature": "test-signature"}
    )
    
    assert response.status_code == 200
    # Verify invoice was updated to paid
    mock_supabase.table.return_value.update.assert_called()


def test_stripe_webhook_upgrades_plan(mock_auth, mock_supabase):
    """Test that Stripe webhook upgrades agency plan"""
    agency_id = "00000000-0000-0000-0000-000000000000"
    
    # Mock agency lookup
    mock_supabase.table.return_value.select.return_value.execute.return_value = Mock(data=[{
        'id': agency_id,
        'name': 'Test Agency',
        'slug': 'test-agency',
        'logo_url': None,
        'brand_color': '#6366f1',
        'custom_domain': None,
        'plan': 'free',
        'plan_expires_at': None,
        'owner_id': '00000000-0000-0000-0000-000000000001',
        'created_at': '2025-01-01T00:00:00Z'
    }])
    
    # Mock update
    mock_supabase.table.return_value.update.return_value.execute.return_value = Mock(data=[{
        'id': agency_id,
        'name': 'Test Agency',
        'slug': 'test-agency',
        'logo_url': None,
        'brand_color': '#6366f1',
        'custom_domain': None,
        'plan': 'solo',
        'plan_expires_at': '2026-01-01T00:00:00Z',
        'owner_id': '00000000-0000-0000-0000-000000000001',
        'created_at': '2025-01-01T00:00:00Z'
    }])
    
    webhook_data = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "metadata": {
                    "agency_id": agency_id,
                    "plan": "solo"
                },
                "payment_status": "paid"
            }
        }
    }
    
    response = client.post(
        "/api/webhooks/stripe",
        json=webhook_data,
        headers={"stripe-signature": "test-signature"}
    )
    
    assert response.status_code == 200
    # Verify agency plan was upgraded
    mock_supabase.table.return_value.update.assert_called()
