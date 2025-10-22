-- Add finalization tracking to companies table

-- Add finalization status column
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS finalization_status VARCHAR(50) DEFAULT 'Pending' 
CHECK (finalization_status IN ('Pending', 'Finalized'));

-- Add finalized by tracking
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS finalized_by_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add finalized timestamp
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- Create index for finalization queries
CREATE INDEX IF NOT EXISTS idx_companies_finalization ON companies(finalization_status);

-- Add comment
COMMENT ON COLUMN companies.finalization_status IS 'Tracks whether company data has been finalized by a Manager';
COMMENT ON COLUMN companies.finalized_by_id IS 'User ID of the Manager who finalized the data';
COMMENT ON COLUMN companies.finalized_at IS 'Timestamp when the data was finalized';
