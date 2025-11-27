-- Create intraday_opportunities table for day trading feature
-- This is separate from trade_recommendations (daily scanner)
-- Opportunities expire after 30 minutes

CREATE TABLE IF NOT EXISTS intraday_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic info
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,  -- '5Min', '15Min', etc.
  scan_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Trade recommendation
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('long', 'short')),
  entry_price NUMERIC(10,2) NOT NULL,
  target_price NUMERIC(10,2) NOT NULL,
  stop_loss NUMERIC(10,2) NOT NULL,

  -- Scoring
  opportunity_score INTEGER NOT NULL CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),

  -- Context
  rationale TEXT,
  current_price NUMERIC(10,2) NOT NULL,
  channel_status TEXT,
  pattern_detected TEXT,
  rsi NUMERIC(5,2),

  -- Expiration (intraday setups are time-sensitive)
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'triggered')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one opportunity per symbol per scan
  UNIQUE(symbol, scan_timestamp)
);

-- Indexes for performance
CREATE INDEX idx_intraday_user_id ON intraday_opportunities(user_id);
CREATE INDEX idx_intraday_symbol ON intraday_opportunities(symbol);
CREATE INDEX idx_intraday_status ON intraday_opportunities(status) WHERE status = 'active';
CREATE INDEX idx_intraday_expires_at ON intraday_opportunities(expires_at);
CREATE INDEX idx_intraday_score ON intraday_opportunities(opportunity_score DESC);
CREATE INDEX idx_intraday_scan_timestamp ON intraday_opportunities(scan_timestamp DESC);

-- RLS Policies
ALTER TABLE intraday_opportunities ENABLE ROW LEVEL SECURITY;

-- Users can view their own intraday opportunities
CREATE POLICY "Users can view their own intraday opportunities"
  ON intraday_opportunities
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert opportunities (scanner uses service role key)
CREATE POLICY "Service role can insert opportunities"
  ON intraday_opportunities
  FOR INSERT
  WITH CHECK (true);

-- Service role can update opportunities (for expiration)
CREATE POLICY "Service role can update opportunities"
  ON intraday_opportunities
  FOR UPDATE
  USING (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intraday_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_intraday_opportunities_updated_at
  BEFORE UPDATE ON intraday_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_intraday_opportunities_updated_at();

-- Function to auto-expire old opportunities
CREATE OR REPLACE FUNCTION expire_old_intraday_opportunities()
RETURNS void AS $$
BEGIN
  UPDATE intraday_opportunities
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE intraday_opportunities IS 'Day trading opportunities from intraday scanner (5-min bars). Auto-expires after 30 minutes.';
COMMENT ON COLUMN intraday_opportunities.timeframe IS 'Bar interval: 5Min, 15Min, etc.';
COMMENT ON COLUMN intraday_opportunities.expires_at IS 'Timestamp when setup becomes invalid (30 min from scan)';
COMMENT ON COLUMN intraday_opportunities.status IS 'active: live opportunity, expired: too old, triggered: user acted on it';
