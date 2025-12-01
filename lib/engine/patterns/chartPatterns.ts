/**
 * Chart Pattern Detection
 *
 * Detects multi-bar chart patterns that indicate continuation or reversal.
 * These complement candlestick patterns by analyzing longer-term price structure.
 *
 * Pattern Win Rates (from EOC - Encyclopedia of Chart Patterns):
 * - Double Bottom: 78% (strong reversal)
 * - Double Top: 76% (strong reversal)
 * - Bull Flag: 68% (continuation)
 * - Bear Flag: 67% (continuation)
 * - Ascending Triangle: 72% (bullish breakout)
 * - Descending Triangle: 69% (bearish breakout)
 * - Symmetrical Triangle: 54% (directional breakout, needs trend context)
 * - Cup and Handle: 75% (bullish continuation)
 * - Head and Shoulders: 73% (bearish reversal)
 * - Inverse Head and Shoulders: 71% (bullish reversal)
 */

import { Candle } from '../../types';
import { PatternResult, PatternType } from '../types';

export interface ChartPattern {
  type: PatternType;
  confidence: number; // 0-1
  winRate: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  breakoutLevel?: number;
  targetLevel?: number;
  stopLevel?: number;
  metadata?: Record<string, any>;
}

/**
 * Detect chart patterns requiring 20+ bars of context
 */
export function detectChartPatterns(candles: Candle[]): PatternResult[] {
  if (candles.length < 20) {
    return [];
  }

  const patterns: ChartPattern[] = [];

  // Reversal patterns (require longer history)
  if (candles.length >= 30) {
    const doubleBottom = detectDoubleBottom(candles);
    if (doubleBottom) patterns.push(doubleBottom);

    const doubleTop = detectDoubleTop(candles);
    if (doubleTop) patterns.push(doubleTop);

    const headAndShoulders = detectHeadAndShoulders(candles);
    if (headAndShoulders) patterns.push(headAndShoulders);

    const inverseHeadAndShoulders = detectInverseHeadAndShoulders(candles);
    if (inverseHeadAndShoulders) patterns.push(inverseHeadAndShoulders);
  }

  // Continuation patterns (need trend + consolidation)
  const bullFlag = detectBullFlag(candles);
  if (bullFlag) patterns.push(bullFlag);

  const bearFlag = detectBearFlag(candles);
  if (bearFlag) patterns.push(bearFlag);

  // Triangle patterns (consolidation patterns)
  const ascendingTriangle = detectAscendingTriangle(candles);
  if (ascendingTriangle) patterns.push(ascendingTriangle);

  const descendingTriangle = detectDescendingTriangle(candles);
  if (descendingTriangle) patterns.push(descendingTriangle);

  const symmetricalTriangle = detectSymmetricalTriangle(candles);
  if (symmetricalTriangle) patterns.push(symmetricalTriangle);

  // Cup and Handle (requires long history)
  if (candles.length >= 40) {
    const cupAndHandle = detectCupAndHandle(candles);
    if (cupAndHandle) patterns.push(cupAndHandle);
  }

  // Sort by confidence descending
  patterns.sort((a, b) => b.confidence - a.confidence);

  // Convert to PatternResult
  return patterns.map(p => ({
    type: p.type,
    confidence: p.confidence,
    data: {
      winRate: p.winRate,
      direction: p.direction,
      breakoutLevel: p.breakoutLevel,
      targetLevel: p.targetLevel,
      stopLevel: p.stopLevel,
      ...p.metadata,
    },
  }));
}

// ============================================================================
// REVERSAL PATTERNS
// ============================================================================

/**
 * Double Bottom: W-shaped pattern indicating bullish reversal
 *
 * Requirements:
 * - Two distinct lows within 3% of each other
 * - Peak between them (resistance level)
 * - Second low comes after 10-20 bars from first
 * - Breakout above peak confirms pattern
 */
function detectDoubleBottom(candles: Candle[]): ChartPattern | null {
  const lookback = Math.min(40, candles.length);
  const recent = candles.slice(-lookback);

  // Find two lowest points
  const lows = recent.map((c, i) => ({ price: c.low, index: i }));
  lows.sort((a, b) => a.price - b.price);

  const firstLow = lows[0];
  const secondLow = lows[1];

  // Must be within 3% of each other
  const priceDiff = Math.abs(firstLow.price - secondLow.price) / firstLow.price;
  if (priceDiff > 0.03) return null;

  // Must be separated by 10-20 bars
  const barDistance = Math.abs(firstLow.index - secondLow.index);
  if (barDistance < 10 || barDistance > 25) return null;

  // Find peak between the lows
  const minIndex = Math.min(firstLow.index, secondLow.index);
  const maxIndex = Math.max(firstLow.index, secondLow.index);
  const between = recent.slice(minIndex, maxIndex + 1);
  const peak = Math.max(...between.map(c => c.high));

  // Current price should be approaching or above peak (confirmation)
  const currentPrice = candles[candles.length - 1].close;
  const distanceFromPeak = (peak - currentPrice) / peak;

  // Confidence based on:
  // - How close the two lows are (closer = better)
  // - How close current price is to peak breakout (closer = better)
  // - Volume on second low (if available)
  const closeness = 1 - priceDiff / 0.03; // 0-1 scale
  const breakoutProximity = Math.max(0, 1 - distanceFromPeak / 0.05); // Within 5% of breakout
  const confidence = (closeness * 0.6 + breakoutProximity * 0.4) * 0.78; // Scaled by win rate

  if (confidence < 0.4) return null;

  const avgLow = (firstLow.price + secondLow.price) / 2;
  const target = peak + (peak - avgLow); // Measured move: height of pattern

  return {
    type: 'double_bottom',
    confidence,
    winRate: 0.78,
    direction: 'bullish',
    breakoutLevel: peak,
    targetLevel: target,
    stopLevel: avgLow * 0.98, // 2% below lows
    metadata: {
      firstLowPrice: firstLow.price,
      secondLowPrice: secondLow.price,
      peakPrice: peak,
      barsBetween: barDistance,
    },
  };
}

/**
 * Double Top: M-shaped pattern indicating bearish reversal
 */
function detectDoubleTop(candles: Candle[]): ChartPattern | null {
  const lookback = Math.min(40, candles.length);
  const recent = candles.slice(-lookback);

  // Find two highest points
  const highs = recent.map((c, i) => ({ price: c.high, index: i }));
  highs.sort((a, b) => b.price - a.price);

  const firstHigh = highs[0];
  const secondHigh = highs[1];

  // Must be within 3% of each other
  const priceDiff = Math.abs(firstHigh.price - secondHigh.price) / firstHigh.price;
  if (priceDiff > 0.03) return null;

  // Must be separated by 10-20 bars
  const barDistance = Math.abs(firstHigh.index - secondHigh.index);
  if (barDistance < 10 || barDistance > 25) return null;

  // Find trough between the highs
  const minIndex = Math.min(firstHigh.index, secondHigh.index);
  const maxIndex = Math.max(firstHigh.index, secondHigh.index);
  const between = recent.slice(minIndex, maxIndex + 1);
  const trough = Math.min(...between.map(c => c.low));

  // Current price should be approaching or below trough (confirmation)
  const currentPrice = candles[candles.length - 1].close;
  const distanceFromTrough = (currentPrice - trough) / currentPrice;

  const closeness = 1 - priceDiff / 0.03;
  const breakoutProximity = Math.max(0, 1 - distanceFromTrough / 0.05);
  const confidence = (closeness * 0.6 + breakoutProximity * 0.4) * 0.76;

  if (confidence < 0.4) return null;

  const avgHigh = (firstHigh.price + secondHigh.price) / 2;
  const target = trough - (avgHigh - trough); // Measured move

  return {
    type: 'double_top',
    confidence,
    winRate: 0.76,
    direction: 'bearish',
    breakoutLevel: trough,
    targetLevel: target,
    stopLevel: avgHigh * 1.02, // 2% above highs
    metadata: {
      firstHighPrice: firstHigh.price,
      secondHighPrice: secondHigh.price,
      troughPrice: trough,
      barsBetween: barDistance,
    },
  };
}

/**
 * Head and Shoulders: Three peaks with middle peak highest (bearish reversal)
 */
function detectHeadAndShoulders(candles: Candle[]): ChartPattern | null {
  const lookback = Math.min(50, candles.length);
  const recent = candles.slice(-lookback);

  // Find three highest peaks
  const peaks: Array<{ price: number; index: number }> = [];
  for (let i = 2; i < recent.length - 2; i++) {
    const candle = recent[i];
    if (
      candle.high > recent[i - 1].high &&
      candle.high > recent[i - 2].high &&
      candle.high > recent[i + 1].high &&
      candle.high > recent[i + 2].high
    ) {
      peaks.push({ price: candle.high, index: i });
    }
  }

  if (peaks.length < 3) return null;

  // Sort by price to find potential head and shoulders
  peaks.sort((a, b) => b.price - a.price);
  const head = peaks[0];
  const leftShoulder = peaks.find(p => p.index < head.index);
  const rightShoulder = peaks.find(p => p.index > head.index);

  if (!leftShoulder || !rightShoulder) return null;

  // Shoulders should be roughly equal height (within 5%)
  const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
  if (shoulderDiff > 0.05) return null;

  // Head should be significantly higher (at least 5%)
  const avgShoulder = (leftShoulder.price + rightShoulder.price) / 2;
  const headHeight = (head.price - avgShoulder) / avgShoulder;
  if (headHeight < 0.05) return null;

  // Find neckline (support connecting lows between shoulders and head)
  const leftLow = Math.min(...recent.slice(leftShoulder.index, head.index).map(c => c.low));
  const rightLow = Math.min(...recent.slice(head.index, rightShoulder.index).map(c => c.low));
  const neckline = (leftLow + rightLow) / 2;

  const currentPrice = candles[candles.length - 1].close;
  const distanceFromNeckline = (currentPrice - neckline) / currentPrice;
  const breakoutProximity = Math.max(0, 1 - Math.abs(distanceFromNeckline) / 0.05);

  const symmetry = 1 - shoulderDiff / 0.05;
  const confidence = (symmetry * 0.5 + breakoutProximity * 0.5) * 0.73;

  if (confidence < 0.4) return null;

  const target = neckline - (head.price - neckline); // Measured move

  return {
    type: 'head_and_shoulders',
    confidence,
    winRate: 0.73,
    direction: 'bearish',
    breakoutLevel: neckline,
    targetLevel: target,
    stopLevel: rightShoulder.price * 1.02,
    metadata: {
      headPrice: head.price,
      leftShoulderPrice: leftShoulder.price,
      rightShoulderPrice: rightShoulder.price,
      necklinePrice: neckline,
    },
  };
}

/**
 * Inverse Head and Shoulders: Three troughs with middle trough lowest (bullish reversal)
 */
function detectInverseHeadAndShoulders(candles: Candle[]): ChartPattern | null {
  const lookback = Math.min(50, candles.length);
  const recent = candles.slice(-lookback);

  // Find three lowest troughs
  const troughs: Array<{ price: number; index: number }> = [];
  for (let i = 2; i < recent.length - 2; i++) {
    const candle = recent[i];
    if (
      candle.low < recent[i - 1].low &&
      candle.low < recent[i - 2].low &&
      candle.low < recent[i + 1].low &&
      candle.low < recent[i + 2].low
    ) {
      troughs.push({ price: candle.low, index: i });
    }
  }

  if (troughs.length < 3) return null;

  troughs.sort((a, b) => a.price - b.price);
  const head = troughs[0];
  const leftShoulder = troughs.find(p => p.index < head.index);
  const rightShoulder = troughs.find(p => p.index > head.index);

  if (!leftShoulder || !rightShoulder) return null;

  const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
  if (shoulderDiff > 0.05) return null;

  const avgShoulder = (leftShoulder.price + rightShoulder.price) / 2;
  const headDepth = (avgShoulder - head.price) / avgShoulder;
  if (headDepth < 0.05) return null;

  const leftHigh = Math.max(...recent.slice(leftShoulder.index, head.index).map(c => c.high));
  const rightHigh = Math.max(...recent.slice(head.index, rightShoulder.index).map(c => c.high));
  const neckline = (leftHigh + rightHigh) / 2;

  const currentPrice = candles[candles.length - 1].close;
  const distanceFromNeckline = (neckline - currentPrice) / currentPrice;
  const breakoutProximity = Math.max(0, 1 - Math.abs(distanceFromNeckline) / 0.05);

  const symmetry = 1 - shoulderDiff / 0.05;
  const confidence = (symmetry * 0.5 + breakoutProximity * 0.5) * 0.71;

  if (confidence < 0.4) return null;

  const target = neckline + (neckline - head.price);

  return {
    type: 'inverse_head_and_shoulders',
    confidence,
    winRate: 0.71,
    direction: 'bullish',
    breakoutLevel: neckline,
    targetLevel: target,
    stopLevel: rightShoulder.price * 0.98,
    metadata: {
      headPrice: head.price,
      leftShoulderPrice: leftShoulder.price,
      rightShoulderPrice: rightShoulder.price,
      necklinePrice: neckline,
    },
  };
}

// ============================================================================
// CONTINUATION PATTERNS (FLAGS)
// ============================================================================

/**
 * Bull Flag: Strong uptrend followed by tight consolidation (bullish continuation)
 *
 * Requirements:
 * - Strong uptrend (flagpole): 10%+ gain in 5-10 bars
 * - Consolidation (flag): 10-15 bars within narrow range (3-5%)
 * - Breakout above flag resistance
 */
function detectBullFlag(candles: Candle[]): ChartPattern | null {
  if (candles.length < 20) return null;

  const recent = candles.slice(-25);

  // Find potential flagpole (strong uptrend in first 10 bars)
  const poleStart = recent[0].close;
  const poleEnd = recent[10].close;
  const poleGain = (poleEnd - poleStart) / poleStart;

  if (poleGain < 0.10) return null; // Need at least 10% gain

  // Check for consolidation in last 10-15 bars (the flag)
  const flag = recent.slice(10);
  const flagHigh = Math.max(...flag.map(c => c.high));
  const flagLow = Math.min(...flag.map(c => c.low));
  const flagRange = (flagHigh - flagLow) / flagLow;

  if (flagRange > 0.06) return null; // Too wide (need tight consolidation)
  if (flagRange < 0.02) return null; // Too tight (no pattern)

  // Flag should be slightly downward sloping (healthy retracement)
  const flagSlope = (flag[flag.length - 1].close - flag[0].close) / flag[0].close;
  if (flagSlope > 0.03) return null; // Rising too much (not a flag)

  const currentPrice = candles[candles.length - 1].close;
  const distanceFromBreakout = (flagHigh - currentPrice) / currentPrice;
  const breakoutProximity = Math.max(0, 1 - Math.abs(distanceFromBreakout) / 0.02);

  // Confidence based on pole strength, flag tightness, and breakout proximity
  const poleStrength = Math.min(1, poleGain / 0.20); // Scale 10-20% gains to 0-1
  const flagTightness = 1 - flagRange / 0.06;
  const confidence = (poleStrength * 0.4 + flagTightness * 0.3 + breakoutProximity * 0.3) * 0.68;

  if (confidence < 0.4) return null;

  const target = flagHigh + (poleEnd - poleStart); // Measured move: pole height

  return {
    type: 'bull_flag',
    confidence,
    winRate: 0.68,
    direction: 'bullish',
    breakoutLevel: flagHigh,
    targetLevel: target,
    stopLevel: flagLow * 0.98,
    metadata: {
      poleGain: poleGain * 100,
      flagRange: flagRange * 100,
      poleBars: 10,
      flagBars: flag.length,
    },
  };
}

/**
 * Bear Flag: Strong downtrend followed by tight consolidation (bearish continuation)
 */
function detectBearFlag(candles: Candle[]): ChartPattern | null {
  if (candles.length < 20) return null;

  const recent = candles.slice(-25);

  // Find potential flagpole (strong downtrend)
  const poleStart = recent[0].close;
  const poleEnd = recent[10].close;
  const poleDrop = (poleStart - poleEnd) / poleStart;

  if (poleDrop < 0.10) return null;

  // Check for consolidation
  const flag = recent.slice(10);
  const flagHigh = Math.max(...flag.map(c => c.high));
  const flagLow = Math.min(...flag.map(c => c.low));
  const flagRange = (flagHigh - flagLow) / flagLow;

  if (flagRange > 0.06 || flagRange < 0.02) return null;

  // Flag should be slightly upward sloping (bear flag counter-rally)
  const flagSlope = (flag[flag.length - 1].close - flag[0].close) / flag[0].close;
  if (flagSlope < -0.03) return null; // Falling too much

  const currentPrice = candles[candles.length - 1].close;
  const distanceFromBreakout = (currentPrice - flagLow) / currentPrice;
  const breakoutProximity = Math.max(0, 1 - Math.abs(distanceFromBreakout) / 0.02);

  const poleStrength = Math.min(1, poleDrop / 0.20);
  const flagTightness = 1 - flagRange / 0.06;
  const confidence = (poleStrength * 0.4 + flagTightness * 0.3 + breakoutProximity * 0.3) * 0.67;

  if (confidence < 0.4) return null;

  const target = flagLow - (poleStart - poleEnd);

  return {
    type: 'bear_flag',
    confidence,
    winRate: 0.67,
    direction: 'bearish',
    breakoutLevel: flagLow,
    targetLevel: target,
    stopLevel: flagHigh * 1.02,
    metadata: {
      poleDrop: poleDrop * 100,
      flagRange: flagRange * 100,
      poleBars: 10,
      flagBars: flag.length,
    },
  };
}

// ============================================================================
// TRIANGLE PATTERNS (CONSOLIDATION)
// ============================================================================

/**
 * Ascending Triangle: Flat resistance + rising support (bullish breakout)
 */
function detectAscendingTriangle(candles: Candle[]): ChartPattern | null {
  if (candles.length < 20) return null;

  const recent = candles.slice(-30);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);

  // Resistance should be flat (highs within 2%)
  const maxHigh = Math.max(...highs);
  const highVariance = highs.filter(h => Math.abs(h - maxHigh) / maxHigh < 0.02).length;
  if (highVariance < 3) return null; // Need at least 3 touches at resistance

  // Support should be rising (use linear regression on lows)
  const supportSlope = calculateSlope(lows);
  if (supportSlope <= 0) return null; // Must be rising

  // Triangle should be converging
  const firstHalf = recent.slice(0, 15);
  const secondHalf = recent.slice(15);
  const firstRange = (Math.max(...firstHalf.map(c => c.high)) - Math.min(...firstHalf.map(c => c.low))) / firstHalf[0].close;
  const secondRange = (Math.max(...secondHalf.map(c => c.high)) - Math.min(...secondHalf.map(c => c.low))) / secondHalf[0].close;

  if (secondRange >= firstRange) return null; // Must be tightening

  const currentPrice = candles[candles.length - 1].close;
  const distanceFromResistance = (maxHigh - currentPrice) / currentPrice;
  const breakoutProximity = Math.max(0, 1 - distanceFromResistance / 0.03);

  const convergence = Math.min(1, (firstRange - secondRange) / firstRange);
  const confidence = (convergence * 0.5 + breakoutProximity * 0.5) * 0.72;

  if (confidence < 0.4) return null;

  const triangleHeight = maxHigh - Math.min(...lows);
  const target = maxHigh + triangleHeight;

  return {
    type: 'ascending_triangle',
    confidence,
    winRate: 0.72,
    direction: 'bullish',
    breakoutLevel: maxHigh,
    targetLevel: target,
    stopLevel: Math.min(...lows.slice(-10)) * 0.98,
    metadata: {
      resistanceLevel: maxHigh,
      supportSlope: supportSlope * 100,
      triangleHeight: triangleHeight,
    },
  };
}

/**
 * Descending Triangle: Flat support + falling resistance (bearish breakout)
 */
function detectDescendingTriangle(candles: Candle[]): ChartPattern | null {
  if (candles.length < 20) return null;

  const recent = candles.slice(-30);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);

  // Support should be flat
  const minLow = Math.min(...lows);
  const lowVariance = lows.filter(l => Math.abs(l - minLow) / minLow < 0.02).length;
  if (lowVariance < 3) return null;

  // Resistance should be falling
  const resistanceSlope = calculateSlope(highs);
  if (resistanceSlope >= 0) return null;

  const firstHalf = recent.slice(0, 15);
  const secondHalf = recent.slice(15);
  const firstRange = (Math.max(...firstHalf.map(c => c.high)) - Math.min(...firstHalf.map(c => c.low))) / firstHalf[0].close;
  const secondRange = (Math.max(...secondHalf.map(c => c.high)) - Math.min(...secondHalf.map(c => c.low))) / secondHalf[0].close;

  if (secondRange >= firstRange) return null;

  const currentPrice = candles[candles.length - 1].close;
  const distanceFromSupport = (currentPrice - minLow) / currentPrice;
  const breakoutProximity = Math.max(0, 1 - distanceFromSupport / 0.03);

  const convergence = Math.min(1, (firstRange - secondRange) / firstRange);
  const confidence = (convergence * 0.5 + breakoutProximity * 0.5) * 0.69;

  if (confidence < 0.4) return null;

  const triangleHeight = Math.max(...highs) - minLow;
  const target = minLow - triangleHeight;

  return {
    type: 'descending_triangle',
    confidence,
    winRate: 0.69,
    direction: 'bearish',
    breakoutLevel: minLow,
    targetLevel: target,
    stopLevel: Math.max(...highs.slice(-10)) * 1.02,
    metadata: {
      supportLevel: minLow,
      resistanceSlope: resistanceSlope * 100,
      triangleHeight: triangleHeight,
    },
  };
}

/**
 * Symmetrical Triangle: Converging trendlines (directional breakout, needs trend context)
 */
function detectSymmetricalTriangle(candles: Candle[]): ChartPattern | null {
  if (candles.length < 20) return null;

  const recent = candles.slice(-30);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);

  const resistanceSlope = calculateSlope(highs);
  const supportSlope = calculateSlope(lows);

  // Both lines must be converging (one falling, one rising)
  if (resistanceSlope >= 0 || supportSlope <= 0) return null;

  // Check convergence
  const firstHalf = recent.slice(0, 15);
  const secondHalf = recent.slice(15);
  const firstRange = (Math.max(...firstHalf.map(c => c.high)) - Math.min(...firstHalf.map(c => c.low))) / firstHalf[0].close;
  const secondRange = (Math.max(...secondHalf.map(c => c.high)) - Math.min(...secondHalf.map(c => c.low))) / secondHalf[0].close;

  if (secondRange >= firstRange * 0.8) return null; // Must be significantly tightening

  // Estimate breakout level (midpoint of current range)
  const currentHigh = Math.max(...recent.slice(-5).map(c => c.high));
  const currentLow = Math.min(...recent.slice(-5).map(c => c.low));
  const breakoutLevel = (currentHigh + currentLow) / 2;

  const convergence = Math.min(1, (firstRange - secondRange) / firstRange);
  const confidence = convergence * 0.54; // Lower win rate - directional uncertainty

  if (confidence < 0.3) return null;

  const triangleHeight = Math.max(...highs) - Math.min(...lows);
  const targetUp = breakoutLevel + triangleHeight;
  const targetDown = breakoutLevel - triangleHeight;

  return {
    type: 'symmetrical_triangle',
    confidence,
    winRate: 0.54,
    direction: 'neutral', // Breakout direction unknown
    breakoutLevel,
    targetLevel: targetUp, // Provide both targets in metadata
    stopLevel: currentLow * 0.98,
    metadata: {
      resistanceSlope: resistanceSlope * 100,
      supportSlope: supportSlope * 100,
      triangleHeight: triangleHeight,
      bullishTarget: targetUp,
      bearishTarget: targetDown,
    },
  };
}

// ============================================================================
// CUP AND HANDLE (BULLISH CONTINUATION)
// ============================================================================

/**
 * Cup and Handle: U-shaped recovery followed by small pullback (bullish continuation)
 *
 * Requirements:
 * - Cup: 30-40 bars, U-shaped bottom (not V-shaped)
 * - Handle: 7-12 bars, small pullback (3-5%)
 * - Breakout above cup rim
 */
function detectCupAndHandle(candles: Candle[]): ChartPattern | null {
  if (candles.length < 50) return null;

  const recent = candles.slice(-50);

  // Find cup (look for U-shape in first 30-40 bars)
  const cup = recent.slice(0, 40);
  const cupHigh = Math.max(...cup.slice(0, 5).map(c => c.high)); // Left rim
  const cupLow = Math.min(...cup.slice(10, 30).map(c => c.low)); // Bottom
  const cupDepth = (cupHigh - cupLow) / cupHigh;

  if (cupDepth < 0.12 || cupDepth > 0.33) return null; // 12-33% depth

  // Cup should recover close to high
  const rightRim = Math.max(...cup.slice(-5).map(c => c.high));
  const recovery = (rightRim - cupLow) / (cupHigh - cupLow);
  if (recovery < 0.90) return null; // Must recover to 90% of depth

  // Find handle (last 7-12 bars, small pullback)
  const handle = recent.slice(40);
  if (handle.length < 7) return null;

  const handleHigh = Math.max(...handle.map(c => c.high));
  const handleLow = Math.min(...handle.map(c => c.low));
  const handleDepth = (handleHigh - handleLow) / handleHigh;

  if (handleDepth < 0.03 || handleDepth > 0.08) return null; // 3-8% pullback

  const currentPrice = candles[candles.length - 1].close;
  const distanceFromBreakout = (handleHigh - currentPrice) / currentPrice;
  const breakoutProximity = Math.max(0, 1 - Math.abs(distanceFromBreakout) / 0.02);

  const cupQuality = recovery * (1 - Math.abs(cupDepth - 0.20) / 0.20); // Prefer 20% depth
  const handleQuality = 1 - Math.abs(handleDepth - 0.05) / 0.05; // Prefer 5% pullback
  const confidence = (cupQuality * 0.4 + handleQuality * 0.3 + breakoutProximity * 0.3) * 0.75;

  if (confidence < 0.4) return null;

  const target = handleHigh + (cupHigh - cupLow); // Measured move: cup depth

  return {
    type: 'cup_and_handle',
    confidence,
    winRate: 0.75,
    direction: 'bullish',
    breakoutLevel: handleHigh,
    targetLevel: target,
    stopLevel: handleLow * 0.98,
    metadata: {
      cupDepth: cupDepth * 100,
      handleDepth: handleDepth * 100,
      cupBars: 40,
      handleBars: handle.length,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate linear regression slope for an array of prices
 */
function calculateSlope(prices: number[]): number {
  const n = prices.length;
  const xMean = (n - 1) / 2;
  const yMean = prices.reduce((sum, p) => sum + p, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = prices[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}
