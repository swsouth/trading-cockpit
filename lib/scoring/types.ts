/**
 * Scoring System Type Definitions
 *
 * Defines types for the enhanced 0-100 scoring algorithm
 * that evaluates trade opportunities based on multiple factors
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult } from '../types';

/**
 * Volume analysis result
 */
export interface VolumeAnalysis {
  last5DaysAvg: number;
  last30DaysAvg: number;
  currentVolume: number;
  volumeRatio: number; // recent / historical
  status: 'high' | 'average' | 'low';
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: 'uptrend' | 'downtrend' | 'sideways';
  slope: number; // Rate of change
  strength: number; // 0-1, how strong the trend is
  channelClarity: number; // 0-1, how well-defined the channel is
}

/**
 * Momentum indicators
 */
export interface MomentumIndicators {
  rsi: number; // Relative Strength Index (0-100)
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
}

/**
 * Individual scoring components
 */
export interface ScoringComponents {
  trendStrength: number;    // 0-30 points
  patternQuality: number;   // 0-25 points
  volumeScore: number;      // 0-20 points
  riskRewardScore: number;  // 0-15 points
  momentumScore: number;    // 0-10 points
  absorptionScore?: number; // 0-10 points (optional - requires order flow data)
}

/**
 * Complete scoring result
 */
export interface OpportunityScore {
  totalScore: number;           // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  components: ScoringComponents;
  breakdown: {
    trendStrength: string;
    patternQuality: string;
    volumeScore: string;
    riskRewardScore: string;
    momentumScore: string;
    absorptionScore?: string; // Optional - only if absorption detected
  };
}

/**
 * Input data for scoring
 */
export interface ScoringInput {
  candles: Candle[];
  channel: ChannelDetectionResult;
  pattern: PatternDetectionResult;
  volume: VolumeAnalysis;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
}

/**
 * Risk/Reward calculation result
 */
export interface RiskRewardMetrics {
  entry: number;
  target: number;
  stop: number;
  risk: number;        // $ amount at risk
  reward: number;      // $ potential profit
  ratio: number;       // reward / risk
  riskPercent: number; // % risk from entry
  rewardPercent: number; // % reward from entry
}
