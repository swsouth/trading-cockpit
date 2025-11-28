/**
 * Trade Calculator - Main Module
 *
 * Generates complete trade recommendations with entry, target, and stop loss
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult } from '../types';
import { TradeRecommendation, TradeCalculatorInput } from './types';
import { determineSetupType, isActionableSetup } from './setupDetection';
import {
  calculateLongEntry,
  calculateShortEntry,
  calculateLongStopLoss,
  calculateShortStopLoss,
  calculateLongTarget,
  calculateShortTarget,
  validateLongPrices,
  validateShortPrices,
} from './priceCalculations';
import {
  generateTradeRationale,
  generateSetupSummary,
  generateTargetReasonText,
  generateStopReasonText,
} from './rationale';

/**
 * Generate a complete trade recommendation
 *
 * @param input - All data needed for trade calculation
 * @returns Complete trade recommendation or null if no actionable setup
 */
export function generateTradeRecommendation(
  input: TradeCalculatorInput
): TradeRecommendation | null {
  const { symbol, candles, channel, pattern, currentPrice: providedPrice, volume, absorption } = input;

  // Get current price
  const currentPrice = providedPrice ?? candles[candles.length - 1].close;

  // Determine setup type (pass volume and absorption for high confidence determination)
  const setup = determineSetupType(candles, channel, pattern, volume, absorption);

  // Only proceed if we have an actionable setup
  if (!isActionableSetup(setup)) {
    return null;
  }

  // Calculate prices based on setup type
  if (setup.type === 'long') {
    return generateLongRecommendation(symbol, currentPrice, candles, channel, pattern, setup);
  } else if (setup.type === 'short') {
    return generateShortRecommendation(symbol, currentPrice, candles, channel, pattern, setup);
  }

  return null;
}

/**
 * Generate a long trade recommendation
 */
function generateLongRecommendation(
  symbol: string,
  currentPrice: number,
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  setup: any
): TradeRecommendation | null {
  // Calculate entry
  const entryCalc = calculateLongEntry(currentPrice, channel, setup);
  const entry = entryCalc.price;

  // Calculate stop loss
  const stopCalc = calculateLongStopLoss(entry, candles, channel, pattern);
  const stopLoss = stopCalc.price;

  // Calculate target
  const targetCalc = calculateLongTarget(entry, stopLoss, channel, 2.0);
  const target = targetCalc.price;

  // Validate prices
  if (!validateLongPrices(entry, target, stopLoss)) {
    return null; // Invalid price levels
  }

  // Calculate risk/reward metrics
  const riskAmount = entry - stopLoss;
  const rewardAmount = target - entry;
  const riskRewardRatio = rewardAmount / riskAmount;
  const riskPercent = (riskAmount / entry) * 100;
  const rewardPercent = (rewardAmount / entry) * 100;

  // Generate rationale
  const rationale = generateTradeRationale({
    symbol,
    setupType: 'long',
    setupName: setup.setupName,
    channelStatus: channel.hasChannel ? channel.status : null,
    pattern: pattern.mainPattern !== 'none' ? pattern.mainPattern : null,
    entryReason: entryCalc.reason,
    targetReason: targetCalc.reason,
    stopReason: stopCalc.reason,
    riskReward: riskRewardRatio,
    currentPrice,
    entry,
    target,
    stopLoss,
  });

  return {
    symbol,
    setup,
    entry,
    target,
    stopLoss,
    riskAmount,
    rewardAmount,
    riskRewardRatio,
    riskPercent,
    rewardPercent,
    currentPrice,
    timeframe: 'swing_trade', // Default to swing trade
    rationale,
    entryReason: entryCalc.reason,
    targetReason: generateTargetReasonText('long', targetCalc.method),
    stopReason: generateStopReasonText('long', stopCalc.method),
    channelSupport: channel.hasChannel ? channel.support : undefined,
    channelResistance: channel.hasChannel ? channel.resistance : undefined,
  };
}

/**
 * Generate a short trade recommendation
 */
function generateShortRecommendation(
  symbol: string,
  currentPrice: number,
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  setup: any
): TradeRecommendation | null {
  // Calculate entry
  const entryCalc = calculateShortEntry(currentPrice, channel, setup);
  const entry = entryCalc.price;

  // Calculate stop loss
  const stopCalc = calculateShortStopLoss(entry, candles, channel, pattern);
  const stopLoss = stopCalc.price;

  // Calculate target
  const targetCalc = calculateShortTarget(entry, stopLoss, channel, 2.0);
  const target = targetCalc.price;

  // Validate prices
  if (!validateShortPrices(entry, target, stopLoss)) {
    return null; // Invalid price levels
  }

  // Calculate risk/reward metrics
  const riskAmount = stopLoss - entry;
  const rewardAmount = entry - target;
  const riskRewardRatio = rewardAmount / riskAmount;
  const riskPercent = (riskAmount / entry) * 100;
  const rewardPercent = (rewardAmount / entry) * 100;

  // Generate rationale
  const rationale = generateTradeRationale({
    symbol,
    setupType: 'short',
    setupName: setup.setupName,
    channelStatus: channel.hasChannel ? channel.status : null,
    pattern: pattern.mainPattern !== 'none' ? pattern.mainPattern : null,
    entryReason: entryCalc.reason,
    targetReason: targetCalc.reason,
    stopReason: stopCalc.reason,
    riskReward: riskRewardRatio,
    currentPrice,
    entry,
    target,
    stopLoss,
  });

  return {
    symbol,
    setup,
    entry,
    target,
    stopLoss,
    riskAmount,
    rewardAmount,
    riskRewardRatio,
    riskPercent,
    rewardPercent,
    currentPrice,
    timeframe: 'swing_trade', // Default to swing trade
    rationale,
    entryReason: entryCalc.reason,
    targetReason: generateTargetReasonText('short', targetCalc.method),
    stopReason: generateStopReasonText('short', stopCalc.method),
    channelSupport: channel.hasChannel ? channel.support : undefined,
    channelResistance: channel.hasChannel ? channel.resistance : undefined,
  };
}

// Re-export types and functions
export * from './types';
export * from './setupDetection';
export * from './priceCalculations';
export * from './rationale';
