ALTER TABLE photographer_leads DROP CONSTRAINT IF EXISTS photographer_leads_status_check;

ALTER TABLE photographer_leads
  ADD CONSTRAINT photographer_leads_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'suspended', 'deactivated')
  );

CREATE INDEX photographer_leads_status_idx ON photographer_leads (status, created_at DESC);
