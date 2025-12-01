/**
 * Enhanced Regime Detection
 *
 * Extends basic regime detection with:
 * - Volatility Regimes (low/medium/high/extreme)
 * - Trend Strength Classification (weak/moderate/strong)
 * - Market Phase Detection (accumulation/markup/distribution/markdown)
 * - Volume-Based Regime Confirmation
 *
 * References:
 * - Mark Minervini "Think & Trade Like a Champion" (trend templates)
 * - Stan Weinstein "Secrets for Profiting in Bull and Bear Markets" (market phases)
 * - Van K. Tharp "Trade Your Way to Financial Freedom" (volatility regimes)
 */

import { Candle } from '../../types';
import { RegimeAnalysis, MarketRegime } from '../types';
import { calculateEMA, calculateADX, calculateATR } from '../patterns/indicators';

// ============================================================================
// ENHANCED REGIME TYPES
// ============================================================================

export interface EnhancedRegime extends RegimeAnalysis {
  // Trend classification
  trendStrengthClass: 'weak' | 'moderate' | 'strong' | 'very_strong';
  trendQuality: number; // 0-100 (how clean/consistent the trend is)

  // Volatility regime
  volatilityRegime: 'low' | 'normal' | 'high' | 'extreme';
  volatilityPercentile: number; // 0-100 (current vol vs 90-day history)

  // Market phase (Weinstein)
  marketPhase: 'accumulation' | 'markup' | 'distribution' | 'markdown' | 'transition';

  // Volume confirmation
  volumeConfirmsRegime: boolean;
  volumeTrend: 'increasing' | 'decreasing' | 'stable';

  // Metadata
  metadata: {
    ema21: number | null;
    ema50: number | null;
    ema200: number | null;
    priceVsEMA21: number; // % above/below
    priceVsEMA50: number;
    priceVsEMA200: number;
    consecutiveBarsInTrend: number;
    avgDailyRange: number; // ATR as % of price
  };
}

// ============================================================================
// MAIN ENHANCED REGIME FUNCTION
// ============================================================================

/**
 * Detect market regime with enhanced classification
 *
 * Process:
 * 1. Calculate EMAs (21, 50, 200)
 * 2. Classify trend direction and strength
 * 3. Determine volatility regime
 * 4. Identify market phase
 * 5. Check volume confirmation
 * 6. Calculate trend quality score
 */
export function detectEnhancedRegime(candles: Candle[]): EnhancedRegime {
  if (candles.length < 20) {
    return createDefaultEnhancedRegime();
  }

  // Calculate EMAs
  const ema21 = candles.length >= 21 ? calculateEMA(candles, 21) : null;
  const ema50 = candles.length >= 50 ? calculateEMA(candles, 50) : null;
  const ema200 = candles.length >= 200 ? calculateEMA(candles, 200) : null;

  const currentPrice = candles[candles.length - 1].close;

  // Calculate ADX and ATR
  const adx = calculateADX(candles, 14) || 20;
  const atr = calculateATR(candles, 14) || currentPrice * 0.02;

  // 1. Determine basic regime (trending/ranging)
  const basicRegime = determineBasicRegime(currentPrice, ema21, ema50, ema200, adx);

  // 2. Classify trend strength
  const trendStrengthClass = classifyTrendStrength(adx);

  // 3. Calculate trend quality
  const trendQuality = calculateTrendQuality(candles, ema21, ema50, ema200);

  // 4. Determine volatility regime
  const { volatilityRegime, volatilityPercentile } = classifyVolatilityRegime(candles, atr, currentPrice);

  // 5. Identify market phase
  const marketPhase = identifyMarketPhase(candles, ema21, ema50, ema200, currentPrice);

  // 6. Check volume confirmation
  const { volumeConfirmsRegime, volumeTrend } = analyzeVolumeRegime(candles, basicRegime);

  // 7. Calculate price vs EMA percentages
  const priceVsEMA21 = ema21 ? ((currentPrice - ema21) / ema21) * 100 : 0;
  const priceVsEMA50 = ema50 ? ((currentPrice - ema50) / ema50) * 100 : 0;
  const priceVsEMA200 = ema200 ? ((currentPrice - ema200) / ema200) * 100 : 0;

  // 8. Count consecutive bars in trend
  const consecutiveBarsInTrend = countConsecutiveTrendBars(candles, ema21);

  // 9. Calculate average daily range
  const avgDailyRange = (atr / currentPrice) * 100;

  return {
    type: basicRegime,
    strength: adx / 100,
    adx,
    atr,
    volatility: volatilityRegime === 'low' ? 'low' : volatilityRegime === 'normal' ? 'medium' : 'high',
    trendStrengthClass,
    trendQuality,
    volatilityRegime,
    volatilityPercentile,
    marketPhase,
    volumeConfirmsRegime,
    volumeTrend,
    metadata: {
      ema21,
      ema50,
      ema200,
      priceVsEMA21,
      priceVsEMA50,
      priceVsEMA200,
      consecutiveBarsInTrend,
      avgDailyRange,
    },
  };
}

// ============================================================================
// REGIME CLASSIFICATION
// ============================================================================

function determineBasicRegime(
  currentPrice: number,
  ema21: number | null,
  ema50: number | null,
  ema200: number | null,
  adx: number
): MarketRegime {
  // Strong trending market (ADX > 30)
  if (adx > 30) {
    if (ema21 && ema50 && ema200) {
      // Perfect bullish alignment: Price > EMA21 > EMA50 > EMA200
      if (currentPrice > ema21 && ema21 > ema50 && ema50 > ema200) {
        return 'trending_bullish';
      }
      // Perfect bearish alignment: Price < EMA21 < EMA50 < EMA200
      if (currentPrice < ema21 && ema21 < ema50 && ema50 < ema200) {
        return 'trending_bearish';
      }
    } else if (ema21 && ema50) {
      // Fallback: Use 21 and 50 EMAs
      if (currentPrice > ema21 && ema21 > ema50) return 'trending_bullish';
      if (currentPrice < ema21 && ema21 < ema50) return 'trending_bearish';
    }
  }

  // Ranging market (ADX < 20)
  if (adx < 20) {
    if (ema21 && ema50 && ema200) {
      // EMAs tangled = ranging
      const allClose = Math.abs(ema21 - ema50) / ema50 < 0.02;
      if (allClose) return 'ranging_low_vol';
    }
    return 'ranging_high_vol';
  }

  // Transitional market (ADX 20-30)
  return 'transitional';
}

function classifyTrendStrength(adx: number): 'weak' | 'moderate' | 'strong' | 'very_strong' {
  if (adx < 20) return 'weak';
  if (adx < 30) return 'moderate';
  if (adx < 50) return 'strong';
  return 'very_strong';
}

function calculateTrendQuality(
  candles: Candle[],
  ema21: number | null,
  ema50: number | null,
  ema200: number | null
): number {
  if (!ema21 || !ema50) return 50; // Neutral quality

  let quality = 50;

  // Factor 1: EMA alignment (0-30 points)
  const currentPrice = candles[candles.length - 1].close;
  if (ema200) {
    // Perfect alignment: Price > EMA21 > EMA50 > EMA200 (or reverse for downtrend)
    const bullishAlignment = currentPrice > ema21 && ema21 > ema50 && ema50 > ema200;
    const bearishAlignment = currentPrice < ema21 && ema21 < ema50 && ema50 < ema200;

    if (bullishAlignment || bearishAlignment) {
      quality += 30;
    } else if ((currentPrice > ema21 && ema21 > ema50) || (currentPrice < ema21 && ema21 < ema50)) {
      quality += 15; // Partial alignment
    }
  }

  // Factor 2: Consistency (0-20 points)
  // Count how many recent candles close above/below EMA21
  const recent = candles.slice(-20);
  const aboveEMA = recent.filter(c => c.close > (ema21 || c.close)).length;
  const consistency = Math.abs(aboveEMA - 10) / 10; // 0-1 (10 = 50/50, 20 = 100%, 0 = 0%)

  quality += consistency * 20;

  return Math.min(100, Math.max(0, quality));
}

// ============================================================================
// VOLATILITY REGIME
// ============================================================================

function classifyVolatilityRegime(
  candles: Candle[],
  currentATR: number,
  currentPrice: number
): { volatilityRegime: 'low' | 'normal' | 'high' | 'extreme'; volatilityPercentile: number } {
  // Calculate ATR for last 90 days (or available candles)
  const lookback = Math.min(90, candles.length);
  const historicalATRs: number[] = [];

  for (let i = lookback; i < candles.length; i++) {
    const slice = candles.slice(i - 14, i + 1);
    if (slice.length >= 14) {
      const atr = calculateATR(slice, 14);
      if (atr) historicalATRs.push((atr / slice[slice.length - 1].close) * 100);
    }
  }

  if (historicalATRs.length === 0) {
    return { volatilityRegime: 'normal', volatilityPercentile: 50 };
  }

  // Current ATR as % of price
  const currentATRPercent = (currentATR / currentPrice) * 100;

  // Calculate percentile
  const sorted = historicalATRs.sort((a, b) => a - b);
  const rank = sorted.filter(atr => atr < currentATRPercent).length;
  const volatilityPercentile = (rank / sorted.length) * 100;

  // Classify regime based on percentile
  let volatilityRegime: 'low' | 'normal' | 'high' | 'extreme';
  if (volatilityPercentile < 25) {
    volatilityRegime = 'low';
  } else if (volatilityPercentile < 75) {
    volatilityRegime = 'normal';
  } else if (volatilityPercentile < 90) {
    volatilityRegime = 'high';
  } else {
    volatilityRegime = 'extreme';
  }

  return { volatilityRegime, volatilityPercentile };
}

// ============================================================================
// MARKET PHASE (WEINSTEIN)
// ============================================================================

function identifyMarketPhase(
  candles: Candle[],
  ema21: number | null,
  ema50: number | null,
  ema200: number | null,
  currentPrice: number
): 'accumulation' | 'markup' | 'distribution' | 'markdown' | 'transition' {
  if (!ema50 || !ema200) return 'transition';

  // Calculate EMA slopes (rising/falling)
  const ema50Slope = calculateEMASlope(candles, 50);
  const ema200Slope = calculateEMASlope(candles, 200);

  // Calculate price position relative to EMAs
  const aboveEMA50 = currentPrice > ema50;
  const aboveEMA200 = currentPrice > ema200;

  // Phase 1: Accumulation (basing, EMA flattening, price near/below EMA200)
  if (!aboveEMA200 && Math.abs(ema200Slope) < 0.001 && Math.abs(ema50Slope) < 0.002) {
    return 'accumulation';
  }

  // Phase 2: Markup (uptrend, EMAs rising, price above both EMAs)
  if (aboveEMA50 && aboveEMA200 && ema50Slope > 0 && ema200Slope > 0) {
    return 'markup';
  }

  // Phase 3: Distribution (topping, EMA flattening, price near/above EMA200)
  if (aboveEMA200 && Math.abs(ema200Slope) < 0.001 && Math.abs(ema50Slope) < 0.002) {
    return 'distribution';
  }

  // Phase 4: Markdown (downtrend, EMAs falling, price below both EMAs)
  if (!aboveEMA50 && !aboveEMA200 && ema50Slope < 0 && ema200Slope < 0) {
    return 'markdown';
  }

  // Transition phase (between major phases)
  return 'transition';
}

function calculateEMASlope(candles: Candle[], period: number): number {
  if (candles.length < period + 10) return 0;

  // Calculate EMA for last 10 candles
  const emas: number[] = [];
  for (let i = 0; i < 10; i++) {
    const slice = candles.slice(-(period + 10 - i), candles.length - i);
    if (slice.length >= period) {
      const ema = calculateEMA(slice, period);
      if (ema) emas.push(ema);
    }
  }

  if (emas.length < 2) return 0;

  // Slope = (latest EMA - oldest EMA) / number of bars / average EMA
  const avgEMA = emas.reduce((sum, e) => sum + e, 0) / emas.length;
  const slope = (emas[emas.length - 1] - emas[0]) / emas.length / avgEMA;

  return slope;
}

// ============================================================================
// VOLUME ANALYSIS
// ============================================================================

function analyzeVolumeRegime(
  candles: Candle[],
  regime: MarketRegime
): { volumeConfirmsRegime: boolean; volumeTrend: 'increasing' | 'decreasing' | 'stable' } {
  const recent = candles.slice(-20);

  // Calculate average volume for recent bars
  const avgVolume = recent.reduce((sum, c) => sum + (c.volume || 0), 0) / recent.length;

  // Calculate volume trend (first 10 vs last 10)
  const firstHalf = recent.slice(0, 10);
  const secondHalf = recent.slice(10);

  const avgVolumeFirst = firstHalf.reduce((sum, c) => sum + (c.volume || 0), 0) / firstHalf.length;
  const avgVolumeSecond = secondHalf.reduce((sum, c) => sum + (c.volume || 0), 0) / secondHalf.length;

  const volumeChange = (avgVolumeSecond - avgVolumeFirst) / avgVolumeFirst;

  let volumeTrend: 'increasing' | 'decreasing' | 'stable';
  if (volumeChange > 0.15) {
    volumeTrend = 'increasing';
  } else if (volumeChange < -0.15) {
    volumeTrend = 'decreasing';
  } else {
    volumeTrend = 'stable';
  }

  // Volume confirmation logic
  let volumeConfirmsRegime = false;

  if (regime === 'trending_bullish' || regime === 'trending_bearish') {
    // Trending markets should have increasing volume
    volumeConfirmsRegime = volumeTrend === 'increasing';
  } else if (regime === 'ranging_low_vol' || regime === 'ranging_high_vol') {
    // Ranging markets should have decreasing or stable volume
    volumeConfirmsRegime = volumeTrend === 'decreasing' || volumeTrend === 'stable';
  } else {
    // Transitional markets - neutral
    volumeConfirmsRegime = true;
  }

  return { volumeConfirmsRegime, volumeTrend };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function countConsecutiveTrendBars(candles: Candle[], ema: number | null): number {
  if (!ema) return 0;

  let count = 0;
  const recent = candles.slice(-30); // Check last 30 bars

  // Determine if trend is up or down based on last candle
  const lastCandle = recent[recent.length - 1];
  const isUptrend = lastCandle.close > ema;

  // Count consecutive bars in same direction
  for (let i = recent.length - 1; i >= 0; i--) {
    const candle = recent[i];
    if (isUptrend && candle.close > ema) {
      count++;
    } else if (!isUptrend && candle.close < ema) {
      count++;
    } else {
      break; // Streak broken
    }
  }

  return count;
}

function createDefaultEnhancedRegime(): EnhancedRegime {
  return {
    type: 'transitional',
    strength: 0.5,
    adx: 20,
    atr: 0,
    volatility: 'medium',
    trendStrengthClass: 'weak',
    trendQuality: 50,
    volatilityRegime: 'normal',
    volatilityPercentile: 50,
    marketPhase: 'transition',
    volumeConfirmsRegime: true,
    volumeTrend: 'stable',
    metadata: {
      ema21: null,
      ema50: null,
      ema200: null,
      priceVsEMA21: 0,
      priceVsEMA50: 0,
      priceVsEMA200: 0,
      consecutiveBarsInTrend: 0,
      avgDailyRange: 2.0,
    },
  };
}
