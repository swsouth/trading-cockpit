/**
 * Main Scoring Module
 *
 * Orchestrates all scoring components to produce a final 0-100 opportunity score
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult } from '../types';
import {
  OpportunityScore,
  ScoringComponents,
  ScoringInput,
  VolumeAnalysis,
} from './types';
import {
  scoreTrendStrength,
  scorePatternQuality,
  scoreVolumeConfirmation,
  scoreRiskReward,
  scoreMomentum,
  calculateRiskRewardMetrics,
} from './components';
import { analyzeVolume } from './indicators';

/**
 * Calculate comprehensive opportunity score (0-100)
 *
 * @param input - All required data for scoring
 * @returns Complete scoring result with breakdown
 */
export function calculateOpportunityScore(input: ScoringInput): OpportunityScore {
  const { candles, channel, pattern, volume, entryPrice, targetPrice, stopLoss } = input;

  // Calculate risk/reward metrics
  const rrMetrics = calculateRiskRewardMetrics(entryPrice, targetPrice, stopLoss);

  // Determine setup type based on entry vs target
  const setupType: 'long' | 'short' = targetPrice > entryPrice ? 'long' : 'short';

  // Calculate each scoring component
  const trendStrength = scoreTrendStrength(candles, channel);
  const patternQuality = scorePatternQuality(pattern);
  const volumeScore = scoreVolumeConfirmation(volume);
  const riskRewardScore = scoreRiskReward(rrMetrics);
  const momentumScore = scoreMomentum(candles, setupType);

  // Sum all components
  const totalScore = Math.min(
    100,
    trendStrength + patternQuality + volumeScore + riskRewardScore + momentumScore
  );

  // Calculate confidence level
  const confidenceLevel = calculateConfidenceLevel(totalScore);

  // Create component breakdown
  const components: ScoringComponents = {
    trendStrength,
    patternQuality,
    volumeScore,
    riskRewardScore,
    momentumScore,
  };

  // Create human-readable breakdown
  const breakdown = {
    trendStrength: `${trendStrength}/30 - ${getTrendStrengthLabel(trendStrength)}`,
    patternQuality: `${patternQuality}/25 - ${getPatternQualityLabel(pattern.mainPattern)}`,
    volumeScore: `${volumeScore}/20 - ${getVolumeLabel(volume.status)}`,
    riskRewardScore: `${riskRewardScore}/15 - ${getRiskRewardLabel(rrMetrics.ratio)}`,
    momentumScore: `${momentumScore}/10 - ${getMomentumLabel(momentumScore)}`,
  };

  return {
    totalScore: Math.round(totalScore),
    confidenceLevel,
    components,
    breakdown,
  };
}

/**
 * Calculate confidence level based on total score
 *
 * - High: 75+
 * - Medium: 60-74
 * - Low: <60
 */
export function calculateConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * Simplified scoring function that auto-calculates volume
 * This is useful when you don't have pre-calculated volume analysis
 */
export function calculateOpportunityScoreSimple(
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  entryPrice: number,
  targetPrice: number,
  stopLoss: number
): OpportunityScore {
  const volume = analyzeVolume(candles);

  return calculateOpportunityScore({
    candles,
    channel,
    pattern,
    volume,
    entryPrice,
    targetPrice,
    stopLoss,
  });
}

// Helper functions for breakdown labels

function getTrendStrengthLabel(score: number): string {
  if (score >= 25) return 'Strong trend with clear channel';
  if (score >= 20) return 'Good trend structure';
  if (score >= 15) return 'Moderate trend';
  if (score >= 10) return 'Weak trend';
  return 'Poor trend structure';
}

function getPatternQualityLabel(pattern: string): string {
  const labels: Record<string, string> = {
    'bullish_engulfing': 'Strong bullish reversal',
    'bearish_engulfing': 'Strong bearish reversal',
    'hammer': 'Bullish hammer',
    'shooting_star': 'Bearish shooting star',
    'piercing_line': 'Bullish piercing',
    'dark_cloud_cover': 'Bearish dark cloud',
    'doji': 'Indecision doji',
    'none': 'No clear pattern',
  };
  return labels[pattern] || 'Unknown pattern';
}

function getVolumeLabel(status: string): string {
  const labels: Record<string, string> = {
    'high': 'High volume confirmation',
    'average': 'Average volume',
    'low': 'Low volume warning',
  };
  return labels[status] || 'Unknown volume';
}

function getRiskRewardLabel(ratio: number): string {
  if (ratio >= 3) return `Excellent (${ratio.toFixed(1)}:1)`;
  if (ratio >= 2) return `Good (${ratio.toFixed(1)}:1)`;
  if (ratio >= 1.5) return `Acceptable (${ratio.toFixed(1)}:1)`;
  return `Poor (${ratio.toFixed(1)}:1)`;
}

function getMomentumLabel(score: number): string {
  if (score >= 9) return 'Ideal momentum';
  if (score >= 7) return 'Good momentum';
  if (score >= 5) return 'Neutral momentum';
  return 'Weak momentum';
}

// Re-export types and functions for convenience
export * from './types';
export * from './indicators';
export * from './components';
