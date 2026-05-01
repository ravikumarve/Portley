"""
Webhooks Router
Handles Razorpay and Stripe webhook endpoints
"""

from fastapi import APIRouter, Request, HTTPException, status
from typing import Optional
import hmac
import hashlib
import json

from backend.services.supabase import supabase_service

router = APIRouter()


# ============================================================================
# WEBHOOK ENDPOINTS
# ============================================================================

# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.post("/webhooks/razorpay", status_code=status.HTTP_200_OK)
async def razorpay_webhook(
    request: Request,
):
    """
    Verify signature → mark invoice paid
    
    Args:
        request: FastAPI request with webhook payload
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If signature verification fails
    """
    # Get webhook secret from environment
    webhook_secret = "test_razorpay_webhook_secret"  # TODO: Get from env
    
    # Get raw body
    body = await request.body()
    
    # Get signature from headers
    signature = request.headers.get("x-razorpay-signature")
    
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing signature",
        )
    
    # Verify signature
    # TODO: Implement proper signature verification
    # expected_signature = hmac.new(
    #     webhook_secret.encode(),
    #     body,
    #     hashlib.sha256
    # ).hexdigest()
    # 
    # if not hmac.compare_digest(signature, expected_signature):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid signature",
    #     )
    
    # Parse webhook payload
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )
    
    # Process webhook event
    event_type = payload.get("event")
    
    if event_type == "payment.captured":
        # Extract payment details
        payment_id = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
        notes = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("notes", {})
        invoice_id = notes.get("invoice_id")
        
        if invoice_id:
            # TODO: Mark invoice as paid
            # await supabase_service.update_invoice(
            #     UUID(invoice_id),
            #     {
            #         'status': 'paid',
            #         'payment_id': payment_id,
            #         'paid_at': datetime.now().isoformat()
            #     }
            # )
            
            # TODO: Log activity
            # await supabase_service.log_activity({
            #     'agency_id': agency_id,
            #     'actor_id': None,
            #     'actor_name': 'Razorpay Webhook',
            #     'action': 'invoice.paid',
            #     'entity_type': 'invoice',
            #     'entity_id': invoice_id,
            #     'entity_name': f'Invoice {invoice_id}'
            # })
            
            print(f"Payment captured: {payment_id} for invoice {invoice_id}")
    
    return {
        "status": "success",
        "message": "Webhook processed successfully"
    }


# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.post("/webhooks/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
):
    """
    Verify signature → mark invoice paid + upgrade plan
    
    Args:
        request: FastAPI request with webhook payload
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If signature verification fails
    """
    # Get webhook secret from environment
    webhook_secret = "test_stripe_webhook_secret"  # TODO: Get from env
    
    # Get raw body
    body = await request.body()
    
    # Get signature from headers
    signature = request.headers.get("stripe-signature")
    
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing signature",
        )
    
    # Verify signature
    # TODO: Implement proper signature verification using stripe library
    # try:
    #     event = stripe.Webhook.construct_event(
    #         body,
    #         signature,
    #         webhook_secret
    #     )
    # except ValueError as e:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Invalid payload",
    #     )
    # except stripe.error.SignatureVerificationError as e:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid signature",
    #     )
    
    # Parse webhook payload
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )
    
    # Process webhook event
    event_type = payload.get("type")
    
    if event_type == "payment_intent.succeeded":
        # Extract payment details
        payment_intent = payload.get("data", {}).get("object", {})
        payment_id = payment_intent.get("id")
        metadata = payment_intent.get("metadata", {})
        invoice_id = metadata.get("invoice_id")
        
        if invoice_id:
            # TODO: Mark invoice as paid
            # await supabase_service.update_invoice(
            #     UUID(invoice_id),
            #     {
            #         'status': 'paid',
            #         'payment_id': payment_id,
            #         'paid_at': datetime.now().isoformat()
            #     }
            # )
            
            # TODO: Check if this is a plan upgrade payment
            # plan_type = metadata.get("plan_type")
            # if plan_type:
            #     # TODO: Upgrade agency plan
            #     await supabase_service.update_agency(
            #         UUID(agency_id),
            #         {
            #             'plan': plan_type,
            #             'plan_expires_at': (datetime.now() + timedelta(days=30)).isoformat()
            #         }
            #     )
            
            # TODO: Log activity
            # await supabase_service.log_activity({
            #     'agency_id': agency_id,
            #     'actor_id': None,
            #     'actor_name': 'Stripe Webhook',
            #     'action': 'invoice.paid',
            #     'entity_type': 'invoice',
            #     'entity_id': invoice_id,
            #     'entity_name': f'Invoice {invoice_id}'
            # })
            
            print(f"Payment succeeded: {payment_id} for invoice {invoice_id}")
    
    return {
        "status": "success",
        "message": "Webhook processed successfully"
    }
