/*
  # Enable Demo Access

  This migration allows unauthenticated access to all tables for demo purposes.
  When authentication is added later, these policies can be replaced with proper authenticated-only policies.

  1. Changes
    - Drop existing restrictive RLS policies
    - Add permissive policies that allow public access to all operations
    
  2. Security
    - This is temporary for single-user demo mode
    - Will be replaced with proper auth-based policies when authentication is added
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own watchlist items" ON watchlist_items;
DROP POLICY IF EXISTS "Users can view own watchlist items" ON watchlist_items;
DROP POLICY IF EXISTS "Users can insert own watchlist items" ON watchlist_items;
DROP POLICY IF EXISTS "Users can update own watchlist items" ON watchlist_items;
DROP POLICY IF EXISTS "Users can delete own watchlist items" ON watchlist_items;

DROP POLICY IF EXISTS "Users can manage own ticker notes" ON ticker_notes;
DROP POLICY IF EXISTS "Users can view own ticker notes" ON ticker_notes;
DROP POLICY IF EXISTS "Users can insert own ticker notes" ON ticker_notes;
DROP POLICY IF EXISTS "Users can update own ticker notes" ON ticker_notes;
DROP POLICY IF EXISTS "Users can delete own ticker notes" ON ticker_notes;

DROP POLICY IF EXISTS "Users can manage own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can view own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON uploads;

DROP POLICY IF EXISTS "Users can manage own price alerts" ON price_alerts;
DROP POLICY IF EXISTS "Users can view own price alerts" ON price_alerts;
DROP POLICY IF EXISTS "Users can insert own price alerts" ON price_alerts;
DROP POLICY IF EXISTS "Users can update own price alerts" ON price_alerts;
DROP POLICY IF EXISTS "Users can delete own price alerts" ON price_alerts;

DROP POLICY IF EXISTS "Users can manage own combined signals" ON combined_signals;
DROP POLICY IF EXISTS "Users can view own combined signals" ON combined_signals;
DROP POLICY IF EXISTS "Users can insert own combined signals" ON combined_signals;
DROP POLICY IF EXISTS "Users can update own combined signals" ON combined_signals;
DROP POLICY IF EXISTS "Users can delete own combined signals" ON combined_signals;

DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Watchlist items - allow all operations
CREATE POLICY "Allow all access to watchlist_items"
  ON watchlist_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ticker notes - allow all operations
CREATE POLICY "Allow all access to ticker_notes"
  ON ticker_notes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Uploads - allow all operations
CREATE POLICY "Allow all access to uploads"
  ON uploads FOR ALL
  USING (true)
  WITH CHECK (true);

-- Price alerts - allow all operations
CREATE POLICY "Allow all access to price_alerts"
  ON price_alerts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Combined signals - allow all operations
CREATE POLICY "Allow all access to combined_signals"
  ON combined_signals FOR ALL
  USING (true)
  WITH CHECK (true);

-- Profiles - allow all operations
CREATE POLICY "Allow all access to profiles"
  ON profiles FOR ALL
  USING (true)
  WITH CHECK (true);
