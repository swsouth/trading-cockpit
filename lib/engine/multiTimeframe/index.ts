/**
 * Multi-Timeframe Analysis Module
 *
 * Analyzes higher timeframes (weekly, daily) to provide context for lower timeframe signals.
 * Improves signal quality by ensuring trend alignment across timeframes.
 *
 * Core Concepts:
 * - **Trend Alignment:** Daily signal confirmed by weekly trend = higher win rate
 * - **Key Levels:** Weekly S/R levels act as stronger barriers than daily levels
 * - **Confluence Zones:** Multiple timeframe levels clustered = high probability zones
 * - **Divergence Detection:** Trend disagreement between timeframes = caution
 *
 * References:
 * - Top-Down Analysis (Alexander Elder, "The New Trading for a Living")
 * - Multiple Timeframe Analysis (Brian Shannon, "Technical Analysis Using Multiple Timeframes")
 */

import { Candle } from '../../types';
import { calculateEMA, calculateRSI, calculateADX } from '../patterns/indicators';

// ============================================================================
// TYPES
// ============================================================================

export interface MultiTimeframeAnalysis {
  // Higher timeframe trend
  higherTimeframeTrend: 'bullish' | 'bearish' | 'neutral';
  trendAlignment: 'aligned' | 'divergent' | 'neutral';
  trendStrength: number; // 0-1 (higher TF strength)

  // Key levels from higher timeframes
  weeklySupport: number | null;
  weeklyResistance: number | null;
  weeklyPivot: number | null;

  // Confluence analysis
  confluenceZones: ConfluenceZone[];

  // Timeframe agreement
  timeframeAgreement: number; // 0-1 (% of timeframes agreeing)

  // Metadata
  metadata: {
    weeklyTrend?: 'up' | 'down' | 'sideways';
    weeklySlope?: number;
    weeklyVolatility?: 'low' | 'medium' | 'high';
    dailyTrend?: 'up' | 'down' | 'sideways';
  };
}

export interface ConfluenceZone {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 0-1 (how many timeframes agree)
  timeframes: Array<'weekly' | 'daily' | '4h' | '1h' | '15min'>;
  description: string;
}

export interface TimeframeData {
  timeframe: 'weekly' | 'daily' | '4h' | '1h' | '15min';
  candles: Candle[];
  trend: 'up' | 'down' | 'sideways';
  support: number | null;
  resistance: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi: number | null;
  adx: number | null;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze multiple timeframes to improve signal quality
 *
 * Strategy:
 * 1. Analyze weekly candles for major trend direction
 * 2. Identify weekly support/resistance levels
 * 3. Check trend alignment with daily timeframe
 * 4. Find confluence zones where levels cluster
 * 5. Calculate timeframe agreement score
 */
export function analyzeMultipleTimeframes(
  dailyCandles: Candle[],
  weeklyCandles?: Candle[],
  currentPrice?: number
): MultiTimeframeAnalysis {
  // Default: No higher timeframe data available
  if (!weeklyCandles || weeklyCandles.length < 20) {
    return createDefaultAnalysis(dailyCandles, currentPrice);
  }

  // Analyze each timeframe
  const weeklyData = analyzeTimeframe('weekly', weeklyCandles);
  const dailyData = analyzeTimeframe('daily', dailyCandles);

  // Determine trend alignment
  const trendAlignment = getTrendAlignment(weeklyData.trend, dailyData.trend);

  // Find weekly support/resistance
  const weeklyLevels = findKeyLevels(weeklyCandles, currentPrice || dailyCandles[dailyCandles.length - 1].close);

  // Find confluence zones
  const confluenceZones = findConfluenceZones([weeklyData, dailyData], currentPrice);

  // Calculate timeframe agreement
  const timeframeAgreement = calculateTimeframeAgreement([weeklyData, dailyData]);

  // Determine higher timeframe trend strength
  const trendStrength = weeklyData.adx ? weeklyData.adx / 100 : 0.5;

  return {
    higherTimeframeTrend: weeklyData.trend === 'up' ? 'bullish' : weeklyData.trend === 'down' ? 'bearish' : 'neutral',
    trendAlignment,
    trendStrength,
    weeklySupport: weeklyLevels.support,
    weeklyResistance: weeklyLevels.resistance,
    weeklyPivot: weeklyLevels.pivot,
    confluenceZones,
    timeframeAgreement,
    metadata: {
      weeklyTrend: weeklyData.trend,
      weeklySlope: calculateSlope(weeklyCandles),
      weeklyVolatility: classifyVolatility(weeklyCandles),
      dailyTrend: dailyData.trend,
    },
  };
}

// ============================================================================
// TIMEFRAME ANALYSIS
// ============================================================================

function analyzeTimeframe(
  timeframe: TimeframeData['timeframe'],
  candles: Candle[]
): TimeframeData {
  if (candles.length < 10) {
    return {
      timeframe,
      candles,
      trend: 'sideways',
      support: null,
      resistance: null,
      ema50: null,
      ema200: null,
      rsi: null,
      adx: null,
    };
  }

  // Calculate indicators
  const ema50 = candles.length >= 50 ? calculateEMA(candles, 50) : null;
  const ema200 = candles.length >= 200 ? calculateEMA(candles, 200) : null;
  const rsi = calculateRSI(candles, 14);
  const adx = calculateADX(candles, 14);

  const currentPrice = candles[candles.length - 1].close;

  // Determine trend
  let trend: 'up' | 'down' | 'sideways' = 'sideways';
  if (ema50 && ema200) {
    if (currentPrice > ema50 && ema50 > ema200) {
      trend = 'up';
    } else if (currentPrice < ema50 && ema50 < ema200) {
      trend = 'down';
    }
  } else if (ema50) {
    trend = currentPrice > ema50 ? 'up' : 'down';
  } else {
    // Fallback: Use recent price action
    const firstPrice = candles[0].close;
    const lastPrice = candles[candles.length - 1].close;
    trend = lastPrice > firstPrice * 1.05 ? 'up' : lastPrice < firstPrice * 0.95 ? 'down' : 'sideways';
  }

  // Find support/resistance
  const { support, resistance } = findSupportResistance(candles, currentPrice);

  return {
    timeframe,
    candles,
    trend,
    support,
    resistance,
    ema50,
    ema200,
    rsi,
    adx,
  };
}

// ============================================================================
// SUPPORT/RESISTANCE DETECTION
// ============================================================================

function findSupportResistance(
  candles: Candle[],
  currentPrice: number
): { support: number | null; resistance: number | null } {
  // Find swing highs and lows in recent candles
  const lookback = Math.min(50, candles.length);
  const recent = candles.slice(-lookback);

  const swingLows: number[] = [];
  const swingHighs: number[] = [];

  for (let i = 2; i < recent.length - 2; i++) {
    const candle = recent[i];

    // Swing low: Lower than 2 candles on each side
    if (
      candle.low < recent[i - 1].low &&
      candle.low < recent[i - 2].low &&
      candle.low < recent[i + 1].low &&
      candle.low < recent[i + 2].low
    ) {
      swingLows.push(candle.low);
    }

    // Swing high: Higher than 2 candles on each side
    if (
      candle.high > recent[i - 1].high &&
      candle.high > recent[i - 2].high &&
      candle.high > recent[i + 1].high &&
      candle.high > recent[i + 2].high
    ) {
      swingHighs.push(candle.high);
    }
  }

  // Find nearest support (swing low below current price)
  const supportCandidates = swingLows.filter(low => low < currentPrice);
  const support = supportCandidates.length > 0
    ? Math.max(...supportCandidates) // Closest support below
    : null;

  // Find nearest resistance (swing high above current price)
  const resistanceCandidates = swingHighs.filter(high => high > currentPrice);
  const resistance = resistanceCandidates.length > 0
    ? Math.min(...resistanceCandidates) // Closest resistance above
    : null;

  return { support, resistance };
}

/**
 * Find key weekly levels (support, resistance, pivot)
 */
function findKeyLevels(
  weeklyCandles: Candle[],
  currentPrice: number
): { support: number | null; resistance: number | null; pivot: number | null } {
  const { support, resistance } = findSupportResistance(weeklyCandles, currentPrice);

  // Calculate pivot (average of support and resistance if both exist)
  const pivot = support && resistance
    ? (support + resistance) / 2
    : null;

  return { support, resistance, pivot };
}

// ============================================================================
// CONFLUENCE ZONE DETECTION
// ============================================================================

function findConfluenceZones(
  timeframes: TimeframeData[],
  currentPrice?: number
): ConfluenceZone[] {
  const zones: ConfluenceZone[] = [];

  // Collect all levels from all timeframes
  const allLevels: Array<{ price: number; type: 'support' | 'resistance'; timeframe: TimeframeData['timeframe'] }> = [];

  timeframes.forEach(tf => {
    if (tf.support) {
      allLevels.push({ price: tf.support, type: 'support', timeframe: tf.timeframe });
    }
    if (tf.resistance) {
      allLevels.push({ price: tf.resistance, type: 'resistance', timeframe: tf.timeframe });
    }
  });

  // Group levels within 2% of each other (confluence threshold)
  const grouped: Array<typeof allLevels> = [];

  allLevels.forEach(level => {
    let added = false;

    for (const group of grouped) {
      const avgPrice = group.reduce((sum, l) => sum + l.price, 0) / group.length;
      if (Math.abs(level.price - avgPrice) / avgPrice < 0.02) {
        group.push(level);
        added = true;
        break;
      }
    }

    if (!added) {
      grouped.push([level]);
    }
  });

  // Convert groups to confluence zones (only if 2+ timeframes agree)
  grouped.forEach(group => {
    if (group.length >= 2) {
      const avgPrice = group.reduce((sum, l) => sum + l.price, 0) / group.length;
      const type = group[0].type; // Assume all in group are same type
      const timeframes = group.map(l => l.timeframe);
      const strength = group.length / timeframes.length; // % of timeframes agreeing

      zones.push({
        price: avgPrice,
        type,
        strength,
        timeframes,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} confluence zone (${group.length} timeframes agree)`,
      });
    }
  });

  // Sort by strength descending
  zones.sort((a, b) => b.strength - a.strength);

  return zones;
}

// ============================================================================
// TREND ALIGNMENT
// ============================================================================

function getTrendAlignment(
  higherTimeframeTrend: 'up' | 'down' | 'sideways',
  lowerTimeframeTrend: 'up' | 'down' | 'sideways'
): 'aligned' | 'divergent' | 'neutral' {
  // Both trending in same direction = aligned
  if (
    (higherTimeframeTrend === 'up' && lowerTimeframeTrend === 'up') ||
    (higherTimeframeTrend === 'down' && lowerTimeframeTrend === 'down')
  ) {
    return 'aligned';
  }

  // Trending in opposite directions = divergent
  if (
    (higherTimeframeTrend === 'up' && lowerTimeframeTrend === 'down') ||
    (higherTimeframeTrend === 'down' && lowerTimeframeTrend === 'up')
  ) {
    return 'divergent';
  }

  // At least one sideways = neutral
  return 'neutral';
}

function calculateTimeframeAgreement(timeframes: TimeframeData[]): number {
  if (timeframes.length < 2) return 1.0;

  // Count how many timeframes agree on trend direction
  const trends = timeframes.map(tf => tf.trend);
  const mostCommonTrend = getMostCommon(trends);
  const agreementCount = trends.filter(t => t === mostCommonTrend).length;

  return agreementCount / trends.length;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateSlope(candles: Candle[]): number {
  const prices = candles.map(c => c.close);
  const n = prices.length;
  const xMean = (n - 1) / 2;
  const yMean = prices.reduce((sum, p) => sum + p, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = prices[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

function classifyVolatility(candles: Candle[]): 'low' | 'medium' | 'high' {
  const ranges = candles.slice(-20).map(c => (c.high - c.low) / c.close);
  const avgRange = ranges.reduce((sum, r) => sum + r, 0) / ranges.length;

  if (avgRange < 0.015) return 'low';
  if (avgRange < 0.03) return 'medium';
  return 'high';
}

function getMostCommon<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  arr.forEach(item => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });

  let max = 0;
  let most: T = arr[0];

  counts.forEach((count, item) => {
    if (count > max) {
      max = count;
      most = item;
    }
  });

  return most;
}

function createDefaultAnalysis(
  dailyCandles: Candle[],
  currentPrice?: number
): MultiTimeframeAnalysis {
  // No higher timeframe data - analyze daily only
  const dailyData = analyzeTimeframe('daily', dailyCandles);

  return {
    higherTimeframeTrend: 'neutral',
    trendAlignment: 'neutral',
    trendStrength: 0.5,
    weeklySupport: dailyData.support,
    weeklyResistance: dailyData.resistance,
    weeklyPivot: null,
    confluenceZones: [],
    timeframeAgreement: 1.0, // Only one timeframe, so 100% agreement
    metadata: {
      dailyTrend: dailyData.trend,
    },
  };
}
