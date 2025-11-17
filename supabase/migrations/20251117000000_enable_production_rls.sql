/*
  # Enable Production Row Level Security

  This migration replaces demo access with proper authenticated-only RLS policies.

  1. Drop all demo policies
  2. Re-enable foreign key constraints
  3. Create proper RLS policies that require authentication
  4. Ensure data isolation per user
*/

-- Drop all existing demo policies
DROP POLICY IF EXISTS "demo_watchlist_items_select" ON watchlist_items;
DROP POLICY IF EXISTS "demo_watchlist_items_insert" ON watchlist_items;
DROP POLICY IF EXISTS "demo_watchlist_items_update" ON watchlist_items;
DROP POLICY IF EXISTS "demo_watchlist_items_delete" ON watchlist_items;

DROP POLICY IF EXISTS "demo_ticker_notes_select" ON ticker_notes;
DROP POLICY IF EXISTS "demo_ticker_notes_insert" ON ticker_notes;
DROP POLICY IF EXISTS "demo_ticker_notes_update" ON ticker_notes;
DROP POLICY IF EXISTS "demo_ticker_notes_delete" ON ticker_notes;

DROP POLICY IF EXISTS "demo_research_uploads_select" ON research_uploads;
DROP POLICY IF EXISTS "demo_research_uploads_insert" ON research_uploads;
DROP POLICY IF EXISTS "demo_research_uploads_update" ON research_uploads;
DROP POLICY IF EXISTS "demo_research_uploads_delete" ON research_uploads;

DROP POLICY IF EXISTS "demo_price_alerts_select" ON price_alerts;
DROP POLICY IF EXISTS "demo_price_alerts_insert" ON price_alerts;
DROP POLICY IF EXISTS "demo_price_alerts_update" ON price_alerts;
DROP POLICY IF EXISTS "demo_price_alerts_delete" ON price_alerts;

DROP POLICY IF EXISTS "demo_combined_signals_select" ON combined_signals;
DROP POLICY IF EXISTS "demo_combined_signals_insert" ON combined_signals;
DROP POLICY IF EXISTS "demo_combined_signals_update" ON combined_signals;
DROP POLICY IF EXISTS "demo_combined_signals_delete" ON combined_signals;

DROP POLICY IF EXISTS "demo_profiles_select" ON profiles;
DROP POLICY IF EXISTS "demo_profiles_insert" ON profiles;
DROP POLICY IF EXISTS "demo_profiles_update" ON profiles;
DROP POLICY IF EXISTS "demo_profiles_delete" ON profiles;

-- Re-enable foreign key constraints for profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Watchlist Items: Users can only access their own items
CREATE POLICY "Users can view own watchlist items"
  ON watchlist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist items"
  ON watchlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist items"
  ON watchlist_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist items"
  ON watchlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- Ticker Notes: Users can only access their own notes
CREATE POLICY "Users can view own ticker notes"
  ON ticker_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ticker notes"
  ON ticker_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ticker notes"
  ON ticker_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ticker notes"
  ON ticker_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Research Uploads: Users can only access their own uploads
CREATE POLICY "Users can view own research uploads"
  ON research_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research uploads"
  ON research_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research uploads"
  ON research_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own research uploads"
  ON research_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Price Alerts: Users can only access their own alerts
CREATE POLICY "Users can view own price alerts"
  ON price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own price alerts"
  ON price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own price alerts"
  ON price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own price alerts"
  ON price_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Combined Signals: Users can only access their own signals
CREATE POLICY "Users can view own combined signals"
  ON combined_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own combined signals"
  ON combined_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own combined signals"
  ON combined_signals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own combined signals"
  ON combined_signals FOR DELETE
  USING (auth.uid() = user_id);

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Note: Profile insert is handled by the signup function in AuthContext

-- Remove the demo profile (if it exists)
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';
