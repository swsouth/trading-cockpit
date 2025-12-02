-- Create crypto_scan_history table
-- Tracks when each crypto tier was last scanned to enable "one scan per period" functionality
-- Instead of requiring exact timing (:00, :05, :10), allows scanning anytime within the period

CREATE TABLE IF NOT EXISTS crypto_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 4),
  scan_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast tier lookups
CREATE INDEX idx_crypto_scan_history_tier ON crypto_scan_history(tier);
CREATE INDEX idx_crypto_scan_history_timestamp ON crypto_scan_history(scan_timestamp);

-- Composite index for efficient period queries
CREATE INDEX idx_crypto_scan_history_tier_timestamp ON crypto_scan_history(tier, scan_timestamp DESC);

-- Auto-cleanup: Delete scan history older than 2 hours (keeps table small)
-- We only need recent history to prevent duplicate scans within the same period
CREATE OR REPLACE FUNCTION cleanup_old_crypto_scan_history()
RETURNS void AS $$
BEGIN
  DELETE FROM crypto_scan_history
  WHERE scan_timestamp < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup every hour (if pg_cron is available)
-- Note: This requires pg_cron extension - if not available, cleanup happens manually
-- SELECT cron.schedule('cleanup-crypto-scan-history', '0 * * * *', 'SELECT cleanup_old_crypto_scan_history()');

-- Manual cleanup can be run with: SELECT cleanup_old_crypto_scan_history();

-- Enable RLS (required for security)
ALTER TABLE crypto_scan_history ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert (scanner creates records)
CREATE POLICY "Service role can insert scan history"
  ON crypto_scan_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can read (scanner checks for duplicates)
CREATE POLICY "Service role can read scan history"
  ON crypto_scan_history
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Authenticated users can read (UI can show last scan times)
CREATE POLICY "Authenticated users can view scan history"
  ON crypto_scan_history
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE crypto_scan_history IS 'Tracks crypto tier scan timestamps to enable flexible "one scan per period" functionality';
COMMENT ON COLUMN crypto_scan_history.tier IS 'Crypto tier (1=every 5min, 2=every 10min, 3=every 15min, 4=every 30min)';
COMMENT ON COLUMN crypto_scan_history.scan_timestamp IS 'When this tier was scanned';
