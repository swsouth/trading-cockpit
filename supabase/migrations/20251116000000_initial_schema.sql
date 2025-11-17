/*
  # Initial Schema - Trading Cockpit

  Creates all tables for the trading cockpit application.

  1. Tables
    - profiles
    - watchlist_items
    - ticker_notes
    - research_uploads
    - price_alerts
    - combined_signals

  2. Security
    - Enable RLS on all tables
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Watchlist items
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- Ticker notes
CREATE TABLE IF NOT EXISTS ticker_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  timeframe TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ticker_notes ENABLE ROW LEVEL SECURITY;

-- Research uploads
CREATE TABLE IF NOT EXISTS research_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  note TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE research_uploads ENABLE ROW LEVEL SECURITY;

-- Price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Combined signals
CREATE TABLE IF NOT EXISTS combined_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  detected_at DATE NOT NULL,
  bias TEXT NOT NULL,
  channel_status TEXT,
  main_pattern TEXT,
  notes TEXT[],
  cautions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol, timeframe)
);

ALTER TABLE combined_signals ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ticker_notes_user_id ON ticker_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_ticker_notes_symbol ON ticker_notes(symbol);
CREATE INDEX IF NOT EXISTS idx_research_uploads_user_id ON research_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_research_uploads_symbol ON research_uploads(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_combined_signals_user_id ON combined_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_combined_signals_symbol ON combined_signals(symbol);
