/*
  # Add Asset Type to Watchlist

  Adds asset_type column to watchlist_items to differentiate between stocks and crypto.

  1. Changes
    - Add asset_type column (stock or crypto)
    - Default existing items to 'stock'
    - Add check constraint to ensure valid values
*/

-- Add asset_type column
ALTER TABLE watchlist_items
ADD COLUMN IF NOT EXISTS asset_type TEXT DEFAULT 'stock';

-- Add constraint to ensure only valid asset types
ALTER TABLE watchlist_items
ADD CONSTRAINT valid_asset_type
CHECK (asset_type IN ('stock', 'crypto'));

-- Update any existing NULL values to 'stock'
UPDATE watchlist_items
SET asset_type = 'stock'
WHERE asset_type IS NULL;
