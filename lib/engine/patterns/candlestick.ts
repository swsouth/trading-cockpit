/**
 * Candlestick Pattern Detection
 *
 * Detects 7 core candlestick reversal patterns with confidence scoring.
 * Based on EOC (Encyclopedia of Chart Patterns) criteria and current implementation.
 *
 * Pattern Win Rates (from EOC):
 * - Bullish Engulfing: 63%
 * - Bearish Engulfing: 61%
 * - Hammer: 60%
 * - Shooting Star: 58%
 * - Doji: 55% (neutral, context-dependent)
 * - Piercing Line: 67%
 * - Dark Cloud Cover: 64%
 */

import { Candle } from '../../types';
import { PatternResult, PatternType, RegimeAnalysis } from '../types';

export interface CandlestickPattern {
  type: PatternType;
  confidence: number; // 0-1
  winRate: number; // Historical win rate from EOC
  direction: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Pattern detection thresholds
 * Crypto 15-min bars have smaller bodies and more wick volatility than stock daily bars
 */
interface PatternThresholds {
  engulfingBodyRatio: number;    // Minimum body ratio for engulfing patterns
  hammerShadowRatio: number;     // Minimum shadow:body ratio for hammer/shooting star
  hammerBodyMinPct: number;      // Minimum body size as % of range
  dojiBodyMaxPct: number;        // Maximum body size as % of range for doji
}

const STOCK_THRESHOLDS: PatternThresholds = {
  engulfingBodyRatio: 0.8,
  hammerShadowRatio: 2.0,
  hammerBodyMinPct: 0.2,
  dojiBodyMaxPct: 0.1,
};

const CRYPTO_THRESHOLDS: PatternThresholds = {
  engulfingBodyRatio: 0.6,  // Relaxed from 0.8 (crypto has smaller bodies)
  hammerShadowRatio: 1.5,   // Relaxed from 2.0 (crypto has more wicks)
  hammerBodyMinPct: 0.15,   // Relaxed from 0.2
  dojiBodyMaxPct: 0.15,     // Increased from 0.1 (crypto bars are noisier)
};

/**
 * Detect candlestick patterns in the most recent candles
 * Returns array of detected patterns, sorted by confidence
 *
 * @param candles - Historical candle data
 * @param regime - Market regime analysis (optional)
 * @param assetType - 'stock' or 'crypto' to use appropriate thresholds
 */
export function detectCandlestickPatterns(
  candles: Candle[],
  regime?: RegimeAnalysis,
  assetType: 'stock' | 'crypto' = 'stock'
): PatternResult[] {
  if (candles.length < 2) {
    return [];
  }

  const patterns: CandlestickPattern[] = [];
  const thresholds = assetType === 'crypto' ? CRYPTO_THRESHOLDS : STOCK_THRESHOLDS;

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // Check each pattern with asset-specific thresholds
  const bullishEngulfing = checkBullishEngulfing(last, prev, thresholds);
  if (bullishEngulfing) patterns.push(bullishEngulfing);

  const bearishEngulfing = checkBearishEngulfing(last, prev, thresholds);
  if (bearishEngulfing) patterns.push(bearishEngulfing);

  const hammer = checkHammer(last, thresholds);
  if (hammer) patterns.push(hammer);

  const shootingStar = checkShootingStar(last, thresholds);
  if (shootingStar) patterns.push(shootingStar);

  const doji = checkDoji(last, thresholds);
  if (doji) patterns.push(doji);

  const piercingLine = checkPiercingLine(last, prev);
  if (piercingLine) patterns.push(piercingLine);

  const darkCloudCover = checkDarkCloudCover(last, prev);
  if (darkCloudCover) patterns.push(darkCloudCover);

  // Adjust confidence based on market regime
  if (regime) {
    patterns.forEach(pattern => {
      pattern.confidence = adjustConfidenceForRegime(pattern, regime);
    });
  }

  // Sort by confidence descending
  patterns.sort((a, b) => b.confidence - a.confidence);

  // Convert to PatternResult
  return patterns.map(p => ({
    type: p.type,
    confidence: p.confidence,
    data: {
      winRate: p.winRate,
      direction: p.direction,
    },
  }));
}

// ============================================================================
// PATTERN DETECTION FUNCTIONS
// ============================================================================

function checkBullishEngulfing(
  last: Candle,
  prev: Candle,
  thresholds: PatternThresholds
): CandlestickPattern | null {
  const lastBody = Math.abs(last.close - last.open);
  const prevBody = Math.abs(prev.close - prev.open);

  const isBearishCandle = prev.close < prev.open;
  const isBullishCandle = last.close > last.open;

  // Bullish Engulfing criteria:
  // 1. Previous candle is bearish
  // 2. Current candle is bullish
  // 3. Current opens at or below previous close
  // 4. Current closes at or above previous open
  // 5. Current body is at least [threshold]% of previous body
  if (
    isBearishCandle &&
    isBullishCandle &&
    last.open <= prev.close &&
    last.close >= prev.open &&
    lastBody > prevBody * thresholds.engulfingBodyRatio
  ) {
    // Calculate confidence based on engulfing strength
    const engulfingRatio = lastBody / prevBody;
    const baseConfidence = 0.7; // Base confidence for valid pattern
    const bonusConfidence = Math.min((engulfingRatio - 1) * 0.2, 0.25); // Up to +0.25 for strong engulfing

    return {
      type: 'bullish_engulfing',
      confidence: Math.min(baseConfidence + bonusConfidence, 0.95),
      winRate: 0.63,
      direction: 'bullish',
    };
  }

  return null;
}

function checkBearishEngulfing(
  last: Candle,
  prev: Candle,
  thresholds: PatternThresholds
): CandlestickPattern | null {
  const lastBody = Math.abs(last.close - last.open);
  const prevBody = Math.abs(prev.close - prev.open);

  const isBullishCandle = prev.close > prev.open;
  const isBearishCandle = last.close < last.open;

  // Bearish Engulfing criteria (mirror of bullish)
  if (
    isBullishCandle &&
    isBearishCandle &&
    last.open >= prev.close &&
    last.close <= prev.open &&
    lastBody > prevBody * thresholds.engulfingBodyRatio
  ) {
    const engulfingRatio = lastBody / prevBody;
    const baseConfidence = 0.7;
    const bonusConfidence = Math.min((engulfingRatio - 1) * 0.2, 0.25);

    return {
      type: 'bearish_engulfing',
      confidence: Math.min(baseConfidence + bonusConfidence, 0.95),
      winRate: 0.61,
      direction: 'bearish',
    };
  }

  return null;
}

function checkHammer(last: Candle, thresholds: PatternThresholds): CandlestickPattern | null {
  const body = Math.abs(last.close - last.open);
  const range = last.high - last.low;
  const upperShadow = last.high - Math.max(last.open, last.close);
  const lowerShadow = Math.min(last.open, last.close) - last.low;

  const isBullishCandle = last.close > last.open;

  // Hammer criteria:
  // 1. Bullish candle
  // 2. Lower shadow > [threshold]x body
  // 3. Upper shadow < 0.5x body
  // 4. Body > [threshold]% of range
  if (
    isBullishCandle &&
    lowerShadow > body * thresholds.hammerShadowRatio &&
    upperShadow < body * 0.5 &&
    body > range * thresholds.hammerBodyMinPct
  ) {
    // Calculate confidence based on shadow ratios
    const shadowRatio = lowerShadow / body;
    const baseConfidence = 0.65;
    const bonusConfidence = Math.min((shadowRatio - 2) * 0.05, 0.2); // Up to +0.2 for very long lower shadow

    return {
      type: 'hammer',
      confidence: Math.min(baseConfidence + bonusConfidence, 0.9),
      winRate: 0.60,
      direction: 'bullish',
    };
  }

  return null;
}

function checkShootingStar(last: Candle, thresholds: PatternThresholds): CandlestickPattern | null {
  const body = Math.abs(last.close - last.open);
  const range = last.high - last.low;
  const upperShadow = last.high - Math.max(last.open, last.close);
  const lowerShadow = Math.min(last.open, last.close) - last.low;

  const isBearishCandle = last.close < last.open;

  // Shooting Star criteria (mirror of hammer)
  if (
    isBearishCandle &&
    upperShadow > body * thresholds.hammerShadowRatio &&
    lowerShadow < body * 0.5 &&
    body > range * thresholds.hammerBodyMinPct
  ) {
    const shadowRatio = upperShadow / body;
    const baseConfidence = 0.65;
    const bonusConfidence = Math.min((shadowRatio - 2) * 0.05, 0.2);

    return {
      type: 'shooting_star',
      confidence: Math.min(baseConfidence + bonusConfidence, 0.9),
      winRate: 0.58,
      direction: 'bearish',
    };
  }

  return null;
}

function checkDoji(last: Candle, thresholds: PatternThresholds): CandlestickPattern | null {
  const body = Math.abs(last.close - last.open);
  const range = last.high - last.low;

  // Doji criteria: Body < [threshold]% of range
  if (body < range * thresholds.dojiBodyMaxPct) {
    // Confidence based on how small the body is
    const bodyRatio = body / range;
    const confidence = 0.5 + (thresholds.dojiBodyMaxPct - bodyRatio) * 5; // Range: 0.5-1.0

    return {
      type: 'doji',
      confidence: Math.min(confidence, 0.85), // Cap at 0.85 since doji is context-dependent
      winRate: 0.55,
      direction: 'neutral',
    };
  }

  return null;
}

function checkPiercingLine(last: Candle, prev: Candle): CandlestickPattern | null {
  const prevBody = Math.abs(prev.close - prev.open);

  const isBearishPrev = prev.close < prev.open;
  const isBullishLast = last.close > last.open;

  // Piercing Line criteria:
  // 1. Previous candle is bearish
  // 2. Current candle is bullish
  // 3. Current opens below previous low (gap down)
  // 4. Current closes above midpoint of previous body
  // 5. Current closes below previous open (doesn't fully engulf)
  if (
    isBearishPrev &&
    isBullishLast &&
    last.open < prev.low &&
    last.close > prev.close + prevBody * 0.5 &&
    last.close < prev.open
  ) {
    // Calculate confidence based on penetration depth
    const penetration = (last.close - prev.close) / prevBody;
    const baseConfidence = 0.7;
    const bonusConfidence = Math.min((penetration - 0.5) * 0.4, 0.2); // Up to +0.2 for deep penetration

    return {
      type: 'piercing_line',
      confidence: Math.min(baseConfidence + bonusConfidence, 0.95),
      winRate: 0.67, // Best performer
      direction: 'bullish',
    };
  }

  return null;
}

function checkDarkCloudCover(last: Candle, prev: Candle): CandlestickPattern | null {
  const prevBody = Math.abs(prev.close - prev.open);

  const isBullishPrev = prev.close > prev.open;
  const isBearishLast = last.close < last.open;

  // Dark Cloud Cover criteria (mirror of piercing line)
  if (
    isBullishPrev &&
    isBearishLast &&
    last.open > prev.high &&
    last.close < prev.close - prevBody * 0.5 &&
    last.close > prev.open
  ) {
    const penetration = (prev.close - last.close) / prevBody;
    const baseConfidence = 0.7;
    const bonusConfidence = Math.min((penetration - 0.5) * 0.4, 0.2);

    return {
      type: 'dark_cloud_cover',
      confidence: Math.min(baseConfidence + bonusConfidence, 0.95),
      winRate: 0.64,
      direction: 'bearish',
    };
  }

  return null;
}

// ============================================================================
// CONFIDENCE ADJUSTMENT
// ============================================================================

/**
 * Adjust pattern confidence based on market regime
 * Patterns are more reliable when aligned with regime
 */
function adjustConfidenceForRegime(
  pattern: CandlestickPattern,
  regime: RegimeAnalysis
): number {
  let adjustment = 0;

  // Bullish patterns in trending bullish regime: +10% confidence
  if (
    pattern.direction === 'bullish' &&
    regime.type === 'trending_bullish'
  ) {
    adjustment = 0.1;
  }

  // Bearish patterns in trending bearish regime: +10% confidence
  if (
    pattern.direction === 'bearish' &&
    regime.type === 'trending_bearish'
  ) {
    adjustment = 0.1;
  }

  // Reversal patterns against trend: -10% confidence (counter-trend is riskier)
  if (
    pattern.direction === 'bullish' &&
    regime.type === 'trending_bearish'
  ) {
    adjustment = -0.1;
  }

  if (
    pattern.direction === 'bearish' &&
    regime.type === 'trending_bullish'
  ) {
    adjustment = -0.1;
  }

  // In ranging markets, all patterns get slight boost (reversals work well)
  if (
    regime.type === 'ranging_low_vol' ||
    regime.type === 'ranging_high_vol'
  ) {
    adjustment = 0.05;
  }

  // Apply adjustment and clamp to [0, 1]
  return Math.max(0, Math.min(1, pattern.confidence + adjustment));
}

// ============================================================================
// PATTERN METADATA (for reference)
// ============================================================================

export const PATTERN_METADATA = {
  bullish_engulfing: {
    name: 'Bullish Engulfing',
    winRate: 0.63,
    avgRiskReward: 2.1,
    reliability: 'high' as const,
    eocReference: 'EOC-1, Chapter 4',
  },
  bearish_engulfing: {
    name: 'Bearish Engulfing',
    winRate: 0.61,
    avgRiskReward: 2.0,
    reliability: 'high' as const,
    eocReference: 'EOC-1, Chapter 5',
  },
  hammer: {
    name: 'Hammer',
    winRate: 0.60,
    avgRiskReward: 2.2,
    reliability: 'medium' as const,
    eocReference: 'EOC-1, Chapter 6',
  },
  shooting_star: {
    name: 'Shooting Star',
    winRate: 0.58,
    avgRiskReward: 1.9,
    reliability: 'medium' as const,
    eocReference: 'EOC-1, Chapter 7',
  },
  doji: {
    name: 'Doji',
    winRate: 0.55,
    avgRiskReward: 1.8,
    reliability: 'medium' as const,
    eocReference: 'EOC-1, Chapter 8',
  },
  piercing_line: {
    name: 'Piercing Line',
    winRate: 0.67,
    avgRiskReward: 2.3,
    reliability: 'high' as const,
    eocReference: 'EOC-1, Chapter 9',
  },
  dark_cloud_cover: {
    name: 'Dark Cloud Cover',
    winRate: 0.64,
    avgRiskReward: 2.1,
    reliability: 'high' as const,
    eocReference: 'EOC-1, Chapter 10',
  },
};
