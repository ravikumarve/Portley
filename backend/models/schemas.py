"""
Pydantic Schemas for Portley Backend
All request and response models for the API
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class Plan(str, Enum):
    """Subscription plan types"""
    FREE = "free"
    SOLO = "solo"
    AGENCY = "agency"


class ProjectStatus(str, Enum):
    """Project status types"""
    ACTIVE = "active"
    REVIEW = "review"
    COMPLETED = "completed"
    PAUSED = "paused"


class InviteStatus(str, Enum):
    """Client invite status"""
    PENDING = "pending"
    ACCEPTED = "accepted"


class InvoiceStatus(str, Enum):
    """Invoice status types"""
    DRAFT = "draft"
    UNPAID = "unpaid"
    PAID = "paid"
    OVERDUE = "overdue"


class ApprovalStatus(str, Enum):
    """Approval status types"""
    PENDING = "pending"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"


class Currency(str, Enum):
    """Currency types"""
    INR = "INR"
    USD = "USD"
    GBP = "GBP"
    EUR = "EUR"


# ============================================================================
# PROJECTS
# ============================================================================

class ProjectCreate(BaseModel):
    """Schema for creating a project"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    client_id: Optional[UUID] = None
    due_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    due_date: Optional[date] = None


class ClientSummary(BaseModel):
    """Summary of client information"""
    id: UUID
    name: str
    email: str


class ProjectResponse(BaseModel):
    """Schema for project response"""
    id: UUID
    name: str
    description: Optional[str]
    status: ProjectStatus
    due_date: Optional[date]
    client: Optional[ClientSummary]
    task_count: int
    completed_task_count: int
    progress_pct: float
    unread_messages: int
    pending_approvals: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# TASKS
# ============================================================================

class TaskCreate(BaseModel):
    """Schema for creating a task"""
    title: str = Field(..., min_length=1, max_length=255)
    project_id: UUID
    position: int = 0


class TaskUpdate(BaseModel):
    """Schema for updating a task"""
    completed: Optional[bool] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    position: Optional[int] = None


class TaskResponse(BaseModel):
    """Schema for task response"""
    id: UUID
    title: str
    completed: bool
    position: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# FILES
# ============================================================================

class FileResponse(BaseModel):
    """Schema for file response"""
    id: UUID
    name: str
    size_bytes: int
    mime_type: Optional[str]
    uploader_name: str
    download_url: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# MESSAGES
# ============================================================================

class MessageCreate(BaseModel):
    """Schema for creating a message"""
    project_id: UUID
    content: str = Field(..., min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    """Schema for message response"""
    id: UUID
    content: str
    sender_id: UUID
    sender_name: str
    is_mine: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# APPROVALS
# ============================================================================

class ApprovalCreate(BaseModel):
    """Schema for creating an approval request"""
    project_id: UUID
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    file_id: Optional[UUID] = None


class ApprovalRespond(BaseModel):
    """Schema for responding to an approval"""
    status: ApprovalStatus
    client_note: Optional[str] = None


class ApprovalResponse(BaseModel):
    """Schema for approval response"""
    id: UUID
    title: str
    description: Optional[str]
    status: ApprovalStatus
    file: Optional[FileResponse]
    client_note: Optional[str]
    created_at: datetime
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# INVOICES
# ============================================================================

class LineItem(BaseModel):
    """Schema for invoice line item"""
    description: str = Field(..., min_length=1, max_length=255)
    quantity: float = Field(..., gt=0)
    rate: float = Field(..., ge=0)
    amount: float

    @validator('amount')
    def calculate_amount(cls, v, values):
        """Calculate amount from quantity and rate"""
        if 'quantity' in values and 'rate' in values:
            return values['quantity'] * values['rate']
        return v


class InvoiceCreate(BaseModel):
    """Schema for creating an invoice"""
    client_id: UUID
    project_id: Optional[UUID] = None
    amount: float = Field(..., gt=0)
    currency: Currency = Currency.INR
    due_date: Optional[date] = None
    line_items: List[LineItem] = []
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    """Schema for invoice response"""
    id: UUID
    invoice_number: str
    client: ClientSummary
    project: Optional[ProjectResponse]
    amount: float
    currency: Currency
    status: InvoiceStatus
    due_date: Optional[date]
    payment_url: Optional[str]
    line_items: List[LineItem]
    created_at: datetime
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# CLIENTS
# ============================================================================

class ClientInvite(BaseModel):
    """Schema for inviting a client"""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr


class ClientResponse(BaseModel):
    """Schema for client response"""
    id: UUID
    name: str
    email: str
    invite_status: InviteStatus
    project_count: int
    unpaid_invoice_total: float
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# AGENCY / WHITE-LABEL
# ============================================================================

class AgencyBrandingUpdate(BaseModel):
    """Schema for updating agency branding"""
    brand_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    logo_url: Optional[str] = None
    custom_domain: Optional[str] = None


class AgencyBrandingResponse(BaseModel):
    """Schema for agency branding response"""
    name: str
    logo_url: Optional[str]
    brand_color: str
    custom_domain: Optional[str]
    plan: Plan

    class Config:
        from_attributes = True


# ============================================================================
# AI
# ============================================================================

class BriefSummaryRequest(BaseModel):
    """Schema for brief summary request"""
    raw_text: str = Field(..., min_length=10, max_length=10000)


class BriefSummaryResponse(BaseModel):
    """Schema for brief summary response"""
    project_name: str
    deliverables: List[str]
    timeline: Optional[str]
    budget: Optional[str]
    key_requirements: List[str]
    suggested_tasks: List[str]


class NudgeRequest(BaseModel):
    """Schema for payment reminder request"""
    invoice_id: UUID
    tone: str = "friendly"  # "friendly" | "firm" | "final"


class NudgeResponse(BaseModel):
    """Schema for payment reminder response"""
    subject: str
    body: str
    whatsapp_version: str


# ============================================================================
# COMMON
# ============================================================================

class HealthResponse(BaseModel):
    """Schema for health check response"""
    status: str
    service: str
    version: str


class ErrorResponse(BaseModel):
    """Schema for error response"""
    error: str
    message: str
    detail: Optional[str] = None
