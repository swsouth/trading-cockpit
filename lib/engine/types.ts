/**
 * Analysis Engine - Core Type Definitions
 *
 * Standardized types used across the entire analysis engine.
 * These types ensure consistency across all scanners and displays.
 */

import { Candle } from '../types';

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AnalysisConfig {
  // Asset type
  assetType: 'stock' | 'crypto';
  timeframe: 'daily' | 'intraday';

  // Minimum score threshold (signals below this are filtered out)
  minScore: number;         // 0-100 (default: 60)

  // Channel detection parameters
  channel: {
    minTouches: number;      // Minimum support + resistance touches
    maxOutOfBand: number;    // Max % price can be outside channel
    minWidth: number;        // Min % channel width
    maxWidth: number;        // Max % channel width
  };

  // Risk management parameters
  risk: {
    maxStopLoss: number;     // Max % stop loss
    minRiskReward: number;   // Minimum R:R ratio
    maxRisk: number;         // Max % portfolio risk per trade
  };

  // Pre-trade filters
  filters: {
    minADV: number;          // Minimum average daily volume ($)
    maxSpread: number;       // Maximum bid-ask spread %
    earningsBuffer: number;  // Days to avoid before/after earnings
  };

  // Scoring weights (must sum to 1.0)
  scoring: {
    trendWeight: number;     // 0-1
    patternWeight: number;   // 0-1
    volumeWeight: number;    // 0-1
    riskRewardWeight: number; // 0-1
    momentumWeight: number;  // 0-1
  };
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface AnalysisInput {
  symbol: string;
  candles: Candle[];
  currentPrice: number;
  volume24h?: number;       // For crypto
  marketCap?: number;       // For stocks
  weeklyCandles?: Candle[]; // Phase 2: Multi-timeframe analysis
}

// ============================================================================
// PATTERN TYPES
// ============================================================================

export type PatternType =
  // Candlestick patterns (current)
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'hammer'
  | 'shooting_star'
  | 'doji'
  | 'piercing_line'
  | 'dark_cloud_cover'
  // Chart patterns (Phase 2 - NOW IMPLEMENTED!)
  | 'double_bottom'
  | 'double_top'
  | 'bull_flag'
  | 'bear_flag'
  | 'ascending_triangle'
  | 'descending_triangle'
  | 'symmetrical_triangle'
  | 'head_and_shoulders'
  | 'inverse_head_and_shoulders'
  | 'cup_and_handle'
  // Chart patterns (Phase 2+ - future)
  | 'rectangle'
  | 'wedge_rising'
  | 'wedge_falling'
  | 'pennant'
  // Trend patterns
  | 'channel'
  | 'trendline_support'
  | 'trendline_resistance';

export interface PatternResult {
  type: PatternType;
  confidence: number;       // 0-1
  data: Record<string, any>; // Pattern-specific data
}

export interface PatternMetadata {
  name: string;
  winRate: number;          // Historical win rate (0-1)
  avgRiskReward: number;    // Average R:R ratio
  reliability: 'very_high' | 'high' | 'medium' | 'low';
  eocReference?: string;    // EOC book reference
}

// ============================================================================
// REGIME TYPES
// ============================================================================

export type MarketRegime =
  | 'trending_bullish'      // ADX > 25, slope > 1%
  | 'trending_bearish'      // ADX > 25, slope < -1%
  | 'ranging_high_vol'      // ADX < 20, ATR high
  | 'ranging_low_vol'       // ADX < 20, ATR low
  | 'transitional';         // Otherwise

export interface RegimeAnalysis {
  type: MarketRegime;
  strength: number;         // 0-1
  weeklyTrend?: 'up' | 'down' | 'sideways'; // Multi-timeframe
  adx: number;
  atr: number;
  volatility: 'low' | 'medium' | 'high';
}

// ============================================================================
// TRADE SETUP TYPES
// ============================================================================

export interface TradeSetup {
  direction: 'long' | 'short';
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  rationale: string;
}

// ============================================================================
// SCORING TYPES
// ============================================================================

export interface ScoreComponents {
  trendScore: number;       // 0-30
  patternScore: number;     // 0-25
  volumeScore: number;      // 0-20
  riskRewardScore: number;  // 0-15
  momentumScore: number;    // 0-10
}

export interface OpportunityScore {
  total: number;            // 0-100
  components: ScoreComponents;
  level: 'high' | 'medium' | 'low'; // high: 75+, medium: 60-74, low: <60
}

// ============================================================================
// SIGNAL OUTPUT (Final Result)
// ============================================================================

export interface Signal {
  // Basic info
  symbol: string;
  recommendation: 'long' | 'short' | null;

  // Trade setup
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;

  // Analysis results
  score: number;            // 0-100
  confidence: 'high' | 'medium' | 'low';
  rationale: string;

  // Detected patterns
  patterns: PatternType[];
  mainPattern?: PatternType; // Primary pattern driving the signal

  // Market context
  regime: MarketRegime;

  // Metadata
  metadata: {
    channelStatus?: 'near_support' | 'near_resistance' | 'inside' | 'broken_out' | null;
    volumeConfirmation: boolean;
    weeklyTrend?: 'up' | 'down' | 'sideways';
    analysisVersion?: string; // Engine version for tracking
    // Multi-timeframe analysis (Phase 2)
    trendAlignment?: 'aligned' | 'divergent' | 'neutral';
    weeklySupport?: number;
    weeklyResistance?: number;
    confluenceZones?: number; // Count of confluence zones
  };

  // Timestamps
  analyzedAt: Date;
  expiresAt?: Date;         // For intraday signals
}

// ============================================================================
// INDICATOR TYPES
// ============================================================================

export interface Indicators {
  ema50?: number;
  ema200?: number;
  rsi?: number;
  adx?: number;
  atr?: number;
  volume30DayAvg?: number;
  volumeCurrent?: number;
}

// ============================================================================
// ENGINE OPTIONS
// ============================================================================

export interface EngineOptions {
  assetType: 'stock' | 'crypto';
  timeframe: 'daily' | 'intraday';
  config?: Partial<AnalysisConfig>; // Override default config
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PriceComparison {
  value: 'equal' | 'above' | 'below';
  difference: number;       // Absolute difference
  percentDifference: number; // Percentage difference
}

// Deterministic comparison with epsilon tolerance
export const EPSILON = 0.0001;

export function comparePrice(a: number, b: number): PriceComparison {
  const diff = a - b;
  const absDiff = Math.abs(diff);
  const pctDiff = (diff / b) * 100;

  if (absDiff < EPSILON) {
    return { value: 'equal', difference: 0, percentDifference: 0 };
  }

  return {
    value: a > b ? 'above' : 'below',
    difference: diff,
    percentDifference: pctDiff,
  };
}
