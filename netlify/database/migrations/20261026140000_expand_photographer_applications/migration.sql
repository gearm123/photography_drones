ALTER TABLE photographer_leads
  ADD COLUMN phone text,
  ADD COLUMN equipment text,
  ADD COLUMN experience text,
  ADD COLUMN availability text,
  ADD COLUMN working_areas text,
  ADD COLUMN hourly_rate_cents integer,
  ADD COLUMN currency text,
  ADD COLUMN specialties text[],
  ADD COLUMN portfolio_urls text[],
  ADD COLUMN status text NOT NULL DEFAULT 'pending';

ALTER TABLE photographer_leads
  ADD CONSTRAINT photographer_leads_phone_len CHECK (
    phone IS NULL OR char_length(phone) BETWEEN 9 AND 16
  ),
  ADD CONSTRAINT photographer_leads_equipment_len CHECK (
    equipment IS NULL OR char_length(equipment) BETWEEN 2 AND 400
  ),
  ADD CONSTRAINT photographer_leads_experience_len CHECK (
    experience IS NULL OR char_length(experience) BETWEEN 2 AND 300
  ),
  ADD CONSTRAINT photographer_leads_availability_len CHECK (
    availability IS NULL OR char_length(availability) BETWEEN 2 AND 300
  ),
  ADD CONSTRAINT photographer_leads_working_areas_len CHECK (
    working_areas IS NULL OR char_length(working_areas) BETWEEN 2 AND 300
  ),
  ADD CONSTRAINT photographer_leads_hourly_rate_check CHECK (
    hourly_rate_cents IS NULL OR hourly_rate_cents BETWEEN 100 AND 1000000
  ),
  ADD CONSTRAINT photographer_leads_currency_check CHECK (
    currency IS NULL OR currency IN ('USD', 'EUR', 'GBP')
  ),
  ADD CONSTRAINT photographer_leads_specialties_check CHECK (
    specialties IS NULL
    OR (
      cardinality(specialties) BETWEEN 1 AND 4
      AND specialties <@ ARRAY['mobile', 'professional', 'drone', 'hotels']::text[]
    )
  ),
  ADD CONSTRAINT photographer_leads_portfolio_urls_check CHECK (
    portfolio_urls IS NULL OR cardinality(portfolio_urls) BETWEEN 1 AND 3
  ),
  ADD CONSTRAINT photographer_leads_status_check CHECK (
    status IN ('pending', 'approved', 'rejected')
  );

CREATE UNIQUE INDEX photographer_leads_email_lower_idx ON photographer_leads (lower(email));

CREATE UNIQUE INDEX photographer_leads_phone_idx ON photographer_leads (phone) WHERE phone IS NOT NULL;
