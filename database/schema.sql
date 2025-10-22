-- CRM Database Schema for PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Head', 'SubHead', 'Manager', 'Converter', 'DataCollector')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  "conversionStatus" VARCHAR(50) NOT NULL DEFAULT 'Waiting' CHECK ("conversionStatus" IN ('Waiting', 'NoReach', 'Confirmed', 'Finalized')),
  "customFields" JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  "companyId" UUID REFERENCES companies(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'NotYet' CHECK (status IN ('NotYet', 'InProgress', 'Completed')),
  deadline TIMESTAMP WITH TIME ZONE,
  "companyId" UUID REFERENCES companies(id) ON DELETE CASCADE,
  "assignedToId" UUID REFERENCES users(id) ON DELETE SET NULL,
  "assignedById" UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  "isResolved" BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  "companyId" UUID REFERENCES companies(id) ON DELETE CASCADE,
  "raisedById" UUID REFERENCES users(id) ON DELETE SET NULL,
  "assignedToId" UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom Field Definitions table
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Text', 'Number', 'Date')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts("companyId");
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks("companyId");
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks("assignedToId");
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets("companyId");
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets("assignedToId");
CREATE INDEX IF NOT EXISTS idx_tickets_raised_by ON tickets("raisedById");
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_field_definitions_updated_at BEFORE UPDATE ON custom_field_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (password should be hashed in production)
INSERT INTO users (id, full_name, email, role) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Insert some sample data
INSERT INTO companies (name, website, phone, email, address, "conversionStatus") 
VALUES 
  ('Acme Corporation', 'https://acme.com', '+1-555-0100', 'contact@acme.com', '123 Main St, New York, NY 10001', 'Confirmed'),
  ('TechStart Inc', 'https://techstart.io', '+1-555-0200', 'info@techstart.io', '456 Tech Ave, San Francisco, CA 94102', 'Waiting'),
  ('Global Solutions', 'https://globalsolutions.com', '+1-555-0300', 'hello@globalsolutions.com', '789 Business Blvd, Chicago, IL 60601', 'Finalized')
ON CONFLICT DO NOTHING;
