-- Migration: Add Profile Change Requests Table
-- Description: Allow users to request profile changes that require admin approval

CREATE TABLE IF NOT EXISTS profile_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_changes JSONB NOT NULL, -- Stores the requested field changes
  current_values JSONB NOT NULL, -- Stores current values for reference
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_user_id ON profile_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_status ON profile_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_requested_at ON profile_change_requests(requested_at DESC);

-- Add comments for documentation
COMMENT ON TABLE profile_change_requests IS 'Stores user profile change requests that require admin approval';
COMMENT ON COLUMN profile_change_requests.requested_changes IS 'JSON object containing the requested field changes (e.g., {"full_name": "New Name", "email": "new@email.com"})';
COMMENT ON COLUMN profile_change_requests.current_values IS 'JSON object containing current values at the time of request for reference';
COMMENT ON COLUMN profile_change_requests.status IS 'Request status: pending (awaiting review), approved (changes applied), rejected (changes denied)';
