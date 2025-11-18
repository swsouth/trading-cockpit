import {
  ChannelDetectionResult,
  PatternDetectionResult,
  CombinedSignal,
  TradingAction,
  Quote,
} from '../types';
import {
  calculateConfidence,
  calculateRiskReward,
  calculatePercentChange,
} from './confidenceScorer';

/**
 * Generate trading action recommendation based on technical analysis
 *
 * This is the core IP - converts technical patterns into specific trade recommendations
 * with entry prices, targets, stops, and risk/reward calculations.
 *
 * Rules:
 * 1. BULLISH SUPPORT BOUNCE - Buy near support with bullish pattern
 * 2. BEARISH RESISTANCE REJECTION - Sell/short near resistance with bearish pattern
 * 3. BREAKOUT - Buy breakouts above resistance
 * 4. INSIDE CHANNEL - Wait for better setup
 * 5. NO CLEAR SETUP - Wait
 */
export function generateTradingAction(
  symbol: string,
  quote: Quote,
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  signal: CombinedSignal
): TradingAction {
  const price = quote.price;
  const volume = quote.volume;

  // RULE 1: BULLISH SUPPORT BOUNCE
  if (
    channel.hasChannel &&
    channel.status === 'near_support' &&
    (pattern.mainPattern === 'hammer' ||
      pattern.mainPattern === 'bullish_engulfing' ||
      pattern.mainPattern === 'piercing_line') &&
    signal.bias === 'bullish'
  ) {
    return generateBuyAtSupportAction(
      symbol,
      price,
      channel,
      pattern,
      signal,
      volume
    );
  }

  // RULE 2: BEARISH RESISTANCE REJECTION
  if (
    channel.hasChannel &&
    channel.status === 'near_resistance' &&
    (pattern.mainPattern === 'shooting_star' ||
      pattern.mainPattern === 'bearish_engulfing' ||
      pattern.mainPattern === 'dark_cloud_cover') &&
    signal.bias === 'bearish'
  ) {
    return generateSellAtResistanceAction(
      symbol,
      price,
      channel,
      pattern,
      signal,
      volume
    );
  }

  // RULE 3: BULLISH BREAKOUT
  if (
    channel.hasChannel &&
    channel.status === 'broken_out' &&
    price > channel.resistance &&
    signal.bias === 'bullish'
  ) {
    return generateBreakoutAction(
      symbol,
      price,
      channel,
      pattern,
      signal,
      volume
    );
  }

  // RULE 4: POTENTIAL BREAKOUT SETUP (near resistance with bullish bias)
  if (
    channel.hasChannel &&
    channel.status === 'near_resistance' &&
    (pattern.mainPattern === 'bullish_engulfing' ||
      pattern.mainPattern === 'hammer') &&
    signal.bias === 'bullish'
  ) {
    return generatePotentialBreakoutAction(
      symbol,
      price,
      channel,
      pattern,
      signal,
      volume
    );
  }

  // RULE 5: BEARISH BREAKDOWN (near support with bearish bias)
  if (
    channel.hasChannel &&
    channel.status === 'near_support' &&
    (pattern.mainPattern === 'bearish_engulfing' ||
      pattern.mainPattern === 'shooting_star') &&
    signal.bias === 'bearish'
  ) {
    return generateBreakdownWarningAction(
      symbol,
      price,
      channel,
      pattern,
      signal,
      volume
    );
  }

  // RULE 6: INSIDE CHANNEL - WAIT
  if (channel.hasChannel && channel.status === 'inside') {
    return generateInsideChannelAction(
      symbol,
      price,
      channel,
      pattern,
      signal,
      volume
    );
  }

  // RULE 7: NO CLEAR SETUP
  return generateNoSetupAction(symbol, price, channel, pattern, signal, volume);
}

/**
 * BUY setup at support
 */
function generateBuyAtSupportAction(
  symbol: string,
  price: number,
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  signal: CombinedSignal,
  volume?: number
): TradingAction {
  const entryPrice = channel.support * 1.005; // 0.5% above support
  const entryLow = channel.support * 0.995; // 0.5% below support
  const entryHigh = channel.support * 1.015; // 1.5% above support

  const targetPrimary = channel.mid; // Conservative: mid-channel
  const targetSecondary = channel.resistance * 0.98; // Aggressive: near resistance

  const stopLoss = channel.support * 0.97; // 3% below support

  const rrPrimary = calculateRiskReward(entryPrice, targetPrimary, stopLoss);
  const rrSecondary = calculateRiskReward(entryPrice, targetSecondary, stopLoss);

  const confidence = calculateConfidence({ channel, pattern, signal, volume });

  const gain1Pct = calculatePercentChange(entryPrice, targetPrimary);
  const gain2Pct = calculatePercentChange(entryPrice, targetSecondary);
  const lossPct = calculatePercentChange(entryPrice, stopLoss);

  return {
    recommendation: 'BUY',
    entry: {
      type: 'limit',
      price: parseFloat(entryPrice.toFixed(2)),
      range: {
        low: parseFloat(entryLow.toFixed(2)),
        high: parseFloat(entryHigh.toFixed(2)),
      },
    },
    target: {
      primary: parseFloat(targetPrimary.toFixed(2)),
      secondary: parseFloat(targetSecondary.toFixed(2)),
      rationale: `Mid-channel offers ${rrPrimary.toFixed(1)}:1 R/R, resistance offers ${rrSecondary.toFixed(1)}:1 R/R`,
    },
    stopLoss: {
      price: parseFloat(stopLoss.toFixed(2)),
      rationale: 'Below support invalidates setup',
    },
    riskReward: parseFloat(rrPrimary.toFixed(2)),
    confidence: confidence.level,
    reasoning: [
      `Price bouncing off support at $${channel.support.toFixed(2)}`,
      `${pattern.mainPattern.replace(/_/g, ' ')} pattern (bullish reversal)`,
      `${channel.supportTouches} previous support touches (${channel.supportTouches >= 3 ? 'strong' : 'moderate'} level)`,
      `Bullish bias confirmed by signal analysis`,
      `Risk/Reward: ${rrPrimary.toFixed(1)}:1 (to mid-channel)`,
      `Potential gain: ${gain1Pct.toFixed(1)}% to ${gain2Pct.toFixed(1)}%`,
    ],
    cautions: [
      ...signal.cautions,
      lossPct < -5 ? 'Wide stop loss - consider position sizing' : '',
    ].filter(Boolean),
    setup: 'Support Bounce',
  };
}

/**
 * SELL/SHORT setup at resistance
 */
function generateSellAtResistanceAction(
  symbol: string,
  price: number,
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  signal: CombinedSignal,
  volume?: number
): TradingAction {
  const entryPrice = channel.resistance * 0.995; // 0.5% below resistance
  const entryLow = channel.resistance * 0.985; // 1.5% below resistance
  const entryHigh = channel.resistance * 1.005; // 0.5% above resistance

  const targetPrimary = channel.mid; // Conservative: mid-channel
  const targetSecondary = channel.support * 1.02; // Aggressive: near support

  const stopLoss = channel.resistance * 1.03; // 3% above resistance

  const rrPrimary = calculateRiskReward(entryPrice, targetPrimary, stopLoss);
  const rrSecondary = calculateRiskReward(entryPrice, targetSecondary, stopLoss);

  const confidence = calculateConfidence({ channel, pattern, signal, volume });

  const gain1Pct = calculatePercentChange(entryPrice, targetPrimary);
  const gain2Pct = calculatePercentChange(entryPrice, targetSecondary);
  const lossPct = calculatePercentChange(entryPrice, stopLoss);

  return {
    recommendation: 'SELL',
    entry: {
      type: 'limit',
      price: parseFloat(entryPrice.toFixed(2)),
      range: {
        low: parseFloat(entryLow.toFixed(2)),
        high: parseFloat(entryHigh.toFixed(2)),
      },
    },
    target: {
      primary: parseFloat(targetPrimary.toFixed(2)),
      secondary: parseFloat(targetSecondary.toFixed(2)),
      rationale: `Mid-channel offers ${rrPrimary.toFixed(1)}:1 R/R, support offers ${rrSecondary.toFixed(1)}:1 R/R`,
    },
    stopLoss: {
      price: parseFloat(stopLoss.toFixed(2)),
      rationale: 'Above resistance invalidates setup',
    },
    riskReward: parseFloat(rrPrimary.toFixed(2)),
    confidence: confidence.level,
    reasoning: [
      `Price rejected at resistance $${channel.resistance.toFixed(2)}`,
      `${pattern.mainPattern.replace(/_/g, ' ')} pattern (bearish reversal)`,
      `${channel.resistanceTouches} resistance touches (${channel.resistanceTouches >= 3 ? 'strong ceiling' : 'moderate resistance'})`,
      `Bearish bias confirmed`,
      `Risk/Reward: ${rrPrimary.toFixed(1)}:1 (to mid-channel)`,
      `Potential gain: ${Math.abs(gain1Pct).toFixed(1)}% to ${Math.abs(gain2Pct).toFixed(1)}%`,
    ],
    cautions: [
      ...signal.cautions,
      lossPct > 5 ? 'Wide stop loss - consider position sizing' : '',
    ].filter(Boolean),
    setup: 'Resistance Rejection',
  };
}

/**
 * BREAKOUT setup (already broken out)
 */
function generateBreakoutAction(
  symbol: string,
  price: number,
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  signal: CombinedSignal,
  volume?: number
): TradingAction {
  const channelHeight = channel.resistance - channel.support;
  const measuredMove = channel.resistance + channelHeight;

  const entryPrice = price; // Current market price
  const entryLow = channel.resistance * 1.01; // 1% above resistance
  const entryHigh = channel.resistance * 1.05; // 5% above resistance

  const targetPrimary = measuredMove;
  const targetSecondary = null;

  const stopLoss = channel.resistance * 0.98; // 2% below resistance

  const rr = calculateRiskReward(entryPrice, targetPrimary, stopLoss);

  const confidence = calculateConfidence({ channel, pattern, signal, volume });

  const gainPct = calculatePercentChange(entryPrice, targetPrimary);
  const lossPct = calculatePercentChange(entryPrice, stopLoss);

  const breakoutExtension = ((price - channel.resistance) / channel.resistance) * 100;

  return {
    recommendation: 'BUY_BREAKOUT',
    entry: {
      type: 'market',
      price: parseFloat(entryPrice.toFixed(2)),
      range: {
        low: parseFloat(entryLow.toFixed(2)),
        high: parseFloat(entryHigh.toFixed(2)),
      },
    },
    target: {
      primary: parseFloat(targetPrimary.toFixed(2)),
      secondary: null,
      rationale: 'Measured move: channel height projected upward',
    },
    stopLoss: {
      price: parseFloat(stopLoss.toFixed(2)),
      rationale: 'Failed breakout if closes below resistance',
    },
    riskReward: parseFloat(rr.toFixed(2)),
    confidence: 'HIGH', // Breakouts are typically high conviction
    reasoning: [
      `Clean breakout above $${channel.resistance.toFixed(2)} resistance`,
      `Strong bullish momentum (+${breakoutExtension.toFixed(1)}% above resistance)`,
      `Measured move target: $${measuredMove.toFixed(2)} (+${gainPct.toFixed(1)}%)`,
      `Previous channel: $${channel.support.toFixed(2)} - $${channel.resistance.toFixed(2)}`,
      `Risk/Reward: ${rr.toFixed(1)}:1`,
    ],
    cautions: [
      breakoutExtension > 3 ? 'Already extended - use tight stop' : '',
      'Monitor for volume confirmation',
      'Consider waiting for pullback to resistance (now support)',
      ...signal.cautions,
    ].filter(Boolean),
    setup: 'Breakout',
  };
}

/**
 * POTENTIAL BREAKOUT setup (at resistance with bullish bias)
 */
function generatePotentialBreakoutAction(
  symbol: string,
  price: number,
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  signal: CombinedSignal,
  volume?: number
): TradingAction {
  const confidence = calculateConfidence({ channel, pattern, signal, volume });

  return {
    recommendation: 'WAIT',
    entry: null,
    target: null,
    stopLoss: null,
    riskReward: null,
    confidence: confidence.level,
    reasoning: [
      `Price at resistance ($${channel.resistance.toFixed(2)}) with bullish pattern`,
      `${pattern.mainPattern.replace(/_/g, ' ')} suggests potential breakout`,
      `Current price: $${price.toFixed(2)}`,
      'Wait for confirmation: close above resistance OR pullback to support',
    ],
    cautions: [
      'Breakout not confirmed yet',
      'Could reject and reverse to support',
      'Monitor volume for breakout strength',
      ...signal.cautions,
    ],
    setup: 'Potential Breakout - Monitor',
  };
}

/**
 * BREAKDOWN WARNING (at support with bearish bias)
 */
function generateBreakdownWarningAction(
  symbol: string,
  price: number,
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  signal: CombinedSignal,
  volume?: number
): TradingAction {
  const confidence = calculateConfidence({ channel, pattern, signal, volume });

  return {
    recommendation: 'WAIT',
    entry: null,
    target: null,
    stopLoss: null,
    riskReward: null,
    confidence: 'LOW',
    reasoning: [
      `Price at support ($${channel.support.toFixed(2)}) but bearish pattern detected`,
      `${pattern.mainPattern.replace(/_/g, ' ')} suggests potential breakdown`,
      `Current price: $${price.toFixed(2)}`,
      'HIGH RISK: Support may fail',
    ],
    cautions: [
      '⚠️ WARNING: Bearish pattern at support',
      'Increased breakdown risk',
      'Wait for bounce confirmation OR short on breakdown',
      ...signal.cautions,
    ],
    setup: 'Breakdown Risk - Avoid',
  };
}

/**
 * INSIDE CHANNEL - WAIT for better position
 */
function generateInsideChannelAction(
  symbol: string,
  price: number,
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  signal: CombinedSignal,
  volume?: number
): TradingAction {
  const nextLevel =
    signal.bias === 'bullish' ? channel.support : channel.resistance;
  const action = signal.bias === 'bullish' ? 'BUY' : 'SELL';

  return {
    recommendation: 'WAIT',
    entry: null,
    target: null,
    stopLoss: null,
    riskReward: null,
    confidence: 'LOW',
    reasoning: [
      `Price inside channel ($${channel.support.toFixed(2)} - $${channel.resistance.toFixed(2)})`,
      `Current price: $${price.toFixed(2)}`,
      `Wait for move to ${signal.bias === 'bullish' ? 'support' : 'resistance'}`,
      `${action} setup likely at $${nextLevel.toFixed(2)}`,
    ],
    cautions: [
      'Current price not at actionable level',
      'Mid-channel entries carry higher risk',
      'Consider waiting for support/resistance test',
    ],
    setup: 'Inside Channel - Monitor',
  };
}

/**
 * NO CLEAR SETUP
 */
function generateNoSetupAction(
  symbol: string,
  price: number,
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  signal: CombinedSignal,
  volume?: number
): TradingAction {
  return {
    recommendation: 'WAIT',
    entry: null,
    target: null,
    stopLoss: null,
    riskReward: null,
    confidence: 'LOW',
    reasoning: [
      'No clear setup detected',
      channel.hasChannel
        ? `Channel: $${channel.support.toFixed(2)} - $${channel.resistance.toFixed(2)}`
        : 'No defined channel',
      pattern.mainPattern !== 'none'
        ? `Pattern: ${pattern.mainPattern.replace(/_/g, ' ')}`
        : 'No clear pattern',
      `Bias: ${signal.bias}`,
    ],
    cautions: [
      'Conflicting or unclear signals',
      'Wait for clearer technical setup',
      ...signal.cautions,
    ],
    setup: 'No Setup',
  };
}
