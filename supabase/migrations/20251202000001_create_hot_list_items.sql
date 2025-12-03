-- Create hot_list_items table
-- Allows users to pin/save trade recommendations to their personal "Hot List"
-- Persists beyond the 7-day expiration of regular recommendations

CREATE TABLE IF NOT EXISTS hot_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES trade_recommendations(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT NULL,  -- Optional user notes about why they pinned this
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure each user can only pin a recommendation once
  CONSTRAINT unique_user_recommendation UNIQUE(user_id, recommendation_id)
);

-- Indexes for fast queries
CREATE INDEX idx_hot_list_user_id ON hot_list_items(user_id);
CREATE INDEX idx_hot_list_recommendation_id ON hot_list_items(recommendation_id);
CREATE INDEX idx_hot_list_pinned_at ON hot_list_items(pinned_at DESC);

-- Composite index for user's hot list ordered by pin time
CREATE INDEX idx_hot_list_user_pinned ON hot_list_items(user_id, pinned_at DESC);

-- Enable Row Level Security
ALTER TABLE hot_list_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own hot list items
CREATE POLICY "Users can view own hot list items"
  ON hot_list_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can add to their own hot list
CREATE POLICY "Users can add to own hot list"
  ON hot_list_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove from their own hot list
CREATE POLICY "Users can remove from own hot list"
  ON hot_list_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own hot list items (e.g., edit notes)
CREATE POLICY "Users can update own hot list items"
  ON hot_list_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE hot_list_items IS 'User-pinned trade recommendations that persist beyond 7-day expiration';
COMMENT ON COLUMN hot_list_items.user_id IS 'User who pinned this recommendation';
COMMENT ON COLUMN hot_list_items.recommendation_id IS 'Reference to trade_recommendations table';
COMMENT ON COLUMN hot_list_items.pinned_at IS 'When the user pinned this recommendation';
COMMENT ON COLUMN hot_list_items.notes IS 'Optional user notes about this pinned recommendation';
