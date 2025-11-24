-- Create stock_prices table to store historical OHLC data
-- This eliminates redundant API calls and provides persistent data for charts/analysis

CREATE TABLE IF NOT EXISTS stock_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(12,4) NOT NULL,
  high DECIMAL(12,4) NOT NULL,
  low DECIMAL(12,4) NOT NULL,
  close DECIMAL(12,4) NOT NULL,
  volume BIGINT NOT NULL,
  adjusted_close DECIMAL(12,4),  -- For split/dividend adjustments
  data_source VARCHAR(20) DEFAULT 'fmp' NOT NULL,  -- Track where data came from
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate price records for same symbol/date
  CONSTRAINT unique_symbol_date UNIQUE (symbol, date)
);

-- Indexes for fast queries
CREATE INDEX idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX idx_stock_prices_date ON stock_prices(date DESC);
CREATE INDEX idx_stock_prices_symbol_date ON stock_prices(symbol, date DESC);

-- Comments for documentation
COMMENT ON TABLE stock_prices IS 'Historical OHLC price data for all stocks in scan universe';
COMMENT ON COLUMN stock_prices.symbol IS 'Stock ticker symbol (e.g., AAPL, MSFT)';
COMMENT ON COLUMN stock_prices.date IS 'Trading date for this price bar';
COMMENT ON COLUMN stock_prices.open IS 'Opening price';
COMMENT ON COLUMN stock_prices.high IS 'High price of the day';
COMMENT ON COLUMN stock_prices.low IS 'Low price of the day';
COMMENT ON COLUMN stock_prices.close IS 'Closing price';
COMMENT ON COLUMN stock_prices.volume IS 'Trading volume';
COMMENT ON COLUMN stock_prices.adjusted_close IS 'Split/dividend adjusted closing price';
COMMENT ON COLUMN stock_prices.data_source IS 'Source of the data (fmp, polygon, etc.)';

-- Row Level Security (RLS)
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read price data
CREATE POLICY "Allow authenticated users to read stock prices"
  ON stock_prices
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role can insert/update price data (via scanner)
CREATE POLICY "Only service_role can write stock prices"
  ON stock_prices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_prices_updated_at
  BEFORE UPDATE ON stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_prices_updated_at();
