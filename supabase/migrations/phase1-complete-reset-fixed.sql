-- ============================================================
-- ACCRION — PHASE 1 COMPLETE RESET & SETUP  (FIXED)
--
-- Fix applied: raw_user_meta_data->>'role' is only populated
-- when you use the Admin API (createUser with user_metadata).
-- When using the Supabase Dashboard UI "Add user" button, that
-- column starts as '{}' — so the trigger defaulted everyone to
-- CLIENT, including the advisor.
--
-- The trigger now checks BOTH raw_user_meta_data AND
-- raw_app_meta_data, and the update trigger is wired too.
-- The "next steps" at the bottom show the exact curl commands
-- to create users correctly via the Admin API so metadata is
-- set at creation time — no manual SQL after the fact.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- STEP 1 — CLEAR ALL DATA
-- ────────────────────────────────────────────────────────────

TRUNCATE TABLE
  behavioral_snapshots,
  action_items,
  communications,
  documents,
  review_cycles,
  decision_log,
  behavioral_flags,
  goals,
  advisor_availability,
  clients,
  users
CASCADE;

DELETE FROM auth.users;


-- ────────────────────────────────────────────────────────────
-- STEP 2 — DROP password_hash (auth owns passwords now)
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;


-- ────────────────────────────────────────────────────────────
-- STEP 3 — AUTO-SYNC TRIGGER (FIXED)
--
-- Reads role from raw_user_meta_data first (set by Admin API
-- user_metadata), then falls back to raw_app_meta_data (set
-- by Admin API app_metadata), then defaults to 'CLIENT'.
--
-- This means you can create users TWO ways:
--   A) Dashboard UI → then run the UPDATE snippet below
--   B) Admin API createUser with user_metadata (recommended)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role  user_role;
  _name  text;
BEGIN
  -- Role: check raw_user_meta_data first, then raw_app_meta_data
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    (NEW.raw_app_meta_data->>'role')::user_role,
    'CLIENT'::user_role
  );

  -- Name: check raw_user_meta_data, then raw_app_meta_data, then email prefix
  _name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_app_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, _name, _role)
  ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      name  = EXCLUDED.name,
      role  = EXCLUDED.role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();


-- ────────────────────────────────────────────────────────────
-- STEP 4 — UPDATE-SYNC TRIGGER (FIXED)
-- Fires when metadata is updated after creation.
-- This is the escape hatch if you create via Dashboard UI.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role  user_role;
  _name  text;
BEGIN
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    (NEW.raw_app_meta_data->>'role')::user_role,
    (OLD.raw_user_meta_data->>'role')::user_role,
    'CLIENT'::user_role
  );

  _name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_app_meta_data->>'name',
    OLD.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  UPDATE public.users
  SET
    email = NEW.email,
    name  = _name,
    role  = _role
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_updated();


-- ────────────────────────────────────────────────────────────
-- STEP 5 — DROP OLD OPEN RLS POLICIES
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon: full access to users"                ON users;
DROP POLICY IF EXISTS "anon: full access to clients"              ON clients;
DROP POLICY IF EXISTS "anon: full access to goals"                ON goals;
DROP POLICY IF EXISTS "anon: full access to behavioral_flags"     ON behavioral_flags;
DROP POLICY IF EXISTS "anon: full access to decision_log"         ON decision_log;
DROP POLICY IF EXISTS "anon: full access to review_cycles"        ON review_cycles;
DROP POLICY IF EXISTS "anon: full access to action_items"         ON action_items;
DROP POLICY IF EXISTS "anon: full access to communications"       ON communications;
DROP POLICY IF EXISTS "anon: full access to documents"            ON documents;
DROP POLICY IF EXISTS "anon: full access to behavioral_snapshots" ON behavioral_snapshots;
DROP POLICY IF EXISTS "anon: full access to advisor_availability" ON advisor_availability;
DROP POLICY IF EXISTS "Allow anon to insert goals"                ON goals;
DROP POLICY IF EXISTS "Allow anon to insert behavioral_flags"     ON behavioral_flags;
DROP POLICY IF EXISTS "Allow anon to insert decision_log"         ON decision_log;
DROP POLICY IF EXISTS "Allow anon to insert communications"       ON communications;
DROP POLICY IF EXISTS "Allow anon to insert users"                ON users;
DROP POLICY IF EXISTS "Allow anon to insert clients"              ON clients;
DROP POLICY IF EXISTS "Allow anon to update users"                ON users;
DROP POLICY IF EXISTS "Allow anon to update clients"              ON clients;

DROP POLICY IF EXISTS "users: advisor can read all"                       ON users;
DROP POLICY IF EXISTS "users: client can read own"                        ON users;
DROP POLICY IF EXISTS "users: user can update own"                        ON users;
DROP POLICY IF EXISTS "clients: advisor full access"                      ON clients;
DROP POLICY IF EXISTS "clients: client can read own"                      ON clients;
DROP POLICY IF EXISTS "goals: advisor full access"                        ON goals;
DROP POLICY IF EXISTS "goals: client can read own"                        ON goals;
DROP POLICY IF EXISTS "behavioral_flags: advisor full access"             ON behavioral_flags;
DROP POLICY IF EXISTS "behavioral_flags: client can read own"             ON behavioral_flags;
DROP POLICY IF EXISTS "decision_log: advisor full access"                 ON decision_log;
DROP POLICY IF EXISTS "decision_log: client can read own non-internal"    ON decision_log;
DROP POLICY IF EXISTS "review_cycles: advisor full access"                ON review_cycles;
DROP POLICY IF EXISTS "review_cycles: client can read own"                ON review_cycles;
DROP POLICY IF EXISTS "action_items: advisor full access"                 ON action_items;
DROP POLICY IF EXISTS "action_items: client can read own"                 ON action_items;
DROP POLICY IF EXISTS "communications: advisor full access"               ON communications;
DROP POLICY IF EXISTS "communications: client can read own"               ON communications;
DROP POLICY IF EXISTS "documents: advisor full access"                    ON documents;
DROP POLICY IF EXISTS "documents: client can read own"                    ON documents;
DROP POLICY IF EXISTS "behavioral_snapshots: advisor full access"         ON behavioral_snapshots;
DROP POLICY IF EXISTS "behavioral_snapshots: client can read own"         ON behavioral_snapshots;
DROP POLICY IF EXISTS "advisor_availability: advisor manages own"         ON advisor_availability;
DROP POLICY IF EXISTS "advisor_availability: authenticated can read"      ON advisor_availability;


-- ────────────────────────────────────────────────────────────
-- STEP 6 — HELPER FUNCTION
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_advisor()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADVISOR'
  );
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 7 — PROPER RLS POLICIES
-- ────────────────────────────────────────────────────────────

-- USERS
CREATE POLICY "users: advisor can read all"
  ON users FOR SELECT TO authenticated
  USING (public.is_advisor());

CREATE POLICY "users: client can read own"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users: user can update own"
  ON users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- CLIENTS
CREATE POLICY "clients: advisor full access"
  ON clients FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "clients: client can read own"
  ON clients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- GOALS
CREATE POLICY "goals: advisor full access"
  ON goals FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "goals: client can read own"
  ON goals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = goals.client_id AND clients.user_id = auth.uid()
  ));

-- BEHAVIORAL FLAGS
CREATE POLICY "behavioral_flags: advisor full access"
  ON behavioral_flags FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "behavioral_flags: client can read own"
  ON behavioral_flags FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = behavioral_flags.client_id AND clients.user_id = auth.uid()
  ));

-- DECISION LOG
CREATE POLICY "decision_log: advisor full access"
  ON decision_log FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "decision_log: client can read own non-internal"
  ON decision_log FOR SELECT TO authenticated
  USING (
    is_internal = false AND EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = decision_log.client_id AND clients.user_id = auth.uid()
    )
  );

-- REVIEW CYCLES
CREATE POLICY "review_cycles: advisor full access"
  ON review_cycles FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "review_cycles: client can read own"
  ON review_cycles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = review_cycles.client_id AND clients.user_id = auth.uid()
  ));

-- ACTION ITEMS
CREATE POLICY "action_items: advisor full access"
  ON action_items FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "action_items: client can read own"
  ON action_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM review_cycles
    JOIN clients ON clients.id = review_cycles.client_id
    WHERE review_cycles.id = action_items.review_id
      AND clients.user_id = auth.uid()
  ));

-- COMMUNICATIONS
CREATE POLICY "communications: advisor full access"
  ON communications FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "communications: client can read own"
  ON communications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = communications.client_id AND clients.user_id = auth.uid()
  ));

-- DOCUMENTS
CREATE POLICY "documents: advisor full access"
  ON documents FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "documents: client can read own"
  ON documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id AND clients.user_id = auth.uid()
  ));

-- BEHAVIORAL SNAPSHOTS
CREATE POLICY "behavioral_snapshots: advisor full access"
  ON behavioral_snapshots FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "behavioral_snapshots: client can read own"
  ON behavioral_snapshots FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = behavioral_snapshots.client_id AND clients.user_id = auth.uid()
  ));

-- ADVISOR AVAILABILITY
CREATE POLICY "advisor_availability: advisor manages own"
  ON advisor_availability FOR ALL TO authenticated
  USING (advisor_id = auth.uid()) WITH CHECK (advisor_id = auth.uid());

CREATE POLICY "advisor_availability: authenticated can read"
  ON advisor_availability FOR SELECT TO authenticated
  USING (true);


-- ────────────────────────────────────────────────────────────
-- DONE — run the script above, then follow these steps:
-- ────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════
-- OPTION A — Dashboard UI (easiest, no curl needed)
-- ══════════════════════════════════════════════════════════
--
-- 1. Go to Authentication → Users → "Add user" → "Create new user"
--    DO NOT use the quick "Invite user" — it doesn't support metadata.
--
-- 2. Create the ADVISOR:
--    Email:    tanay@accrion.co
--    Password: advisor123
--    ✅ Auto Confirm User: checked
--    Under "User Metadata" paste:
--      {"role": "ADVISOR", "name": "Tanay"}
--
-- 3. Create the CLIENT:
--    Email:    arjun.mehta@email.com
--    Password: client123
--    ✅ Auto Confirm User: checked
--    Under "User Metadata" paste:
--      {"role": "CLIENT", "name": "Arjun Mehta"}
--
-- 4. Verify: run this query in the SQL editor:
--    SELECT id, email, name, role FROM public.users;
--    You should see both rows with the correct roles.
--
-- ══════════════════════════════════════════════════════════
-- OPTION B — If you already created users WITHOUT metadata
--            (the trigger got {} and defaulted to CLIENT)
-- ══════════════════════════════════════════════════════════
--
-- Run this in the SQL editor to manually fix the advisor row.
-- Replace <ADVISOR_UUID> with the UUID shown in Authentication → Users.
--
-- UPDATE auth.users
-- SET raw_user_meta_data = '{"role": "ADVISOR", "name": "Tanay"}'
-- WHERE id = '<ADVISOR_UUID>';
--
-- The on_auth_user_updated trigger will fire automatically and
-- fix the public.users row too. Verify with:
--   SELECT id, email, name, role FROM public.users;
