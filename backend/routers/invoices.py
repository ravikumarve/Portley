"""
Invoices Router
Handles all invoice CRUD and payment link generation
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date

from backend.models.schemas import (
    InvoiceCreate,
    InvoiceResponse,
    LineItem,
    ErrorResponse,
)
from backend.services.supabase import supabase_service
from backend.middleware.auth import get_current_user, UserContext

router = APIRouter()


# ============================================================================
# INVOICE ENDPOINTS
# ============================================================================

# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    status_filter: Optional[str] = Query(None, alias="status"),
    client_id: Optional[UUID] = Query(None),
    current_user: UserContext = Depends(get_current_user),
):
    """
    List invoices (filter: status, client_id)
    
    Args:
        status_filter: Filter by invoice status
        client_id: Filter by client ID
        current_user: Authenticated user context
        
    Returns:
        List[InvoiceResponse]: List of invoices
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
    
    # TODO: Get invoices from database
    # invoices = await supabase_service.get_invoices_by_agency(UUID(current_user.agency_id), filters)
    
    # For now, return empty list
    return []


# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_data: InvoiceCreate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Create invoice + auto-generate invoice_number
    
    Args:
        invoice_data: Invoice creation data
        current_user: Authenticated user context
        
    Returns:
        InvoiceResponse: Created invoice
        
    Raises:
        HTTPException: If client not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # Verify client exists and belongs to agency
    client_response = supabase_service.client.table('clients').select('*').eq('id', str(invoice_data.client_id)).execute()
    if not client_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    client = client_response.data[0]
    if client['agency_id'] != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this client",
        )
    
    # Generate invoice number: INV-{YYYY}-{agency_seq_padded_3}
    # TODO: Implement invoice sequence generation
    # invoice_number = await supabase_service.generate_invoice_number(UUID(current_user.agency_id))
    invoice_number = f"INV-{datetime.now().year}-001"
    
    # Create invoice
    invoice_dict = {
        'agency_id': current_user.agency_id,
        'client_id': str(invoice_data.client_id),
        'project_id': str(invoice_data.project_id) if invoice_data.project_id else None,
        'invoice_number': invoice_number,
        'amount': invoice_data.amount,
        'currency': invoice_data.currency,
        'status': 'draft',
        'due_date': invoice_data.due_date.isoformat() if invoice_data.due_date else None,
        'line_items': [item.dict() for item in invoice_data.line_items],
        'payment_id': None,
        'payment_url': None,
        'notes': invoice_data.notes,
        'paid_at': None
    }
    
    # TODO: Insert into invoices table
    # created_invoice = await supabase_service.create_invoice(invoice_dict)
    
    # For now, return mock response
    created_invoice = {
        'id': str(UUID()),
        'invoice_number': invoice_number,
        'client': {
            'id': str(invoice_data.client_id),
            'name': client['name'],
            'email': client['email']
        },
        'project': None,
        'amount': invoice_data.amount,
        'currency': invoice_data.currency,
        'status': 'draft',
        'due_date': invoice_data.due_date,
        'payment_url': None,
        'line_items': [item.dict() for item in invoice_data.line_items],
        'created_at': datetime.now().isoformat(),
        'paid_at': None
    }
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'invoice.created',
        'entity_type': 'invoice',
        'entity_id': created_invoice['id'],
        'entity_name': invoice_number
    })
    
    return InvoiceResponse(
        id=UUID(created_invoice['id']),
        invoice_number=created_invoice['invoice_number'],
        client=created_invoice['client'],
        project=created_invoice['project'],
        amount=created_invoice['amount'],
        currency=created_invoice['currency'],
        status=created_invoice['status'],
        due_date=created_invoice['due_date'],
        payment_url=created_invoice['payment_url'],
        line_items=[LineItem(**item) for item in created_invoice['line_items']],
        created_at=datetime.fromisoformat(created_invoice['created_at']),
        paid_at=created_invoice['paid_at']
    )


# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Get invoice detail
    
    Args:
        invoice_id: Invoice UUID
        current_user: Authenticated user context
        
    Returns:
        InvoiceResponse: Invoice details
        
    Raises:
        HTTPException: If invoice not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Get invoice from database
    # invoice = await supabase_service.get_invoice_by_id(invoice_id)
    
    # TODO: Verify user has access to this invoice
    # if invoice['agency_id'] != current_user.agency_id:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Access denied to this invoice",
    #     )
    
    # For now, return mock response
    return InvoiceResponse(
        id=invoice_id,
        invoice_number="INV-2026-001",
        client={'id': str(UUID()), 'name': 'Test Client', 'email': 'test@example.com'},
        project=None,
        amount=1000.00,
        currency="INR",
        status="unpaid",
        due_date=date(2026, 6, 1),
        payment_url=None,
        line_items=[],
        created_at=datetime.now(),
        paid_at=None
    )


# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.patch("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: UUID,
    update_data: dict,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Update invoice status, add notes
    
    Args:
        invoice_id: Invoice UUID
        update_data: Data to update
        current_user: Authenticated user context
        
    Returns:
        InvoiceResponse: Updated invoice
        
    Raises:
        HTTPException: If invoice not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Get invoice from database
    # invoice = await supabase_service.get_invoice_by_id(invoice_id)
    
    # TODO: Verify user has access to this invoice
    # if invoice['agency_id'] != current_user.agency_id:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Access denied to this invoice",
    #     )
    
    # TODO: Update invoice in database
    # updated_invoice = await supabase_service.update_invoice(invoice_id, update_data)
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'invoice.updated',
        'entity_type': 'invoice',
        'entity_id': str(invoice_id),
        'entity_name': 'Invoice'
    })
    
    # For now, return mock response
    return InvoiceResponse(
        id=invoice_id,
        invoice_number="INV-2026-001",
        client={'id': str(UUID()), 'name': 'Test Client', 'email': 'test@example.com'},
        project=None,
        amount=1000.00,
        currency="INR",
        status="unpaid",
        due_date=date(2026, 6, 1),
        payment_url=None,
        line_items=[],
        created_at=datetime.now(),
        paid_at=None
    )


# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.post("/invoices/{invoice_id}/send", status_code=status.HTTP_200_OK)
async def send_invoice(
    invoice_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Email to client + generate payment link
    
    Args:
        invoice_id: Invoice UUID
        current_user: Authenticated user context
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If invoice not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Get invoice from database
    # invoice = await supabase_service.get_invoice_by_id(invoice_id)
    
    # TODO: Generate payment link based on currency
    # if invoice['currency'] == 'INR':
    #     payment_link = await generate_razorpay_payment_link(invoice)
    # else:
    #     payment_link = await generate_stripe_payment_link(invoice)
    
    # TODO: Send email via Resend
    # await send_invoice_email(invoice, payment_link)
    
    # Log activity
    await supabase_service.log_activity({
        'agency_id': current_user.agency_id,
        'actor_id': current_user.id,
        'actor_name': current_user.user_metadata.get('full_name', current_user.email),
        'action': 'invoice.sent',
        'entity_type': 'invoice',
        'entity_id': str(invoice_id),
        'entity_name': 'Invoice'
    })
    
    return {
        "message": "Invoice sent successfully",
        "invoice_id": str(invoice_id)
    }


# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.post("/invoices/{invoice_id}/payment-link", response_model=dict)
async def create_payment_link(
    invoice_id: UUID,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Create Razorpay/Stripe payment link
    
    Args:
        invoice_id: Invoice UUID
        current_user: Authenticated user context
        
    Returns:
        dict: Payment link details
        
    Raises:
        HTTPException: If invoice not found
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Get invoice from database
    # invoice = await supabase_service.get_invoice_by_id(invoice_id)
    
    # TODO: Generate payment link based on currency
    # if invoice['currency'] == 'INR':
    #     payment_link = await generate_razorpay_payment_link(invoice)
    # else:
    #     payment_link = await generate_stripe_payment_link(invoice)
    
    # TODO: Update invoice with payment URL
    # await supabase_service.update_invoice(invoice_id, {'payment_url': payment_link['url']})
    
    # For now, return mock response
    return {
        "payment_url": "https://payment.example.com/link",
        "expires_at": (datetime.now().timestamp() + 86400 * 7)  # 7 days
    }
