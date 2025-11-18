-- Market Scanner: Create market_opportunities table
-- This table stores scan results for both personal watchlist scans and future market-wide scans
-- Designed to be multi-tenant ready for easy scaling

CREATE TABLE IF NOT EXISTS market_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User association (nullable for future market-wide scans)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stock identification
  symbol TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Price data
  price DECIMAL NOT NULL,
  change_percent DECIMAL,
  volume BIGINT,

  -- Technical analysis (from existing algorithms)
  has_channel BOOLEAN DEFAULT false,
  channel_status TEXT, -- near_support, near_resistance, inside, broken_out
  support DECIMAL,
  resistance DECIMAL,
  mid_channel DECIMAL,
  channel_width_pct DECIMAL,
  support_touches INT,
  resistance_touches INT,

  pattern TEXT, -- bullish_engulfing, hammer, doji, etc.
  bias TEXT NOT NULL, -- bullish, bearish, neutral, conflicting
  notes TEXT[] DEFAULT ARRAY[]::TEXT[],
  cautions TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Trading action (NEW - the valuable part)
  recommended_action TEXT NOT NULL, -- BUY, SELL, SHORT, BUY_BREAKOUT, WAIT
  entry_price DECIMAL,
  entry_range_low DECIMAL,
  entry_range_high DECIMAL,
  entry_type TEXT, -- market, limit, stop

  target_price_1 DECIMAL, -- Conservative target
  target_price_2 DECIMAL, -- Aggressive target
  stop_loss DECIMAL,

  potential_gain_1_pct DECIMAL, -- To target 1
  potential_gain_2_pct DECIMAL, -- To target 2
  potential_loss_pct DECIMAL, -- To stop

  risk_reward_ratio DECIMAL, -- The golden number

  -- Quality metrics
  confidence TEXT NOT NULL, -- LOW, MODERATE, HIGH
  confidence_score INT, -- 0-10
  reasoning TEXT[] DEFAULT ARRAY[]::TEXT[],

  setup TEXT, -- "Support Bounce", "Resistance Rejection", "Breakout", etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering and querying
CREATE INDEX IF NOT EXISTS idx_market_opportunities_user_id
  ON market_opportunities(user_id);

CREATE INDEX IF NOT EXISTS idx_market_opportunities_scanned_at
  ON market_opportunities(scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_opportunities_symbol
  ON market_opportunities(symbol);

CREATE INDEX IF NOT EXISTS idx_market_opportunities_recommended_action
  ON market_opportunities(recommended_action);

CREATE INDEX IF NOT EXISTS idx_market_opportunities_confidence
  ON market_opportunities(confidence);

CREATE INDEX IF NOT EXISTS idx_market_opportunities_risk_reward
  ON market_opportunities(risk_reward_ratio DESC);

CREATE INDEX IF NOT EXISTS idx_market_opportunities_pattern
  ON market_opportunities(pattern);

CREATE INDEX IF NOT EXISTS idx_market_opportunities_bias
  ON market_opportunities(bias);

-- Composite index for actionable opportunities (most common query)
CREATE INDEX IF NOT EXISTS idx_market_opportunities_actionable
  ON market_opportunities(user_id, scanned_at DESC, recommended_action)
  WHERE recommended_action IN ('BUY', 'SELL', 'SHORT', 'BUY_BREAKOUT');

-- Composite index for high-quality setups
CREATE INDEX IF NOT EXISTS idx_market_opportunities_high_quality
  ON market_opportunities(user_id, risk_reward_ratio DESC, confidence)
  WHERE confidence = 'HIGH' AND risk_reward_ratio >= 2.0;

-- Row Level Security (RLS)
ALTER TABLE market_opportunities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own opportunities
CREATE POLICY "Users can view own opportunities"
  ON market_opportunities
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL -- Allow viewing market-wide scans (future)
  );

-- Policy: Users can insert their own opportunities
CREATE POLICY "Users can insert own opportunities"
  ON market_opportunities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own opportunities
CREATE POLICY "Users can update own opportunities"
  ON market_opportunities
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own opportunities
CREATE POLICY "Users can delete own opportunities"
  ON market_opportunities
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean up old scan results (optional, for future use)
CREATE OR REPLACE FUNCTION cleanup_old_opportunities()
RETURNS void AS $$
BEGIN
  -- Delete opportunities older than 30 days
  DELETE FROM market_opportunities
  WHERE scanned_at < NOW() - INTERVAL '30 days'
    AND user_id IS NOT NULL; -- Only clean up personal scans, keep market-wide
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table
COMMENT ON TABLE market_opportunities IS 'Stores market scanner results with trading recommendations. Multi-tenant ready for both personal watchlist scans and market-wide scans.';
