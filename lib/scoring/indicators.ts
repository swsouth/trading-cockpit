/**
 * Technical Indicators for Scoring
 *
 * Provides calculation functions for RSI, ATR, volume analysis, and other indicators
 */

import { Candle } from '../types';
import { VolumeAnalysis, MomentumIndicators, TrendAnalysis } from './types';

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
  const rsi = 100 - (100 / (1 + rs));

  return Math.max(0, Math.min(100, rsi));
}

/**
 * Calculate Average True Range (ATR)
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
 * Analyze volume relative to historical average
 * @param candles - Array of candles
 * @returns Volume analysis result
 */
export function analyzeVolume(candles: Candle[]): VolumeAnalysis {
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

  const last5DaysAvg = last5Days.reduce((sum, c) => sum + (c.volume || 0), 0) / last5Days.length;
  const last30DaysAvg = last30Days.reduce((sum, c) => sum + (c.volume || 0), 0) / last30Days.length;
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
 * Calculate channel slope (rate of change)
 * @param candles - Array of candles
 * @param support - Support level
 * @param resistance - Resistance level
 * @returns Slope as a percentage (e.g., 0.02 = 2% per day average)
 */
export function calculateChannelSlope(
  candles: Candle[],
  support: number,
  resistance: number
): number {
  if (candles.length < 10) {
    return 0;
  }

  const recentCandles = candles.slice(-30); // Use last 30 days
  const n = recentCandles.length;

  // Calculate slope using actual closing prices for more accuracy
  const points = recentCandles.map((c, i) => ({
    x: i,
    y: c.close,
  }));

  // Simple linear regression
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = (n * sumXX - sumX * sumX);

  if (denominator === 0) {
    return 0;
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;

  // Convert to percentage per day
  const avgPrice = sumY / n;

  if (avgPrice === 0) {
    return 0;
  }

  const slopePercent = slope / avgPrice;

  return slopePercent;
}

/**
 * Analyze trend direction and strength
 * @param candles - Array of candles
 * @param channel - Channel detection result
 * @returns Trend analysis
 */
export function analyzeTrend(candles: Candle[], channel: { hasChannel: boolean; support: number; resistance: number }): TrendAnalysis {
  if (candles.length < 20) {
    return {
      direction: 'sideways',
      slope: 0,
      strength: 0,
      channelClarity: 0,
    };
  }

  const recentCandles = candles.slice(-30);
  const closes = recentCandles.map(c => c.close);

  // Calculate simple moving averages
  const sma20 = closes.slice(-20).reduce((sum, c) => sum + c, 0) / 20;
  const sma10 = closes.slice(-10).reduce((sum, c) => sum + c, 0) / 10;
  const currentPrice = closes[closes.length - 1];

  // Determine trend direction
  let direction: 'uptrend' | 'downtrend' | 'sideways';
  if (sma10 > sma20 * 1.02 && currentPrice > sma10) {
    direction = 'uptrend';
  } else if (sma10 < sma20 * 0.98 && currentPrice < sma10) {
    direction = 'downtrend';
  } else {
    direction = 'sideways';
  }

  // Calculate slope
  const slope = channel.hasChannel
    ? calculateChannelSlope(candles, channel.support, channel.resistance)
    : 0;

  // Calculate trend strength (0-1)
  const priceChange = (closes[closes.length - 1] - closes[0]) / closes[0];
  const strength = Math.min(1, Math.abs(priceChange) / 0.2); // 20% move = max strength

  // Calculate channel clarity (0-1)
  const channelClarity = channel.hasChannel ? 0.8 : 0.3; // Simplified for now

  return {
    direction,
    slope,
    strength,
    channelClarity,
  };
}

/**
 * Calculate momentum indicators
 * @param candles - Array of candles
 * @returns Momentum indicators
 */
export function calculateMomentum(candles: Candle[]): MomentumIndicators {
  const rsi = calculateRSI(candles);

  // MACD could be added here in the future
  return {
    rsi,
  };
}

/**
 * Calculate Simple Moving Average
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
