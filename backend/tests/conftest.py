"""
Test configuration for Portley backend tests
"""

import pytest
import os
from dotenv import load_dotenv

# Load environment variables from backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))

# Test configuration
TEST_SUPABASE_URL = os.getenv("SUPABASE_URL")
TEST_SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
TEST_SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Test agency ID (should be created in test setup)
TEST_AGENCY_ID = os.getenv("TEST_AGENCY_ID", "00000000-0000-0000-0000-000000000000")

# Test user IDs
TEST_AGENCY_OWNER_ID = os.getenv("TEST_AGENCY_OWNER_ID", "00000000-0000-0000-0000-000000000001")
TEST_CLIENT_USER_ID = os.getenv("TEST_CLIENT_USER_ID", "00000000-0000-0000-0000-000000000002")

# Test client ID
TEST_CLIENT_ID = os.getenv("TEST_CLIENT_ID", "00000000-0000-0000-0000-000000000003")

# Test project ID
TEST_PROJECT_ID = os.getenv("TEST_PROJECT_ID", "00000000-0000-0000-0000-000000000004")

# Test file ID
TEST_FILE_ID = os.getenv("TEST_FILE_ID", "00000000-0000-0000-0000-000000000005")

# Test invoice ID
TEST_INVOICE_ID = os.getenv("TEST_INVOICE_ID", "00000000-0000-0000-0000-000000000006")

# Test approval ID
TEST_APPROVAL_ID = os.getenv("TEST_APPROVAL_ID", "00000000-0000-0000-0000-000000000007")

# Test message ID
TEST_MESSAGE_ID = os.getenv("TEST_MESSAGE_ID", "00000000-0000-0000-0000-000000000008")

# Test task ID
TEST_TASK_ID = os.getenv("TEST_TASK_ID", "00000000-0000-0000-0000-000000000009")

# Test API keys
TEST_GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
TEST_RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
TEST_RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
TEST_RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
TEST_STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
TEST_STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
TEST_RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

# Test settings
pytest_plugins = ["pytest_asyncio"]
asyncio_mode = "auto"
