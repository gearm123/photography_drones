CREATE TABLE traveler_leads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  destination text NOT NULL,
  service_tier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT traveler_leads_name_len CHECK (char_length(name) BETWEEN 2 AND 80),
  CONSTRAINT traveler_leads_email_len CHECK (char_length(email) BETWEEN 3 AND 120),
  CONSTRAINT traveler_leads_destination_len CHECK (char_length(destination) BETWEEN 2 AND 120),
  CONSTRAINT traveler_leads_service_tier_check CHECK (
    service_tier IN ('mobile', 'professional', 'drone', 'hotels')
  )
);

CREATE INDEX traveler_leads_created_at_idx ON traveler_leads (created_at DESC);

CREATE TABLE photographer_leads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  location text NOT NULL,
  specialization text NOT NULL,
  portfolio_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT photographer_leads_name_len CHECK (char_length(name) BETWEEN 2 AND 80),
  CONSTRAINT photographer_leads_email_len CHECK (char_length(email) BETWEEN 3 AND 120),
  CONSTRAINT photographer_leads_location_len CHECK (char_length(location) BETWEEN 2 AND 120),
  CONSTRAINT photographer_leads_specialization_check CHECK (
    specialization IN ('mobile', 'professional', 'drone', 'hotels', 'multiple')
  ),
  CONSTRAINT photographer_leads_portfolio_len CHECK (
    portfolio_url IS NULL OR char_length(portfolio_url) <= 300
  )
);

CREATE INDEX photographer_leads_created_at_idx ON photographer_leads (created_at DESC);
