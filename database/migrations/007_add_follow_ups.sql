-- Create follow_ups table for company follow-up tracking
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contacted_date TIMESTAMP WITH TIME ZONE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  follow_up_notes TEXT,
  contacted_by_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for follow_ups
CREATE INDEX IF NOT EXISTS idx_follow_ups_company ON follow_ups(company_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_contacted_by ON follow_ups(contacted_by_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_follow_up_date ON follow_ups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_at ON follow_ups(created_at);

-- Create updated_at trigger for follow_ups
CREATE TRIGGER update_follow_ups_updated_at 
  BEFORE UPDATE ON follow_ups 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE follow_ups IS 'Tracks follow-up activities for companies';
