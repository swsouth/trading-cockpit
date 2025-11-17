/*
  # Fix OHLC Cache RLS

  Enable RLS on the ohlc_cache table (if it exists)
*/

-- Enable RLS on ohlc_cache table
ALTER TABLE IF EXISTS ohlc_cache ENABLE ROW LEVEL SECURITY;

-- Since this is a cache table, we can either:
-- Option 1: Make it public read-only (if it's shared across users)
CREATE POLICY IF NOT EXISTS "Public read access to ohlc_cache"
  ON ohlc_cache FOR SELECT
  TO authenticated
  USING (true);

-- Option 2: Or delete it if not needed
-- DROP TABLE IF EXISTS ohlc_cache;
