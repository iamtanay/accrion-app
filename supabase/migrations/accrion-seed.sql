-- ============================================================
-- ACCRION ADVISORY CRM — SEED DATA
-- Run this after accrion-schema.sql to populate the database
-- with one advisor (Tanay) and one client (Arjun Mehta).
--
-- Login credentials:
--   Advisor → tanay@accrion.co      / password: advisor123
--   Client  → arjun.mehta@email.com / password: client123
-- ============================================================


-- ============================================================
-- USERS
-- ============================================================

INSERT INTO users (id, email, name, role, password_hash, created_at, updated_at)
VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'tanay@accrion.co',
    'Tanay',
    'ADVISOR',
    '$2a$10$kYVXIh.kRk7RfIKX0MBUSOkRXrPUGJBiEjx8c3vBpKEzYE24jV/Ra',
    '2026-01-01 00:00:00+00',
    '2026-01-01 00:00:00+00'
  ),
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'arjun.mehta@email.com',
    'Arjun Mehta',
    'CLIENT',
    '$2a$10$HjqLs38JwoPaLBk0vmZCz.hsaOLRcDWhV3EW9J4NWA1LgvUvbg6sS',
    '2026-01-10 00:00:00+00',
    '2026-01-10 00:00:00+00'
  );


-- ============================================================
-- CLIENTS
-- ============================================================

INSERT INTO clients (
  id, user_id, advisor_id,
  phone, date_of_birth, occupation, city,
  marital_status, dependents, family_notes,
  income_range, net_worth_band, primary_liability,
  stated_risk_score, revealed_risk_score, discomfort_budget, panic_threshold,
  decision_temperament, behavioral_summary,
  onboarded_at, last_reviewed_at, status, created_at, updated_at
)
VALUES (
  'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',  -- user_id (Arjun)
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',  -- advisor_id (Tanay)
  '+91 98200 11234',
  '1984-03-22',
  'Senior Engineering Manager',
  'Bangalore',
  'Married',
  2,
  'Spouse is a doctor with independent income.',
  '40L-60L',
  '1Cr-3Cr',
  'Home loan 45L outstanding',
  7,
  4,
  25,
  15,
  'REACTIVE',
  'Confident professional with significant anxiety during market corrections.',
  '2026-01-10 00:00:00+00',
  '2026-01-28 00:00:00+00',
  'ACTIVE',
  '2026-02-22 15:16:59+00',
  '2026-02-22 15:16:59+00'
);


-- ============================================================
-- GOALS
-- ============================================================

INSERT INTO goals (id, client_id, title, description, target_amount, target_date, priority, category, status, progress_notes, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    'Early Retirement Corpus',
    'Build a retirement corpus to retire comfortably by 55.',
    50000000,
    '2039-03-01',
    'HIGH',
    'RETIREMENT',
    'ON_TRACK',
    'SIPs running. On track as of last review.',
    '2026-01-10 00:00:00+00',
    '2026-01-28 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    'Children''s Education Fund',
    'Fund higher education for both kids, likely abroad.',
    8000000,
    '2034-06-01',
    'HIGH',
    'EDUCATION',
    'NEEDS_ATTENTION',
    'Corpus growing but below target pace due to market underperformance.',
    '2026-01-10 00:00:00+00',
    '2026-01-28 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    'Emergency Fund',
    'Maintain 6 months of expenses as liquid emergency reserve.',
    600000,
    '2026-06-01',
    'MEDIUM',
    'EMERGENCY_FUND',
    'ON_TRACK',
    'FD ladder set up. Fully funded.',
    '2026-01-10 00:00:00+00',
    '2026-01-28 00:00:00+00'
  );


-- ============================================================
-- BEHAVIORAL FLAGS
-- ============================================================

INSERT INTO behavioral_flags (id, client_id, date, market_context, client_behavior, advisor_response, resolved, severity, is_internal, created_at)
VALUES
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-01-20 00:00:00+00',
    'Nifty fell 4.2% in a single week amid FII outflows.',
    'Called twice in one day asking to move everything to FD.',
    'Walked through the portfolio allocation and historical recovery data. Client calmed down.',
    true,
    'HIGH',
    true,
    '2026-01-20 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-02-10 00:00:00+00',
    'Budget announcement created short-term volatility in mid-caps.',
    'Wanted to pause SIPs for 3 months "until things settle".',
    'Explained rupee cost averaging benefit. Client agreed to continue SIPs.',
    true,
    'MEDIUM',
    false,
    '2026-02-10 00:00:00+00'
  );


-- ============================================================
-- DECISION LOG
-- ============================================================

INSERT INTO decision_log (id, client_id, date, decision, context, emotional_state, reasoning, advisor_note, outcome, outcome_date, is_internal, created_at)
VALUES
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-01-15 00:00:00+00',
    'Agreed to increase SIP by ₹20,000/month',
    'Annual appraisal resulted in significant salary hike.',
    'Positive and motivated',
    'Wanted to accelerate retirement corpus after raise.',
    'Good decision aligned with long-term goals. Encouraged.',
    'SIP increase executed. Running smoothly.',
    '2026-01-16 00:00:00+00',
    false,
    '2026-01-15 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-01-21 00:00:00+00',
    'Decided against redeeming equity funds during correction',
    'Market down 4.2%. Client initially wanted to exit.',
    'Anxious, panic-driven',
    'Feared further losses. Wanted capital protection.',
    'Reactive behaviour consistent with profile. Logged for pattern tracking.',
    'Held position. Portfolio recovered 3.1% in following 2 weeks.',
    '2026-02-04 00:00:00+00',
    true,
    '2026-01-21 00:00:00+00'
  );


-- ============================================================
-- REVIEW CYCLES
-- Only one completed review. No future scheduled row —
-- clients book their own calls through the portal.
-- ============================================================

INSERT INTO review_cycles (id, client_id, scheduled_date, completed_date, status, advisor_notes, drift_assessment, created_at)
VALUES (
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
  '2026-01-28 10:00:00+00',
  '2026-01-28 11:15:00+00',
  'COMPLETED',
  'Client is performing well overall. Behavioral reactivity is the primary concern. Education goal needs a top-up discussion next quarter.',
  'SLIGHT_DRIFT',
  '2026-01-10 00:00:00+00'
);


-- ============================================================
-- ACTION ITEMS (from the completed review)
-- ============================================================

INSERT INTO action_items (id, review_id, description, owner, due_date, completed, completed_at, created_at)
VALUES
  (
    gen_random_uuid(),
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Review education fund allocation and present top-up plan.',
    'ADVISOR',
    '2026-02-28 00:00:00+00',
    true,
    '2026-02-20 00:00:00+00',
    '2026-01-28 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Share reading material on behavioural biases during market volatility.',
    'ADVISOR',
    '2026-02-10 00:00:00+00',
    true,
    '2026-02-08 00:00:00+00',
    '2026-01-28 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Set up auto-debit for increased SIP amount.',
    'CLIENT',
    '2026-02-05 00:00:00+00',
    true,
    '2026-02-03 00:00:00+00',
    '2026-01-28 00:00:00+00'
  );


-- ============================================================
-- COMMUNICATIONS
-- ============================================================

INSERT INTO communications (id, client_id, date, type, summary, is_internal, created_at)
VALUES
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-01-20 14:30:00+00',
    'CALL',
    'Client called during market correction. Panicked about losses. Advisor walked through portfolio resilience and calmed him down.',
    true,
    '2026-01-20 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-01-28 11:15:00+00',
    'REVIEW',
    'Quarterly review completed. Discussed behavioral patterns, education fund gap, and retirement SIP progress.',
    false,
    '2026-01-28 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-02-10 09:00:00+00',
    'EMAIL',
    'Sent article on rupee cost averaging and SIP behaviour during volatile markets.',
    false,
    '2026-02-10 00:00:00+00'
  );


-- ============================================================
-- BEHAVIORAL SNAPSHOTS
-- ============================================================

INSERT INTO behavioral_snapshots (id, client_id, date, stated_risk_score, revealed_risk_score, discomfort_budget, panic_threshold, decision_temperament, advisor_observation, created_at)
VALUES
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-01-10 00:00:00+00',
    7, 5, 25, 18,
    'REACTIVE',
    'Onboarding snapshot. Stated risk appetite is higher than revealed behaviour suggests.',
    '2026-01-10 00:00:00+00'
  ),
  (
    gen_random_uuid(),
    'a3ece44a-9bf5-4703-9ad3-cd25b99c7845',
    '2026-01-28 00:00:00+00',
    7, 4, 25, 15,
    'REACTIVE',
    'Post-correction review. Revealed risk score dropped further after panic call in January. Panic threshold tightened.',
    '2026-01-28 00:00:00+00'
  );


-- ============================================================
-- ADVISOR AVAILABILITY (Tanay)
-- Mon–Thu: 10am–6pm | Fri: 10am–2pm | Sat–Sun: inactive
-- ============================================================

INSERT INTO advisor_availability (advisor_id, day_of_week, start_time, end_time, is_active)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 0, '10:00', '18:00', false), -- Sunday
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, '10:00', '18:00', true),  -- Monday
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, '10:00', '18:00', true),  -- Tuesday
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, '10:00', '18:00', true),  -- Wednesday
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, '10:00', '18:00', true),  -- Thursday
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5, '10:00', '14:00', true),  -- Friday
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 6, '10:00', '18:00', false)  -- Saturday
ON CONFLICT (advisor_id, day_of_week) DO UPDATE
  SET start_time = EXCLUDED.start_time,
      end_time   = EXCLUDED.end_time,
      is_active  = EXCLUDED.is_active,
      updated_at = now();
