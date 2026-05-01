"""
Supabase Service Wrapper for Portley Backend
Handles all Supabase database operations
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from uuid import UUID

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


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


# Create singleton instance
supabase_service = SupabaseService()
