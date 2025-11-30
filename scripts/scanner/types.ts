/**
 * Scanner Types
 *
 * Type definitions for the daily market scanner
 */

import { TradeRecommendation } from '../../lib/tradeCalculator';
import { OpportunityScore } from '../../lib/scoring';
import { Candle } from '../../lib/types';
import { VettingResult } from '../../lib/vetting/types';

/**
 * Single stock analysis result
 */
export interface StockAnalysisResult {
  symbol: string;
  success: boolean;
  error?: string;
  recommendation?: TradeRecommendation;
  score?: OpportunityScore;
  vetting?: VettingResult | null;  // Enhanced vetting results (20-point checklist)
  candles?: Candle[];  // Store the fetched price data for database storage
}

/**
 * Scanner configuration
 */
export interface ScannerConfig {
  batchSize: number;           // Stocks to process per batch
  batchDelayMs: number;        // Delay between batches (rate limiting)
  minScore: number;            // Minimum opportunity score to save
  maxRecommendations: number;  // Maximum recommendations to store
  lookbackDays: number;        // Days of historical data to fetch
}

/**
 * Scanner statistics
 */
export interface ScannerStats {
  totalStocks: number;
  processed: number;
  successful: number;
  failed: number;
  opportunities: number;
  saved: number;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
}

/**
 * Database recommendation record (for insertion)
 */
export interface RecommendationRecord {
  symbol: string;
  scan_date: string;
  recommendation_type: 'long' | 'short';
  setup_type: string;
  timeframe: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_amount: number;
  reward_amount: number;
  risk_reward_ratio: number;
  opportunity_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  current_price: number;
  channel_status: string | null;
  pattern_detected: string | null;
  volume_status: string | null;
  rsi: number | null;
  trend: string | null;
  rationale: string;
  expires_at: string;
  // Enhanced vetting fields
  vetting_score: number | null;
  vetting_passed: boolean | null;
  vetting_summary: string | null;
  vetting_red_flags: string[] | null;
  vetting_green_flags: string[] | null;
  vetting_checks: any | null;  // JSONB
}
