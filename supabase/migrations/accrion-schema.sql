-- ============================================================
-- ACCRION ADVISORY CRM — COMPLETE SCHEMA
-- Run this once on a fresh Supabase project to set up
-- the entire database structure, policies, and indexes.
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role         AS ENUM ('ADVISOR', 'CLIENT');
CREATE TYPE client_status     AS ENUM ('ACTIVE', 'INACTIVE', 'ONBOARDING', 'PAUSED');
CREATE TYPE temperament       AS ENUM ('DELIBERATE', 'REACTIVE', 'AVOIDANT', 'OVERCONFIDENT', 'ANCHORED', 'BALANCED');
CREATE TYPE priority          AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE goal_category     AS ENUM ('RETIREMENT', 'EDUCATION', 'PROPERTY', 'EMERGENCY_FUND', 'WEALTH_CREATION', 'BUSINESS', 'OTHER');
CREATE TYPE goal_status       AS ENUM ('ON_TRACK', 'NEEDS_ATTENTION', 'AT_RISK', 'ACHIEVED', 'PAUSED');
CREATE TYPE severity          AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE review_status     AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'RESCHEDULED');
CREATE TYPE drift_level       AS ENUM ('ON_TRACK', 'SLIGHT_DRIFT', 'SIGNIFICANT_DRIFT', 'CRITICAL');
CREATE TYPE comm_type         AS ENUM ('MEETING', 'CALL', 'EMAIL', 'MESSAGE', 'REVIEW');
CREATE TYPE doc_type          AS ENUM ('KYC', 'AGREEMENT', 'STATEMENT', 'REPORT', 'OTHER');
CREATE TYPE action_owner      AS ENUM ('CLIENT', 'ADVISOR');


-- ============================================================
-- TABLES
-- ============================================================

-- Users (advisors and clients)
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  name          text NOT NULL,
  role          user_role NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES users(id) ON DELETE CASCADE,
  advisor_id           uuid REFERENCES users(id) ON DELETE CASCADE,

  -- Personal
  phone                text,
  date_of_birth        date,
  occupation           text,
  city                 text,

  -- Family
  marital_status       text,
  dependents           integer DEFAULT 0,
  family_notes         text,

  -- Financial snapshot
  income_range         text,
  net_worth_band       text,
  primary_liability    text,

  -- Behavioral core
  stated_risk_score    integer,
  revealed_risk_score  integer,
  discomfort_budget    integer,
  panic_threshold      integer,
  decision_temperament temperament,
  behavioral_summary   text,

  -- Meta
  onboarded_at         timestamptz DEFAULT now(),
  last_reviewed_at     timestamptz,
  status               client_status DEFAULT 'ONBOARDING',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid REFERENCES clients(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  target_amount  numeric,
  target_date    date,
  priority       priority DEFAULT 'MEDIUM',
  category       goal_category NOT NULL,
  status         goal_status DEFAULT 'ON_TRACK',
  progress_notes text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Behavioral flags
CREATE TABLE IF NOT EXISTS behavioral_flags (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES clients(id) ON DELETE CASCADE,
  date             timestamptz NOT NULL,
  market_context   text NOT NULL,
  client_behavior  text NOT NULL,
  advisor_response text,
  resolved         boolean DEFAULT false,
  severity         severity DEFAULT 'MEDIUM',
  is_internal      boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- Decision log
CREATE TABLE IF NOT EXISTS decision_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid REFERENCES clients(id) ON DELETE CASCADE,
  date           timestamptz NOT NULL,
  decision       text NOT NULL,
  context        text NOT NULL,
  emotional_state text,
  reasoning      text,
  advisor_note   text,
  outcome        text,
  outcome_date   timestamptz,
  is_internal    boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

-- Review cycles
CREATE TABLE IF NOT EXISTS review_cycles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_date      timestamptz NOT NULL,
  completed_date      timestamptz,
  status              review_status DEFAULT 'SCHEDULED',
  pre_review_answers  jsonb,
  advisor_notes       text,
  drift_assessment    drift_level,
  created_at          timestamptz DEFAULT now()
);

-- Action items
CREATE TABLE IF NOT EXISTS action_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    uuid REFERENCES review_cycles(id) ON DELETE CASCADE,
  description  text NOT NULL,
  owner        action_owner NOT NULL,
  due_date     timestamptz,
  completed    boolean DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- Communications
CREATE TABLE IF NOT EXISTS communications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  date        timestamptz NOT NULL,
  type        comm_type NOT NULL,
  summary     text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        doc_type NOT NULL,
  url         text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Behavioral snapshots
CREATE TABLE IF NOT EXISTS behavioral_snapshots (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            uuid REFERENCES clients(id) ON DELETE CASCADE,
  date                 timestamptz NOT NULL,
  stated_risk_score    integer,
  revealed_risk_score  integer,
  discomfort_budget    integer,
  panic_threshold      integer,
  decision_temperament temperament,
  advisor_observation  text,
  created_at           timestamptz DEFAULT now()
);

-- Advisor availability (weekly recurring schedule)
-- day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
CREATE TABLE IF NOT EXISTS advisor_availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (advisor_id, day_of_week)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clients_advisor            ON clients(advisor_id);
CREATE INDEX IF NOT EXISTS idx_clients_user               ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status             ON clients(status);
CREATE INDEX IF NOT EXISTS idx_goals_client               ON goals(client_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_flags_client    ON behavioral_flags(client_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_flags_resolved  ON behavioral_flags(resolved);
CREATE INDEX IF NOT EXISTS idx_decision_log_client        ON decision_log(client_id);
CREATE INDEX IF NOT EXISTS idx_review_cycles_client       ON review_cycles(client_id);
CREATE INDEX IF NOT EXISTS idx_review_cycles_status       ON review_cycles(status);
CREATE INDEX IF NOT EXISTS idx_action_items_review        ON action_items(review_id);
CREATE INDEX IF NOT EXISTS idx_communications_client      ON communications(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_client           ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_client           ON behavioral_snapshots(client_id);
CREATE INDEX IF NOT EXISTS idx_availability_advisor       ON advisor_availability(advisor_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_flags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_cycles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_availability ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES
-- The app uses the anon key server-side (no Supabase Auth),
-- so all policies grant the anon role full access.
-- Access control is enforced at the application layer.
-- ============================================================

-- users
CREATE POLICY "anon: full access to users"
  ON users FOR ALL TO anon USING (true) WITH CHECK (true);

-- clients
CREATE POLICY "anon: full access to clients"
  ON clients FOR ALL TO anon USING (true) WITH CHECK (true);

-- goals
CREATE POLICY "anon: full access to goals"
  ON goals FOR ALL TO anon USING (true) WITH CHECK (true);

-- behavioral_flags
CREATE POLICY "anon: full access to behavioral_flags"
  ON behavioral_flags FOR ALL TO anon USING (true) WITH CHECK (true);

-- decision_log
CREATE POLICY "anon: full access to decision_log"
  ON decision_log FOR ALL TO anon USING (true) WITH CHECK (true);

-- review_cycles
CREATE POLICY "anon: full access to review_cycles"
  ON review_cycles FOR ALL TO anon USING (true) WITH CHECK (true);

-- action_items
CREATE POLICY "anon: full access to action_items"
  ON action_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- communications
CREATE POLICY "anon: full access to communications"
  ON communications FOR ALL TO anon USING (true) WITH CHECK (true);

-- documents
CREATE POLICY "anon: full access to documents"
  ON documents FOR ALL TO anon USING (true) WITH CHECK (true);

-- behavioral_snapshots
CREATE POLICY "anon: full access to behavioral_snapshots"
  ON behavioral_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);

-- advisor_availability
CREATE POLICY "anon: full access to advisor_availability"
  ON advisor_availability FOR ALL TO anon USING (true) WITH CHECK (true);
