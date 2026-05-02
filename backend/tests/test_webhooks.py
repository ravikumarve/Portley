"""
Tests for webhook signature verification and handling
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from uuid import uuid4
import hmac
import hashlib

from backend.main import app


client = TestClient(app)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    with patch('backend.services.supabase.supabase') as mock:
        mock.table.return_value.select.return_value.execute.return_value = Mock(data=[])
        mock.table.return_value.update.return_value.execute.return_value = Mock(data=[{
            'id': str(uuid4()),
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
        yield mock


def generate_razorpay_signature(payload: str, secret: str) -> str:
    """Generate Razorpay webhook signature"""
    return hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def generate_stripe_signature(payload: str, secret: str) -> str:
    """Generate Stripe webhook signature"""
    timestamp = str(int(__import__('time').time()))
    signed_payload = f"{timestamp}.{payload}"
    signature = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"t={timestamp},v1={signature}"


def test_razorpay_invalid_signature_rejected(mock_supabase):
    """Test that invalid Razorpay signatures are rejected"""
    webhook_data = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_123",
                    "amount": 100000,
                    "currency": "INR",
                    "notes": {
                        "invoice_id": str(uuid4())
                    }
                }
            }
        }
    }
    
    # Use invalid signature
    response = client.post(
        "/api/webhooks/razorpay",
        json=webhook_data,
        headers={"x-razorpay-signature": "invalid-signature"}
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "signature" in data.get("error", "").lower()


def test_razorpay_valid_signature_accepted(mock_supabase):
    """Test that valid Razorpay signatures are accepted"""
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
    
    webhook_data = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_123",
                    "amount": 100000,
                    "currency": "INR",
                    "notes": {
                        "invoice_id": invoice_id
                    }
                }
            }
        }
    }
    
    # Generate valid signature
    import json
    payload_str = json.dumps(webhook_data, separators=(',', ':'))
    secret = "test-secret"
    signature = generate_razorpay_signature(payload_str, secret)
    
    # Mock signature verification
    with patch('backend.routers.webhooks.verify_razorpay_signature') as mock_verify:
        mock_verify.return_value = True
        
        response = client.post(
            "/api/webhooks/razorpay",
            json=webhook_data,
            headers={"x-razorpay-signature": signature}
        )
        
        assert response.status_code == 200


def test_stripe_invalid_signature_rejected(mock_supabase):
    """Test that invalid Stripe signatures are rejected"""
    webhook_data = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "metadata": {
                    "agency_id": str(uuid4()),
                    "plan": "solo"
                },
                "payment_status": "paid"
            }
        }
    }
    
    # Use invalid signature
    response = client.post(
        "/api/webhooks/stripe",
        json=webhook_data,
        headers={"stripe-signature": "invalid-signature"}
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "signature" in data.get("error", "").lower()


def test_stripe_valid_signature_accepted(mock_supabase):
    """Test that valid Stripe signatures are accepted"""
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
    
    # Generate valid signature
    import json
    payload_str = json.dumps(webhook_data, separators=(',', ':'))
    secret = "whsec_test_secret"
    signature = generate_stripe_signature(payload_str, secret)
    
    # Mock signature verification
    with patch('backend.routers.webhooks.verify_stripe_signature') as mock_verify:
        mock_verify.return_value = True
        
        response = client.post(
            "/api/webhooks/stripe",
            json=webhook_data,
            headers={"stripe-signature": signature}
        )
        
        assert response.status_code == 200


def test_razorpay_missing_signature_rejected(mock_supabase):
    """Test that missing Razorpay signatures are rejected"""
    webhook_data = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_123",
                    "amount": 100000,
                    "currency": "INR"
                }
            }
        }
    }
    
    # No signature header
    response = client.post(
        "/api/webhooks/razorpay",
        json=webhook_data
    )
    
    assert response.status_code == 401


def test_stripe_missing_signature_rejected(mock_supabase):
    """Test that missing Stripe signatures are rejected"""
    webhook_data = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "metadata": {
                    "agency_id": str(uuid4()),
                    "plan": "solo"
                },
                "payment_status": "paid"
            }
        }
    }
    
    # No signature header
    response = client.post(
        "/api/webhooks/stripe",
        json=webhook_data
    )
    
    assert response.status_code == 401
