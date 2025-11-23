/**
 * Trade Rationale Generator
 *
 * Creates human-readable explanations for trade recommendations
 */

import { RationaleParams } from './types';

/**
 * Generate a complete trade rationale
 */
export function generateTradeRationale(params: RationaleParams): string {
  const {
    symbol,
    setupType,
    setupName,
    channelStatus,
    pattern,
    entryReason,
    targetReason,
    stopReason,
    riskReward,
    currentPrice,
    entry,
    target,
    stopLoss,
  } = params;

  const parts: string[] = [];

  // Opening statement
  parts.push(`**${symbol}** presents a ${setupType} opportunity.`);

  // Setup description
  if (channelStatus && channelStatus !== 'inside') {
    if (setupType === 'long') {
      if (channelStatus === 'near_support') {
        parts.push('Price is trading near channel support, offering an attractive entry point for a bounce play.');
      } else if (channelStatus === 'broken_out') {
        parts.push('Price has broken out above the channel, suggesting strong bullish momentum.');
      }
    } else {
      if (channelStatus === 'near_resistance') {
        parts.push('Price is testing channel resistance, setting up a potential rejection.');
      } else if (channelStatus === 'broken_out') {
        parts.push('Price has broken down below the channel, indicating strong bearish pressure.');
      }
    }
  }

  // Pattern confirmation
  if (pattern && pattern !== 'none') {
    const patternName = formatPatternName(pattern);
    parts.push(`A ${patternName} pattern provides additional confirmation of ${setupType === 'long' ? 'bullish' : 'bearish'} bias.`);
  }

  // Entry explanation
  parts.push(`Entry at $${entry.toFixed(2)} (current: $${currentPrice.toFixed(2)}): ${entryReason}.`);

  // Target explanation
  const potentialGain = setupType === 'long'
    ? ((target - entry) / entry * 100).toFixed(1)
    : ((entry - target) / entry * 100).toFixed(1);
  parts.push(`Target at $${target.toFixed(2)} (+${potentialGain}%): ${targetReason}.`);

  // Stop explanation
  const potentialLoss = setupType === 'long'
    ? ((entry - stopLoss) / entry * 100).toFixed(1)
    : ((stopLoss - entry) / entry * 100).toFixed(1);
  parts.push(`Stop loss at $${stopLoss.toFixed(2)} (-${potentialLoss}%): ${stopReason}.`);

  // Risk/Reward summary
  parts.push(`Risk/reward ratio of 1:${riskReward.toFixed(1)} offers favorable risk-adjusted returns.`);

  return parts.join(' ');
}

/**
 * Format pattern name for human readability
 */
function formatPatternName(pattern: string): string {
  const patternNames: Record<string, string> = {
    'bullish_engulfing': 'bullish engulfing',
    'bearish_engulfing': 'bearish engulfing',
    'hammer': 'hammer',
    'shooting_star': 'shooting star',
    'piercing_line': 'piercing line',
    'dark_cloud_cover': 'dark cloud cover',
    'doji': 'doji',
  };

  return patternNames[pattern] || pattern.replace(/_/g, ' ');
}

/**
 * Generate a brief setup summary (one line)
 */
export function generateSetupSummary(
  setupName: string,
  riskReward: number,
  channelStatus: string | null
): string {
  const rrDisplay = riskReward.toFixed(1);

  if (channelStatus === 'near_support') {
    return `${setupName} with ${rrDisplay}:1 R:R at support`;
  } else if (channelStatus === 'near_resistance') {
    return `${setupName} with ${rrDisplay}:1 R:R at resistance`;
  } else if (channelStatus === 'broken_out') {
    return `${setupName} with ${rrDisplay}:1 R:R on breakout`;
  } else {
    return `${setupName} with ${rrDisplay}:1 R:R`;
  }
}

/**
 * Generate entry reason text
 */
export function generateEntryReasonText(
  setupType: 'long' | 'short',
  channelStatus: string | null,
  distanceFromLevel: number
): string {
  if (setupType === 'long') {
    if (channelStatus === 'near_support') {
      if (distanceFromLevel < 0.02) {
        return 'At support level - favorable risk/reward entry';
      } else {
        return 'Near support with room to pullback';
      }
    } else if (channelStatus === 'broken_out') {
      return 'On pullback to breakout level (old resistance, now support)';
    } else {
      return 'Current price action suggests upside potential';
    }
  } else {
    if (channelStatus === 'near_resistance') {
      if (distanceFromLevel < 0.02) {
        return 'At resistance level - favorable risk/reward entry';
      } else {
        return 'Near resistance with room to rally';
      }
    } else if (channelStatus === 'broken_out') {
      return 'On bounce to breakdown level (old support, now resistance)';
    } else {
      return 'Current price action suggests downside potential';
    }
  }
}

/**
 * Generate target reason text
 */
export function generateTargetReasonText(
  setupType: 'long' | 'short',
  method: 'channel' | 'risk_reward' | 'fibonacci' | 'measured_move'
): string {
  if (method === 'channel') {
    return setupType === 'long'
      ? 'Channel resistance provides natural profit target'
      : 'Channel support provides natural profit target';
  } else if (method === 'risk_reward') {
    return 'Risk/reward ratio determines profit target';
  } else {
    return 'Technical analysis determines profit target';
  }
}

/**
 * Generate stop reason text
 */
export function generateStopReasonText(
  setupType: 'long' | 'short',
  method: 'channel' | 'atr' | 'pattern' | 'percentage'
): string {
  if (method === 'channel') {
    return setupType === 'long'
      ? 'Below support invalidates bullish thesis'
      : 'Above resistance invalidates bearish thesis';
  } else if (method === 'atr') {
    return 'ATR-based stop accounts for normal volatility';
  } else {
    return 'Stop placement protects capital while allowing room to work';
  }
}
