/**
 * Scoring Components
 *
 * Individual scoring functions for each component of the 0-100 scoring system
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult, DetectedPattern } from '../types';
import { VolumeAnalysis, RiskRewardMetrics } from './types';
import { analyzeTrend, calculateChannelSlope, calculateRSI } from './indicators';
import { AbsorptionPattern } from '../orderflow/types';

/**
 * Score trend strength (0-30 points)
 *
 * Factors:
 * - Channel clarity: How well-defined the channel is (0-10 pts)
 * - Trend slope: Strength of the trend (0-15 pts)
 * - Price position: Where price is in the channel (0-5 pts)
 */
export function scoreTrendStrength(
  candles: Candle[],
  channel: ChannelDetectionResult
): number {
  let score = 0;

  if (!channel.hasChannel) {
    // No channel = weak trend structure
    return 5; // Minimal points for having data
  }

  // 1. Channel Clarity (0-10 points)
  const channelWidth = (channel.resistance - channel.support) / channel.support;

  if (channelWidth < 0.05) {
    score += 10; // Very tight, clear channel
  } else if (channelWidth < 0.10) {
    score += 7; // Good channel
  } else if (channelWidth < 0.15) {
    score += 4; // Acceptable channel
  } else {
    score += 2; // Wide/unclear channel
  }

  // 2. Trend Slope/Strength (0-15 points)
  const slope = calculateChannelSlope(candles, channel.support, channel.resistance);
  const absSlope = Math.abs(slope);

  if (absSlope > 0.02) {
    score += 15; // Strong trend (>2% per day)
  } else if (absSlope > 0.01) {
    score += 10; // Moderate trend (1-2% per day)
  } else if (absSlope > 0.005) {
    score += 5; // Weak trend (0.5-1% per day)
  } else {
    score += 2; // Sideways
  }

  // 3. Price Position in Channel (0-5 points)
  // Good entry = near support in uptrend or near resistance in downtrend
  const currentPrice = candles[candles.length - 1].close;
  const channelPosition = (currentPrice - channel.support) / (channel.resistance - channel.support);

  if (slope > 0 && channelPosition < 0.3) {
    // Near support in uptrend = good long entry
    score += 5;
  } else if (slope < 0 && channelPosition > 0.7) {
    // Near resistance in downtrend = good short entry
    score += 5;
  } else if (channelPosition > 0.3 && channelPosition < 0.7) {
    // Mid-channel
    score += 2;
  } else {
    // Wrong side of channel for the trend
    score += 0;
  }

  return Math.min(30, score);
}

/**
 * Score pattern quality (0-25 points)
 *
 * Different patterns have different reliability and strength
 */
export function scorePatternQuality(pattern: PatternDetectionResult): number {
  const patternScores: Record<DetectedPattern, number> = {
    'bullish_engulfing': 25,
    'bearish_engulfing': 24,
    'hammer': 22,
    'shooting_star': 21,
    'piercing_line': 20,
    'dark_cloud_cover': 19,
    'doji': 12,
    'none': 8, // No pattern = some base points
  };

  return patternScores[pattern.mainPattern] || 8;
}

/**
 * Score volume confirmation (0-20 points)
 *
 * Higher volume on the move = stronger confirmation
 */
export function scoreVolumeConfirmation(volume: VolumeAnalysis): number {
  const { volumeRatio, status } = volume;

  let score = 0;

  // Score based on volume ratio
  if (volumeRatio >= 2.0) {
    score += 20; // Exceptional volume
  } else if (volumeRatio >= 1.5) {
    score += 17; // High volume
  } else if (volumeRatio >= 1.2) {
    score += 13; // Above average
  } else if (volumeRatio >= 1.0) {
    score += 10; // Average
  } else if (volumeRatio >= 0.8) {
    score += 7; // Below average
  } else {
    score += 3; // Low volume
  }

  return Math.min(20, score);
}

/**
 * Score risk/reward ratio (0-15 points)
 *
 * Higher R:R = more points
 * Minimum acceptable is typically 1.5:1, ideal is 3:1 or better
 */
export function scoreRiskReward(metrics: RiskRewardMetrics): number {
  const { ratio } = metrics;

  if (ratio >= 3.5) {
    return 15; // Exceptional R:R
  } else if (ratio >= 3.0) {
    return 14;
  } else if (ratio >= 2.5) {
    return 12;
  } else if (ratio >= 2.0) {
    return 10; // Good R:R
  } else if (ratio >= 1.5) {
    return 7; // Acceptable
  } else if (ratio >= 1.0) {
    return 4; // Marginal
  } else {
    return 1; // Poor R:R
  }
}

/**
 * Score momentum/RSI (0-10 points)
 *
 * Context-aware RSI scoring that rewards BOTH reversals AND continuations:
 * - Reversal setups (near support/resistance): Favor oversold/overbought
 * - Continuation setups (trending): Favor healthy momentum zones
 *
 * @param candles - Price candles
 * @param setupType - 'long' or 'short'
 * @param channelStatus - Price position ('near_support', 'near_resistance', 'inside', 'broken_out')
 */
export function scoreMomentum(
  candles: Candle[],
  setupType: 'long' | 'short' = 'long',
  channelStatus?: string
): number {
  const rsi = calculateRSI(candles);

  // Determine if this is a reversal or continuation setup
  const isReversal = (
    (setupType === 'long' && channelStatus === 'near_support') ||
    (setupType === 'short' && channelStatus === 'near_resistance')
  );

  if (setupType === 'long') {
    if (isReversal) {
      // REVERSAL LONG (bounce off support)
      // Favor oversold conditions
      if (rsi >= 25 && rsi <= 35) {
        return 10; // Sweet spot: oversold, ready to bounce
      } else if (rsi > 35 && rsi <= 45) {
        return 8; // Good: recovering from oversold
      } else if (rsi > 45 && rsi <= 55) {
        return 5; // Neutral: less conviction for reversal
      } else if (rsi > 55) {
        return 3; // Not oversold, weaker reversal signal
      } else {
        return 7; // Very oversold (<25), risky but possible
      }
    } else {
      // CONTINUATION LONG (trending up or mid-channel)
      // Favor healthy uptrend momentum
      if (rsi >= 50 && rsi <= 60) {
        return 10; // Sweet spot: healthy uptrend momentum
      } else if (rsi > 60 && rsi <= 70) {
        return 8; // Strong uptrend, still good
      } else if (rsi > 70 && rsi <= 75) {
        return 5; // Overbought but trend strong
      } else if (rsi > 75) {
        return 3; // Very overbought, risky
      } else if (rsi >= 40 && rsi < 50) {
        return 6; // Building momentum
      } else {
        return 4; // Weak momentum for continuation
      }
    }
  } else {
    // SHORT SETUPS (mirror logic)
    if (isReversal) {
      // REVERSAL SHORT (rejection at resistance)
      // Favor overbought conditions
      if (rsi >= 65 && rsi <= 75) {
        return 10; // Sweet spot: overbought, ready to drop
      } else if (rsi >= 55 && rsi < 65) {
        return 8; // Good: weakening from overbought
      } else if (rsi >= 45 && rsi < 55) {
        return 5; // Neutral: less conviction for reversal
      } else if (rsi < 45) {
        return 3; // Not overbought, weaker reversal signal
      } else {
        return 7; // Very overbought (>75), risky but possible
      }
    } else {
      // CONTINUATION SHORT (trending down)
      // Favor healthy downtrend momentum
      if (rsi >= 40 && rsi <= 50) {
        return 10; // Sweet spot: healthy downtrend momentum
      } else if (rsi >= 30 && rsi < 40) {
        return 8; // Strong downtrend, still good
      } else if (rsi >= 25 && rsi < 30) {
        return 5; // Oversold but trend strong
      } else if (rsi < 25) {
        return 3; // Very oversold, risky
      } else if (rsi > 50 && rsi <= 60) {
        return 6; // Losing momentum
      } else {
        return 4; // Weak momentum for continuation
      }
    }
  }
}

/**
 * Calculate risk/reward metrics
 */
export function calculateRiskRewardMetrics(
  entry: number,
  target: number,
  stop: number
): RiskRewardMetrics {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  const ratio = risk > 0 ? reward / risk : 0;

  const riskPercent = (risk / entry) * 100;
  const rewardPercent = (reward / entry) * 100;

  return {
    entry,
    target,
    stop,
    risk,
    reward,
    ratio,
    riskPercent,
    rewardPercent,
  };
}

/**
 * Score absorption pattern (0-10 points)
 *
 * Absorption occurs when high volume doesn't move price (action without reaction).
 * This reveals hidden institutional buying/selling before price moves.
 *
 * Based on Jay Ortani's strategy: "When I see 50K shares sold and price doesn't move,
 * I know institutions are absorbing that supply."
 *
 * @param absorption - Detected absorption pattern
 * @param setupType - Trade setup type (long/short)
 * @returns Score 0-10
 */
export function scoreAbsorption(
  absorption: AbsorptionPattern,
  setupType: 'long' | 'short'
): number {
  if (absorption.type === 'none') return 0;

  // Only score absorption if it aligns with our setup direction
  if (setupType === 'long' && absorption.type !== 'buying') return 0;
  if (setupType === 'short' && absorption.type !== 'selling') return 0;

  // High confidence absorption adds up to 10 points
  const baseScore = (absorption.confidence / 100) * 10;

  // Bonus points if large orders are involved (more reliable)
  const largeOrderBonus = absorption.largeOrdersInvolved > 0 ? 1 : 0;

  return Math.min(10, Math.round(baseScore + largeOrderBonus));
}
