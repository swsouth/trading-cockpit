-- Create table for crypto intraday recommendations (15-min bars)
-- Optimized for day trading with 2-4 hour hold times
-- Records expire after 4 hours (stale for intraday trading)

CREATE TABLE IF NOT EXISTS crypto_intraday_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  scan_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('long', 'short')),
  entry_price NUMERIC(12, 2) NOT NULL,
  target_price NUMERIC(12, 2) NOT NULL,
  stop_loss NUMERIC(12, 2) NOT NULL,
  risk_reward_ratio NUMERIC(5, 2) NOT NULL,
  opportunity_score INTEGER NOT NULL CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  setup_type TEXT NOT NULL,
  pattern_detected TEXT,
  channel_status TEXT,
  trend TEXT,
  current_price NUMERIC(12, 2),
  rationale TEXT,
  timeframe TEXT NOT NULL DEFAULT '15min',
  valid_until TIMESTAMPTZ NOT NULL, -- Expires when next 15-min bar closes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries (scan_date + score sorting)
CREATE INDEX IF NOT EXISTS idx_crypto_intraday_scan_date ON crypto_intraday_recommendations(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_intraday_score ON crypto_intraday_recommendations(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_intraday_valid_until ON crypto_intraday_recommendations(valid_until);

-- Unique constraint: One recommendation per symbol per scan
CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_intraday_symbol_scan
  ON crypto_intraday_recommendations(symbol, scan_date);

-- Row Level Security (RLS)
ALTER TABLE crypto_intraday_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read crypto recommendations (public data)
CREATE POLICY "Allow public read access to crypto intraday recommendations"
  ON crypto_intraday_recommendations
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert (scanner automation)
CREATE POLICY "Allow service role to insert crypto intraday recommendations"
  ON crypto_intraday_recommendations
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Only service role can delete (cleanup automation)
CREATE POLICY "Allow service role to delete old crypto intraday recommendations"
  ON crypto_intraday_recommendations
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Auto-cleanup trigger: Delete recommendations older than 4 hours
-- (Intraday recommendations are stale after 4 hours)
CREATE OR REPLACE FUNCTION cleanup_stale_crypto_intraday_recommendations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM crypto_intraday_recommendations
  WHERE scan_date < NOW() - INTERVAL '4 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_stale_crypto_intraday_recommendations
  AFTER INSERT ON crypto_intraday_recommendations
  EXECUTE FUNCTION cleanup_stale_crypto_intraday_recommendations();

-- Grant permissions
GRANT SELECT ON crypto_intraday_recommendations TO anon, authenticated;
GRANT ALL ON crypto_intraday_recommendations TO service_role;
