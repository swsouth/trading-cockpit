/**
 * Add Unique Constraint to Intraday Opportunities
 *
 * Prevents duplicate opportunities from being inserted when scanner runs multiple times.
 *
 * Constraint ensures one opportunity per:
 * - user_id (which user)
 * - symbol (which stock/crypto)
 * - asset_type (stock vs crypto)
 * - recommendation_type (long vs short)
 * - entry_price (ensures same setup isn't duplicated)
 *
 * This allows:
 * - Same symbol to have both LONG and SHORT setups
 * - Same symbol to be rescanned with different entry prices (market moved)
 * - Different users to have same opportunities
 *
 * But prevents:
 * - Duplicate entries from same scan run (same symbol, type, entry)
 * - Scanner running twice and inserting identical opportunity
 */

-- First, remove any existing duplicates before adding constraint
-- Keep the most recent entry for each unique combination
DELETE FROM intraday_opportunities
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY
          user_id,
          symbol,
          COALESCE(asset_type, 'stock'),
          recommendation_type,
          entry_price
        ORDER BY created_at DESC
      ) as rn
    FROM intraday_opportunities
  ) sub
  WHERE rn > 1
);

-- Add unique constraint on logical key fields
-- This prevents exact duplicates while allowing updates when market moves
CREATE UNIQUE INDEX idx_intraday_opportunities_unique
ON intraday_opportunities (
  user_id,
  symbol,
  COALESCE(asset_type, 'stock'),
  recommendation_type,
  entry_price
)
WHERE status = 'active';

-- Add comment explaining the constraint
COMMENT ON INDEX idx_intraday_opportunities_unique IS
'Prevents duplicate active opportunities. Allows same symbol to have multiple historical entries but only one active entry per type/price combination.';
