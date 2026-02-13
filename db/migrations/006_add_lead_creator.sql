BEGIN;

-- Add created_by_company_user_id to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS created_by_company_user_id UUID;

-- Add foreign key constraint
ALTER TABLE leads
  ADD CONSTRAINT fk_leads_created_by
  FOREIGN KEY (company_id, created_by_company_user_id)
  REFERENCES company_users(company_id, id)
  ON DELETE SET NULL;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_leads_company_created_by
  ON leads (company_id, created_by_company_user_id);

COMMIT;

