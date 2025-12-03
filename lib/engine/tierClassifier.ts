/**
 * Tier Classifier
 *
 * Classifies intraday trading setups into tiers based on confluence of factors:
 * - SCALP: 1-2% target, 5-15 min hold (60% of setups)
 * - STANDARD: 2-3% target, 15-30 min hold (35% of setups)
 * - MOMENTUM: 3-5% target, 30-60 min hold (5% of setups)
 */

import { Candle } from '../types';

export type SetupTier = 'SCALP' | 'STANDARD' | 'MOMENTUM';

export interface TierClassification {
  tier: SetupTier;
  targetPercent: number;
  expectedHoldMinutes: number;
  rationale: string;
  score: number; // 0-100 confidence in tier classification
}

export interface TierInput {
  volume: number;
  avgVolume: number;
  pattern: string | null;
  channelStatus: string | null;
  rsi: number | null;
  atr: number;
  avgATR: number;
  gapPercent: number;
  candles: Candle[];
  hasChannel: boolean;
}

/**
 * Calculate volume ratio compared to average
 */
function getVolumeRatio(volume: number, avgVolume: number): number {
  if (avgVolume === 0) return 1;
  return volume / avgVolume;
}

/**
 * Calculate ATR expansion ratio
 */
function getATRExpansion(atr: number, avgATR: number): number {
  if (avgATR === 0) return 1;
  return atr / avgATR;
}

/**
 * Check if pattern is strong (bullish/bearish signals)
 */
function isStrongPattern(pattern: string | null): boolean {
  if (!pattern) return false;

  const strongPatterns = [
    'bullish_engulfing',
    'bearish_engulfing',
    'hammer',
    'shooting_star',
    'piercing_line',
    'dark_cloud_cover',
  ];

  return strongPatterns.includes(pattern);
}

/**
 * Check if in breakout from consolidation (3+ days tight range)
 */
function isBreakoutFromConsolidation(candles: Candle[]): boolean {
  if (candles.length < 20) return false;

  // Look at last 20 bars (roughly 3-4 days of 5-min bars for intraday)
  const recentCandles = candles.slice(-20);
  const prices = recentCandles.map(c => c.close);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const range = high - low;
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const rangePercent = (range / avgPrice) * 100;

  // Consolidation = tight range (< 2% over period)
  const isConsolidation = rangePercent < 2.0;

  // Breakout = current price breaking above recent high
  const currentPrice = candles[candles.length - 1].close;
  const isBreakingOut = currentPrice > high * 0.99; // Within 1% of high

  return isConsolidation && isBreakingOut;
}

/**
 * Check if RSI is in "launch zone" for given direction
 */
function isRSIInLaunchZone(rsi: number | null, direction: 'long' | 'short'): boolean {
  if (rsi === null) return false;

  if (direction === 'long') {
    // Long launch zone: 30-50 (oversold recovering, not overbought)
    return rsi >= 30 && rsi <= 50;
  } else {
    // Short launch zone: 50-70 (overbought starting, not oversold)
    return rsi >= 50 && rsi <= 70;
  }
}

/**
 * Classify setup into tier based on objective criteria
 */
export function classifySetupTier(
  input: TierInput,
  direction: 'long' | 'short' = 'long'
): TierClassification {
  const {
    volume,
    avgVolume,
    pattern,
    channelStatus,
    rsi,
    atr,
    avgATR,
    gapPercent,
    candles,
    hasChannel,
  } = input;

  // Calculate key metrics
  const volumeRatio = getVolumeRatio(volume, avgVolume);
  const atrExpansion = getATRExpansion(atr, avgATR);
  const strongPattern = isStrongPattern(pattern);
  const breakout = isBreakoutFromConsolidation(candles);
  const rsiLaunch = isRSIInLaunchZone(rsi, direction);
  const nearSupport = channelStatus === 'near_support' || channelStatus === 'near_resistance';
  const gapFollowThrough = Math.abs(gapPercent) > 1.5;

  // Score each factor (0-100)
  let score = 0;
  const reasons: string[] = [];

  // --- TIER 3 (MOMENTUM) CRITERIA --- ALL must be true
  // Requires exceptional confluence
  const momentumCriteria = {
    highVolume: volumeRatio >= 2.0,
    atrExpansion: atrExpansion >= 1.5,
    breakout: breakout,
    gap: gapFollowThrough,
    strongPattern: strongPattern,
    rsiOK: rsi !== null && rsi < 70, // Not overbought
  };

  const momentumCount = Object.values(momentumCriteria).filter(Boolean).length;

  if (momentumCount >= 5) {
    // TIER 3: MOMENTUM
    score = 80 + momentumCount * 3; // 80-98 range

    if (momentumCriteria.highVolume) reasons.push('High volume (2x+)');
    if (momentumCriteria.atrExpansion) reasons.push('Volatility expansion');
    if (momentumCriteria.breakout) reasons.push('Breakout from consolidation');
    if (momentumCriteria.gap) reasons.push('Gap follow-through');
    if (momentumCriteria.strongPattern) reasons.push('Strong pattern');

    return {
      tier: 'MOMENTUM',
      targetPercent: 4.0, // 4% target
      expectedHoldMinutes: 45, // 30-60 min
      rationale: `Tier 3 (Momentum) — ${reasons.join(', ')}`,
      score,
    };
  }

  // --- TIER 2 (STANDARD) CRITERIA --- At least 3 of 5
  const standardCriteria = {
    goodVolume: volumeRatio >= 1.5,
    strongPattern: strongPattern,
    nearKey: nearSupport && hasChannel,
    rsiLaunch: rsiLaunch,
    normalATR: atrExpansion >= 0.8 && atrExpansion <= 1.3, // Normal volatility
  };

  const standardCount = Object.values(standardCriteria).filter(Boolean).length;

  if (standardCount >= 3) {
    // TIER 2: STANDARD
    score = 60 + standardCount * 5; // 60-85 range

    if (standardCriteria.goodVolume) reasons.push('Above-average volume');
    if (standardCriteria.strongPattern) reasons.push(`Strong pattern (${pattern})`);
    if (standardCriteria.nearKey) reasons.push('Near key support/resistance');
    if (standardCriteria.rsiLaunch) reasons.push('RSI in launch zone');

    return {
      tier: 'STANDARD',
      targetPercent: 2.5, // 2.5% target
      expectedHoldMinutes: 20, // 15-30 min
      rationale: `Tier 2 (Standard) — ${reasons.join(', ')}`,
      score,
    };
  }

  // --- TIER 1 (SCALP) --- Default for all other setups
  score = 40 + standardCount * 5; // 40-65 range

  if (volumeRatio >= 1.0) reasons.push('Normal volume');
  if (pattern) reasons.push(`Pattern: ${pattern}`);
  if (hasChannel) reasons.push('Channel structure');

  if (reasons.length === 0) {
    reasons.push('Conservative setup, normal conditions');
  }

  return {
    tier: 'SCALP',
    targetPercent: 1.5, // 1.5% target
    expectedHoldMinutes: 10, // 5-15 min
    rationale: `Tier 1 (Scalp) — ${reasons.join(', ')}`,
    score,
  };
}

/**
 * Get tier configuration (target %, stop %, R:R, hold time)
 */
export function getTierConfig(tier: SetupTier) {
  switch (tier) {
    case 'MOMENTUM':
      return {
        targetPercent: 4.0,
        stopPercent: 1.5,
        riskRewardRatio: 2.67,
        holdMinutes: 45,
        minHoldMinutes: 30,
        maxHoldMinutes: 60,
      };
    case 'STANDARD':
      return {
        targetPercent: 2.5,
        stopPercent: 1.2,
        riskRewardRatio: 2.08,
        holdMinutes: 20,
        minHoldMinutes: 15,
        maxHoldMinutes: 30,
      };
    case 'SCALP':
    default:
      return {
        targetPercent: 1.5,
        stopPercent: 1.0,
        riskRewardRatio: 1.5,
        holdMinutes: 10,
        minHoldMinutes: 5,
        maxHoldMinutes: 15,
      };
  }
}
