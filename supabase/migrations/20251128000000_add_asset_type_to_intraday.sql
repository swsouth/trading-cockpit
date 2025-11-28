-- Add asset_type column to intraday_opportunities table
-- This allows us to separate stocks from crypto in the Day Trader UI

ALTER TABLE intraday_opportunities
ADD COLUMN IF NOT EXISTS asset_type TEXT DEFAULT 'stock' CHECK (asset_type IN ('stock', 'crypto'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_intraday_opportunities_asset_type
ON intraday_opportunities(asset_type);

-- Create index for combined queries (user + asset_type + status)
CREATE INDEX IF NOT EXISTS idx_intraday_opportunities_user_asset_status
ON intraday_opportunities(user_id, asset_type, status);

COMMENT ON COLUMN intraday_opportunities.asset_type IS 'Type of asset: stock or crypto. Default is stock for backward compatibility.';
