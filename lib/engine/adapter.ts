// @ts-nocheck - DEPRECATED: Legacy adapter, not used by current scanners
/**
 * Engine Adapter
 *
 * Converts Analysis Engine's Signal type to legacy scanner types.
 * This allows gradual migration from old analysis pipeline to new engine.
 *
 * STATUS: DEPRECATED - Not imported anywhere, kept for reference only
 */

import { Signal } from './types';
import { StockAnalysisResult } from '../../scripts/scanner/types';
import { TradeRecommendation, OpportunityScore as LegacyScore } from '../types';

/**
 * Convert engine Signal to StockAnalysisResult
 *
 * Maps the standardized Signal type to the scanner's expected format.
 * This adapter will be removed once all scanners use the engine directly.
 */
export function signalToAnalysisResult(
  symbol: string,
  signal: Signal | null,
  candles?: any[]
): StockAnalysisResult {
  // No signal = no actionable setup
  if (!signal) {
    return {
      symbol,
      success: true,
      error: 'No actionable setup',
    };
  }

  // Convert Signal to TradeRecommendation (legacy format)
  const recommendation: TradeRecommendation = {
    symbol: signal.symbol,
    setup: {
      type: signal.recommendation || 'none',
      setupName: formatSetupName(signal),
      confidence: signal.confidence,
      bias: signal.recommendation === 'long' ? 'bullish' : signal.recommendation === 'short' ? 'bearish' : 'neutral',
    },
    entry: signal.entry,
    target: signal.target,
    stopLoss: signal.stopLoss,
    riskAmount: signal.recommendation === 'long'
      ? signal.entry - signal.stopLoss
      : signal.stopLoss - signal.entry,
    rewardAmount: signal.recommendation === 'long'
      ? signal.target - signal.entry
      : signal.entry - signal.target,
    riskRewardRatio: signal.riskReward,
    riskPercent: signal.recommendation === 'long'
      ? ((signal.entry - signal.stopLoss) / signal.entry) * 100
      : ((signal.stopLoss - signal.entry) / signal.entry) * 100,
    rewardPercent: signal.recommendation === 'long'
      ? ((signal.target - signal.entry) / signal.entry) * 100
      : ((signal.entry - signal.target) / signal.entry) * 100,
    currentPrice: signal.entry, // Use entry as current price proxy
    timeframe: 'swing_trade',
    rationale: signal.rationale,
    entryReason: `Entry based on ${signal.mainPattern || 'pattern'}`,
    targetReason: `Target based on ${signal.riskReward.toFixed(1)}:1 R:R`,
    stopReason: 'Stop based on channel/ATR',
    channelSupport: undefined,
    channelResistance: undefined,
  };

  // Convert score to legacy format
  // Note: Component scores aren't exposed in Signal, so we provide placeholder values
  const score: LegacyScore = {
    totalScore: signal.score,
    confidenceLevel: signal.confidence,
    // Component scores: Use totalScore divided by weight as proxy
    trendStrength: Math.round(signal.score * 0.30), // 30% weight
    patternQuality: Math.round(signal.score * 0.25), // 25% weight
    volumeConfirmation: signal.metadata.volumeConfirmation ? 80 : 40,
    riskReward: Math.round(signal.riskReward * 15), // Scale to 0-100 (typical R:R 2-6)
    momentumRSI: Math.round(signal.score * 0.10), // 10% weight
    breakdown: {
      trend: Math.round(signal.score * 0.30),
      pattern: Math.round(signal.score * 0.25),
      volume: signal.metadata.volumeConfirmation ? 80 : 40,
      riskReward: Math.round(signal.riskReward * 15),
      momentum: Math.round(signal.score * 0.10),
    },
  };

  return {
    symbol,
    success: true,
    recommendation,
    score,
    vetting: null, // Vetting not part of engine yet
    candles,
  };
}

/**
 * Format setup name from signal patterns and regime
 */
function formatSetupName(signal: Signal): string {
  const parts: string[] = [];

  // Pattern component
  if (signal.mainPattern) {
    const patternName = signal.mainPattern
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    parts.push(patternName);
  }

  // Position component
  if (signal.metadata.channelStatus) {
    const positionName = signal.metadata.channelStatus
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    parts.push(positionName);
  }

  // Direction
  if (signal.recommendation) {
    const direction = signal.recommendation.charAt(0).toUpperCase() + signal.recommendation.slice(1);
    parts.push(direction);
  }

  return parts.length > 0 ? parts.join(' - ') : 'Trade Setup';
}
