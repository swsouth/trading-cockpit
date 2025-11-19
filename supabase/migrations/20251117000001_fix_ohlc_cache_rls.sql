/*
  # Fix OHLC Cache RLS

  Enable RLS on the ohlc_cache table (if it exists)
*/

-- Enable RLS on ohlc_cache table
ALTER TABLE IF EXISTS ohlc_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public read access to ohlc_cache" ON ohlc_cache;

-- Create policy for authenticated users to read cache
CREATE POLICY "Public read access to ohlc_cache"
  ON ohlc_cache FOR SELECT
  TO authenticated
  USING (true);
