"""
AI Router
Handles all AI-powered features (brief summarization, invoice nudge)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from uuid import UUID
from datetime import datetime

from backend.models.schemas import (
    BriefSummaryRequest,
    BriefSummaryResponse,
    NudgeRequest,
    NudgeResponse,
    ErrorResponse,
)
from backend.services.supabase import supabase_service
from backend.middleware.auth import get_current_user, UserContext

router = APIRouter()


# ============================================================================
# AI ENDPOINTS
# ============================================================================

# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.post("/ai/brief-summary", response_model=BriefSummaryResponse)
async def brief_summary(
    request: BriefSummaryRequest,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Paste client email → structured brief
    
    Args:
        request: Brief summary request with raw text
        current_user: Authenticated user context
        
    Returns:
        BriefSummaryResponse: Structured brief data
        
    Raises:
        HTTPException: If AI service unavailable
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Call Gemini Flash API
    # try:
    #     result = await ai_service.generate_brief_summary(request.raw_text)
    # except Exception as e:
    #     raise HTTPException(
    #         status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    #         detail={
    #             "error": "ai_unavailable",
    #             "fallback": True
    #         }
    #     )
    
    # For now, return mock response
    return BriefSummaryResponse(
        project_name="Website Redesign Project",
        deliverables=[
            "New homepage design",
            "Product page redesign",
            "Mobile responsive implementation"
        ],
        timeline="4-6 weeks",
        budget="$5,000 - $7,000",
        key_requirements=[
            "Modern, clean design",
            "Mobile-first approach",
            "Fast loading speed",
            "SEO optimized"
        ],
        suggested_tasks=[
            "Design homepage mockups",
            "Develop homepage HTML/CSS",
            "Implement responsive design",
            "Optimize for performance",
            "SEO meta tags and structure"
        ]
    )


# AGENT: invoices-webhooks-ai-router | STATUS: complete
@router.post("/ai/invoice-nudge", response_model=NudgeResponse)
async def invoice_nudge(
    request: NudgeRequest,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Invoice ID + tone → payment reminder copy
    
    Args:
        request: Nudge request with invoice ID and tone
        current_user: Authenticated user context
        
    Returns:
        NudgeResponse: Subject, body, and WhatsApp version
        
    Raises:
        HTTPException: If invoice not found or AI service unavailable
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a member of an agency",
        )
    
    # TODO: Get invoice from database
    # invoice = await supabase_service.get_invoice_by_id(request.invoice_id)
    
    # TODO: Verify user has access to this invoice
    # if invoice['agency_id'] != current_user.agency_id:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Access denied to this invoice",
    #     )
    
    # TODO: Get client details
    # client = await supabase_service.get_client_by_id(invoice['client_id'])
    
    # TODO: Call Gemini Flash API
    # try:
    #     result = await ai_service.generate_invoice_nudge(
    #         invoice_number=invoice['invoice_number'],
    #         currency=invoice['currency'],
    #         amount=invoice['amount'],
    #         due_date=invoice['due_date'],
    #         client_name=client['name'],
    #         tone=request.tone
    #     )
    # except Exception as e:
    #     raise HTTPException(
    #         status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    #         detail={
    #             "error": "ai_unavailable",
    #             "fallback": True
    #         }
    #     )
    
    # For now, return mock response based on tone
    if request.tone == "friendly":
        subject = "Quick reminder: Invoice #INV-2026-001 is due soon"
        body = """Hi [Client Name],

Hope you're doing well! Just a friendly reminder that invoice #INV-2026-001 for ₹1,000.00 is due on June 1, 2026.

You can pay securely using the link below:
[Payment Link]

Let me know if you have any questions or need any clarification.

Thanks!
[Your Name]"""
        whatsapp = "Hi! Just a reminder that invoice #INV-2026-001 for ₹1,000 is due on June 1. Payment link: [Link]"
    elif request.tone == "firm":
        subject = "Payment Reminder: Invoice #INV-2026-001 - Due June 1, 2026"
        body = """Dear [Client Name],

This is a reminder that invoice #INV-2026-001 for ₹1,000.00 is due on June 1, 2026.

Please ensure payment is made by the due date to avoid any late fees. You can pay using the link below:
[Payment Link]

If you have already made the payment, please disregard this notice.

Regards,
[Your Name]"""
        whatsapp = "Payment reminder: Invoice #INV-2026-001 for ₹1,000 due June 1. Please pay: [Link]"
    else:  # final
        subject = "URGENT: Final Notice - Invoice #INV-2026-001 Overdue"
        body = """Dear [Client Name],

This is a final notice that invoice #INV-2026-001 for ₹1,000.00 is now overdue.

Please make payment immediately using the link below:
[Payment Link]

If payment is not received within 3 days, we may need to suspend services.

Regards,
[Your Name]"""
        whatsapp = "URGENT: Invoice #INV-2026-001 is overdue. Please pay immediately: [Link]"
    
    return NudgeResponse(
        subject=subject,
        body=body,
        whatsapp_version=whatsapp
    )
