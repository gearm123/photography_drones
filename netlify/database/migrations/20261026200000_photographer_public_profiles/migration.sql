CREATE TABLE photographer_profiles (
  photographer_id bigint PRIMARY KEY REFERENCES photographer_leads (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  location text NOT NULL,
  working_areas text NOT NULL,
  specialties text[] NOT NULL,
  hourly_rate_cents integer,
  currency text,
  portfolio_urls text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT photographer_profiles_name_len CHECK (char_length(display_name) BETWEEN 2 AND 80),
  CONSTRAINT photographer_profiles_location_len CHECK (char_length(location) BETWEEN 2 AND 120),
  CONSTRAINT photographer_profiles_working_areas_len CHECK (char_length(working_areas) BETWEEN 2 AND 300),
  CONSTRAINT photographer_profiles_specialties_check CHECK (
    cardinality(specialties) BETWEEN 1 AND 4
    AND specialties <@ ARRAY['mobile', 'professional', 'drone', 'hotels']::text[]
  ),
  CONSTRAINT photographer_profiles_hourly_rate_check CHECK (
    hourly_rate_cents IS NULL OR hourly_rate_cents BETWEEN 100 AND 1000000
  ),
  CONSTRAINT photographer_profiles_currency_check CHECK (
    currency IS NULL OR currency IN ('USD', 'EUR', 'GBP')
  ),
  CONSTRAINT photographer_profiles_portfolio_urls_check CHECK (cardinality(portfolio_urls) <= 3)
);

CREATE INDEX photographer_profiles_active_idx
  ON photographer_profiles (published_at DESC, photographer_id DESC)
  WHERE active;

INSERT INTO photographer_profiles (
  photographer_id,
  display_name,
  location,
  working_areas,
  specialties,
  hourly_rate_cents,
  currency,
  portfolio_urls,
  active,
  published_at
)
SELECT
  id,
  name,
  location,
  CASE
    WHEN working_areas IS NOT NULL AND char_length(working_areas) BETWEEN 2 AND 300 THEN working_areas
    ELSE location
  END,
  CASE
    WHEN specialties IS NOT NULL
      AND cardinality(specialties) BETWEEN 1 AND 4
      AND specialties <@ ARRAY['mobile', 'professional', 'drone', 'hotels']::text[]
      THEN specialties
    ELSE ARRAY[specialization]::text[]
  END,
  hourly_rate_cents,
  currency,
  CASE
    WHEN portfolio_urls IS NOT NULL THEN portfolio_urls[1:3]
    WHEN portfolio_url IS NOT NULL THEN ARRAY[portfolio_url]
    ELSE ARRAY[]::text[]
  END,
  status = 'approved',
  CASE WHEN status = 'approved' THEN created_at ELSE NULL END
FROM photographer_leads
WHERE status IN ('approved', 'suspended', 'deactivated')
  AND char_length(name) BETWEEN 2 AND 80
  AND char_length(location) BETWEEN 2 AND 120
  AND (
    (
      specialties IS NOT NULL
      AND cardinality(specialties) BETWEEN 1 AND 4
      AND specialties <@ ARRAY['mobile', 'professional', 'drone', 'hotels']::text[]
    )
    OR specialization IN ('mobile', 'professional', 'drone', 'hotels')
  );
