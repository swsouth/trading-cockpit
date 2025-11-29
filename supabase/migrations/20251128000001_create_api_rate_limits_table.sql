/**
 * Create API Rate Limits Tracking Table
 *
 * Tracks API usage for rate limiting across serverless function invocations.
 * Since serverless functions are stateless, we need database persistence.
 */

-- Create table for tracking API rate limits
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  time_window TEXT NOT NULL, -- 'minute' or 'day'
  window_start TIMESTAMPTZ NOT NULL,
  calls_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX idx_api_rate_limits_window
ON api_rate_limits (api_name, time_window, window_start);

-- Add index for cleanup queries
CREATE INDEX idx_api_rate_limits_window_start
ON api_rate_limits (window_start);

-- Add comment
COMMENT ON TABLE api_rate_limits IS
'Tracks API usage for rate limiting. Persists across serverless function invocations.';

-- Enable RLS but allow public read (usage stats are not sensitive)
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read rate limit stats
CREATE POLICY "Allow public read access to rate limits"
ON api_rate_limits FOR SELECT
TO public
USING (true);

-- Only service role can insert/update
CREATE POLICY "Only service role can modify rate limits"
ON api_rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
