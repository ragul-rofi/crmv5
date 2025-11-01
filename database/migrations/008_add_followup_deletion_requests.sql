-- Create follow-up deletion requests table
CREATE TABLE IF NOT EXISTS followup_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id UUID NOT NULL REFERENCES follow_ups(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for follow-up deletion requests
CREATE INDEX IF NOT EXISTS idx_followup_deletion_requests_followup ON followup_deletion_requests(followup_id);
CREATE INDEX IF NOT EXISTS idx_followup_deletion_requests_company ON followup_deletion_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_followup_deletion_requests_requested_by ON followup_deletion_requests(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_followup_deletion_requests_status ON followup_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_followup_deletion_requests_created_at ON followup_deletion_requests(created_at);

-- Create updated_at trigger for followup_deletion_requests
CREATE TRIGGER update_followup_deletion_requests_updated_at 
  BEFORE UPDATE ON followup_deletion_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE followup_deletion_requests IS 'Tracks deletion requests for follow-ups requiring manager approval';
