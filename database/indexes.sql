-- Production indexes for optimal query performance

-- Companies table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_status_created 
ON companies(conversion_status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_finalization_created 
ON companies(finalization_status, finalized_at DESC) 
WHERE finalization_status = 'Finalized';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_converter_public 
ON companies(assigned_converter_id, is_public) 
WHERE assigned_converter_id IS NOT NULL OR is_public = true;

-- Tasks table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_status 
ON tasks(assigned_to_id, status) 
WHERE status != 'Completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_company_created 
ON tasks(company_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_deadline 
ON tasks(deadline) 
WHERE deadline IS NOT NULL AND status != 'Completed';

-- Tickets table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_assigned_resolved 
ON tickets(assigned_to_id, is_resolved) 
WHERE is_resolved = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_company_created 
ON tickets(company_id, created_at DESC);

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created 
ON users(role, created_at DESC);

-- Notifications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, is_read, created_at DESC);

-- Comments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_company_created 
ON comments(company_id, created_at DESC);

-- Audit logs table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_action 
ON audit_logs(entity_type, entity_id, action, created_at DESC);