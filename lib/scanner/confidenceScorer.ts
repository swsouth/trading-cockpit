import {
  ChannelDetectionResult,
  PatternDetectionResult,
  CombinedSignal,
  ConfidenceLevel,
  DetectedPattern,
} from '../types';

interface ConfidenceScoringParams {
  channel: ChannelDetectionResult;
  pattern: PatternDetectionResult;
  signal: CombinedSignal;
  volume?: number;
}

/**
 * Calculate confidence score for a trading setup
 *
 * Scoring factors:
 * - Channel strength (support/resistance touches): 0-4 points
 * - Pattern confirmation: 0-3 points
 * - Signal alignment (bias): 0-2 points
 * - Cautions penalty: -1 to +1 points
 * - Volume confirmation: 0-1 point
 * - Tight channel bonus: 0-1 point
 *
 * Total possible: 0-12 points
 * - HIGH: 9+ points
 * - MODERATE: 6-8 points
 * - LOW: <6 points
 */
export function calculateConfidence(params: ConfidenceScoringParams): {
  level: ConfidenceLevel;
  score: number;
  breakdown: string[];
} {
  const { channel, pattern, signal, volume } = params;
  let score = 0;
  const breakdown: string[] = [];

  // 1. Channel strength (0-4 points)
  if (channel.hasChannel) {
    const touches = Math.max(
      channel.supportTouches || 0,
      channel.resistanceTouches || 0
    );

    if (touches >= 4) {
      score += 4;
      breakdown.push(`Strong channel (${touches} touches): +4`);
    } else if (touches === 3) {
      score += 3;
      breakdown.push(`Good channel (${touches} touches): +3`);
    } else if (touches === 2) {
      score += 2;
      breakdown.push(`Moderate channel (${touches} touches): +2`);
    } else {
      score += 1;
      breakdown.push(`Weak channel (${touches} touches): +1`);
    }
  } else {
    breakdown.push('No channel detected: +0');
  }

  // 2. Pattern confirmation (0-3 points)
  const strongPatterns: DetectedPattern[] = [
    'hammer',
    'bullish_engulfing',
    'bearish_engulfing',
    'shooting_star',
  ];
  const moderatePatterns: DetectedPattern[] = [
    'piercing_line',
    'dark_cloud_cover',
  ];

  if (strongPatterns.includes(pattern.mainPattern)) {
    score += 3;
    breakdown.push(`Strong pattern (${pattern.mainPattern}): +3`);
  } else if (moderatePatterns.includes(pattern.mainPattern)) {
    score += 2;
    breakdown.push(`Moderate pattern (${pattern.mainPattern}): +2`);
  } else if (pattern.mainPattern !== 'none') {
    score += 1;
    breakdown.push(`Weak pattern (${pattern.mainPattern}): +1`);
  } else {
    breakdown.push('No pattern: +0');
  }

  // 3. Signal alignment (0-2 points)
  if (signal.bias === 'bullish' || signal.bias === 'bearish') {
    score += 2;
    breakdown.push(`Clear bias (${signal.bias}): +2`);
  } else if (signal.bias === 'neutral') {
    score += 1;
    breakdown.push('Neutral bias: +1');
  } else {
    breakdown.push('Conflicting signals: +0');
  }

  // 4. Cautions analysis (-1 to +1 points)
  const cautionsCount = signal.cautions?.length || 0;
  if (cautionsCount === 0) {
    score += 1;
    breakdown.push('No cautions: +1');
  } else if (cautionsCount >= 3) {
    score -= 1;
    breakdown.push(`Many cautions (${cautionsCount}): -1`);
  } else {
    breakdown.push(`Some cautions (${cautionsCount}): +0`);
  }

  // 5. Volume confirmation (0-1 point)
  if (volume && volume > 1000000) {
    score += 1;
    breakdown.push('High volume: +1');
  } else if (volume) {
    breakdown.push('Low volume: +0');
  }

  // 6. Tight channel bonus (0-1 point)
  if (channel.hasChannel && channel.widthPct > 0 && channel.widthPct <= 0.06) {
    score += 1;
    breakdown.push(`Tight channel (${(channel.widthPct * 100).toFixed(1)}%): +1`);
  }

  // Determine confidence level
  let level: ConfidenceLevel;
  if (score >= 9) {
    level = 'HIGH';
  } else if (score >= 6) {
    level = 'MODERATE';
  } else {
    level = 'LOW';
  }

  return {
    level,
    score,
    breakdown,
  };
}

/**
 * Helper function to calculate risk/reward ratio
 */
export function calculateRiskReward(
  entryPrice: number,
  targetPrice: number,
  stopPrice: number
): number {
  const potentialGain = Math.abs(targetPrice - entryPrice);
  const potentialLoss = Math.abs(entryPrice - stopPrice);

  if (potentialLoss === 0) return 0;

  return potentialGain / potentialLoss;
}

/**
 * Helper function to calculate percentage gain/loss
 */
export function calculatePercentChange(
  fromPrice: number,
  toPrice: number
): number {
  return ((toPrice - fromPrice) / fromPrice) * 100;
}
