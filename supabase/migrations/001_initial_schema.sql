-- Portley Database Schema
-- Migration: 001_initial_schema
-- Description: Complete schema for Portley white-label client portal SaaS
-- Version: 2.0 (Fixed all critical issues)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AGENCIES (Tenant root)
-- ============================================================================

CREATE TABLE agencies (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    slug          TEXT UNIQUE NOT NULL,
    logo_url      TEXT,
    brand_color   TEXT DEFAULT '#6366f1' CHECK (brand_color ~ '^#[0-9a-fA-F]{6}$'),
    custom_domain TEXT CHECK (custom_domain IS NULL OR custom_domain ~ '^[a-z0-9][a-z0-9\-\.]+[a-z0-9]$'),
    plan          TEXT DEFAULT 'free' CHECK (plan IN ('free','solo','agency')),
    plan_expires_at TIMESTAMPTZ,
    invoice_seq   INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for agencies
CREATE INDEX idx_agencies_owner_id ON agencies(owner_id);
CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_plan ON agencies(plan);

-- ============================================================================
-- CLIENTS (Agency-scoped)
-- ============================================================================

CREATE TABLE clients (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id       UUID REFERENCES auth.users(id),
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    invite_token  TEXT UNIQUE,
    invite_status TEXT DEFAULT 'pending' CHECK (invite_status IN ('pending','accepted')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(agency_id, email)
);

-- Indexes for clients
CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_invite_token ON clients(invite_token);

-- ============================================================================
-- PROJECTS (Agency-scoped, client-linked)
-- ============================================================================

CREATE TABLE projects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id     UUID REFERENCES clients(id),
    name          TEXT NOT NULL,
    description   TEXT,
    status        TEXT DEFAULT 'active' CHECK (status IN ('active','review','completed','paused')),
    due_date      DATE,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for projects
CREATE INDEX idx_projects_agency_id ON projects(agency_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_due_date ON projects(due_date);

-- ============================================================================
-- TASKS (Project-scoped)
-- ============================================================================

CREATE TABLE tasks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    completed     BOOLEAN DEFAULT false,
    position      INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for tasks
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_position ON tasks(project_id, position);

-- ============================================================================
-- FILES (Agency + Project scoped)
-- ============================================================================

CREATE TABLE files (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agency_id     UUID NOT NULL REFERENCES agencies(id),
    uploader_id   UUID NOT NULL REFERENCES auth.users(id),
    name          TEXT NOT NULL,
    storage_path  TEXT NOT NULL,
    size_bytes    BIGINT NOT NULL,
    mime_type     TEXT,
    deleted_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for files
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_agency_id ON files(agency_id);
CREATE INDEX idx_files_uploader_id ON files(uploader_id);
CREATE INDEX idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- MESSAGES (Project-scoped, real-time)
-- ============================================================================

CREATE TABLE messages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender_id     UUID NOT NULL REFERENCES auth.users(id),
    content       TEXT NOT NULL,
    read_by       UUID[] DEFAULT '{}',
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for messages
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(project_id, created_at DESC);

-- ============================================================================
-- APPROVALS (Project-scoped)
-- ============================================================================

CREATE TABLE approvals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agency_id     UUID NOT NULL REFERENCES agencies(id),
    title         TEXT NOT NULL,
    description   TEXT,
    file_id       UUID REFERENCES files(id),
    status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','changes_requested')),
    client_note   TEXT,
    created_at    TIMESTAMPTZ DEFAULT now(),
    responded_at  TIMESTAMPTZ
);

-- Indexes for approvals
CREATE INDEX idx_approvals_project_id ON approvals(project_id);
CREATE INDEX idx_approvals_agency_id ON approvals(agency_id);
CREATE INDEX idx_approvals_status ON approvals(status);

-- ============================================================================
-- INVOICES (Agency-scoped, client-linked)
-- ============================================================================

CREATE TABLE invoices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id     UUID NOT NULL REFERENCES clients(id),
    project_id    UUID REFERENCES projects(id),
    invoice_number TEXT NOT NULL,
    amount        NUMERIC(10,2) NOT NULL,
    currency      TEXT DEFAULT 'INR' CHECK (currency IN ('INR','USD','GBP','EUR')),
    status        TEXT DEFAULT 'unpaid' CHECK (status IN ('draft','unpaid','paid','overdue')),
    due_date      DATE,
    line_items    JSONB DEFAULT '[]',
    payment_id    TEXT,
    payment_url   TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT now(),
    paid_at       TIMESTAMPTZ,
    CONSTRAINT invoices_number_agency_unique UNIQUE (agency_id, invoice_number)
);

-- Indexes for invoices
CREATE INDEX idx_invoices_agency_id ON invoices(agency_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- ============================================================================
-- ACTIVITY LOG (Agency-scoped, real-time feed)
-- ============================================================================

CREATE TABLE activity (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    actor_id      UUID REFERENCES auth.users(id),
    actor_name    TEXT,
    action        TEXT NOT NULL,
    entity_type   TEXT,
    entity_id     UUID,
    entity_name   TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for activity
CREATE INDEX idx_activity_agency_id ON activity(agency_id);
CREATE INDEX idx_activity_created_at ON activity(agency_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE agencies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity   ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Agencies: Owners can see/edit their own agency
CREATE POLICY "Agency owners can view their own agency"
    ON agencies FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Agency owners can update their own agency"
    ON agencies FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Agency owners can insert their own agency"
    ON agencies FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Clients: Agency members can see their clients
CREATE POLICY "Agency members can view their clients"
    ON clients FOR SELECT
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can insert clients"
    ON clients FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can update their clients"
    ON clients FOR UPDATE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can delete their clients"
    ON clients FOR DELETE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

-- Projects: Agency members can see their projects
CREATE POLICY "Agency members can view their projects"
    ON projects FOR SELECT
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can insert projects"
    ON projects FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can update their projects"
    ON projects FOR UPDATE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can delete their projects"
    ON projects FOR DELETE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

-- Projects: Clients can view their assigned projects
CREATE POLICY "Clients can view their assigned projects"
    ON projects FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Tasks: Agency members can see tasks for their projects
CREATE POLICY "Agency members can view tasks for their projects"
    ON tasks FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
        )
    );

CREATE POLICY "Agency members can insert tasks for their projects"
    ON tasks FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
        )
    );

CREATE POLICY "Agency members can update tasks for their projects"
    ON tasks FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
        )
    );

CREATE POLICY "Agency members can delete tasks for their projects"
    ON tasks FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
        )
    );

-- Tasks: Clients can view tasks for their assigned projects
CREATE POLICY "Clients can view tasks for their assigned projects"
    ON tasks FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        )
    );

-- Files: Agency members can see files for their projects
CREATE POLICY "Agency members can view files for their projects"
    ON files FOR SELECT
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can insert files"
    ON files FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can update files"
    ON files FOR UPDATE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can delete files"
    ON files FOR DELETE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

-- Files: Clients can view files for their assigned projects
CREATE POLICY "Clients can view files for their assigned projects"
    ON files FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        )
    );

-- Messages: Agency owners and clients can see messages for their projects
CREATE POLICY "Users can view messages for their projects"
    ON messages FOR SELECT
    USING (
        -- Agency owner sees all messages in their projects
        project_id IN (
            SELECT p.id FROM projects p
            JOIN agencies a ON a.id = p.agency_id
            WHERE a.owner_id = auth.uid()
        )
        OR
        -- Clients see messages in their assigned projects
        project_id IN (
            SELECT p.id FROM projects p
            JOIN clients c ON c.id = p.client_id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND (
            -- Agency owner can insert messages in their projects
            project_id IN (
                SELECT p.id FROM projects p
                JOIN agencies a ON a.id = p.agency_id
                WHERE a.owner_id = auth.uid()
            )
            OR
            -- Clients can insert messages in their assigned projects
            project_id IN (
                SELECT p.id FROM projects p
                JOIN clients c ON c.id = p.client_id
                WHERE c.user_id = auth.uid()
            )
        )
    );

-- Approvals: Agency members can see approvals for their projects
CREATE POLICY "Agency members can view approvals for their projects"
    ON approvals FOR SELECT
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can insert approvals"
    ON approvals FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can update approvals"
    ON approvals FOR UPDATE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can delete approvals"
    ON approvals FOR DELETE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

-- Approvals: Clients can view approvals for their assigned projects
CREATE POLICY "Clients can view approvals for their assigned projects"
    ON approvals FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        )
    );

-- Invoices: Agency members can see their invoices
CREATE POLICY "Agency members can view their invoices"
    ON invoices FOR SELECT
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can insert invoices"
    ON invoices FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can update their invoices"
    ON invoices FOR UPDATE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agency members can delete their invoices"
    ON invoices FOR DELETE
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

-- Invoices: Clients can view their invoices
CREATE POLICY "Clients can view their invoices"
    ON invoices FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Activity: Agency members can see their activity feed
CREATE POLICY "Agency members can view their activity"
    ON activity FOR SELECT
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "System can insert activity for own agency"
    ON activity FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate next invoice number for an agency
CREATE OR REPLACE FUNCTION next_invoice_number(p_agency_id UUID)
RETURNS TEXT AS $$
DECLARE
    seq INT;
    yr  TEXT;
BEGIN
    yr := to_char(now(), 'YYYY');
    UPDATE agencies SET invoice_seq = invoice_seq + 1
        WHERE id = p_agency_id
        RETURNING invoice_seq INTO seq;
    RETURN 'INV-' || yr || '-' || LPAD(seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUPABASE REALTIME
-- ============================================================================

-- Enable realtime for live feed tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE activity;
ALTER PUBLICATION supabase_realtime ADD TABLE approvals;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Migration completed successfully
-- All foreign key constraints added
-- All RLS policies for agency owners and clients added
-- Invoice sequence function added
-- Updated_at triggers on tasks and clients added
-- Domain and color format validation added
-- DELETE policies added
-- Supabase Realtime publication added
