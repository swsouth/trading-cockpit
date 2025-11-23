/**
 * Trade Calculator Type Definitions
 *
 * Defines types for entry/exit/stop price calculations
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult } from '../types';

/**
 * Trade setup direction
 */
export type SetupType = 'long' | 'short' | 'none';

/**
 * Trade setup classification
 */
export interface TradeSetup {
  type: SetupType;
  setupName: string; // "Long - Channel Support", "Short - Resistance Rejection", etc.
  reason: string; // Why this setup was identified
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Complete trade recommendation with entry, target, and stop
 */
export interface TradeRecommendation {
  symbol: string;
  setup: TradeSetup;

  // Price levels
  entry: number;
  target: number;
  stopLoss: number;

  // Risk/Reward metrics
  riskAmount: number;      // $ at risk (entry - stop)
  rewardAmount: number;    // $ potential profit (target - entry)
  riskRewardRatio: number; // reward / risk
  riskPercent: number;     // % from entry
  rewardPercent: number;   // % from entry

  // Context
  currentPrice: number;
  timeframe: 'day_trade' | 'swing_trade' | 'position_trade';

  // Explanation
  rationale: string;
  entryReason: string;
  targetReason: string;
  stopReason: string;

  // Technical details
  channelSupport?: number;
  channelResistance?: number;
  atr?: number;
}

/**
 * Input for trade calculator
 */
export interface TradeCalculatorInput {
  symbol: string;
  candles: Candle[];
  channel: ChannelDetectionResult;
  pattern: PatternDetectionResult;
  currentPrice?: number; // If not provided, uses last candle close
}

/**
 * Entry price calculation result
 */
export interface EntryCalculation {
  price: number;
  reason: string;
  entryType: 'market' | 'limit' | 'stop';
}

/**
 * Stop loss calculation result
 */
export interface StopLossCalculation {
  price: number;
  reason: string;
  method: 'channel' | 'atr' | 'pattern' | 'percentage';
}

/**
 * Target price calculation result
 */
export interface TargetCalculation {
  price: number;
  reason: string;
  method: 'channel' | 'risk_reward' | 'fibonacci' | 'measured_move';
}

/**
 * Rationale generation parameters
 */
export interface RationaleParams {
  symbol: string;
  setupType: SetupType;
  setupName: string;
  channelStatus: string | null;
  pattern: string | null;
  entryReason: string;
  targetReason: string;
  stopReason: string;
  riskReward: number;
  currentPrice: number;
  entry: number;
  target: number;
  stopLoss: number;
}
