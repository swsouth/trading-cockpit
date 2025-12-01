/**
 * Scoring Module
 *
 * Configuration-driven opportunity scoring (0-100 scale).
 * Applies scoring weights from config to ensure consistent evaluation
 * across stocks and crypto.
 *
 * Score Components:
 * - Trend Strength: 0-100 (weighted by config.scoring.trendWeight)
 * - Pattern Quality: 0-100 (weighted by config.scoring.patternWeight)
 * - Volume Confirmation: 0-100 (weighted by config.scoring.volumeWeight)
 * - Risk/Reward: 0-100 (weighted by config.scoring.riskRewardWeight)
 * - Momentum/RSI: 0-100 (weighted by config.scoring.momentumWeight)
 *
 * Total Score = Σ(Component × Weight) × 100
 */

import { Candle } from '../../types';
import {
  AnalysisConfig,
  OpportunityScore,
  ScoreComponents,
  PatternResult,
  TradeSetup,
  Indicators,
} from '../types';
import { ChannelResult } from '../patterns/channel';
import { calculateRSI } from '../patterns/indicators';

/**
 * Calculate comprehensive opportunity score using config weights
 *
 * @param candles - Price candles
 * @param channel - Channel detection result
 * @param patterns - Detected patterns
 * @param tradeSetup - Trade setup (entry/stop/target)
 * @param indicators - Technical indicators
 * @param config - Analysis configuration
 * @returns Opportunity score with breakdown
 */
export function calculateOpportunityScore(
  candles: Candle[],
  channel: ChannelResult,
  patterns: PatternResult[],
  tradeSetup: TradeSetup,
  indicators: Indicators,
  config: AnalysisConfig
): OpportunityScore {
  // Calculate each component as 0-100 raw score
  const trendScore = scoreTrendStrength(candles, channel, config);
  const patternScore = scorePatternQuality(patterns);
  const volumeScore = scoreVolumeConfirmation(indicators);
  const riskRewardScore = scoreRiskReward(tradeSetup.riskReward);
  const momentumScore = scoreMomentum(
    candles,
    tradeSetup.direction,
    channel.status
  );

  // Apply configuration weights to get final weighted scores
  const weights = config.scoring;

  // Each component contributes its weighted portion to the total
  // Example: If trendScore = 80 and trendWeight = 0.30,
  //          contribution = 80 * 0.30 = 24 points out of 100
  const weightedTrend = trendScore * weights.trendWeight;
  const weightedPattern = patternScore * weights.patternWeight;
  const weightedVolume = volumeScore * weights.volumeWeight;
  const weightedRR = riskRewardScore * weights.riskRewardWeight;
  const weightedMomentum = momentumScore * weights.momentumWeight;

  // Total score (0-100)
  const total =
    weightedTrend +
    weightedPattern +
    weightedVolume +
    weightedRR +
    weightedMomentum;

  // Calculate confidence level
  const level = total >= 75 ? 'high' : total >= 60 ? 'medium' : 'low';

  return {
    total: Math.round(total),
    components: {
      trendScore: Math.round(weightedTrend),
      patternScore: Math.round(weightedPattern),
      volumeScore: Math.round(weightedVolume),
      riskRewardScore: Math.round(weightedRR),
      momentumScore: Math.round(weightedMomentum),
    },
    level,
  };
}

// ============================================================================
// COMPONENT SCORING FUNCTIONS (0-100 SCALE)
// ============================================================================

/**
 * Score trend strength (0-100)
 *
 * Factors:
 * - Channel clarity: How well-defined the channel is
 * - Channel slope: Strength of directional movement
 * - Price position: Optimal entry location in channel
 */
function scoreTrendStrength(
  candles: Candle[],
  channel: ChannelResult,
  config: AnalysisConfig
): number {
  if (!channel.hasChannel) {
    return 20; // Minimal score without clear channel
  }

  let score = 0;

  // 1. Channel Clarity (0-40 points)
  // Tighter channel = clearer structure
  const widthPct = channel.widthPct;

  if (widthPct < config.channel.minWidth * 1.5) {
    score += 40; // Very tight, well-defined
  } else if (widthPct < config.channel.minWidth * 2.5) {
    score += 30; // Good clarity
  } else if (widthPct < config.channel.minWidth * 4) {
    score += 20; // Acceptable
  } else {
    score += 10; // Loose/unclear
  }

  // 2. Channel Slope (0-40 points)
  // Stronger trend = better
  const absSlope = Math.abs(channel.slope);

  if (absSlope > 2.0) {
    score += 40; // Strong directional trend (>2% per bar)
  } else if (absSlope > 1.0) {
    score += 30; // Moderate trend (1-2%)
  } else if (absSlope > 0.5) {
    score += 20; // Weak trend (0.5-1%)
  } else {
    score += 10; // Sideways (<0.5%)
  }

  // 3. Price Position (0-20 points)
  // Optimal entry = near support in uptrend, near resistance in downtrend
  const currentPrice = candles[candles.length - 1].close;
  const channelPosition =
    (currentPrice - channel.support) / (channel.resistance - channel.support);

  const isUptrend = channel.slope > 0;
  const isDowntrend = channel.slope < 0;

  if (isUptrend && channelPosition < 0.3) {
    // Near support in uptrend = good long entry
    score += 20;
  } else if (isDowntrend && channelPosition > 0.7) {
    // Near resistance in downtrend = good short entry
    score += 20;
  } else if (channelPosition >= 0.3 && channelPosition <= 0.7) {
    // Mid-channel
    score += 10;
  } else {
    // Wrong side of channel for trend direction
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Score pattern quality (0-100)
 *
 * Incorporates pattern confidence and historical win rates
 */
function scorePatternQuality(patterns: PatternResult[]): number {
  if (patterns.length === 0) {
    return 30; // Base score for no pattern
  }

  // Use highest confidence pattern
  const bestPattern = patterns[0]; // Already sorted by confidence

  // Win rate contribution (0-50 points)
  const winRate = bestPattern.data.winRate || 0.5;
  const winRateScore = winRate * 50; // 50% win rate = 25pts, 70% = 35pts

  // Confidence contribution (0-50 points)
  const confidenceScore = bestPattern.confidence * 50;

  return Math.min(100, winRateScore + confidenceScore);
}

/**
 * Score volume confirmation (0-100)
 *
 * Higher volume = stronger confirmation
 */
function scoreVolumeConfirmation(indicators: Indicators): number {
  const currentVolume = indicators.volumeCurrent || 0;
  const avgVolume = indicators.volume30DayAvg || 1;

  if (avgVolume === 0) {
    return 50; // Neutral if no volume data
  }

  const volumeRatio = currentVolume / avgVolume;

  // Score based on volume ratio
  if (volumeRatio >= 2.0) {
    return 100; // Exceptional volume (2x average)
  } else if (volumeRatio >= 1.5) {
    return 85; // High volume (1.5x average)
  } else if (volumeRatio >= 1.2) {
    return 70; // Above average
  } else if (volumeRatio >= 1.0) {
    return 50; // Average
  } else if (volumeRatio >= 0.8) {
    return 35; // Below average
  } else {
    return 20; // Low volume
  }
}

/**
 * Score risk/reward ratio (0-100)
 *
 * Higher R:R = better opportunity
 * Minimum acceptable: 1.5:1, Ideal: 3:1+
 */
function scoreRiskReward(ratio: number): number {
  if (ratio >= 4.0) {
    return 100; // Exceptional R:R
  } else if (ratio >= 3.5) {
    return 95;
  } else if (ratio >= 3.0) {
    return 90;
  } else if (ratio >= 2.5) {
    return 80;
  } else if (ratio >= 2.0) {
    return 65; // Good R:R
  } else if (ratio >= 1.5) {
    return 45; // Acceptable
  } else if (ratio >= 1.0) {
    return 25; // Marginal
  } else {
    return 10; // Poor R:R
  }
}

/**
 * Score momentum/RSI (0-100)
 *
 * Context-aware scoring:
 * - Reversal setups: Favor oversold/overbought zones
 * - Continuation setups: Favor healthy momentum zones
 *
 * @param candles - Price candles
 * @param direction - Trade direction ('long' or 'short')
 * @param channelStatus - Price position in channel
 */
function scoreMomentum(
  candles: Candle[],
  direction: 'long' | 'short',
  channelStatus: ChannelResult['status']
): number {
  const rsi = calculateRSI(candles);

  // Determine if this is a reversal or continuation setup
  const isReversal =
    (direction === 'long' && channelStatus === 'near_support') ||
    (direction === 'short' && channelStatus === 'near_resistance');

  if (direction === 'long') {
    if (isReversal) {
      // REVERSAL LONG (bounce off support)
      // Favor oversold conditions
      if (rsi >= 25 && rsi <= 35) {
        return 100; // Sweet spot: oversold, ready to bounce
      } else if (rsi > 35 && rsi <= 45) {
        return 80; // Recovering from oversold
      } else if (rsi > 45 && rsi <= 55) {
        return 50; // Neutral
      } else if (rsi > 55) {
        return 30; // Not oversold, weaker reversal
      } else {
        return 70; // Very oversold (<25), risky but possible
      }
    } else {
      // CONTINUATION LONG (trending up)
      // Favor healthy uptrend momentum
      if (rsi >= 50 && rsi <= 60) {
        return 100; // Sweet spot: healthy uptrend
      } else if (rsi > 60 && rsi <= 70) {
        return 85; // Strong uptrend
      } else if (rsi > 70 && rsi <= 75) {
        return 60; // Overbought but strong
      } else if (rsi > 75) {
        return 30; // Very overbought, risk of pullback
      } else if (rsi >= 45 && rsi < 50) {
        return 70; // Building momentum
      } else {
        return 40; // Too weak for continuation
      }
    }
  } else {
    // SHORT setups (mirror of long logic)
    if (isReversal) {
      // REVERSAL SHORT (rejection at resistance)
      // Favor overbought conditions
      if (rsi >= 65 && rsi <= 75) {
        return 100; // Sweet spot: overbought, ready to reject
      } else if (rsi >= 55 && rsi < 65) {
        return 80; // Moving toward overbought
      } else if (rsi >= 45 && rsi < 55) {
        return 50; // Neutral
      } else if (rsi < 45) {
        return 30; // Not overbought, weaker reversal
      } else {
        return 70; // Very overbought (>75), risky but possible
      }
    } else {
      // CONTINUATION SHORT (trending down)
      // Favor healthy downtrend momentum
      if (rsi >= 40 && rsi <= 50) {
        return 100; // Sweet spot: healthy downtrend
      } else if (rsi >= 30 && rsi < 40) {
        return 85; // Strong downtrend
      } else if (rsi >= 25 && rsi < 30) {
        return 60; // Oversold but strong downtrend
      } else if (rsi < 25) {
        return 30; // Very oversold, risk of bounce
      } else if (rsi > 50 && rsi <= 55) {
        return 70; // Building downward momentum
      } else {
        return 40; // Too strong for continuation short
      }
    }
  }
}
