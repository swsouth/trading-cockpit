/**
 * Setup Detection
 *
 * Determines whether a stock presents a long, short, or no setup
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult, DetectedPattern } from '../types';
import { TradeSetup, SetupType } from './types';
import { VolumeAnalysis } from '../scoring/types';
import { AbsorptionPattern } from '../orderflow/types';

/**
 * Determine the type of setup (long, short, or none)
 */
export function determineSetupType(
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  volume?: VolumeAnalysis,
  absorption?: AbsorptionPattern
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

  // Strong long setup: Near support with ANY strong confirmation
  // High confidence criteria (ANY of these):
  // 1. Channel + near S/R + pattern
  // 2. Channel + near S/R + volume > 2x
  // 3. Channel + near S/R + buying absorption
  if (channel.hasChannel && channel.status === 'near_support') {
    const hasStrongConfirmation =
      isBullishPattern ||
      (volume && volume.volumeRatio > 2.0) ||
      (absorption && absorption.type === 'buying');

    return {
      type: 'long',
      setupName: hasStrongConfirmation ? 'Long - Support Bounce' : 'Long - Channel Support',
      reason: hasStrongConfirmation
        ? 'Price near support with strong confirmation'
        : 'Price approaching support level',
      confidence: hasStrongConfirmation ? 'high' : 'medium',
    };
  }

  // Strong short setup: Near resistance with ANY strong confirmation
  // High confidence criteria (ANY of these):
  // 1. Channel + near S/R + pattern
  // 2. Channel + near S/R + volume > 2x
  // 3. Channel + near S/R + selling absorption
  if (channel.hasChannel && channel.status === 'near_resistance') {
    const hasStrongConfirmation =
      isBearishPattern ||
      (volume && volume.volumeRatio > 2.0) ||
      (absorption && absorption.type === 'selling');

    return {
      type: 'short',
      setupName: hasStrongConfirmation ? 'Short - Resistance Rejection' : 'Short - Channel Resistance',
      reason: hasStrongConfirmation
        ? 'Price near resistance with strong confirmation'
        : 'Price approaching resistance level',
      confidence: hasStrongConfirmation ? 'high' : 'medium',
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
