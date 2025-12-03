/**
 * Database Functions
 *
 * Handles fetching stock universe and storing recommendations
 */

import { createClient } from '@supabase/supabase-js';
import { StockAnalysisResult, RecommendationRecord } from './types';
import { calculateRSI } from '../../lib/scoring/indicators';

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment');
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Get active stocks from scan universe
 * Only returns stocks with status='active' (excludes paused/removed)
 */
export async function getActiveStocks(): Promise<string[]> {
  const { data, error } = await supabase
    .from('scan_universe')
    .select('symbol')
    .eq('status', 'active')
    .order('symbol');

  if (error) {
    throw new Error(`Failed to fetch stock universe: ${error.message}`);
  }

  return data.map(row => row.symbol);
}

/**
 * Update last scanned timestamp for a stock
 */
export async function updateLastScanned(symbol: string): Promise<void> {
  await supabase
    .from('scan_universe')
    .update({ last_scanned_at: new Date().toISOString() })
    .eq('symbol', symbol);
}

/**
 * Convert analysis result to database record
 */
function convertToRecord(
  result: StockAnalysisResult,
  scanDate: string
): RecommendationRecord | null {
  if (!result.recommendation || !result.score) {
    return null;
  }

  const { recommendation, score, vetting } = result;

  // Calculate expires_at (7 days from scan date)
  const expiresAt = new Date(scanDate);
  expiresAt.setDate(expiresAt.getDate() + 7);

  return {
    symbol: result.symbol,
    scan_date: scanDate,
    recommendation_type: recommendation.setup.type as 'long' | 'short',
    setup_type: recommendation.setup.setupName,
    timeframe: recommendation.timeframe,
    entry_price: recommendation.entry,
    target_price: recommendation.target,
    stop_loss: recommendation.stopLoss,
    risk_amount: recommendation.riskAmount,
    reward_amount: recommendation.rewardAmount,
    risk_reward_ratio: recommendation.riskRewardRatio,
    opportunity_score: score.totalScore,
    confidence_level: score.confidenceLevel,
    current_price: recommendation.currentPrice,
    channel_status: recommendation.channelSupport ? 'in_channel' : null,
    pattern_detected: null, // Will be extracted from recommendation if needed
    volume_status: null, // Will be extracted from score if needed
    rsi: null, // Can calculate from candles if needed
    trend: null, // Can determine from setup type
    rationale: recommendation.rationale,
    expires_at: expiresAt.toISOString(),
    // Enhanced vetting fields
    vetting_score: vetting?.overallScore || null,
    vetting_passed: vetting?.passed || null,
    vetting_summary: vetting?.summary || null,
    vetting_red_flags: vetting?.redFlags || null,
    vetting_green_flags: vetting?.greenFlags || null,
    vetting_checks: vetting?.checks || null,
  };
}

// Removed deactivateOldRecommendations - relying on natural expiration via expires_at timestamp
// Recommendations now persist for 7 days and accumulate throughout the week (Mon+Tue+Wed+Thu+Fri)

/**
 * Store recommendations in database
 */
export async function storeRecommendations(
  results: StockAnalysisResult[],
  scanDate: string
): Promise<number> {
  // Convert results to database records
  const records = results
    .map(result => convertToRecord(result, scanDate))
    .filter((record): record is RecommendationRecord => record !== null);

  if (records.length === 0) {
    console.log('No recommendations to store');
    return 0;
  }

  // Insert in batches of 100 (recommendations accumulate throughout the week)
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const { error } = await supabase
      .from('trade_recommendations')
      .upsert(batch, {
        onConflict: 'symbol,scan_date',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  return inserted;
}

/**
 * Clean up old recommendations
 */
export async function cleanupOldRecommendations(daysToKeep: number = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const { error } = await supabase
    .from('trade_recommendations')
    .delete()
    .lt('scan_date', cutoffDate.toISOString().split('T')[0]);

  if (error) {
    console.error('Error cleaning up old recommendations:', error.message);
  }
}
