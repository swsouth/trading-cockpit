/**
 * Enhanced Vetting System Migration
 *
 * Adds vetting results to trade_recommendations table
 * Stores 20-point checklist breakdown and overall vetting score
 */

-- Add vetting columns to trade_recommendations
ALTER TABLE trade_recommendations
ADD COLUMN IF NOT EXISTS vetting_score INTEGER,  -- 0-100 overall vetting score
ADD COLUMN IF NOT EXISTS vetting_passed BOOLEAN,  -- true if score >= 70
ADD COLUMN IF NOT EXISTS vetting_summary TEXT,  -- Human-readable summary
ADD COLUMN IF NOT EXISTS vetting_red_flags TEXT[],  -- Array of red flag messages
ADD COLUMN IF NOT EXISTS vetting_green_flags TEXT[],  -- Array of green flag messages
ADD COLUMN IF NOT EXISTS vetting_checks JSONB;  -- Full breakdown of all 20 checks

-- Add index on vetting_score for filtering
CREATE INDEX IF NOT EXISTS idx_trade_recommendations_vetting_score
ON trade_recommendations(vetting_score DESC);

-- Add index on vetting_passed for quick filtering
CREATE INDEX IF NOT EXISTS idx_trade_recommendations_vetting_passed
ON trade_recommendations(vetting_passed);

-- Add comment explaining vetting system
COMMENT ON COLUMN trade_recommendations.vetting_score IS
'Enhanced vetting score (0-100) from 20-point checklist: Technical (40pts), Fundamental (30pts), Sentiment (20pts), Timing (10pts)';

COMMENT ON COLUMN trade_recommendations.vetting_checks IS
'Full breakdown of vetting checklist with individual check results, scores, and details';
