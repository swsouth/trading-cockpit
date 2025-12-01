/**
 * Technical Indicators Module
 *
 * Provides calculation functions for technical indicators used in analysis.
 * Migrated from lib/scoring/indicators.ts with improvements.
 *
 * Core Indicators:
 * - RSI (Relative Strength Index)
 * - ATR (Average True Range)
 * - SMA/EMA (Moving Averages)
 * - ADX (Average Directional Index)
 * - Volume Analysis (daily and intraday)
 */

import { Candle } from '../../types';

/**
 * Calculate Relative Strength Index (RSI)
 * @param candles - Array of candles
 * @param period - RSI period (default 14)
 * @returns RSI value (0-100)
 */
export function calculateRSI(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) {
    return 50; // Neutral default
  }

  const changes: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i].close - candles[i - 1].close);
  }

  // Use last 'period' changes
  const recentChanges = changes.slice(-period);

  let avgGain = 0;
  let avgLoss = 0;

  // Calculate initial averages
  for (const change of recentChanges) {
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) {
    return 100; // No losses, max RSI
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return Math.max(0, Math.min(100, rsi));
}

/**
 * Calculate Average True Range (ATR)
 * Measures market volatility
 * @param candles - Array of candles
 * @param period - ATR period (default 14)
 * @returns ATR value
 */
export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );

    trueRanges.push(tr);
  }

  // Average the last 'period' true ranges
  const recentTR = trueRanges.slice(-period);
  const atr = recentTR.reduce((sum, tr) => sum + tr, 0) / period;

  return atr;
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param values - Array of numbers
 * @param period - SMA period
 * @returns SMA value
 */
export function calculateSMA(values: number[], period: number): number {
  if (values.length < period) {
    return 0;
  }

  const recent = values.slice(-period);
  return recent.reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param candles - Array of candles
 * @param period - EMA period
 * @returns EMA value
 */
export function calculateEMA(candles: Candle[], period: number): number {
  if (candles.length < period) {
    return 0;
  }

  const closes = candles.map(c => c.close);
  const multiplier = 2 / (period + 1);

  // Start with SMA
  let ema = calculateSMA(closes.slice(0, period), period);

  // Calculate EMA for remaining values
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate Average Directional Index (ADX)
 * Measures trend strength (0-100)
 * @param candles - Array of candles
 * @param period - ADX period (default 14)
 * @returns ADX value (0-100)
 */
export function calculateADX(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) {
    return 0;
  }

  // Calculate +DM and -DM
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    const highDiff = current.high - previous.high;
    const lowDiff = previous.low - current.low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    tr.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
    );
  }

  // Calculate smoothed averages
  const smoothedPlusDM = smoothArray(plusDM, period);
  const smoothedMinusDM = smoothArray(minusDM, period);
  const smoothedTR = smoothArray(tr, period);

  // Calculate +DI and -DI
  const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
  const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

  // Calculate DX
  const diSum = plusDI + minusDI;
  const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;

  return dx;
}

/**
 * Smooth array using Wilder's smoothing
 */
function smoothArray(values: number[], period: number): number {
  if (values.length < period) {
    return 0;
  }

  // Initial average
  let smoothed = values.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  // Smooth remaining values
  for (let i = period; i < values.length; i++) {
    smoothed = (smoothed * (period - 1) + values[i]) / period;
  }

  return smoothed;
}

/**
 * Analyze daily volume
 * @param candles - Array of candles
 * @returns Volume analysis
 */
export function analyzeVolume(candles: Candle[]): {
  last5DaysAvg: number;
  last30DaysAvg: number;
  currentVolume: number;
  volumeRatio: number;
  status: 'high' | 'average' | 'low';
} {
  if (candles.length < 30) {
    return {
      last5DaysAvg: 0,
      last30DaysAvg: 0,
      currentVolume: 0,
      volumeRatio: 1,
      status: 'average',
    };
  }

  // Filter candles with volume data
  const candlesWithVolume = candles.filter(c => c.volume && c.volume > 0);

  if (candlesWithVolume.length < 10) {
    return {
      last5DaysAvg: 0,
      last30DaysAvg: 0,
      currentVolume: 0,
      volumeRatio: 1,
      status: 'average',
    };
  }

  const last5Days = candlesWithVolume.slice(-5);
  const last30Days = candlesWithVolume.slice(-30);

  const last5DaysAvg =
    last5Days.reduce((sum, c) => sum + (c.volume || 0), 0) / last5Days.length;
  const last30DaysAvg =
    last30Days.reduce((sum, c) => sum + (c.volume || 0), 0) / last30Days.length;
  const currentVolume = candlesWithVolume[candlesWithVolume.length - 1].volume || 0;

  const volumeRatio = last30DaysAvg > 0 ? last5DaysAvg / last30DaysAvg : 1;

  let status: 'high' | 'average' | 'low';
  if (volumeRatio >= 1.5) {
    status = 'high';
  } else if (volumeRatio >= 0.8) {
    status = 'average';
  } else {
    status = 'low';
  }

  return {
    last5DaysAvg,
    last30DaysAvg,
    currentVolume,
    volumeRatio,
    status,
  };
}

/**
 * Analyze intraday volume with time-of-day normalization
 * Compares current bar to same minute-of-day historical average
 * @param candles - Array of intraday candles (5-min bars)
 * @returns Volume analysis with time-of-day adjustment
 */
export function analyzeIntradayVolume(candles: Candle[]): {
  last5DaysAvg: number;
  last30DaysAvg: number;
  currentVolume: number;
  volumeRatio: number;
  status: 'high' | 'average' | 'low';
} {
  if (candles.length < 10) {
    return {
      last5DaysAvg: 0,
      last30DaysAvg: 0,
      currentVolume: 0,
      volumeRatio: 1,
      status: 'average',
    };
  }

  const currentCandle = candles[candles.length - 1];
  const currentVolume = currentCandle.volume || 0;

  // Extract minute-of-day from current candle
  const currentTimestamp = new Date(currentCandle.timestamp);
  const currentHour = currentTimestamp.getUTCHours();
  const currentMinute = currentTimestamp.getUTCMinutes();
  const currentMinuteOfDay = currentHour * 60 + currentMinute;

  // Find all historical bars from the same minute-of-day
  const sameTimeCandles = candles.filter((c, idx) => {
    // Skip current candle
    if (idx === candles.length - 1) return false;

    const ts = new Date(c.timestamp);
    const hour = ts.getUTCHours();
    const minute = ts.getUTCMinutes();
    const minuteOfDay = hour * 60 + minute;

    // Match same minute-of-day (±1 minute tolerance)
    return Math.abs(minuteOfDay - currentMinuteOfDay) <= 1 && (c.volume || 0) > 0;
  });

  if (sameTimeCandles.length < 3) {
    // Not enough historical data - fall back to simple average
    const last30Candles = candles.slice(-30).filter(c => (c.volume || 0) > 0);
    const last30Avg =
      last30Candles.reduce((sum, c) => sum + (c.volume || 0), 0) / last30Candles.length;

    return {
      last5DaysAvg: last30Avg,
      last30DaysAvg: last30Avg,
      currentVolume,
      volumeRatio: last30Avg > 0 ? currentVolume / last30Avg : 1,
      status: 'average',
    };
  }

  // Calculate average volume for this specific minute-of-day
  const sameTimeAvg =
    sameTimeCandles.reduce((sum, c) => sum + (c.volume || 0), 0) / sameTimeCandles.length;

  // Volume ratio: current bar vs historical same-time average
  const volumeRatio = sameTimeAvg > 0 ? currentVolume / sameTimeAvg : 1;

  // Status based on relative volume
  let status: 'high' | 'average' | 'low';
  if (volumeRatio >= 1.5) {
    status = 'high'; // 50% above normal for this time
  } else if (volumeRatio >= 0.8) {
    status = 'average';
  } else {
    status = 'low'; // 20% below normal for this time
  }

  return {
    last5DaysAvg: sameTimeAvg,
    last30DaysAvg: sameTimeAvg,
    currentVolume,
    volumeRatio,
    status,
  };
}
