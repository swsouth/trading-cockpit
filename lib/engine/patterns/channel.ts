/**
 * Channel Detection Module
 *
 * Detects support/resistance channels using ATR-normalized thresholds.
 * Determines price position relative to channel boundaries.
 *
 * Channel Status:
 * - near_support: Price within 0.5x ATR of support
 * - near_resistance: Price within 0.5x ATR of resistance
 * - inside: Price in middle of channel
 * - broken_out: Price beyond channel boundaries
 */

import { Candle } from '../../types';
import { AnalysisConfig } from '../types';
import { calculateATR } from './indicators';

export interface ChannelResult {
  hasChannel: boolean;
  support: number;
  resistance: number;
  mid: number;
  widthPct: number;
  supportTouches: number;
  resistanceTouches: number;
  outOfBandPct: number;
  slope: number; // Channel slope (positive = uptrend, negative = downtrend)
  status: 'near_support' | 'near_resistance' | 'inside' | 'broken_out';
}

/**
 * Detect channel in recent price action
 *
 * Uses ATR-normalized thresholds for volatility-aware detection:
 * - Touch tolerance: 0.3x ATR (precise level detection)
 * - Near threshold: 0.5x ATR (when to consider "near" S/R)
 * - Max channel width: Based on config (stocks: 25%, crypto: 40%)
 * - Min channel width: Based on config (stocks: 2%, crypto: 3%)
 */
export function detectChannel(
  candles: Candle[],
  config: AnalysisConfig,
  lookbackPeriod = 40
): ChannelResult {
  const recentCandles = candles.slice(-lookbackPeriod);
  const n = recentCandles.length;

  // Need minimum candles for valid channel
  if (n < 10) {
    return createEmptyChannel();
  }

  const closes = recentCandles.map(c => c.close);
  const low = Math.min(...closes);
  const high = Math.max(...closes);
  const mid = (low + high) / 2;
  const width = high - low;
  const widthPct = width / mid;

  // Calculate ATR for volatility-aware thresholds
  const atr = calculateATR(recentCandles, 14);
  const currentPrice = recentCandles[recentCandles.length - 1].close;
  const atrPercent = atr / currentPrice;

  // ATR-normalized thresholds
  const touchTolerancePct = Math.max(0.3 * atrPercent, 0.005); // Min 0.5%
  const nearThresholdPct = Math.max(0.5 * atrPercent, 0.01);   // Min 1%

  // Channel width constraints from config
  const minChannelPct = config.channel.minWidth;
  const maxChannelPct = config.channel.maxWidth;

  // Reject channels that are too narrow or too wide
  if (widthPct < minChannelPct || widthPct > maxChannelPct) {
    return {
      ...createEmptyChannel(),
      support: low,
      resistance: high,
      mid,
      widthPct,
    };
  }

  const support = low;
  const resistance = high;

  // Count touches and out-of-band candles
  let supportTouches = 0;
  let resistanceTouches = 0;
  let outOfBandCount = 0;

  for (const candle of recentCandles) {
    const { close } = candle;

    if (close <= support * (1 + touchTolerancePct)) {
      supportTouches++;
    }
    if (close >= resistance * (1 - touchTolerancePct)) {
      resistanceTouches++;
    }
    if (
      close < support * (1 - touchTolerancePct) ||
      close > resistance * (1 + touchTolerancePct)
    ) {
      outOfBandCount++;
    }
  }

  const outOfBandPct = outOfBandCount / n;

  // Validate channel quality using config thresholds
  const minTouches = config.channel.minTouches;
  const maxOutOfBand = config.channel.maxOutOfBand;

  if (
    supportTouches < minTouches ||
    resistanceTouches < minTouches ||
    outOfBandPct > maxOutOfBand
  ) {
    return {
      hasChannel: false,
      support,
      resistance,
      mid,
      widthPct,
      supportTouches,
      resistanceTouches,
      outOfBandPct,
      slope: 0,
      status: 'inside',
    };
  }

  // Calculate channel slope using linear regression
  const slope = calculateChannelSlope(recentCandles);

  // Determine current price status relative to channel
  const lastClose = recentCandles[recentCandles.length - 1].close;
  const status = determineChannelStatus(
    lastClose,
    support,
    resistance,
    touchTolerancePct,
    nearThresholdPct
  );

  return {
    hasChannel: true,
    support,
    resistance,
    mid,
    widthPct,
    supportTouches,
    resistanceTouches,
    outOfBandPct,
    slope,
    status,
  };
}

/**
 * Calculate channel slope using linear regression
 * Returns slope as percentage per candle
 */
function calculateChannelSlope(candles: Candle[]): number {
  const n = candles.length;
  if (n < 2) return 0;

  // Simple linear regression on close prices
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = candles[i].close;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const avgPrice = sumY / n;

  // Return slope as percentage per candle
  return (slope / avgPrice) * 100;
}

/**
 * Determine price position relative to channel boundaries
 */
function determineChannelStatus(
  price: number,
  support: number,
  resistance: number,
  touchTolerance: number,
  nearThreshold: number
): 'near_support' | 'near_resistance' | 'inside' | 'broken_out' {
  // Broken out below
  if (price < support * (1 - touchTolerance)) {
    return 'broken_out';
  }

  // Broken out above
  if (price > resistance * (1 + touchTolerance)) {
    return 'broken_out';
  }

  // Near support
  if (price <= support * (1 + nearThreshold)) {
    return 'near_support';
  }

  // Near resistance
  if (price >= resistance * (1 - nearThreshold)) {
    return 'near_resistance';
  }

  // Inside channel
  return 'inside';
}

/**
 * Create empty channel result
 */
function createEmptyChannel(): ChannelResult {
  return {
    hasChannel: false,
    support: 0,
    resistance: 0,
    mid: 0,
    widthPct: 0,
    supportTouches: 0,
    resistanceTouches: 0,
    outOfBandPct: 0,
    slope: 0,
    status: 'inside',
  };
}

/**
 * Helper: Get channel quality score (0-1)
 * Based on touch counts and out-of-band percentage
 */
export function getChannelQuality(channel: ChannelResult): number {
  if (!channel.hasChannel) return 0;

  // Factor 1: Touch quality (0-0.5)
  const totalTouches = channel.supportTouches + channel.resistanceTouches;
  const touchScore = Math.min(totalTouches / 10, 0.5); // Ideal: 10+ touches

  // Factor 2: Containment quality (0-0.5)
  const containmentScore = (1 - channel.outOfBandPct) * 0.5; // Ideal: 0% out-of-band

  return touchScore + containmentScore;
}
