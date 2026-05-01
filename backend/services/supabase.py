"""
Supabase Service Wrapper for Portley Backend
Handles all Supabase database operations
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from uuid import UUID

# Load environment variables from backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
except Exception as e:
    print(f"Warning: Failed to initialize Supabase client: {e}")
    print("This is expected in development without real credentials")
    supabase = None


class SupabaseService:
    """Service class for Supabase operations"""
    
    def __init__(self):
        """Initialize Supabase service"""
        self.client = supabase
    
    def get_client(self) -> Client:
        """
        Get Supabase client instance
        
        Returns:
            Client: Supabase client
        """
        return self.client
    
    # ============================================================================
    # AGENCY OPERATIONS
    # ============================================================================
    
    async def get_agency_by_id(self, agency_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get agency by ID
        
        Args:
            agency_id: Agency UUID
            
        Returns:
            Optional[Dict]: Agency data or None
        """
        try:
            response = self.client.table('agencies').select('*').eq('id', str(agency_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error getting agency: {e}")
            return None
    
    async def get_agency_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """
        Get agency by slug
        
        Args:
            slug: Agency slug
            
        Returns:
            Optional[Dict]: Agency data or None
        """
        try:
            response = self.client.table('agencies').select('*').eq('slug', slug).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error getting agency by slug: {e}")
            return None
    
    async def create_agency(self, agency_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create new agency
        
        Args:
            agency_data: Agency data
            
        Returns:
            Optional[Dict]: Created agency data or None
        """
        try:
            response = self.client.table('agencies').insert(agency_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error creating agency: {e}")
            return None
    
    async def update_agency(self, agency_id: UUID, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update agency
        
        Args:
            agency_id: Agency UUID
            update_data: Data to update
            
        Returns:
            Optional[Dict]: Updated agency data or None
        """
        try:
            response = self.client.table('agencies').update(update_data).eq('id', str(agency_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error updating agency: {e}")
            return None
    
    # ============================================================================
    # CLIENT OPERATIONS
    # ============================================================================
    
    async def get_clients_by_agency(self, agency_id: UUID) -> List[Dict[str, Any]]:
        """
        Get all clients for an agency
        
        Args:
            agency_id: Agency UUID
            
        Returns:
            List[Dict]: List of clients
        """
        try:
            response = self.client.table('clients').select('*').eq('agency_id', str(agency_id)).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting clients: {e}")
            return []
    
    async def create_client(self, client_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create new client
        
        Args:
            client_data: Client data
            
        Returns:
            Optional[Dict]: Created client data or None
        """
        try:
            response = self.client.table('clients').insert(client_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error creating client: {e}")
            return None
    
    # ============================================================================
    # PROJECT OPERATIONS
    # ============================================================================
    
    async def get_projects_by_agency(self, agency_id: UUID, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get all projects for an agency
        
        Args:
            agency_id: Agency UUID
            filters: Optional filters
            
        Returns:
            List[Dict]: List of projects
        """
        try:
            query = self.client.table('projects').select('*').eq('agency_id', str(agency_id))
            
            if filters:
                if 'status' in filters:
                    query = query.eq('status', filters['status'])
                if 'client_id' in filters:
                    query = query.eq('client_id', str(filters['client_id']))
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting projects: {e}")
            return []
    
    async def get_project_by_id(self, project_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get project by ID
        
        Args:
            project_id: Project UUID
            
        Returns:
            Optional[Dict]: Project data or None
        """
        try:
            response = self.client.table('projects').select('*').eq('id', str(project_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error getting project: {e}")
            return None
    
    async def create_project(self, project_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create new project
        
        Args:
            project_data: Project data
            
        Returns:
            Optional[Dict]: Created project data or None
        """
        try:
            response = self.client.table('projects').insert(project_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error creating project: {e}")
            return None
    
    async def update_project(self, project_id: UUID, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update project
        
        Args:
            project_id: Project UUID
            update_data: Data to update
            
        Returns:
            Optional[Dict]: Updated project data or None
        """
        try:
            response = self.client.table('projects').update(update_data).eq('id', str(project_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error updating project: {e}")
            return None
    
    # ============================================================================
    # TASK OPERATIONS
    # ============================================================================
    
    async def get_tasks_by_project(self, project_id: UUID) -> List[Dict[str, Any]]:
        """
        Get all tasks for a project
        
        Args:
            project_id: Project UUID
            
        Returns:
            List[Dict]: List of tasks
        """
        try:
            response = self.client.table('tasks').select('*').eq('project_id', str(project_id)).order('position').execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting tasks: {e}")
            return []
    
    async def create_task(self, task_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create new task
        
        Args:
            task_data: Task data
            
        Returns:
            Optional[Dict]: Created task data or None
        """
        try:
            response = self.client.table('tasks').insert(task_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error creating task: {e}")
            return None
    
    async def update_task(self, task_id: UUID, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update task
        
        Args:
            task_id: Task UUID
            update_data: Data to update
            
        Returns:
            Optional[Dict]: Updated task data or None
        """
        try:
            response = self.client.table('tasks').update(update_data).eq('id', str(task_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error updating task: {e}")
            return None
    
    # ============================================================================
    # ACTIVITY LOGGING
    # ============================================================================
    
    async def log_activity(self, activity_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Log activity event
        
        Args:
            activity_data: Activity data
            
        Returns:
            Optional[Dict]: Created activity data or None
        """
        try:
            response = self.client.table('activity').insert(activity_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error logging activity: {e}")
            return None
    
    async def get_activity_by_agency(self, agency_id: UUID, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get activity feed for an agency
        
        Args:
            agency_id: Agency UUID
            limit: Number of activities to retrieve
            
        Returns:
            List[Dict]: List of activities
        """
        try:
            response = self.client.table('activity').select('*').eq('agency_id', str(agency_id)).order('created_at', desc=True).limit(limit).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting activity: {e}")
            return []
    
    # ============================================================================
    # FILE OPERATIONS
    # ============================================================================
    
    async def create_file(self, file_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create new file
        
        Args:
            file_data: File data
            
        Returns:
            Optional[Dict]: Created file data or None
        """
        try:
            response = self.client.table('files').insert(file_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error creating file: {e}")
            return None
    
    async def get_files_by_project(self, project_id: UUID) -> List[Dict[str, Any]]:
        """
        Get all files for a project (excluding soft-deleted)
        
        Args:
            project_id: Project UUID
            
        Returns:
            List[Dict]: List of files
        """
        try:
            response = self.client.table('files').select('*').eq('project_id', str(project_id)).is_('deleted_at', 'null').execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting files: {e}")
            return []
    
    async def get_file_by_id(self, file_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get file by ID
        
        Args:
            file_id: File UUID
            
        Returns:
            Optional[Dict]: File data or None
        """
        try:
            response = self.client.table('files').select('*').eq('id', str(file_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error getting file: {e}")
            return None
    
    async def delete_file(self, file_id: UUID) -> bool:
        """
        Soft delete file (set deleted_at)
        
        Args:
            file_id: File UUID
            
        Returns:
            bool: Success status
        """
        try:
            response = self.client.table('files').update({'deleted_at': 'now()'}).eq('id', str(file_id)).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    # ============================================================================
    # MESSAGE OPERATIONS
    # ============================================================================
    
    async def create_message(self, message_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create new message
        
        Args:
            message_data: Message data
            
        Returns:
            Optional[Dict]: Created message data or None
        """
        try:
            response = self.client.table('messages').insert(message_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error creating message: {e}")
            return None
    
    async def get_messages_by_project(self, project_id: UUID, cursor: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get messages for a project with pagination
        
        Args:
            project_id: Project UUID
            cursor: Pagination cursor
            limit: Number of messages per page
            
        Returns:
            List[Dict]: List of messages
        """
        try:
            query = self.client.table('messages').select('*').eq('project_id', str(project_id)).order('created_at', desc=True).limit(limit)
            
            if cursor:
                query = query.lt('created_at', cursor)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting messages: {e}")
            return []
    
    async def mark_message_read(self, message_id: UUID, user_id: str) -> bool:
        """
        Mark message as read (add user to read_by array)
        
        Args:
            message_id: Message UUID
            user_id: User ID to add to read_by
            
        Returns:
            bool: Success status
        """
        try:
            # Get current message
            response = self.client.table('messages').select('read_by').eq('id', str(message_id)).execute()
            if not response.data:
                return False
            
            read_by = response.data[0].get('read_by', [])
            if user_id not in read_by:
                read_by.append(user_id)
                self.client.table('messages').update({'read_by': read_by}).eq('id', str(message_id)).execute()
            
            return True
        except Exception as e:
            print(f"Error marking message read: {e}")
            return False
    
    # ============================================================================
    # APPROVAL OPERATIONS
    # ============================================================================
    
    async def create_approval(self, approval_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create new approval
        
        Args:
            approval_data: Approval data
            
        Returns:
            Optional[Dict]: Created approval data or None
        """
        try:
            response = self.client.table('approvals').insert(approval_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error creating approval: {e}")
            return None
    
    async def get_approvals_by_project(self, project_id: UUID) -> List[Dict[str, Any]]:
        """
        Get all approvals for a project
        
        Args:
            project_id: Project UUID
            
        Returns:
            List[Dict]: List of approvals
        """
        try:
            response = self.client.table('approvals').select('*').eq('project_id', str(project_id)).order('created_at', desc=True).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting approvals: {e}")
            return []
    
    async def get_approval_by_id(self, approval_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get approval by ID
        
        Args:
            approval_id: Approval UUID
            
        Returns:
            Optional[Dict]: Approval data or None
        """
        try:
            response = self.client.table('approvals').select('*').eq('id', str(approval_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error getting approval: {e}")
            return None
    
    async def update_approval(self, approval_id: UUID, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update approval
        
        Args:
            approval_id: Approval UUID
            update_data: Data to update
            
        Returns:
            Optional[Dict]: Updated approval data or None
        """
        try:
            response = self.client.table('approvals').update(update_data).eq('id', str(approval_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error updating approval: {e}")
            return None
    
    # ============================================================================
    # INVOICE OPERATIONS
    # ============================================================================
    
    async def create_invoice(self, invoice_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create new invoice
        
        Args:
            invoice_data: Invoice data
            
        Returns:
            Optional[Dict]: Created invoice data or None
        """
        try:
            response = self.client.table('invoices').insert(invoice_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error creating invoice: {e}")
            return None
    
    async def get_invoices_by_agency(self, agency_id: UUID, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get all invoices for an agency
        
        Args:
            agency_id: Agency UUID
            filters: Optional filters
            
        Returns:
            List[Dict]: List of invoices
        """
        try:
            query = self.client.table('invoices').select('*').eq('agency_id', str(agency_id))
            
            if filters:
                if 'status' in filters:
                    query = query.eq('status', filters['status'])
                if 'client_id' in filters:
                    query = query.eq('client_id', str(filters['client_id']))
            
            response = query.order('created_at', desc=True).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting invoices: {e}")
            return []
    
    async def get_invoice_by_id(self, invoice_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get invoice by ID
        
        Args:
            invoice_id: Invoice UUID
            
        Returns:
            Optional[Dict]: Invoice data or None
        """
        try:
            response = self.client.table('invoices').select('*').eq('id', str(invoice_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error getting invoice: {e}")
            return None
    
    async def update_invoice(self, invoice_id: UUID, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update invoice
        
        Args:
            invoice_id: Invoice UUID
            update_data: Data to update
            
        Returns:
            Optional[Dict]: Updated invoice data or None
        """
        try:
            response = self.client.table('invoices').update(update_data).eq('id', str(invoice_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error updating invoice: {e}")
            return None
    
    async def generate_invoice_number(self, agency_id: UUID) -> str:
        """
        Generate next invoice number for agency
        
        Args:
            agency_id: Agency UUID
            
        Returns:
            str: Invoice number in format INV-{YYYY}-{seq_padded_3}
        """
        try:
            # Get agency current sequence
            agency_response = self.client.table('agencies').select('invoice_seq').eq('id', str(agency_id)).execute()
            if not agency_response.data:
                return f"INV-{datetime.now().year}-001"
            
            agency = agency_response.data[0]
            current_seq = agency.get('invoice_seq', 0)
            next_seq = current_seq + 1
            
            # Update agency sequence
            self.client.table('agencies').update({'invoice_seq': next_seq}).eq('id', str(agency_id)).execute()
            
            # Format invoice number
            year = datetime.now().year
            return f"INV-{year}-{next_seq:03d}"
        except Exception as e:
            print(f"Error generating invoice number: {e}")
            return f"INV-{datetime.now().year}-001"


# Create singleton instance
supabase_service = SupabaseService()
