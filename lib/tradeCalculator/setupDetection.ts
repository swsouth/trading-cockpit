/**
 * Setup Detection
 *
 * Determines whether a stock presents a long, short, or no setup
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult, DetectedPattern } from '../types';
import { TradeSetup, SetupType } from './types';

/**
 * Determine the type of setup (long, short, or none)
 */
export function determineSetupType(
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult
): TradeSetup {
  const bullishPatterns: DetectedPattern[] = [
    'bullish_engulfing',
    'hammer',
    'piercing_line',
  ];

  const bearishPatterns: DetectedPattern[] = [
    'bearish_engulfing',
    'shooting_star',
    'dark_cloud_cover',
  ];

  const isBullishPattern = bullishPatterns.includes(pattern.mainPattern);
  const isBearishPattern = bearishPatterns.includes(pattern.mainPattern);

  const currentPrice = candles[candles.length - 1].close;

  // Strong long setup: Near support with bullish pattern in uptrend
  if (
    channel.hasChannel &&
    channel.status === 'near_support' &&
    isBullishPattern
  ) {
    return {
      type: 'long',
      setupName: 'Long - Support Bounce',
      reason: 'Price near support with bullish reversal pattern',
      confidence: 'high',
    };
  }

  // Strong short setup: Near resistance with bearish pattern in downtrend
  if (
    channel.hasChannel &&
    channel.status === 'near_resistance' &&
    isBearishPattern
  ) {
    return {
      type: 'short',
      setupName: 'Short - Resistance Rejection',
      reason: 'Price near resistance with bearish reversal pattern',
      confidence: 'high',
    };
  }

  // Breakout long setup: Above resistance with bullish pattern
  if (
    channel.hasChannel &&
    channel.status === 'broken_out' &&
    currentPrice > channel.resistance &&
    isBullishPattern
  ) {
    return {
      type: 'long',
      setupName: 'Long - Breakout',
      reason: 'Breakout above resistance with bullish confirmation',
      confidence: 'medium',
    };
  }

  // Breakdown short setup: Below support with bearish pattern
  if (
    channel.hasChannel &&
    channel.status === 'broken_out' &&
    currentPrice < channel.support &&
    isBearishPattern
  ) {
    return {
      type: 'short',
      setupName: 'Short - Breakdown',
      reason: 'Breakdown below support with bearish confirmation',
      confidence: 'medium',
    };
  }

  // Medium confidence long: Near support without pattern
  if (
    channel.hasChannel &&
    channel.status === 'near_support'
  ) {
    return {
      type: 'long',
      setupName: 'Long - Channel Support',
      reason: 'Price approaching support level',
      confidence: 'medium',
    };
  }

  // Medium confidence short: Near resistance without pattern
  if (
    channel.hasChannel &&
    channel.status === 'near_resistance'
  ) {
    return {
      type: 'short',
      setupName: 'Short - Channel Resistance',
      reason: 'Price approaching resistance level',
      confidence: 'medium',
    };
  }

  // Low confidence long: Bullish pattern without channel
  if (isBullishPattern && !channel.hasChannel) {
    return {
      type: 'long',
      setupName: 'Long - Pattern Only',
      reason: 'Bullish pattern without clear channel',
      confidence: 'low',
    };
  }

  // Low confidence short: Bearish pattern without channel
  if (isBearishPattern && !channel.hasChannel) {
    return {
      type: 'short',
      setupName: 'Short - Pattern Only',
      reason: 'Bearish pattern without clear channel',
      confidence: 'low',
    };
  }

  // No clear setup
  return {
    type: 'none',
    setupName: 'No Clear Setup',
    reason: 'No actionable setup identified',
    confidence: 'low',
  };
}

/**
 * Check if a setup is actionable (worth trading)
 */
export function isActionableSetup(setup: TradeSetup): boolean {
  // Allow all setups (including low-confidence) to reach scoring stage
  // Scoring system will filter weak setups, and UI will mark risky ones
  return setup.type !== 'none';
}
