/**
 * Stock Universe Management Migration
 *
 * Adds:
 * 1. Status column to scan_universe (active/paused/removed)
 * 2. intraday_scanner_config table for day trader stock management
 * 3. Indexes for performance
 * 4. Analytics helper views
 */

-- =====================================================
-- 1. Add status column to scan_universe
-- =====================================================

ALTER TABLE scan_universe
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'paused', 'removed'));

-- Index for filtering active stocks
CREATE INDEX IF NOT EXISTS idx_scan_universe_status
  ON scan_universe(status, symbol);

-- Add tracking columns
ALTER TABLE scan_universe
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

COMMENT ON COLUMN scan_universe.status IS 'Stock status: active (scanned), paused (excluded), removed (soft deleted)';
COMMENT ON COLUMN scan_universe.paused_at IS 'Timestamp when stock was paused';
COMMENT ON COLUMN scan_universe.removed_at IS 'Timestamp when stock was removed';

-- =====================================================
-- 2. Create intraday_scanner_config table
-- =====================================================

CREATE TABLE IF NOT EXISTS intraday_scanner_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  sector TEXT,
  market_cap TEXT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  notes TEXT,

  CONSTRAINT valid_symbol CHECK (symbol ~ '^[A-Z]{1,5}$')
);

-- Index for scanner queries (filter by active)
CREATE INDEX IF NOT EXISTS idx_intraday_active
  ON intraday_scanner_config(is_active, symbol);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_intraday_added_at
  ON intraday_scanner_config(added_at);

COMMENT ON TABLE intraday_scanner_config IS 'Stock universe configuration for intraday (day trader) scanner';
COMMENT ON COLUMN intraday_scanner_config.symbol IS 'Stock ticker symbol (uppercase)';
COMMENT ON COLUMN intraday_scanner_config.is_active IS 'Whether stock is currently being scanned';
COMMENT ON COLUMN intraday_scanner_config.paused_at IS 'Timestamp when stock was paused';

-- =====================================================
-- 3. Seed intraday_scanner_config with current stocks
-- =====================================================

-- Insert current hardcoded symbols from intradayMarketScan.ts
INSERT INTO intraday_scanner_config (symbol, sector, market_cap, is_active)
VALUES
  -- Mega-Cap Tech
  ('AAPL', 'Technology', 'Mega-Cap', true),
  ('MSFT', 'Technology', 'Mega-Cap', true),
  ('GOOGL', 'Technology', 'Mega-Cap', true),
  ('AMZN', 'Consumer Cyclical', 'Mega-Cap', true),
  ('TSLA', 'Automotive', 'Large-Cap', true),
  ('NVDA', 'Technology', 'Mega-Cap', true),
  ('META', 'Technology', 'Mega-Cap', true),
  ('AMD', 'Technology', 'Large-Cap', true),
  ('SPY', 'ETF', 'Mega-Cap', true),
  ('QQQ', 'ETF', 'Mega-Cap', true),

  -- Additional Mega-Caps
  ('NFLX', 'Technology', 'Mega-Cap', true),
  ('BABA', 'Technology', 'Large-Cap', true),
  ('CRM', 'Technology', 'Mega-Cap', true),
  ('ORCL', 'Technology', 'Mega-Cap', true),
  ('ADBE', 'Technology', 'Mega-Cap', true),
  ('INTC', 'Technology', 'Large-Cap', true),
  ('CSCO', 'Technology', 'Large-Cap', true),

  -- High-Volume Growth
  ('COIN', 'Financial Services', 'Mid-Cap', true),
  ('PLTR', 'Technology', 'Mid-Cap', true),
  ('SNOW', 'Technology', 'Mid-Cap', true),
  ('UBER', 'Technology', 'Large-Cap', true),
  ('LYFT', 'Technology', 'Mid-Cap', true),
  ('ABNB', 'Consumer Cyclical', 'Large-Cap', true),
  ('SHOP', 'Technology', 'Large-Cap', true),
  ('SQ', 'Financial Services', 'Mid-Cap', true),
  ('PYPL', 'Financial Services', 'Large-Cap', true),
  ('ROKU', 'Technology', 'Small-Cap', true),
  ('DASH', 'Technology', 'Mid-Cap', true),

  -- Volatile/Momentum
  ('NIO', 'Automotive', 'Small-Cap', true),
  ('RIVN', 'Automotive', 'Mid-Cap', true),
  ('LCID', 'Automotive', 'Small-Cap', true),
  ('F', 'Automotive', 'Large-Cap', true),
  ('GM', 'Automotive', 'Large-Cap', true),
  ('AAL', 'Airlines', 'Mid-Cap', true),
  ('BA', 'Aerospace', 'Large-Cap', true),
  ('DIS', 'Entertainment', 'Mega-Cap', true),

  -- Financials
  ('JPM', 'Financial Services', 'Mega-Cap', true),
  ('BAC', 'Financial Services', 'Mega-Cap', true),
  ('GS', 'Financial Services', 'Large-Cap', true),
  ('MS', 'Financial Services', 'Large-Cap', true),
  ('WFC', 'Financial Services', 'Mega-Cap', true),

  -- Energy/Commodities
  ('XOM', 'Energy', 'Mega-Cap', true),
  ('CVX', 'Energy', 'Mega-Cap', true),
  ('USO', 'ETF', 'Mid-Cap', true),
  ('GLD', 'ETF', 'Large-Cap', true),

  -- Sector ETFs
  ('XLF', 'ETF', 'Large-Cap', true),
  ('XLE', 'ETF', 'Large-Cap', true),
  ('XLK', 'ETF', 'Large-Cap', true),
  ('IWM', 'ETF', 'Large-Cap', true),
  ('VXX', 'ETF', 'Mid-Cap', true)
ON CONFLICT (symbol) DO NOTHING;

-- =====================================================
-- 4. Create analytics view for daily scanner
-- =====================================================

CREATE OR REPLACE VIEW daily_scanner_analytics AS
SELECT
  su.symbol,
  su.sector,
  su.market_cap,
  su.status,
  su.paused_at,
  su.removed_at,
  COUNT(*) FILTER (WHERE tr.scan_date >= NOW() - INTERVAL '30 days') as opps_30d,
  COUNT(*) FILTER (WHERE tr.scan_date >= NOW() - INTERVAL '60 days') as opps_60d,
  COUNT(*) FILTER (WHERE tr.scan_date >= NOW() - INTERVAL '90 days') as opps_90d,
  COALESCE(AVG(tr.opportunity_score) FILTER (WHERE tr.scan_date >= NOW() - INTERVAL '90 days'), 0)::INT as avg_score,
  MAX(tr.opportunity_score) FILTER (WHERE tr.scan_date >= NOW() - INTERVAL '90 days') as max_score,
  MAX(tr.scan_date) as last_opportunity_date
FROM scan_universe su
LEFT JOIN trade_recommendations tr ON su.symbol = tr.symbol
GROUP BY su.symbol, su.sector, su.market_cap, su.status, su.paused_at, su.removed_at
ORDER BY opps_90d DESC NULLS LAST;

COMMENT ON VIEW daily_scanner_analytics IS 'Performance metrics for daily scanner stocks (30/60/90 day opportunity counts)';

-- =====================================================
-- 5. Create analytics view for intraday scanner
-- =====================================================

CREATE OR REPLACE VIEW intraday_scanner_analytics AS
SELECT
  isc.symbol,
  isc.sector,
  isc.market_cap,
  isc.is_active,
  isc.added_at,
  isc.paused_at,
  COUNT(*) FILTER (WHERE io.scan_timestamp >= NOW() - INTERVAL '7 days') as opps_7d,
  COUNT(*) FILTER (WHERE io.scan_timestamp >= NOW() - INTERVAL '30 days') as opps_30d,
  COUNT(*) FILTER (WHERE io.scan_timestamp >= NOW() - INTERVAL '90 days') as opps_90d,
  COALESCE(AVG(io.opportunity_score) FILTER (WHERE io.scan_timestamp >= NOW() - INTERVAL '90 days'), 0)::INT as avg_score,
  MAX(io.opportunity_score) FILTER (WHERE io.scan_timestamp >= NOW() - INTERVAL '90 days') as max_score,
  MAX(io.scan_timestamp) as last_opportunity_timestamp,
  COUNT(DISTINCT DATE(io.scan_timestamp)) FILTER (WHERE io.scan_timestamp >= NOW() - INTERVAL '90 days') as days_active
FROM intraday_scanner_config isc
LEFT JOIN intraday_opportunities io ON isc.symbol = io.symbol
GROUP BY isc.symbol, isc.sector, isc.market_cap, isc.is_active, isc.added_at, isc.paused_at
ORDER BY opps_90d DESC NULLS LAST;

COMMENT ON VIEW intraday_scanner_analytics IS 'Performance metrics for intraday scanner stocks (7/30/90 day opportunity counts)';

-- =====================================================
-- 6. Enable Row Level Security on new table
-- =====================================================

-- Enable RLS on intraday_scanner_config
ALTER TABLE intraday_scanner_config ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
CREATE POLICY "Authenticated users can view intraday config"
  ON intraday_scanner_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Service role can modify (for scanners)
CREATE POLICY "Service role can modify intraday config"
  ON intraday_scanner_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can update is_active (pause/resume)
CREATE POLICY "Authenticated users can pause/resume stocks"
  ON intraday_scanner_config
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. Update RLS on scan_universe for pause/resume
-- =====================================================

-- Policy: Authenticated users can update status (pause/resume)
CREATE POLICY "Authenticated users can pause/resume daily stocks"
  ON scan_universe
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 8. Helper functions for common operations
-- =====================================================

-- Function to pause a stock in daily scanner
CREATE OR REPLACE FUNCTION pause_daily_stock(stock_symbol TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE scan_universe
  SET status = 'paused', paused_at = NOW()
  WHERE symbol = stock_symbol AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resume a stock in daily scanner
CREATE OR REPLACE FUNCTION resume_daily_stock(stock_symbol TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE scan_universe
  SET status = 'active', paused_at = NULL
  WHERE symbol = stock_symbol AND status = 'paused';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to pause a stock in intraday scanner
CREATE OR REPLACE FUNCTION pause_intraday_stock(stock_symbol TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE intraday_scanner_config
  SET is_active = false, paused_at = NOW()
  WHERE symbol = stock_symbol AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resume a stock in intraday scanner
CREATE OR REPLACE FUNCTION resume_intraday_stock(stock_symbol TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE intraday_scanner_config
  SET is_active = true, paused_at = NULL
  WHERE symbol = stock_symbol AND is_active = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION pause_daily_stock IS 'Pause a stock in the daily scanner';
COMMENT ON FUNCTION resume_daily_stock IS 'Resume a paused stock in the daily scanner';
COMMENT ON FUNCTION pause_intraday_stock IS 'Pause a stock in the intraday scanner';
COMMENT ON FUNCTION resume_intraday_stock IS 'Resume a paused stock in the intraday scanner';
