# Portley Backend Tests

This directory contains the test suite for the Portley backend API.

## Test Coverage

The test suite covers the following areas:

- **Projects & Tasks** (`test_projects.py`): Project CRUD, task management, progress calculation, plan limits
- **Files** (`test_files.py`): File upload, download, soft delete, size limits, access control
- **Invoices** (`test_invoices.py`): Invoice creation, status transitions, payment webhooks
- **Approvals** (`test_approvals.py`): Approval workflow, client responses, authorization
- **AI** (`test_ai.py`): Brief summarizer, invoice nudge, timeout handling
- **Webhooks** (`test_webhooks.py`): Signature verification, webhook handling

## Running Tests

### Run all tests:
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Run specific test file:
```bash
pytest tests/test_projects.py -v
```

### Run specific test:
```bash
pytest tests/test_projects.py::test_create_project_success -v
```

### Run with coverage:
```bash
pytest tests/ --cov=backend --cov-report=html
```

### Run with verbose output:
```bash
pytest tests/ -vv
```

## Test Configuration

Tests use mocked Supabase clients and authentication to avoid requiring real credentials. Test configuration is in `conftest.py`.

## Target

30/30 tests passing

## Current Status

- test_projects.py: 6 tests
- test_files.py: 5 tests
- test_invoices.py: 5 tests
- test_approvals.py: 4 tests
- test_ai.py: 4 tests
- test_webhooks.py: 6 tests

Total: 30 tests
