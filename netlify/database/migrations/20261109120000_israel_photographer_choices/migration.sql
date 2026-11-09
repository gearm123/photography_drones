ALTER TABLE photographer_leads DROP CONSTRAINT IF EXISTS photographer_leads_working_areas_len;
ALTER TABLE photographer_leads
  ADD CONSTRAINT photographer_leads_working_areas_len CHECK (
    working_areas IS NULL OR char_length(working_areas) BETWEEN 2 AND 800
  );

ALTER TABLE photographer_leads DROP CONSTRAINT IF EXISTS photographer_leads_currency_check;
ALTER TABLE photographer_leads
  ADD CONSTRAINT photographer_leads_currency_check CHECK (
    currency IS NULL OR currency IN ('USD', 'EUR', 'GBP', 'ILS')
  );

ALTER TABLE photographer_profiles DROP CONSTRAINT IF EXISTS photographer_profiles_working_areas_len;
ALTER TABLE photographer_profiles
  ADD CONSTRAINT photographer_profiles_working_areas_len CHECK (
    char_length(working_areas) BETWEEN 2 AND 800
  );

ALTER TABLE photographer_profiles DROP CONSTRAINT IF EXISTS photographer_profiles_currency_check;
ALTER TABLE photographer_profiles
  ADD CONSTRAINT photographer_profiles_currency_check CHECK (
    currency IS NULL OR currency IN ('USD', 'EUR', 'GBP', 'ILS')
  );
