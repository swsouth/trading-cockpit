/**
 * Price Calculations
 *
 * Functions for calculating entry, stop loss, and target prices
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult } from '../types';
import { calculateATR } from '../scoring/indicators';
import { TradeSetup, EntryCalculation, StopLossCalculation, TargetCalculation } from './types';

/**
 * Calculate entry price for a long setup
 */
export function calculateLongEntry(
  currentPrice: number,
  channel: ChannelDetectionResult,
  setup: TradeSetup
): EntryCalculation {
  if (!channel.hasChannel) {
    // No channel - enter at current price
    return {
      price: currentPrice,
      reason: 'Market entry at current price',
      entryType: 'market',
    };
  }

  // Calculate distance from support
  const distanceFromSupport = Math.abs(currentPrice - channel.support) / channel.support;

  if (distanceFromSupport < 0.02) {
    // Within 2% of support - good entry point
    return {
      price: currentPrice,
      reason: 'Near support - favorable entry',
      entryType: 'market',
    };
  } else if (setup.setupName.includes('Breakout')) {
    // Breakout - enter on pullback to broken resistance (now support)
    const pullbackPrice = channel.resistance * 1.005; // Slightly above old resistance
    return {
      price: pullbackPrice,
      reason: 'Pullback to broken resistance (now support)',
      entryType: 'limit',
    };
  } else {
    // Wait for pullback to support
    const entryPrice = channel.support * 1.01; // 1% above support
    return {
      price: entryPrice,
      reason: 'Limit order near support zone',
      entryType: 'limit',
    };
  }
}

/**
 * Calculate entry price for a short setup
 */
export function calculateShortEntry(
  currentPrice: number,
  channel: ChannelDetectionResult,
  setup: TradeSetup
): EntryCalculation {
  if (!channel.hasChannel) {
    // No channel - enter at current price
    return {
      price: currentPrice,
      reason: 'Market entry at current price',
      entryType: 'market',
    };
  }

  // Calculate distance from resistance
  const distanceFromResistance = Math.abs(currentPrice - channel.resistance) / channel.resistance;

  if (distanceFromResistance < 0.02) {
    // Within 2% of resistance - good entry point
    return {
      price: currentPrice,
      reason: 'Near resistance - favorable entry',
      entryType: 'market',
    };
  } else if (setup.setupName.includes('Breakdown')) {
    // Breakdown - enter on bounce to broken support (now resistance)
    const bouncePrice = channel.support * 0.995; // Slightly below old support
    return {
      price: bouncePrice,
      reason: 'Bounce to broken support (now resistance)',
      entryType: 'limit',
    };
  } else {
    // Wait for rally to resistance
    const entryPrice = channel.resistance * 0.99; // 1% below resistance
    return {
      price: entryPrice,
      reason: 'Limit order near resistance zone',
      entryType: 'limit',
    };
  }
}

/**
 * Calculate stop loss for a long setup
 */
export function calculateLongStopLoss(
  entryPrice: number,
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult
): StopLossCalculation {
  const atr = calculateATR(candles);

  if (channel.hasChannel) {
    // Use channel support for stop
    const channelStop = channel.support * 0.98; // 2% below support
    const atrStop = entryPrice - (atr * 2); // 2x ATR below entry

    // Use the tighter of the two (less risk)
    if (channelStop > atrStop && (entryPrice - channelStop) / entryPrice < 0.08) {
      // Channel stop is tighter and within 8% risk
      return {
        price: channelStop,
        reason: 'Below channel support',
        method: 'channel',
      };
    }
  }

  // Fall back to ATR-based stop
  const atrStop = entryPrice - (atr * 2.5); // 2.5x ATR for swing trades

  // Ensure stop is reasonable (not more than 10% risk)
  const maxRisk = entryPrice * 0.10;
  const stopPrice = Math.max(atrStop, entryPrice - maxRisk);

  return {
    price: stopPrice,
    reason: '2.5x ATR below entry',
    method: 'atr',
  };
}

/**
 * Calculate stop loss for a short setup
 */
export function calculateShortStopLoss(
  entryPrice: number,
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult
): StopLossCalculation {
  const atr = calculateATR(candles);

  if (channel.hasChannel) {
    // Use channel resistance for stop
    const channelStop = channel.resistance * 1.02; // 2% above resistance
    const atrStop = entryPrice + (atr * 2); // 2x ATR above entry

    // Use the tighter of the two (less risk)
    if (channelStop < atrStop && (channelStop - entryPrice) / entryPrice < 0.08) {
      // Channel stop is tighter and within 8% risk
      return {
        price: channelStop,
        reason: 'Above channel resistance',
        method: 'channel',
      };
    }
  }

  // Fall back to ATR-based stop
  const atrStop = entryPrice + (atr * 2.5); // 2.5x ATR for swing trades

  // Ensure stop is reasonable (not more than 10% risk)
  const maxRisk = entryPrice * 0.10;
  const stopPrice = Math.min(atrStop, entryPrice + maxRisk);

  return {
    price: stopPrice,
    reason: '2.5x ATR above entry',
    method: 'atr',
  };
}

/**
 * Calculate target price for a long setup
 */
export function calculateLongTarget(
  entryPrice: number,
  stopLoss: number,
  channel: ChannelDetectionResult,
  minRiskReward: number = 2.0
): TargetCalculation {
  const risk = entryPrice - stopLoss;

  if (channel.hasChannel) {
    // Target near resistance
    const channelTarget = channel.resistance * 0.98; // 2% below resistance for safety
    const channelReward = channelTarget - entryPrice;
    const channelRR = channelReward / risk;

    // If channel target gives acceptable R:R, use it
    if (channelRR >= minRiskReward) {
      return {
        price: channelTarget,
        reason: 'Channel resistance target',
        method: 'channel',
      };
    }
  }

  // Fall back to risk/reward target
  const rrTarget = entryPrice + (risk * minRiskReward);

  return {
    price: rrTarget,
    reason: `${minRiskReward}:1 risk/reward target`,
    method: 'risk_reward',
  };
}

/**
 * Calculate target price for a short setup
 */
export function calculateShortTarget(
  entryPrice: number,
  stopLoss: number,
  channel: ChannelDetectionResult,
  minRiskReward: number = 2.0
): TargetCalculation {
  const risk = stopLoss - entryPrice;

  if (channel.hasChannel) {
    // Target near support
    const channelTarget = channel.support * 1.02; // 2% above support for safety
    const channelReward = entryPrice - channelTarget;
    const channelRR = channelReward / risk;

    // If channel target gives acceptable R:R, use it
    if (channelRR >= minRiskReward) {
      return {
        price: channelTarget,
        reason: 'Channel support target',
        method: 'channel',
      };
    }
  }

  // Fall back to risk/reward target
  const rrTarget = entryPrice - (risk * minRiskReward);

  return {
    price: rrTarget,
    reason: `${minRiskReward}:1 risk/reward target`,
    method: 'risk_reward',
  };
}

/**
 * Validate that entry/stop/target make sense for a long setup
 */
export function validateLongPrices(entry: number, target: number, stop: number): boolean {
  // Target should be above entry
  if (target <= entry) return false;

  // Stop should be below entry
  if (stop >= entry) return false;

  // Risk should be reasonable (not more than 15%)
  const risk = (entry - stop) / entry;
  if (risk > 0.15) return false;

  // R:R should be at least 1:1
  const reward = (target - entry) / entry;
  if (reward < risk) return false;

  return true;
}

/**
 * Validate that entry/stop/target make sense for a short setup
 */
export function validateShortPrices(entry: number, target: number, stop: number): boolean {
  // Target should be below entry
  if (target >= entry) return false;

  // Stop should be above entry
  if (stop <= entry) return false;

  // Risk should be reasonable (not more than 15%)
  const risk = (stop - entry) / entry;
  if (risk > 0.15) return false;

  // R:R should be at least 1:1
  const reward = (entry - target) / entry;
  if (reward < risk) return false;

  return true;
}
