-- Migration: 003_enhance_role_features.sql
-- Description: Add missing features for complete role-based workflow

-- Step 1: Add region field to users table for Sub-Head role scoping
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Step 2: Add priority field to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High'));

-- Step 3: Add priority field to tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High'));

-- Step 4: Add status field to tickets for workflow tracking
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'InProgress', 'Resolved'));

-- Step 5: Insert sample users for each role BEFORE adding foreign keys
INSERT INTO users (id, full_name, email, password_hash, role, region) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Head User', 'head@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'Head', NULL),
  ('00000000-0000-0000-0000-000000000003', 'SubHead North', 'subhead.north@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'SubHead', 'North'),
  ('00000000-0000-0000-0000-000000000004', 'Manager User', 'manager@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'Manager', NULL),
  ('00000000-0000-0000-0000-000000000005', 'Data Collector', 'datacollector@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'DataCollector', NULL),
  ('00000000-0000-0000-0000-000000000006', 'Converter User', 'converter@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'Converter', NULL)
ON CONFLICT (email) DO NOTHING;

-- Step 6: Update existing companies with 'Finalized' conversionStatus to 'Confirmed'
-- (Finalized is now a separate finalization_status field, not a conversion status)
UPDATE companies 
SET "conversionStatus" = 'Confirmed'
WHERE "conversionStatus" = 'Finalized';

-- Step 7: Update conversionStatus constraint to include all workflow states
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_conversionStatus_check;

ALTER TABLE companies 
ADD CONSTRAINT companies_conversionStatus_check 
CHECK ("conversionStatus" IN ('Waiting', 'NoReach', 'Contacted', 'Negotiating', 'Confirmed'));

-- Step 8: NOW add assignment columns (users exist now)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS assigned_data_collector_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS assigned_converter_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create comments table for Head/SubHead feedback on finalized data
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  content TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE
);

-- Create audit_logs table for tracking all changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'FINALIZE', 'LOGIN', 'LOGOUT')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45)
);

-- Create activity_timeline table for company history
CREATE TABLE IF NOT EXISTS activity_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB
);

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_companies_assigned_data_collector ON companies(assigned_data_collector_id);
CREATE INDEX IF NOT EXISTS idx_companies_assigned_converter ON companies(assigned_converter_id);
CREATE INDEX IF NOT EXISTS idx_comments_company ON comments(company_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_company ON activity_timeline(company_id);
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);

-- Add trigger for comments updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at 
BEFORE UPDATE ON comments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample users for each role
INSERT INTO users (id, full_name, email, password_hash, role, region) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Head User', 'head@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'Head', NULL),
  ('00000000-0000-0000-0000-000000000003', 'SubHead North', 'subhead.north@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'SubHead', 'North'),
  ('00000000-0000-0000-0000-000000000004', 'Manager User', 'manager@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'Manager', NULL),
  ('00000000-0000-0000-0000-000000000005', 'Data Collector', 'datacollector@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'DataCollector', NULL),
  ('00000000-0000-0000-0000-000000000006', 'Converter User', 'converter@example.com', '$2b$10$rKvVLYqQYJ7YZXvXqYzQJ.FZ5y5vZ5YqZzQJ7YZXvXqYzQJ7YZXvX', 'Converter', NULL)
ON CONFLICT (email) DO NOTHING;
