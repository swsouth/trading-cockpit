-- Paper Trading Performance Tracking
-- Stores executed paper trades and their outcomes for analytics

-- Main paper trades table
CREATE TABLE IF NOT EXISTS paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES trade_recommendations(id) ON DELETE SET NULL,

  -- Trade details
  symbol TEXT NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('long', 'short')),
  setup_type TEXT, -- 'Channel Bounce', 'Breakout', 'Pullback', etc.
  candlestick_pattern TEXT, -- From recommendation rationale

  -- Prices
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  exit_price NUMERIC, -- Filled when trade closes

  -- Position details
  shares INTEGER NOT NULL,
  cost_basis NUMERIC NOT NULL,

  -- Risk/Reward
  predicted_r_multiple NUMERIC NOT NULL, -- From recommendation
  realized_r_multiple NUMERIC, -- Calculated on close
  dollar_risk NUMERIC NOT NULL,
  realized_pnl NUMERIC, -- Profit/Loss in dollars

  -- Order tracking
  alpaca_order_id TEXT,
  alpaca_stop_order_id TEXT,
  alpaca_target_order_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  exit_reason TEXT CHECK (exit_reason IN ('hit_target', 'hit_stop', 'manual_close', 'expired', 'cancelled')),

  -- Timestamps
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_paper_trades_user_id ON paper_trades(user_id);
CREATE INDEX idx_paper_trades_status ON paper_trades(status);
CREATE INDEX idx_paper_trades_symbol ON paper_trades(symbol);
CREATE INDEX idx_paper_trades_closed_at ON paper_trades(closed_at) WHERE status = 'closed';
CREATE INDEX idx_paper_trades_recommendation_id ON paper_trades(recommendation_id);

-- RLS Policies
ALTER TABLE paper_trades ENABLE ROW LEVEL SECURITY;

-- Users can only see their own trades
CREATE POLICY "Users can view their own paper trades"
  ON paper_trades
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own trades
CREATE POLICY "Users can insert their own paper trades"
  ON paper_trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own trades
CREATE POLICY "Users can update their own paper trades"
  ON paper_trades
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all trades (for automation)
CREATE POLICY "Service role can manage all paper trades"
  ON paper_trades
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create aggregated performance view
CREATE OR REPLACE VIEW paper_trading_performance AS
SELECT
  user_id,
  recommendation_type,
  setup_type,
  candlestick_pattern,
  COUNT(*) as total_trades,
  SUM(CASE WHEN realized_pnl > 0 THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100 as win_rate_percent,
  AVG(realized_r_multiple) as avg_r_multiple,
  AVG(predicted_r_multiple) as avg_predicted_r_multiple,
  SUM(realized_pnl) as total_pnl,
  AVG(realized_pnl) as avg_pnl,
  MAX(realized_pnl) as best_trade_pnl,
  MIN(realized_pnl) as worst_trade_pnl,
  MAX(realized_r_multiple) as best_r_multiple,
  MIN(realized_r_multiple) as worst_r_multiple
FROM paper_trades
WHERE status = 'closed' AND realized_pnl IS NOT NULL
GROUP BY user_id, recommendation_type, setup_type, candlestick_pattern;

-- Grant access to the view
GRANT SELECT ON paper_trading_performance TO authenticated;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_paper_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER paper_trades_updated_at
  BEFORE UPDATE ON paper_trades
  FOR EACH ROW
  EXECUTE FUNCTION update_paper_trades_updated_at();

-- Function to calculate realized metrics when closing a trade
CREATE OR REPLACE FUNCTION calculate_paper_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if trade is being closed
  IF NEW.status = 'closed' AND OLD.status = 'open' AND NEW.exit_price IS NOT NULL THEN
    -- Calculate realized P&L
    IF NEW.recommendation_type = 'long' THEN
      NEW.realized_pnl = (NEW.exit_price - NEW.entry_price) * NEW.shares;
      NEW.realized_r_multiple = (NEW.exit_price - NEW.entry_price) / (NEW.entry_price - NEW.stop_loss);
    ELSE -- short
      NEW.realized_pnl = (NEW.entry_price - NEW.exit_price) * NEW.shares;
      NEW.realized_r_multiple = (NEW.entry_price - NEW.exit_price) / (NEW.stop_loss - NEW.entry_price);
    END IF;

    -- Set closed_at timestamp
    NEW.closed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_paper_trade_metrics_trigger
  BEFORE UPDATE ON paper_trades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_paper_trade_metrics();

-- Comments
COMMENT ON TABLE paper_trades IS 'Tracks paper trading performance for analytics and algorithm validation';
COMMENT ON COLUMN paper_trades.setup_type IS 'Type of setup: Channel Bounce, Breakout, Pullback, etc.';
COMMENT ON COLUMN paper_trades.predicted_r_multiple IS 'Expected R:R from recommendation (target-entry)/(entry-stop)';
COMMENT ON COLUMN paper_trades.realized_r_multiple IS 'Actual R:R achieved (exit-entry)/(entry-stop)';
COMMENT ON VIEW paper_trading_performance IS 'Aggregated performance metrics by setup type and pattern';
