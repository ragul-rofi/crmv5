-- Migration: Add approval workflow columns for multi-stage finalization
-- Up
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(30) DEFAULT 'Pending' CHECK (approval_stage IN ('Pending','ConverterApproved','ManagerApproved','HeadApproved','Finalized')),
  ADD COLUMN IF NOT EXISTS converter_approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converter_approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS manager_approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS head_approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS head_approved_at TIMESTAMP WITH TIME ZONE;

-- Indexes to speed up queues
CREATE INDEX IF NOT EXISTS idx_companies_approval_stage ON companies(approval_stage);
CREATE INDEX IF NOT EXISTS idx_companies_converter_approved_at ON companies(converter_approved_at);
CREATE INDEX IF NOT EXISTS idx_companies_manager_approved_at ON companies(manager_approved_at);
CREATE INDEX IF NOT EXISTS idx_companies_head_approved_at ON companies(head_approved_at);

-- Down
-- To rollback, drop the columns (beware of data loss)
-- ALTER TABLE companies
--   DROP COLUMN IF EXISTS head_approved_at,
--   DROP COLUMN IF EXISTS head_approved_by_id,
--   DROP COLUMN IF EXISTS manager_approved_at,
--   DROP COLUMN IF EXISTS manager_approved_by_id,
--   DROP COLUMN IF EXISTS converter_approved_at,
--   DROP COLUMN IF EXISTS converter_approved_by_id,
--   DROP COLUMN IF EXISTS approval_stage;
