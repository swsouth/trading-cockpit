-- Migration: Create trade_recommendations and scan_universe tables for daily market scanner
-- Date: 2025-11-22
-- Purpose: Enable market-wide scanning and trade recommendations storage

-- ============================================================================
-- Table: scan_universe
-- Purpose: Defines which stocks to scan daily (top 500-1000 liquid stocks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scan_universe (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  sector VARCHAR(50),
  market_cap BIGINT,
  avg_volume BIGINT,
  avg_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMP DEFAULT NOW(),
  last_scanned_at TIMESTAMP,

  -- Metadata
  data_source VARCHAR(50), -- 'sp500', 'nasdaq100', 'manual', etc.
  notes TEXT,

  CONSTRAINT chk_positive_market_cap CHECK (market_cap IS NULL OR market_cap > 0),
  CONSTRAINT chk_positive_volume CHECK (avg_volume IS NULL OR avg_volume > 0)
);

-- Indexes for scan_universe
CREATE INDEX idx_scan_universe_active ON scan_universe(is_active) WHERE is_active = true;
CREATE INDEX idx_scan_universe_symbol ON scan_universe(symbol);
CREATE INDEX idx_scan_universe_sector ON scan_universe(sector) WHERE sector IS NOT NULL;
CREATE INDEX idx_scan_universe_market_cap ON scan_universe(market_cap DESC NULLS LAST);
CREATE INDEX idx_scan_universe_last_scanned ON scan_universe(last_scanned_at DESC NULLS LAST);

-- Comments
COMMENT ON TABLE scan_universe IS 'Defines the universe of stocks to scan daily (typically 500-1000 most liquid stocks)';
COMMENT ON COLUMN scan_universe.is_active IS 'Set to false to temporarily exclude from scans without deleting';
COMMENT ON COLUMN scan_universe.last_scanned_at IS 'Last time this symbol was successfully scanned';

-- ============================================================================
-- Table: trade_recommendations
-- Purpose: Stores daily market scan results with specific trade setups
-- ============================================================================

CREATE TABLE IF NOT EXISTS trade_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  scan_date DATE NOT NULL,

  -- Trade Details
  recommendation_type VARCHAR(20) NOT NULL, -- 'long' or 'short'
  setup_type VARCHAR(50) NOT NULL, -- 'channel_breakout', 'support_bounce', 'reversal', etc.
  timeframe VARCHAR(20) NOT NULL DEFAULT 'swing_trade', -- 'day_trade', 'swing_trade', 'position_trade'

  -- Entry/Exit/Stop
  entry_price DECIMAL(10,2) NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  stop_loss DECIMAL(10,2) NOT NULL,

  -- Risk/Reward Metrics
  risk_amount DECIMAL(10,2) NOT NULL, -- $ amount at risk (entry - stop)
  reward_amount DECIMAL(10,2) NOT NULL, -- $ potential profit (target - entry)
  risk_reward_ratio DECIMAL(5,2) NOT NULL, -- e.g., 3.0 for 1:3

  -- Scoring
  opportunity_score INTEGER NOT NULL, -- 0-100 composite score
  confidence_level VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'

  -- Technical Context
  current_price DECIMAL(10,2) NOT NULL,
  channel_status VARCHAR(50),
  pattern_detected VARCHAR(50),
  volume_status VARCHAR(50), -- 'high', 'average', 'low'
  rsi DECIMAL(5,2),
  trend VARCHAR(20), -- 'uptrend', 'downtrend', 'sideways'

  -- Fundamental Context (optional for now)
  market_cap BIGINT,
  sector VARCHAR(50),

  -- Rationale & Context
  rationale TEXT NOT NULL, -- Human-readable explanation of why this is a good trade
  technical_summary TEXT, -- Detailed technical analysis summary

  -- Tracking & Lifecycle
  is_active BOOLEAN DEFAULT true,
  outcome VARCHAR(20), -- 'hit_target', 'hit_stop', 'expired', 'pending', 'invalidated'
  outcome_price DECIMAL(10,2), -- Price at which outcome occurred
  outcome_date TIMESTAMP, -- When the outcome occurred
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- When this recommendation is no longer valid (typically 5-7 days)
  invalidated_at TIMESTAMP, -- If invalidated early
  invalidation_reason TEXT, -- Why it was invalidated

  -- Constraints
  CONSTRAINT chk_recommendation_type CHECK (recommendation_type IN ('long', 'short')),
  CONSTRAINT chk_confidence_level CHECK (confidence_level IN ('high', 'medium', 'low')),
  CONSTRAINT chk_opportunity_score CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  CONSTRAINT chk_risk_reward_positive CHECK (risk_reward_ratio > 0),
  CONSTRAINT chk_outcome_valid CHECK (
    outcome IS NULL OR
    outcome IN ('hit_target', 'hit_stop', 'expired', 'pending', 'invalidated')
  ),
  CONSTRAINT unique_symbol_scan_date UNIQUE(symbol, scan_date)
);

-- Indexes for trade_recommendations
CREATE INDEX idx_trade_recs_scan_date ON trade_recommendations(scan_date DESC);
CREATE INDEX idx_trade_recs_score ON trade_recommendations(opportunity_score DESC);
CREATE INDEX idx_trade_recs_active ON trade_recommendations(is_active) WHERE is_active = true;
CREATE INDEX idx_trade_recs_symbol ON trade_recommendations(symbol);
CREATE INDEX idx_trade_recs_confidence ON trade_recommendations(confidence_level);
CREATE INDEX idx_trade_recs_setup_type ON trade_recommendations(setup_type);
CREATE INDEX idx_trade_recs_outcome ON trade_recommendations(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX idx_trade_recs_pending ON trade_recommendations(outcome) WHERE outcome = 'pending';
CREATE INDEX idx_trade_recs_expires ON trade_recommendations(expires_at) WHERE is_active = true;

-- Composite index for common queries
CREATE INDEX idx_trade_recs_active_score ON trade_recommendations(scan_date DESC, opportunity_score DESC)
  WHERE is_active = true;

-- Comments
COMMENT ON TABLE trade_recommendations IS 'Daily market scan results with specific trade recommendations';
COMMENT ON COLUMN trade_recommendations.scan_date IS 'Date the scan was performed (not necessarily today if backfilling)';
COMMENT ON COLUMN trade_recommendations.opportunity_score IS 'Composite score 0-100 based on trend, pattern, volume, R:R, momentum';
COMMENT ON COLUMN trade_recommendations.risk_reward_ratio IS 'Reward divided by risk (e.g., 2.5 means 2.5:1 or $2.50 profit per $1 risked)';
COMMENT ON COLUMN trade_recommendations.is_active IS 'False if recommendation is no longer valid (expired, hit target/stop, or invalidated)';
COMMENT ON COLUMN trade_recommendations.outcome IS 'What happened to this recommendation';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE scan_universe ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: scan_universe is viewable by authenticated users
-- (Admin-managed table, users can read but not write)
CREATE POLICY "scan_universe_read_access"
  ON scan_universe FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can write to scan_universe
CREATE POLICY "scan_universe_write_service_only"
  ON scan_universe FOR ALL
  TO service_role
  USING (true);

-- Policy: trade_recommendations are viewable by all authenticated users
-- (These are public trade ideas, not personalized recommendations)
CREATE POLICY "trade_recs_read_access"
  ON trade_recommendations FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can write to trade_recommendations
-- (Populated by automated scanner, not by users directly)
CREATE POLICY "trade_recs_write_service_only"
  ON trade_recommendations FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to automatically set expires_at to 7 days from scan_date if not provided
CREATE OR REPLACE FUNCTION set_default_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := (NEW.scan_date + INTERVAL '7 days')::timestamp;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set default expiration
CREATE TRIGGER trg_set_default_expiration
  BEFORE INSERT ON trade_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION set_default_expiration();

-- Function to automatically mark recommendations as expired
CREATE OR REPLACE FUNCTION mark_expired_recommendations()
RETURNS void AS $$
BEGIN
  UPDATE trade_recommendations
  SET
    is_active = false,
    outcome = 'expired',
    outcome_date = NOW()
  WHERE
    is_active = true
    AND outcome = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION mark_expired_recommendations() IS 'Call this periodically (e.g., daily) to auto-expire old recommendations';

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert a few popular stocks into scan_universe for testing
INSERT INTO scan_universe (symbol, company_name, sector, market_cap, avg_volume, is_active, data_source)
VALUES
  ('AAPL', 'Apple Inc.', 'Technology', 3000000000000, 50000000, true, 'sp500'),
  ('MSFT', 'Microsoft Corporation', 'Technology', 2800000000000, 25000000, true, 'sp500'),
  ('GOOGL', 'Alphabet Inc.', 'Technology', 1700000000000, 20000000, true, 'sp500'),
  ('AMZN', 'Amazon.com Inc.', 'Consumer Cyclical', 1500000000000, 30000000, true, 'sp500'),
  ('NVDA', 'NVIDIA Corporation', 'Technology', 1200000000000, 40000000, true, 'sp500'),
  ('TSLA', 'Tesla Inc.', 'Consumer Cyclical', 800000000000, 90000000, true, 'sp500'),
  ('META', 'Meta Platforms Inc.', 'Technology', 900000000000, 15000000, true, 'sp500')
ON CONFLICT (symbol) DO NOTHING;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_universe') THEN
    RAISE NOTICE 'Table scan_universe created successfully';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_recommendations') THEN
    RAISE NOTICE 'Table trade_recommendations created successfully';
  END IF;
END $$;
