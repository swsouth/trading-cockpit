# Signal Engineering Specification
## Enhanced Signal Pipeline for Personal Trading Cockpit

**Document Version:** 1.0
**Date:** 2025-11-30
**Author:** Strategy & Signal Engineering Specialist
**Status:** DRAFT - Ready for Review

---

## Executive Summary

This document provides technical specifications for enhancing the Personal Trading Cockpit's signal generation pipeline to improve prediction accuracy, determinism, and recommendation confidence. Based on analysis of the current implementation and established technical analysis principles (including Encyclopedia of Chart Patterns methodologies), this specification outlines:

1. Enhanced signal determinism and reproducibility
2. Multi-timeframe confirmation framework
3. Pre-trade filter enhancements
4. Regime detection and adaptive filters
5. Multi-factor signal aggregation logic
6. Backtesting integration requirements
7. Crypto-specific signal adaptations

---

## Table of Contents

1. [Current Pipeline Analysis](#1-current-pipeline-analysis)
2. [Signal Determinism Enhancements](#2-signal-determinism-enhancements)
3. [Multi-Timeframe Confirmation Framework](#3-multi-timeframe-confirmation-framework)
4. [Pre-Trade Filter Enhancements](#4-pre-trade-filter-enhancements)
5. [Regime Detection & Adaptive Filters](#5-regime-detection--adaptive-filters)
6. [Multi-Factor Signal Aggregation](#6-multi-factor-signal-aggregation)
7. [Backtesting Integration](#7-backtesting-integration)
8. [Crypto-Specific Adaptations](#8-crypto-specific-adaptations)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Metadata Standards](#10-metadata-standards)
11. [Unit Test Requirements](#11-unit-test-requirements)

---

## 1. Current Pipeline Analysis

### 1.1 Existing Flow

```
Raw Candles (60-day OHLCV)
    ↓
Channel Detection (least squares regression, 2+2 touches)
    ↓
Pattern Recognition (7 candlestick patterns)
    ↓
Trade Setup Generation (entry/target/stop)
    ↓
Opportunity Scoring (0-100 scale)
    ↓
Storage (if score >= 60)
```

### 1.2 Strengths

✅ **Modular architecture** - Clean separation of concerns (analysis, scoring, trade calculation)
✅ **ATR-normalized thresholds** - Volatility-aware channel detection (recent addition)
✅ **Multi-component scoring** - 5-factor model (trend, pattern, volume, R:R, momentum)
✅ **Absorption detection** - Order flow edge (Jay Ortani's methodology)
✅ **Intraday support** - Time-of-day normalized volume for 5-min bars

### 1.3 Gaps & Opportunities

⚠️ **No multi-timeframe confirmation** - Single timeframe analysis only
⚠️ **Limited regime detection** - Basic channel width checks, no ADX/volatility regime classification
⚠️ **Pattern validation** - No volume/range verification for candlestick patterns
⚠️ **Fixed confidence thresholds** - 60/75 score cutoffs don't adapt to market conditions
⚠️ **No pattern performance tracking** - Can't learn which patterns work best for each symbol/regime
⚠️ **Limited pre-trade checks** - No earnings calendar, spread, or correlation filters
⚠️ **No signal invalidation rules** - Can't auto-expire stale setups

---

## 2. Signal Determinism Enhancements

### 2.1 Principle: Same Input → Same Output

**Problem:** Non-deterministic behavior leads to unreproducible signals, making debugging and validation impossible.

**Solution:** Enforce strict determinism at every pipeline stage.

### 2.2 Determinism Checklist

#### A. Timestamp Standardization

```typescript
/**
 * SPECIFICATION: All candle timestamps MUST be normalized to UTC midnight for daily bars
 *
 * Problem: "2025-11-26T14:30:00-05:00" vs "2025-11-26T19:30:00Z" are same time, different strings
 * Solution: Normalize to UTC date only for daily bars
 */
export function normalizeTimestamp(candle: Candle, timeframe: '1d' | '5m'): string {
  const date = new Date(candle.timestamp);

  if (timeframe === '1d') {
    // Daily bars: normalize to UTC midnight
    return date.toISOString().split('T')[0] + 'T00:00:00Z';
  } else {
    // Intraday bars: preserve time but ensure UTC
    return date.toISOString();
  }
}
```

#### B. Floating-Point Determinism

```typescript
/**
 * SPECIFICATION: Price comparisons MUST use epsilon tolerance (0.01% = 1 basis point)
 *
 * Problem: 150.00000001 !== 150.0 due to floating-point arithmetic
 * Solution: Define equality within tolerance
 */
const PRICE_EPSILON = 0.0001; // 0.01% = 1 basis point

export function priceEquals(a: number, b: number): boolean {
  return Math.abs(a - b) / Math.max(a, b) < PRICE_EPSILON;
}

export function priceLessThan(a: number, b: number): boolean {
  return a < b && !priceEquals(a, b);
}
```

#### C. Indicator Warmup Period Enforcement

```typescript
/**
 * SPECIFICATION: Indicators MUST return null during warmup period
 *
 * Problem: Partial RSI(14) with only 10 candles gives unstable values
 * Solution: Explicit null returns during warmup, force handling upstream
 */
export function calculateRSI(
  candles: Candle[],
  period = 14
): number | null {
  if (candles.length < period + 1) {
    return null; // MUST NOT return default 50 - force caller to handle
  }

  // ... calculation logic
}

// Caller MUST handle null
const rsi = calculateRSI(candles, 14);
if (rsi === null) {
  return { signal: 'none', reason: 'Insufficient data for RSI calculation' };
}
```

#### D. Seed-Based Randomness (if needed)

```typescript
/**
 * SPECIFICATION: If any randomness is needed (backtesting, simulation), use seeded RNG
 *
 * Current: No randomness in signal generation (good!)
 * Future: If Monte Carlo or noise injection added, MUST be seeded
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Mulberry32 PRNG (deterministic)
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
```

### 2.3 Edge Case Standardization

```typescript
/**
 * SPECIFICATION: Edge cases MUST have explicit, documented behavior
 */
export interface EdgeCaseHandling {
  // Zero volume candles
  zeroVolume: 'reject' | 'allow'; // Current: filter out in analyzeVolume

  // Gaps (open != previous close)
  gaps: 'include' | 'fill' | 'reject'; // Current: include (good for stocks)

  // Missing candles
  missingData: 'interpolate' | 'reject'; // Current: implicit reject (good)

  // Duplicate timestamps
  duplicates: 'keepFirst' | 'keepLast' | 'average' | 'reject'; // Current: undefined

  // Extreme prices (>50% move)
  extremeMoves: 'cap' | 'reject' | 'allow'; // Current: allow (assumes data quality)
}

// RECOMMENDED DEFAULTS
const EDGE_CASE_POLICY: EdgeCaseHandling = {
  zeroVolume: 'allow',      // Crypto can have low-volume candles
  gaps: 'include',          // Gaps are informational
  missingData: 'reject',    // Don't interpolate - wait for complete data
  duplicates: 'keepLast',   // Assume last update is most accurate
  extremeMoves: 'reject',   // >50% move likely data error
};
```

### 2.4 Determinism Validation Test

```typescript
/**
 * UNIT TEST: Signal determinism
 *
 * Given the same input candles, channel, pattern:
 * - Run scoring 100 times
 * - Assert all outputs are byte-for-byte identical
 */
describe('Signal Determinism', () => {
  it('produces identical output for identical input', () => {
    const candles = loadTestData('AAPL_60d');
    const channel = detectChannel(candles);
    const pattern = detectPatterns(candles);

    const results = [];
    for (let i = 0; i < 100; i++) {
      const score = calculateOpportunityScore({
        candles,
        channel,
        pattern,
        volume: analyzeVolume(candles),
        entryPrice: 150.0,
        targetPrice: 160.0,
        stopLoss: 145.0,
      });
      results.push(JSON.stringify(score));
    }

    // All results MUST be identical
    const unique = new Set(results);
    expect(unique.size).toBe(1);
  });
});
```

---

## 3. Multi-Timeframe Confirmation Framework

### 3.1 Rationale

**Problem:** Single-timeframe analysis misses larger context.

**Example:**
- Daily chart shows bullish hammer at support (score: 75)
- Weekly chart shows bearish engulfing at resistance (invalidates daily signal)

**Solution:** Add optional multi-timeframe (MTF) filter for higher-confidence setups.

### 3.2 Timeframe Hierarchy

```
WEEKLY (context)
  ↓
DAILY (primary signal)
  ↓
4-HOUR (entry refinement, for day trading)
```

**For Swing Trading (daily primary):**
- Weekly: Trend context (optional but recommended)
- Daily: Signal generation
- 4-hour: Entry timing (optional)

**For Day Trading (5-min primary):**
- Daily: Trend context
- 15-min: Signal generation
- 5-min: Entry timing

### 3.3 MTF Confluence Scoring

```typescript
/**
 * Multi-Timeframe Confirmation Score (0-15 bonus points)
 *
 * Added to opportunity score when higher timeframe aligns
 */
export interface MTFAnalysis {
  higherTF: {
    timeframe: '1w' | '1d' | '4h';
    trend: 'bullish' | 'bearish' | 'neutral';
    channelStatus: ChannelStatus;
    patternAlignment: 'aligned' | 'conflicting' | 'neutral';
  };

  confluenceScore: number; // 0-15 points
  confluenceReason: string;
}

export function calculateMTFConfluence(
  primarySignal: { type: 'long' | 'short'; channel: ChannelDetectionResult },
  higherTFCandles: Candle[]
): MTFAnalysis {
  const higherChannel = detectChannel(higherTFCandles);
  const higherPattern = detectPatterns(higherTFCandles);

  const higherTrend = determineOverallTrend(higherChannel);
  const patternAlignment = checkPatternAlignment(
    primarySignal.type,
    higherPattern.mainPattern
  );

  let confluenceScore = 0;
  const reasons: string[] = [];

  // Trend alignment (0-10 points)
  if (
    (primarySignal.type === 'long' && higherTrend === 'bullish') ||
    (primarySignal.type === 'short' && higherTrend === 'bearish')
  ) {
    confluenceScore += 10;
    reasons.push('Higher timeframe trend aligned');
  } else if (higherTrend === 'neutral') {
    confluenceScore += 5;
    reasons.push('Higher timeframe neutral (no conflict)');
  } else {
    confluenceScore += 0;
    reasons.push('WARNING: Higher timeframe trend conflicts');
  }

  // Pattern alignment (0-5 points)
  if (patternAlignment === 'aligned') {
    confluenceScore += 5;
    reasons.push('Pattern confirmed on higher timeframe');
  }

  return {
    higherTF: {
      timeframe: '1w',
      trend: higherTrend,
      channelStatus: higherChannel.status,
      patternAlignment,
    },
    confluenceScore,
    confluenceReason: reasons.join('; '),
  };
}

function determineOverallTrend(channel: ChannelDetectionResult): 'bullish' | 'bearish' | 'neutral' {
  if (!channel.hasChannel) return 'neutral';

  const slope = (channel.resistance - channel.support) / channel.support;

  // Simplified: positive slope = bullish, negative = bearish
  // TODO: Use more sophisticated trend detection (SMA slopes, higher highs/lows)
  if (slope > 0.05) return 'bullish';
  if (slope < -0.05) return 'bearish';
  return 'neutral';
}
```

### 3.4 MTF Integration into Scoring

```typescript
/**
 * Enhanced scoring with MTF
 */
export function calculateOpportunityScoreWithMTF(
  input: ScoringInput,
  higherTFCandles?: Candle[]
): OpportunityScore {
  // Base score (0-100)
  const baseScore = calculateOpportunityScore(input);

  if (!higherTFCandles || higherTFCandles.length < 40) {
    return baseScore; // No MTF data, return base score
  }

  // Calculate MTF confluence
  const mtf = calculateMTFConfluence(
    {
      type: input.targetPrice > input.entryPrice ? 'long' : 'short',
      channel: input.channel
    },
    higherTFCandles
  );

  // Add MTF bonus (0-15 points)
  const enhancedScore = Math.min(100, baseScore.totalScore + mtf.confluenceScore);

  return {
    ...baseScore,
    totalScore: enhancedScore,
    confidenceLevel: calculateConfidenceLevel(enhancedScore),
    components: {
      ...baseScore.components,
      mtfConfluence: mtf.confluenceScore,
    },
    breakdown: {
      ...baseScore.breakdown,
      mtfConfluence: `${mtf.confluenceScore}/15 - ${mtf.confluenceReason}`,
    },
  };
}
```

### 3.5 MTF Usage Recommendations

**Phase 1 (Current):** Single timeframe (daily or 5-min)
**Phase 2 (Optional):** Add MTF as +15 bonus points for high-conviction trades
**Phase 3 (Advanced):** Multi-timeframe scanner (scan weekly for trends, daily for entries)

**Data Requirements:**
- Weekly: 52 candles (1 year)
- Daily: 60 candles (3 months) ← Current
- 4-hour: 180 candles (30 days for crypto)

---

## 4. Pre-Trade Filter Enhancements

### 4.1 Current State

**Implemented:** None (signals generate regardless of market conditions)

**Needed:** Filters to suppress low-quality signals before they reach users.

### 4.2 Filter Architecture

```typescript
/**
 * Pre-Trade Filter Pipeline
 *
 * Each filter returns { pass: boolean; reason?: string }
 * Any filter failure → suppress signal
 */
export interface PreTradeFilter {
  name: string;
  enabled: boolean;
  check: (input: SignalInput) => FilterResult;
}

export interface FilterResult {
  pass: boolean;
  reason?: string;
  severity?: 'warning' | 'error'; // warning = reduce size, error = suppress
}

export interface SignalInput {
  symbol: string;
  candles: Candle[];
  channel: ChannelDetectionResult;
  pattern: PatternDetectionResult;
  currentPrice: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  volume: VolumeAnalysis;
  marketType: 'stock' | 'crypto';
}
```

### 4.3 Filter Specifications

#### Filter 1: Liquidity Check

```typescript
/**
 * LIQUIDITY FILTER
 *
 * Ensures sufficient trading volume for entry/exit
 *
 * Thresholds:
 * - Stocks: ADV >= 500K shares AND Dollar Volume >= $5M
 * - Crypto: 24h Volume >= $1M (for major pairs)
 */
export const liquidityFilter: PreTradeFilter = {
  name: 'Liquidity Filter',
  enabled: true,
  check: (input) => {
    if (input.marketType === 'stock') {
      const avgDailyVolume = input.volume.last30DaysAvg;
      const avgPrice = input.currentPrice;
      const dollarVolume = avgDailyVolume * avgPrice;

      if (avgDailyVolume < 500_000) {
        return {
          pass: false,
          reason: `Low volume: ${(avgDailyVolume / 1000).toFixed(0)}K shares/day (min 500K)`,
          severity: 'error',
        };
      }

      if (dollarVolume < 5_000_000) {
        return {
          pass: false,
          reason: `Low dollar volume: $${(dollarVolume / 1_000_000).toFixed(1)}M (min $5M)`,
          severity: 'error',
        };
      }

      return { pass: true };
    } else {
      // Crypto liquidity check (simplified - would need 24h volume data)
      return { pass: true }; // TODO: Add crypto-specific liquidity check
    }
  },
};
```

#### Filter 2: Spread Check (for live trading)

```typescript
/**
 * SPREAD FILTER
 *
 * Ensures bid-ask spread is reasonable for execution
 *
 * Thresholds:
 * - Liquid stocks: < 0.3%
 * - Small-cap stocks: < 1.0%
 * - Crypto: < 0.5% (for major pairs)
 *
 * Note: Requires real-time quote data (not available in daily scanner)
 * Recommendation: Implement as execution-time check, not scan-time
 */
export const spreadFilter: PreTradeFilter = {
  name: 'Spread Filter',
  enabled: false, // Disable for daily scanner (no real-time quotes)
  check: (input) => {
    // Would require bid/ask data
    return { pass: true };
  },
};
```

#### Filter 3: Earnings Calendar Check

```typescript
/**
 * EARNINGS CALENDAR FILTER
 *
 * Suppresses signals within 48h of earnings announcements
 *
 * Rationale: Earnings cause unpredictable volatility that invalidates technical patterns
 *
 * Data Source: Would need earnings calendar API (e.g., Finnhub, Alpha Vantage)
 * Fallback: Conservative approach - assume unknown = allow
 */
export const earningsFilter: PreTradeFilter = {
  name: 'Earnings Calendar Filter',
  enabled: true,
  check: async (input) => {
    if (input.marketType !== 'stock') {
      return { pass: true }; // Crypto has no earnings
    }

    try {
      const earningsDate = await getNextEarningsDate(input.symbol);

      if (!earningsDate) {
        return { pass: true }; // No known earnings
      }

      const daysUntilEarnings = daysBetween(new Date(), earningsDate);

      if (daysUntilEarnings <= 2) {
        return {
          pass: false,
          reason: `Earnings in ${daysUntilEarnings} day(s) - avoiding pre-earnings volatility`,
          severity: 'error',
        };
      }

      return { pass: true };
    } catch (error) {
      // API failure - default to allow (conservative)
      console.warn(`Earnings check failed for ${input.symbol}:`, error);
      return { pass: true };
    }
  },
};

// Mock implementation for now (replace with real API)
async function getNextEarningsDate(symbol: string): Promise<Date | null> {
  // TODO: Integrate earnings calendar API
  return null;
}
```

#### Filter 4: Risk/Reward Minimum

```typescript
/**
 * RISK/REWARD FILTER
 *
 * Enforces minimum 1.5:1 R:R ratio
 *
 * Rationale: < 1.5:1 requires >60% win rate to be profitable (unrealistic)
 */
export const riskRewardFilter: PreTradeFilter = {
  name: 'Risk/Reward Filter',
  enabled: true,
  check: (input) => {
    const risk = Math.abs(input.entryPrice - input.stopLoss);
    const reward = Math.abs(input.targetPrice - input.entryPrice);
    const ratio = reward / risk;

    if (ratio < 1.5) {
      return {
        pass: false,
        reason: `Poor R:R ratio: ${ratio.toFixed(2)}:1 (minimum 1.5:1)`,
        severity: 'error',
      };
    }

    return { pass: true };
  },
};
```

#### Filter 5: Maximum Risk Per Trade

```typescript
/**
 * MAX RISK FILTER
 *
 * Limits risk per trade to 15% (stocks) or 20% (crypto)
 *
 * Rationale: Excessive stop distance = poor risk management
 */
export const maxRiskFilter: PreTradeFilter = {
  name: 'Maximum Risk Filter',
  enabled: true,
  check: (input) => {
    const riskPercent = Math.abs(
      (input.entryPrice - input.stopLoss) / input.entryPrice
    ) * 100;

    const maxRisk = input.marketType === 'crypto' ? 20 : 15;

    if (riskPercent > maxRisk) {
      return {
        pass: false,
        reason: `Excessive risk: ${riskPercent.toFixed(1)}% (max ${maxRisk}%)`,
        severity: 'error',
      };
    }

    return { pass: true };
  },
};
```

#### Filter 6: Volatility Regime Filter

```typescript
/**
 * VOLATILITY REGIME FILTER
 *
 * Suppresses signals during extreme volatility (VIX spike, flash crash, etc.)
 *
 * Thresholds:
 * - ATR percentile > 95th: Extreme volatility (suppress)
 * - ATR percentile < 5th: Dead market (suppress)
 */
export const volatilityFilter: PreTradeFilter = {
  name: 'Volatility Regime Filter',
  enabled: true,
  check: (input) => {
    const atr = calculateATR(input.candles, 14);
    const atrPercentile = calculateATRPercentile(input.candles, atr);

    if (atrPercentile > 95) {
      return {
        pass: false,
        reason: `Extreme volatility: ATR at ${atrPercentile}th percentile`,
        severity: 'error',
      };
    }

    if (atrPercentile < 5) {
      return {
        pass: false,
        reason: `Dead market: ATR at ${atrPercentile}th percentile`,
        severity: 'warning',
      };
    }

    return { pass: true };
  },
};

function calculateATRPercentile(candles: Candle[], currentATR: number): number {
  const historicalATRs = [];

  for (let i = 14; i < candles.length; i++) {
    const slice = candles.slice(i - 14, i);
    historicalATRs.push(calculateATR(slice, 14));
  }

  const sorted = historicalATRs.sort((a, b) => a - b);
  const rank = sorted.filter(atr => atr <= currentATR).length;

  return (rank / sorted.length) * 100;
}
```

### 4.4 Filter Pipeline Implementation

```typescript
/**
 * Run all filters and aggregate results
 */
export interface FilterPipelineResult {
  pass: boolean;
  failedFilters: string[];
  warnings: string[];
  allResults: Record<string, FilterResult>;
}

export async function runPreTradeFilters(
  input: SignalInput,
  filters: PreTradeFilter[] = DEFAULT_FILTERS
): Promise<FilterPipelineResult> {
  const results: Record<string, FilterResult> = {};
  const failedFilters: string[] = [];
  const warnings: string[] = [];

  for (const filter of filters) {
    if (!filter.enabled) continue;

    const result = await filter.check(input);
    results[filter.name] = result;

    if (!result.pass) {
      if (result.severity === 'error') {
        failedFilters.push(`${filter.name}: ${result.reason}`);
      } else {
        warnings.push(`${filter.name}: ${result.reason}`);
      }
    }
  }

  return {
    pass: failedFilters.length === 0,
    failedFilters,
    warnings,
    allResults: results,
  };
}

export const DEFAULT_FILTERS: PreTradeFilter[] = [
  liquidityFilter,
  earningsFilter,
  riskRewardFilter,
  maxRiskFilter,
  volatilityFilter,
];
```

### 4.5 Integration into Daily Scanner

```typescript
/**
 * Enhanced scanner with pre-trade filters
 */
export async function analyzeSingleStockWithFilters(
  symbol: string,
  marketType: 'stock' | 'crypto'
): Promise<TradeRecommendation | null> {
  // Existing logic
  const candles = await getCandles(symbol, '1d', 60);
  const channel = detectChannel(candles);
  const pattern = detectPatterns(candles);
  const volume = analyzeVolume(candles);

  const trade = generateTradeRecommendation({
    symbol,
    candles,
    channel,
    pattern,
    currentPrice: candles[candles.length - 1].close,
    volume,
    absorption: detectAbsorption(candles, volume),
  });

  if (!trade) return null;

  // NEW: Apply pre-trade filters
  const filterInput: SignalInput = {
    symbol,
    candles,
    channel,
    pattern,
    currentPrice: trade.currentPrice,
    entryPrice: trade.entry,
    targetPrice: trade.target,
    stopLoss: trade.stopLoss,
    volume,
    marketType,
  };

  const filterResult = await runPreTradeFilters(filterInput);

  if (!filterResult.pass) {
    console.log(`Signal suppressed for ${symbol}:`, filterResult.failedFilters);
    return null; // Suppress signal
  }

  // Attach warnings to recommendation (user can see but trade is allowed)
  return {
    ...trade,
    warnings: filterResult.warnings,
    filtersPassed: Object.keys(filterResult.allResults).filter(
      name => filterResult.allResults[name].pass
    ),
  };
}
```

---

## 5. Regime Detection & Adaptive Filters

### 5.1 Rationale

**Problem:** Not all patterns work in all market conditions.

**Example:**
- Breakout patterns: Work well in trending markets, fail in ranging markets
- Mean-reversion patterns: Work well in ranging markets, fail in strong trends

**Solution:** Detect market regime and adjust signal logic accordingly.

### 5.2 Regime Classification

```typescript
/**
 * Market Regime Types
 */
export type MarketRegime =
  | 'trending_bullish'
  | 'trending_bearish'
  | 'ranging_high_vol'
  | 'ranging_low_vol'
  | 'transitional';

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number; // 0-100
  indicators: {
    adx: number;          // Trend strength (0-100)
    atrPercentile: number; // Volatility level (0-100)
    channelWidth: number;  // Range width (%)
    slope: number;         // Trend slope (%/day)
  };
  recommendations: string[];
}
```

### 5.3 Regime Detection Logic

```typescript
/**
 * Detect market regime using ADX, ATR, and channel characteristics
 */
export function detectMarketRegime(candles: Candle[]): RegimeAnalysis {
  // Calculate indicators
  const adx = calculateADX(candles, 14);
  const atr = calculateATR(candles, 14);
  const atrPercentile = calculateATRPercentile(candles, atr);
  const channel = detectChannel(candles);

  const channelWidth = channel.hasChannel
    ? ((channel.resistance - channel.support) / channel.support) * 100
    : 0;

  const slope = channel.hasChannel
    ? calculateChannelSlope(candles, channel.support, channel.resistance) * 100
    : 0;

  // Regime classification rules
  let regime: MarketRegime;
  let confidence: number;
  const recommendations: string[] = [];

  if (adx > 25 && slope > 1.0) {
    regime = 'trending_bullish';
    confidence = Math.min(100, adx * 1.2);
    recommendations.push('Favor trend-following strategies');
    recommendations.push('Look for pullbacks to support in uptrend');
    recommendations.push('Avoid shorting against the trend');
  } else if (adx > 25 && slope < -1.0) {
    regime = 'trending_bearish';
    confidence = Math.min(100, adx * 1.2);
    recommendations.push('Favor trend-following strategies');
    recommendations.push('Look for bounces to resistance in downtrend');
    recommendations.push('Avoid buying against the trend');
  } else if (adx < 20 && atrPercentile > 60) {
    regime = 'ranging_high_vol';
    confidence = 100 - adx;
    recommendations.push('Favor mean-reversion strategies');
    recommendations.push('Trade support/resistance bounces');
    recommendations.push('Widen stops due to high volatility');
  } else if (adx < 20 && atrPercentile < 40) {
    regime = 'ranging_low_vol';
    confidence = 100 - adx;
    recommendations.push('Favor mean-reversion strategies');
    recommendations.push('Trade tight channels');
    recommendations.push('Consider sitting out - low opportunity');
  } else {
    regime = 'transitional';
    confidence = 50;
    recommendations.push('Market in transition - wait for clarity');
    recommendations.push('Avoid new positions until trend establishes');
  }

  return {
    regime,
    confidence,
    indicators: { adx, atrPercentile, channelWidth, slope },
    recommendations,
  };
}

/**
 * Calculate Average Directional Index (ADX)
 *
 * Measures trend strength (not direction)
 * - ADX > 25: Strong trend
 * - ADX 20-25: Moderate trend
 * - ADX < 20: Weak trend / ranging
 */
export function calculateADX(candles: Candle[], period = 14): number {
  if (candles.length < period * 2) {
    return 0;
  }

  // Calculate Directional Movement (+DM, -DM)
  const dmPlus: number[] = [];
  const dmMinus: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    if (upMove > downMove && upMove > 0) {
      dmPlus.push(upMove);
    } else {
      dmPlus.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      dmMinus.push(downMove);
    } else {
      dmMinus.push(0);
    }

    // True Range
    const trValue = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trValue);
  }

  // Smooth with EMA
  const smoothDMPlus = calculateEMA(dmPlus, period);
  const smoothDMMinus = calculateEMA(dmMinus, period);
  const smoothTR = calculateEMA(tr, period);

  // Directional Indicators
  const diPlus = (smoothDMPlus / smoothTR) * 100;
  const diMinus = (smoothDMMinus / smoothTR) * 100;

  // Directional Index
  const dx = (Math.abs(diPlus - diMinus) / (diPlus + diMinus)) * 100;

  // ADX (smoothed DX)
  const adx = dx; // Simplified - proper ADX needs multi-period smoothing

  return adx;
}

function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;

  const k = 2 / (period + 1);
  let ema = values[0];

  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }

  return ema;
}
```

### 5.4 Regime-Adaptive Signal Logic

```typescript
/**
 * Adjust signal confidence based on regime suitability
 */
export function applyRegimeAdaptation(
  signal: TradeRecommendation,
  regime: RegimeAnalysis
): TradeRecommendation {
  let regimeMultiplier = 1.0;
  let regimeNotes: string[] = [];

  // Trend-following setups (breakouts, pullbacks)
  const isTrendFollowing = (
    signal.setup.setupName.includes('Breakout') ||
    signal.setup.setupName.includes('Breakdown') ||
    signal.setup.setupName.includes('Pullback')
  );

  // Mean-reversion setups (support/resistance bounces)
  const isMeanReversion = (
    signal.setup.setupName.includes('Bounce') ||
    signal.setup.setupName.includes('Rejection')
  );

  if (regime.regime === 'trending_bullish' || regime.regime === 'trending_bearish') {
    if (isTrendFollowing) {
      regimeMultiplier = 1.1; // 10% boost
      regimeNotes.push(`Regime: ${regime.regime} favors trend-following`);
    } else if (isMeanReversion) {
      regimeMultiplier = 0.9; // 10% penalty
      regimeNotes.push(`Regime: ${regime.regime} less favorable for mean-reversion`);
    }
  } else if (regime.regime === 'ranging_high_vol' || regime.regime === 'ranging_low_vol') {
    if (isMeanReversion) {
      regimeMultiplier = 1.1; // 10% boost
      regimeNotes.push(`Regime: ${regime.regime} favors mean-reversion`);
    } else if (isTrendFollowing) {
      regimeMultiplier = 0.8; // 20% penalty (breakouts fail in ranges)
      regimeNotes.push(`Regime: ${regime.regime} unfavorable for breakouts`);
    }
  } else if (regime.regime === 'transitional') {
    regimeMultiplier = 0.85; // 15% penalty for all setups
    regimeNotes.push('Regime: Transitional - wait for clearer trend');
  }

  return {
    ...signal,
    opportunityScore: Math.round(signal.opportunityScore * regimeMultiplier),
    regimeAnalysis: regime,
    regimeNotes,
  };
}
```

### 5.5 Regime-Based Trade Management

```typescript
/**
 * Adjust stop loss and target based on regime
 */
export function applyRegimeBasedExits(
  trade: TradeRecommendation,
  regime: RegimeAnalysis
): TradeRecommendation {
  let stopMultiplier = 1.0;
  let targetMultiplier = 1.0;

  // High volatility → widen stops
  if (regime.indicators.atrPercentile > 80) {
    stopMultiplier = 1.5;
    targetMultiplier = 1.3;
  }

  // Low volatility → tighten stops
  if (regime.indicators.atrPercentile < 20) {
    stopMultiplier = 0.8;
    targetMultiplier = 0.9;
  }

  // Recalculate stop and target
  const riskAmount = Math.abs(trade.entry - trade.stopLoss);
  const rewardAmount = Math.abs(trade.target - trade.entry);

  const newStopLoss = trade.setup.type === 'long'
    ? trade.entry - (riskAmount * stopMultiplier)
    : trade.entry + (riskAmount * stopMultiplier);

  const newTarget = trade.setup.type === 'long'
    ? trade.entry + (rewardAmount * targetMultiplier)
    : trade.entry - (rewardAmount * targetMultiplier);

  return {
    ...trade,
    stopLoss: newStopLoss,
    target: newTarget,
    riskAmount: Math.abs(trade.entry - newStopLoss),
    rewardAmount: Math.abs(newTarget - trade.entry),
    riskRewardRatio: Math.abs(newTarget - trade.entry) / Math.abs(trade.entry - newStopLoss),
  };
}
```

---

## 6. Multi-Factor Signal Aggregation

### 6.1 Problem Statement

**Current:** Signals are binary (generate or don't generate)

**Issue:** Conflicting signals are not weighted properly

**Example:**
- Bullish hammer at support (pattern score: 22/25)
- BUT selling absorption detected (absorption score: -5)
- Current system: Generates signal anyway (doesn't check absorption conflict)

### 6.2 Signal Conflict Detection

```typescript
/**
 * Detect conflicting signals within a setup
 */
export interface SignalConflict {
  hasConflict: boolean;
  conflicts: string[];
  severity: 'minor' | 'major';
}

export function detectSignalConflicts(
  setup: TradeSetup,
  pattern: PatternDetectionResult,
  absorption: AbsorptionPattern,
  regime: RegimeAnalysis
): SignalConflict {
  const conflicts: string[] = [];

  // Pattern-absorption conflict
  if (setup.type === 'long' && absorption.type === 'selling') {
    conflicts.push('Bullish pattern BUT selling absorption detected');
  }
  if (setup.type === 'short' && absorption.type === 'buying') {
    conflicts.push('Bearish pattern BUT buying absorption detected');
  }

  // Pattern-regime conflict
  if (
    setup.type === 'long' &&
    (regime.regime === 'trending_bearish' || regime.indicators.slope < -1.0)
  ) {
    conflicts.push('Bullish setup BUT strong downtrend on higher timeframe');
  }
  if (
    setup.type === 'short' &&
    (regime.regime === 'trending_bullish' || regime.indicators.slope > 1.0)
  ) {
    conflicts.push('Bearish setup BUT strong uptrend on higher timeframe');
  }

  // Breakout-regime conflict
  if (
    setup.setupName.includes('Breakout') &&
    regime.regime.startsWith('ranging')
  ) {
    conflicts.push('Breakout setup BUT ranging market (likely false breakout)');
  }

  const severity: 'minor' | 'major' = conflicts.length >= 2 ? 'major' : 'minor';

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    severity,
  };
}
```

### 6.3 Signal Aggregation Formula

```typescript
/**
 * Multi-factor signal aggregation with conflict weighting
 *
 * Final Score = Base Score × Regime Multiplier × Conflict Penalty × MTF Bonus
 */
export function aggregateSignalScore(
  baseScore: OpportunityScore,
  regime: RegimeAnalysis,
  mtf?: MTFAnalysis,
  conflicts?: SignalConflict
): number {
  let finalScore = baseScore.totalScore;

  // Apply regime multiplier (0.8-1.1)
  const regimeMultiplier = calculateRegimeMultiplier(regime);
  finalScore *= regimeMultiplier;

  // Apply conflict penalty
  if (conflicts && conflicts.hasConflict) {
    const conflictPenalty = conflicts.severity === 'major' ? 0.7 : 0.9;
    finalScore *= conflictPenalty;
  }

  // Add MTF bonus (0-15 points, not multiplier)
  if (mtf) {
    finalScore += mtf.confluenceScore;
  }

  return Math.min(100, Math.max(0, Math.round(finalScore)));
}

function calculateRegimeMultiplier(regime: RegimeAnalysis): number {
  // Return multiplier based on regime confidence
  if (regime.confidence > 70) {
    // High confidence regime
    return regime.regime.startsWith('trending') ? 1.1 : 1.05;
  } else if (regime.confidence < 40) {
    // Low confidence / transitional
    return 0.85;
  } else {
    return 1.0; // Neutral
  }
}
```

### 6.4 Ensemble Scoring Model

```typescript
/**
 * Alternative: Ensemble approach where each factor votes
 *
 * Final signal = weighted average of all factor signals
 */
export interface FactorSignal {
  factor: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  weight: number;   // Importance weight
}

export function calculateEnsembleSignal(
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  volume: VolumeAnalysis,
  absorption: AbsorptionPattern,
  regime: RegimeAnalysis
): { signal: 'bullish' | 'bearish' | 'neutral'; confidence: number } {
  const factors: FactorSignal[] = [];

  // Channel factor
  if (channel.hasChannel && channel.status === 'near_support') {
    factors.push({
      factor: 'Channel',
      signal: 'bullish',
      strength: 70,
      weight: 0.3,
    });
  } else if (channel.hasChannel && channel.status === 'near_resistance') {
    factors.push({
      factor: 'Channel',
      signal: 'bearish',
      strength: 70,
      weight: 0.3,
    });
  }

  // Pattern factor
  const bullishPatterns = ['bullish_engulfing', 'hammer', 'piercing_line'];
  const bearishPatterns = ['bearish_engulfing', 'shooting_star', 'dark_cloud_cover'];

  if (bullishPatterns.includes(pattern.mainPattern)) {
    factors.push({
      factor: 'Pattern',
      signal: 'bullish',
      strength: 80,
      weight: 0.25,
    });
  } else if (bearishPatterns.includes(pattern.mainPattern)) {
    factors.push({
      factor: 'Pattern',
      signal: 'bearish',
      strength: 80,
      weight: 0.25,
    });
  }

  // Volume factor
  if (volume.volumeRatio > 1.5) {
    // High volume confirms the pattern direction
    const lastCandle = channel.status === 'near_support' ? 'bullish' : 'bearish';
    factors.push({
      factor: 'Volume',
      signal: lastCandle,
      strength: 60,
      weight: 0.2,
    });
  }

  // Absorption factor
  if (absorption.type === 'buying') {
    factors.push({
      factor: 'Absorption',
      signal: 'bullish',
      strength: absorption.confidence,
      weight: 0.15,
    });
  } else if (absorption.type === 'selling') {
    factors.push({
      factor: 'Absorption',
      signal: 'bearish',
      strength: absorption.confidence,
      weight: 0.15,
    });
  }

  // Regime factor
  if (regime.regime === 'trending_bullish') {
    factors.push({
      factor: 'Regime',
      signal: 'bullish',
      strength: regime.confidence,
      weight: 0.1,
    });
  } else if (regime.regime === 'trending_bearish') {
    factors.push({
      factor: 'Regime',
      signal: 'bearish',
      strength: regime.confidence,
      weight: 0.1,
    });
  }

  // Calculate weighted average
  let bullishScore = 0;
  let bearishScore = 0;
  let totalWeight = 0;

  for (const factor of factors) {
    const weightedStrength = factor.strength * factor.weight;

    if (factor.signal === 'bullish') {
      bullishScore += weightedStrength;
    } else if (factor.signal === 'bearish') {
      bearishScore += weightedStrength;
    }

    totalWeight += factor.weight;
  }

  // Normalize scores
  bullishScore = totalWeight > 0 ? bullishScore / totalWeight : 0;
  bearishScore = totalWeight > 0 ? bearishScore / totalWeight : 0;

  // Determine final signal
  const threshold = 50; // Minimum confidence to generate signal

  if (bullishScore > bearishScore && bullishScore > threshold) {
    return { signal: 'bullish', confidence: bullishScore };
  } else if (bearishScore > bullishScore && bearishScore > threshold) {
    return { signal: 'bearish', confidence: bearishScore };
  } else {
    return { signal: 'neutral', confidence: Math.max(bullishScore, bearishScore) };
  }
}
```

---

## 7. Backtesting Integration

### 7.1 Metrics to Track

```typescript
/**
 * Pattern Performance Metrics (per pattern type, per symbol, per regime)
 */
export interface PatternPerformance {
  patternType: DetectedPattern;
  symbol: string;
  regime: MarketRegime;

  // Sample size
  totalSignals: number;
  tradedSignals: number; // Subset that met filters

  // Win rate
  wins: number;
  losses: number;
  winRate: number; // wins / (wins + losses)

  // Expectancy
  avgWin: number;          // Average R-multiple on wins
  avgLoss: number;         // Average R-multiple on losses
  expectancy: number;      // (winRate × avgWin) - ((1 - winRate) × avgLoss)

  // Risk metrics
  maxConsecutiveLosses: number;
  maxDrawdown: number;     // Peak-to-trough equity drop

  // Time-based
  avgHoldingPeriod: number; // Days

  // Confidence
  confidenceByScore: {
    high: { winRate: number; sampleSize: number };
    medium: { winRate: number; sampleSize: number };
    low: { winRate: number; sampleSize: number };
  };
}
```

### 7.2 Performance Tracking Schema

```sql
-- Database table for tracking signal performance
CREATE TABLE signal_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Signal identification
  signal_id UUID REFERENCES trade_recommendations(id),
  symbol TEXT NOT NULL,
  pattern_type TEXT,
  setup_type TEXT, -- 'long' | 'short'
  regime TEXT,     -- 'trending_bullish' | etc.

  -- Entry details
  entry_date DATE NOT NULL,
  entry_price NUMERIC(10,2) NOT NULL,
  target_price NUMERIC(10,2) NOT NULL,
  stop_loss NUMERIC(10,2) NOT NULL,
  opportunity_score INTEGER,
  confidence_level TEXT,

  -- Exit details
  exit_date DATE,
  exit_price NUMERIC(10,2),
  exit_reason TEXT, -- 'target_hit' | 'stop_hit' | 'time_exit' | 'manual'

  -- Performance
  r_multiple NUMERIC(5,2), -- (exit - entry) / (entry - stop)
  return_pct NUMERIC(6,2),
  holding_days INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance queries
CREATE INDEX idx_perf_pattern ON signal_performance(pattern_type);
CREATE INDEX idx_perf_symbol ON signal_performance(symbol);
CREATE INDEX idx_perf_regime ON signal_performance(regime);
CREATE INDEX idx_perf_score ON signal_performance(opportunity_score);
```

### 7.3 Walk-Forward Validation Framework

```typescript
/**
 * Walk-forward validation: Train on past data, test on future data
 *
 * Period 1: Train on 2020-2021, test on 2022-Q1
 * Period 2: Train on 2020-2022-Q1, test on 2022-Q2
 * Period 3: Train on 2020-2022-Q2, test on 2022-Q3
 * ... and so on
 */
export interface WalkForwardConfig {
  trainingPeriodMonths: number; // e.g., 24 months
  testingPeriodMonths: number;  // e.g., 3 months
  stepSizeMonths: number;       // e.g., 3 months (rolling forward)
}

export async function runWalkForwardValidation(
  symbols: string[],
  startDate: Date,
  endDate: Date,
  config: WalkForwardConfig
): Promise<WalkForwardResults> {
  const results: PeriodResult[] = [];

  let currentDate = startDate;

  while (currentDate < endDate) {
    const trainingEnd = addMonths(currentDate, config.trainingPeriodMonths);
    const testingEnd = addMonths(trainingEnd, config.testingPeriodMonths);

    if (testingEnd > endDate) break;

    // Train phase: Calculate pattern win rates from historical data
    const patternStats = await calculatePatternStats(
      symbols,
      currentDate,
      trainingEnd
    );

    // Test phase: Generate signals and track performance
    const testResults = await backtestPeriod(
      symbols,
      trainingEnd,
      testingEnd,
      patternStats
    );

    results.push({
      trainingPeriod: { start: currentDate, end: trainingEnd },
      testingPeriod: { start: trainingEnd, end: testingEnd },
      patternStats,
      performance: testResults,
    });

    // Step forward
    currentDate = addMonths(currentDate, config.stepSizeMonths);
  }

  return {
    periods: results,
    overallMetrics: aggregateResults(results),
  };
}
```

### 7.4 Adaptive Pattern Scoring

```typescript
/**
 * Use historical win rates to adjust pattern scores dynamically
 *
 * Problem: Static pattern scores (e.g., hammer = 22/25) don't reflect actual performance
 * Solution: Adjust score based on backtested win rate
 */
export function getAdaptivePatternScore(
  pattern: DetectedPattern,
  symbol: string,
  regime: MarketRegime,
  historicalPerformance: Map<string, PatternPerformance>
): number {
  const baseScore = getBasePatternScore(pattern); // Static score (22/25)

  const key = `${symbol}_${pattern}_${regime}`;
  const perf = historicalPerformance.get(key);

  if (!perf || perf.tradedSignals < 10) {
    return baseScore; // Not enough data, use base score
  }

  // Adjust based on actual win rate
  const expectedWinRate = 0.55; // Assume 55% is baseline
  const actualWinRate = perf.winRate;

  const adjustmentFactor = actualWinRate / expectedWinRate;

  // Cap adjustment to ±30%
  const cappedFactor = Math.max(0.7, Math.min(1.3, adjustmentFactor));

  return Math.round(baseScore * cappedFactor);
}

function getBasePatternScore(pattern: DetectedPattern): number {
  const scores: Record<DetectedPattern, number> = {
    'bullish_engulfing': 25,
    'bearish_engulfing': 24,
    'hammer': 22,
    'shooting_star': 21,
    'piercing_line': 20,
    'dark_cloud_cover': 19,
    'doji': 12,
    'none': 8,
  };
  return scores[pattern] || 8;
}
```

---

## 8. Crypto-Specific Adaptations

### 8.1 Key Differences: Crypto vs Stocks

| Aspect | Stocks | Crypto |
|--------|--------|--------|
| Trading hours | 9:30-16:00 ET (6.5h) | 24/7 |
| Volatility | ATR ~2-5% | ATR ~5-15% |
| Liquidity | Concentrated (market hours) | Variable (time zones) |
| Volume patterns | Predictable (open/close spikes) | Unpredictable |
| Support/resistance | Respect levels | More likely to blow through |
| Gaps | Common (overnight news) | Rare (continuous trading) |
| Earnings | Quarterly catalysts | No earnings |
| News impact | Regulated disclosures | Twitter rumors |

### 8.2 Crypto-Specific Parameter Adjustments

```typescript
/**
 * Market-specific configuration
 */
export interface MarketConfig {
  // Channel detection
  minChannelWidth: number;   // Minimum % width to qualify as channel
  maxChannelWidth: number;   // Maximum % width (too wide = choppy)
  touchTolerance: number;    // ATR multiplier for "touch" detection

  // Risk management
  maxRiskPercent: number;    // Maximum stop loss distance
  minRiskReward: number;     // Minimum R:R ratio

  // Volume analysis
  volumeLookback: number;    // Days/bars to average volume
  highVolumeThreshold: number; // Multiplier for "high" volume

  // Pattern validation
  patternMinBody: number;    // Minimum body size for pattern
  patternMinRange: number;   // Minimum total range for pattern
}

export const STOCK_CONFIG: MarketConfig = {
  minChannelWidth: 0.02,     // 2%
  maxChannelWidth: 0.25,     // 25%
  touchTolerance: 0.3,       // 0.3x ATR
  maxRiskPercent: 0.15,      // 15%
  minRiskReward: 1.5,        // 1.5:1
  volumeLookback: 30,        // 30 days
  highVolumeThreshold: 1.5,  // 1.5x average
  patternMinBody: 0.002,     // 0.2% of price
  patternMinRange: 0.005,    // 0.5% of price
};

export const CRYPTO_CONFIG: MarketConfig = {
  minChannelWidth: 0.03,     // 3% (wider due to volatility)
  maxChannelWidth: 0.40,     // 40% (allow wider ranges)
  touchTolerance: 0.5,       // 0.5x ATR (looser due to whipsaws)
  maxRiskPercent: 0.20,      // 20% (higher risk tolerance)
  minRiskReward: 2.0,        // 2:1 (compensate for higher risk)
  volumeLookback: 20,        // 20 days (shorter memory)
  highVolumeThreshold: 2.0,  // 2x average (higher bar)
  patternMinBody: 0.005,     // 0.5% (larger moves needed)
  patternMinRange: 0.01,     // 1% (larger range needed)
};
```

### 8.3 Crypto Volume Normalization

```typescript
/**
 * Crypto volume varies wildly by time zone
 *
 * Problem: 3 AM UTC volume naturally low (Asia sleep, US sleep)
 * Solution: Normalize by global time-of-day patterns
 */
export function analyzeCryptoVolume(candles: Candle[]): VolumeAnalysis {
  if (candles.length < 20) {
    return {
      last5DaysAvg: 0,
      last30DaysAvg: 0,
      currentVolume: 0,
      volumeRatio: 1,
      status: 'average',
    };
  }

  const currentCandle = candles[candles.length - 1];
  const currentVolume = currentCandle.volume || 0;

  // For crypto, use longer lookback (volatility is higher)
  const last20Candles = candles.slice(-20).filter(c => (c.volume || 0) > 0);
  const avgVolume = last20Candles.reduce((sum, c) => sum + (c.volume || 0), 0) / last20Candles.length;

  // Higher threshold for crypto (2x vs 1.5x for stocks)
  const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

  let status: 'high' | 'average' | 'low';
  if (volumeRatio >= 2.0) {
    status = 'high';   // 2x = significant for crypto
  } else if (volumeRatio >= 0.7) {
    status = 'average';
  } else {
    status = 'low';
  }

  return {
    last5DaysAvg: avgVolume,
    last30DaysAvg: avgVolume,
    currentVolume,
    volumeRatio,
    status,
  };
}
```

### 8.4 Crypto Pattern Validation

```typescript
/**
 * Crypto-specific pattern validation
 *
 * Problem: Crypto wicks are extreme (10%+ shadows common)
 * Solution: Require larger minimum body/range for valid patterns
 */
export function detectCryptoPatterns(candles: Candle[]): PatternDetectionResult {
  if (candles.length < 2) {
    return { mainPattern: 'none' };
  }

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const lastBody = Math.abs(last.close - last.open);
  const lastRange = last.high - last.low;
  const lastUpperShadow = last.high - Math.max(last.open, last.close);
  const lastLowerShadow = Math.min(last.open, last.close) - last.low;

  const prevBody = Math.abs(prev.close - prev.open);

  const isBullishCandle = (c: Candle) => c.close > c.open;
  const isBearishCandle = (c: Candle) => c.close < c.open;

  // CRYPTO: Require minimum 0.5% body size (vs 0.2% for stocks)
  const minBodyPercent = 0.005;
  const minBody = last.close * minBodyPercent;

  if (lastBody < minBody) {
    return { mainPattern: 'none' }; // Too small to be meaningful
  }

  // CRYPTO: Require minimum 1% range (vs 0.5% for stocks)
  const minRangePercent = 0.01;
  const minRange = last.close * minRangePercent;

  if (lastRange < minRange) {
    return { mainPattern: 'none' };
  }

  // Standard pattern detection (same logic as stocks, but with stricter size filters)
  if (
    isBearishCandle(prev) &&
    isBullishCandle(last) &&
    last.open <= prev.close &&
    last.close >= prev.open &&
    lastBody > prevBody * 0.8
  ) {
    return { mainPattern: 'bullish_engulfing' };
  }

  // ... (rest of pattern logic)

  return { mainPattern: 'none' };
}
```

### 8.5 Crypto Support/Resistance Behavior

```typescript
/**
 * Crypto support/resistance is "fuzzier" than stocks
 *
 * Problem: Crypto blows through S/R levels more frequently
 * Solution: Use wider zones instead of precise levels
 */
export function detectCryptoChannel(
  candles: Candle[],
  lookbackPeriod = 40
): ChannelDetectionResult {
  const channel = detectChannel(candles, lookbackPeriod);

  if (!channel.hasChannel) {
    return channel;
  }

  // CRYPTO ADJUSTMENT: Widen support/resistance into zones
  const zoneWidth = calculateATR(candles, 14) * 0.5; // ±0.5 ATR

  return {
    ...channel,
    supportZoneLow: channel.support - zoneWidth,
    supportZoneHigh: channel.support + zoneWidth,
    resistanceZoneLow: channel.resistance - zoneWidth,
    resistanceZoneHigh: channel.resistance + zoneWidth,
  };
}
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Deliverables:**
- [ ] Implement determinism enhancements (timestamp normalization, epsilon comparisons)
- [ ] Add edge case handling (zero volume, duplicates, extreme moves)
- [ ] Create determinism unit tests (100x identical output test)
- [ ] Document all edge cases in code comments

**Dependencies:** None

**Risk:** Low

---

### Phase 2: Pre-Trade Filters (Weeks 3-4)

**Deliverables:**
- [ ] Implement filter pipeline architecture (`PreTradeFilter`, `FilterResult`)
- [ ] Build 5 core filters:
  - Liquidity filter
  - Risk/reward filter
  - Max risk filter
  - Volatility regime filter
  - Earnings calendar filter (stub with mock data)
- [ ] Integrate filters into daily scanner
- [ ] Add filter results to UI (show why signals were suppressed)

**Dependencies:** Phase 1

**Risk:** Medium (earnings API integration TBD)

---

### Phase 3: Regime Detection (Weeks 5-6)

**Deliverables:**
- [ ] Implement ADX calculation (`calculateADX`)
- [ ] Build regime detection logic (`detectMarketRegime`)
- [ ] Create regime-adaptive signal logic
- [ ] Add regime analysis to signal metadata
- [ ] Display regime on recommendations page

**Dependencies:** Phase 1

**Risk:** Low

---

### Phase 4: Multi-Timeframe Confirmation (Weeks 7-8)

**Deliverables:**
- [ ] Extend data pipeline to fetch multiple timeframes (weekly + daily)
- [ ] Implement MTF confluence scoring
- [ ] Add MTF bonus to opportunity score (+0 to +15 points)
- [ ] Create MTF visualization in UI (show weekly trend context)

**Dependencies:** Phase 1, Phase 3

**Risk:** Medium (data pipeline complexity)

---

### Phase 5: Signal Conflict Detection (Week 9)

**Deliverables:**
- [ ] Build conflict detection logic (`detectSignalConflicts`)
- [ ] Implement conflict penalty in aggregation formula
- [ ] Add conflict warnings to UI
- [ ] Create unit tests for conflict scenarios

**Dependencies:** Phase 2, Phase 3

**Risk:** Low

---

### Phase 6: Crypto-Specific Adaptations (Week 10)

**Deliverables:**
- [ ] Create `CRYPTO_CONFIG` parameter set
- [ ] Implement crypto-specific volume analysis
- [ ] Adjust pattern validation for crypto (larger min sizes)
- [ ] Test crypto scanner with BTC, ETH, SOL

**Dependencies:** Phase 1

**Risk:** Low

---

### Phase 7: Backtesting Integration (Weeks 11-14)

**Deliverables:**
- [ ] Create `signal_performance` database table
- [ ] Implement performance tracking for paper trades
- [ ] Build walk-forward validation framework
- [ ] Calculate pattern performance metrics by symbol/regime
- [ ] Implement adaptive pattern scoring (adjust based on backtest results)
- [ ] Create performance dashboard in UI

**Dependencies:** All previous phases

**Risk:** High (complex, data-intensive)

---

### Phase 8: Optimization & Deployment (Weeks 15-16)

**Deliverables:**
- [ ] Performance testing (scanner runtime, database queries)
- [ ] Load testing (1000+ symbols)
- [ ] Documentation update (all specs, APIs, formulas)
- [ ] User guide for new features
- [ ] Production deployment

**Dependencies:** All previous phases

**Risk:** Low

---

## 10. Metadata Standards

### 10.1 Signal Event Logging

```typescript
/**
 * Every signal generation event MUST log the following metadata
 */
export interface SignalEventLog {
  // Identification
  signal_id: string;           // UUID
  timestamp_utc: string;       // ISO 8601 (e.g., "2025-11-30T21:00:00Z")
  symbol: string;
  market_type: 'stock' | 'crypto';

  // Signal details
  signal_type: string;         // 'long' | 'short' | 'none'
  setup_name: string;          // 'Long - Support Bounce', etc.
  confidence_level: string;    // 'high' | 'medium' | 'low'
  opportunity_score: number;   // 0-100

  // Prices
  current_price: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;

  // Risk metrics
  risk_amount: number;
  reward_amount: number;
  risk_reward_ratio: number;
  risk_percent: number;

  // Indicators (snapshot at signal generation)
  indicators: {
    channel_support?: number;
    channel_resistance?: number;
    channel_width_pct?: number;
    pattern_type: string;
    rsi_14: number | null;
    atr_14: number;
    adx_14?: number;
    volume_ratio: number;
  };

  // Regime analysis
  regime?: {
    type: MarketRegime;
    confidence: number;
    adx: number;
    atr_percentile: number;
  };

  // MTF analysis (if available)
  mtf?: {
    higher_timeframe: string;
    higher_trend: string;
    confluence_score: number;
  };

  // Pre-trade filters
  filters: {
    passed: string[];          // List of filter names that passed
    failed: string[];          // List of filter names that failed
    warnings: string[];        // Non-fatal warnings
  };

  // Conflicts (if any)
  conflicts?: {
    has_conflict: boolean;
    conflict_list: string[];
    severity: 'minor' | 'major';
  };

  // Rationale
  rationale: string;           // Human-readable explanation

  // Processing metadata
  processing_time_ms: number;  // How long signal calculation took
  data_source: string;         // 'FMP' | 'mock' | 'Finnhub'
  scanner_version: string;     // Code version for reproducibility
}
```

### 10.2 Storage Strategy

**Signal Generation (daily scan):**
- Store in `trade_recommendations` table (user-facing)
- Store full event log in `signal_event_log` table (debugging/analysis)

**Signal Performance (post-trade):**
- Update `signal_performance` table when trade exits
- Link back to original signal via `signal_id`

**Retention Policy:**
- `trade_recommendations`: 30 days
- `signal_event_log`: 1 year
- `signal_performance`: Indefinite (historical analysis)

---

## 11. Unit Test Requirements

### 11.1 Test Categories

#### A. Determinism Tests

```typescript
describe('Signal Determinism', () => {
  it('produces identical output for identical input (100 runs)', () => {
    // See Section 2.4
  });

  it('handles floating-point comparisons correctly', () => {
    expect(priceEquals(150.00000001, 150.0)).toBe(true);
    expect(priceLessThan(149.99, 150.01)).toBe(true);
  });

  it('normalizes timestamps consistently', () => {
    const candle1 = { timestamp: '2025-11-26T14:30:00-05:00', ... };
    const candle2 = { timestamp: '2025-11-26T19:30:00Z', ... };
    expect(normalizeTimestamp(candle1, '1d')).toBe('2025-11-26T00:00:00Z');
    expect(normalizeTimestamp(candle2, '1d')).toBe('2025-11-26T00:00:00Z');
  });
});
```

#### B. Edge Case Tests

```typescript
describe('Edge Case Handling', () => {
  it('rejects candles with zero volume (when configured)', () => {
    const candles = [
      { close: 100, volume: 1000, ... },
      { close: 101, volume: 0, ... },    // Zero volume
      { close: 102, volume: 1200, ... },
    ];
    const filtered = filterZeroVolume(candles);
    expect(filtered.length).toBe(2);
  });

  it('rejects extreme price moves (>50%)', () => {
    const candles = [
      { close: 100, ... },
      { close: 160, ... },  // +60% move (likely data error)
    ];
    expect(() => detectChannel(candles)).toThrow('Extreme price move detected');
  });

  it('handles insufficient data gracefully', () => {
    const candles = generateMockCandles(5); // Only 5 candles
    const rsi = calculateRSI(candles, 14);
    expect(rsi).toBeNull(); // Not enough data for RSI(14)
  });
});
```

#### C. Filter Tests

```typescript
describe('Pre-Trade Filters', () => {
  it('suppresses signal when liquidity too low', async () => {
    const input: SignalInput = {
      symbol: 'LOWVOL',
      volume: { last30DaysAvg: 100_000, ... }, // Below 500K threshold
      marketType: 'stock',
      ...
    };
    const result = await liquidityFilter.check(input);
    expect(result.pass).toBe(false);
    expect(result.reason).toContain('Low volume');
  });

  it('suppresses signal when R:R < 1.5', async () => {
    const input: SignalInput = {
      entryPrice: 100,
      targetPrice: 102,  // +2%
      stopLoss: 98.5,    // -1.5% → R:R = 1.33 (too low)
      ...
    };
    const result = await riskRewardFilter.check(input);
    expect(result.pass).toBe(false);
  });

  it('allows signal when all filters pass', async () => {
    const input: SignalInput = {
      symbol: 'AAPL',
      volume: { last30DaysAvg: 50_000_000, ... },
      entryPrice: 150,
      targetPrice: 157.5,  // +5%
      stopLoss: 147,       // -2% → R:R = 2.5
      marketType: 'stock',
      ...
    };
    const result = await runPreTradeFilters(input);
    expect(result.pass).toBe(true);
  });
});
```

#### D. Regime Detection Tests

```typescript
describe('Regime Detection', () => {
  it('detects trending_bullish regime', () => {
    const candles = generateTrendingCandles('bullish', 0.02); // +2%/day
    const regime = detectMarketRegime(candles);
    expect(regime.regime).toBe('trending_bullish');
    expect(regime.indicators.adx).toBeGreaterThan(25);
    expect(regime.indicators.slope).toBeGreaterThan(0.01);
  });

  it('detects ranging_high_vol regime', () => {
    const candles = generateRangingCandles('high_volatility');
    const regime = detectMarketRegime(candles);
    expect(regime.regime).toBe('ranging_high_vol');
    expect(regime.indicators.adx).toBeLessThan(20);
    expect(regime.indicators.atrPercentile).toBeGreaterThan(60);
  });
});
```

#### E. Conflict Detection Tests

```typescript
describe('Signal Conflict Detection', () => {
  it('detects pattern-absorption conflict', () => {
    const setup: TradeSetup = { type: 'long', ... };
    const pattern: PatternDetectionResult = { mainPattern: 'hammer' }; // Bullish
    const absorption: AbsorptionPattern = { type: 'selling', confidence: 75 }; // Bearish

    const conflicts = detectSignalConflicts(setup, pattern, absorption, regime);

    expect(conflicts.hasConflict).toBe(true);
    expect(conflicts.conflicts).toContain('Bullish pattern BUT selling absorption detected');
  });

  it('detects regime-setup conflict', () => {
    const setup: TradeSetup = { type: 'long', setupName: 'Long - Breakout' };
    const regime: RegimeAnalysis = { regime: 'ranging_low_vol', ... };

    const conflicts = detectSignalConflicts(setup, pattern, absorption, regime);

    expect(conflicts.hasConflict).toBe(true);
    expect(conflicts.severity).toBe('major');
  });
});
```

#### F. MTF Confluence Tests

```typescript
describe('Multi-Timeframe Confluence', () => {
  it('adds +10 points when higher timeframe trend aligns', () => {
    const primarySignal = { type: 'long', channel: { ... } };
    const weeklyCandles = generateTrendingCandles('bullish', 0.015);

    const mtf = calculateMTFConfluence(primarySignal, weeklyCandles);

    expect(mtf.confluenceScore).toBe(10); // Trend aligned
    expect(mtf.higherTF.trend).toBe('bullish');
  });

  it('adds 0 points when higher timeframe conflicts', () => {
    const primarySignal = { type: 'long', channel: { ... } };
    const weeklyCandles = generateTrendingCandles('bearish', -0.015);

    const mtf = calculateMTFConfluence(primarySignal, weeklyCandles);

    expect(mtf.confluenceScore).toBe(0); // Trend conflicts
    expect(mtf.confluenceReason).toContain('conflicts');
  });
});
```

#### G. Crypto-Specific Tests

```typescript
describe('Crypto-Specific Adaptations', () => {
  it('uses wider channel thresholds for crypto', () => {
    const config = CRYPTO_CONFIG;
    expect(config.minChannelWidth).toBe(0.03); // 3% vs 2% for stocks
    expect(config.maxRiskPercent).toBe(0.20);  // 20% vs 15% for stocks
  });

  it('requires larger pattern bodies for crypto', () => {
    const smallPattern = {
      open: 100,
      close: 100.2, // Only 0.2% body
      high: 100.5,
      low: 99.5,
    };

    const result = detectCryptoPatterns([previousCandle, smallPattern]);
    expect(result.mainPattern).toBe('none'); // Too small
  });

  it('uses higher volume threshold for crypto (2x vs 1.5x)', () => {
    const candles = generateMockCandles(30, 'crypto');
    candles[candles.length - 1].volume = candles[candles.length - 2].volume * 1.8;

    const volume = analyzeCryptoVolume(candles);
    expect(volume.status).toBe('average'); // 1.8x is "average" for crypto
  });
});
```

### 11.2 Integration Test: Full Pipeline

```typescript
describe('Signal Pipeline Integration', () => {
  it('generates high-confidence signal for textbook setup', async () => {
    // Setup: AAPL at support with bullish engulfing on high volume
    const candles = loadTestData('AAPL_support_bounce');
    const weeklyCandles = loadTestData('AAPL_weekly_uptrend');

    // Run full pipeline
    const signal = await generateEnhancedSignal({
      symbol: 'AAPL',
      candles,
      weeklyCandles,
      marketType: 'stock',
    });

    // Assertions
    expect(signal).not.toBeNull();
    expect(signal.setup.type).toBe('long');
    expect(signal.opportunityScore).toBeGreaterThan(75); // High confidence
    expect(signal.filters.passed.length).toBeGreaterThan(4);
    expect(signal.mtf.confluenceScore).toBe(10); // Weekly uptrend aligned
    expect(signal.regime.regime).toBe('trending_bullish');
    expect(signal.conflicts.hasConflict).toBe(false);
  });

  it('suppresses signal when filters fail', async () => {
    // Setup: Low-volume stock with poor R:R
    const candles = loadTestData('LOWVOL_poor_setup');

    const signal = await generateEnhancedSignal({
      symbol: 'LOWVOL',
      candles,
      marketType: 'stock',
    });

    expect(signal).toBeNull(); // Signal suppressed
  });

  it('generates signal with conflict warning', async () => {
    // Setup: Bullish pattern BUT selling absorption
    const candles = loadTestData('AAPL_conflicting_signals');

    const signal = await generateEnhancedSignal({
      symbol: 'AAPL',
      candles,
      marketType: 'stock',
    });

    expect(signal).not.toBeNull();
    expect(signal.conflicts.hasConflict).toBe(true);
    expect(signal.opportunityScore).toBeLessThan(65); // Penalized for conflict
    expect(signal.warnings).toContain('Selling absorption detected');
  });
});
```

---

## 12. Success Criteria

### 12.1 Technical Metrics

**Determinism:**
- [ ] 100% identical output on 100 runs with same input
- [ ] Zero test failures in determinism test suite

**Signal Quality:**
- [ ] 30% reduction in low-confidence signals (score < 60)
- [ ] 20% increase in high-confidence signals (score >= 75)
- [ ] Win rate improvement: +5% on backtested signals

**Performance:**
- [ ] Scanner runtime < 30 seconds for 128 stocks (daily scan)
- [ ] MTF data fetch overhead < 3 seconds per stock
- [ ] Database query latency < 100ms for recommendations page

### 12.2 User Experience Metrics

**Clarity:**
- [ ] 100% of signals have complete rationale (no "Unknown reason")
- [ ] 100% of suppressed signals logged with reason

**Actionability:**
- [ ] < 5% of signals flagged with major conflicts
- [ ] > 80% of high-confidence signals meet all pre-trade filters

### 12.3 Business Metrics

**Engagement:**
- [ ] 30% increase in user engagement with recommendations page
- [ ] 50% increase in paper trade executions (one-click trade)

**Retention:**
- [ ] 20% increase in weekly active users (WAU)
- [ ] 15% reduction in user churn

---

## 13. References & Further Reading

### 13.1 Technical Analysis Resources

**Encyclopedia of Chart Patterns (Thomas Bulkowski):**
- Pattern performance statistics by bull/bear market
- Failure rate analysis for each pattern
- Volume and price target methodologies

**Technical Analysis of Financial Markets (John Murphy):**
- Multi-timeframe analysis framework
- Support/resistance identification
- Trend following vs mean reversion strategies

**Way of the Turtle (Curtis Faith):**
- ATR-based position sizing
- Regime-based strategy switching
- Risk management frameworks

### 13.2 Quantitative Trading Resources

**Evidence-Based Technical Analysis (David Aronson):**
- Data snooping bias
- Walk-forward validation
- Statistical significance testing

**Algorithmic Trading (Ernie Chan):**
- Backtest overfitting detection
- Parameter optimization
- Mean reversion vs momentum strategies

---

## 14. Appendix: Code Examples

### A. Enhanced Signal Generation Function

```typescript
/**
 * REFERENCE IMPLEMENTATION: Full enhanced signal pipeline
 */
export async function generateEnhancedSignal(
  input: EnhancedSignalInput
): Promise<EnhancedTradeRecommendation | null> {
  const { symbol, candles, weeklyCandles, marketType } = input;

  // 1. Validate input data
  if (candles.length < 60) {
    console.warn(`Insufficient data for ${symbol}: ${candles.length} candles`);
    return null;
  }

  // 2. Detect channel, pattern, volume
  const channel = detectChannel(candles);
  const pattern = detectPatterns(candles);
  const volume = marketType === 'crypto'
    ? analyzeCryptoVolume(candles)
    : analyzeVolume(candles);
  const absorption = detectAbsorption(candles, volume);

  // 3. Detect market regime
  const regime = detectMarketRegime(candles);

  // 4. Generate base trade recommendation
  const baseTrade = generateTradeRecommendation({
    symbol,
    candles,
    channel,
    pattern,
    currentPrice: candles[candles.length - 1].close,
    volume,
    absorption,
  });

  if (!baseTrade) {
    return null; // No valid setup
  }

  // 5. Run pre-trade filters
  const filterInput: SignalInput = {
    symbol,
    candles,
    channel,
    pattern,
    currentPrice: baseTrade.currentPrice,
    entryPrice: baseTrade.entry,
    targetPrice: baseTrade.target,
    stopLoss: baseTrade.stopLoss,
    volume,
    marketType,
  };

  const filterResult = await runPreTradeFilters(filterInput);

  if (!filterResult.pass) {
    console.log(`Signal suppressed for ${symbol}:`, filterResult.failedFilters);
    return null;
  }

  // 6. Calculate base opportunity score
  const baseScore = calculateOpportunityScore({
    candles,
    channel,
    pattern,
    volume,
    entryPrice: baseTrade.entry,
    targetPrice: baseTrade.target,
    stopLoss: baseTrade.stopLoss,
  });

  // 7. Multi-timeframe analysis (if available)
  let mtf: MTFAnalysis | undefined;
  if (weeklyCandles && weeklyCandles.length >= 40) {
    mtf = calculateMTFConfluence(
      { type: baseTrade.setup.type, channel },
      weeklyCandles
    );
  }

  // 8. Detect conflicts
  const conflicts = detectSignalConflicts(
    baseTrade.setup,
    pattern,
    absorption,
    regime
  );

  // 9. Aggregate final score
  const finalScore = aggregateSignalScore(
    baseScore,
    regime,
    mtf,
    conflicts
  );

  // 10. Apply regime-based exit adjustments
  const adjustedTrade = applyRegimeBasedExits(baseTrade, regime);

  // 11. Create enhanced recommendation
  return {
    ...adjustedTrade,
    opportunityScore: finalScore,
    confidenceLevel: calculateConfidenceLevel(finalScore),
    regime,
    mtf,
    conflicts,
    filters: filterResult,
    warnings: filterResult.warnings,
  };
}
```

---

## Conclusion

This specification provides a comprehensive roadmap for enhancing the Personal Trading Cockpit's signal generation pipeline. By implementing these recommendations in phases, the system will evolve from a single-timeframe pattern recognizer to a sophisticated, multi-factor signal engine with:

1. **Deterministic, reproducible signals** - Critical for debugging and validation
2. **Pre-trade quality filters** - Suppress low-quality setups before they reach users
3. **Regime-adaptive logic** - Strategies that adapt to market conditions
4. **Multi-timeframe confirmation** - Higher conviction through timeframe confluence
5. **Conflict detection** - Warn when indicators disagree
6. **Backtesting integration** - Learn from historical performance
7. **Crypto-specific adaptations** - Handle 24/7 markets and higher volatility

**Next Steps:**
1. Review this specification with the team
2. Prioritize phases based on business impact
3. Assign owners to each phase
4. Set milestone dates for Phases 1-3 (foundation work)
5. Begin implementation with Phase 1 (determinism enhancements)

**Contact:** Strategy & Signal Engineering Specialist
**Document Version:** 1.0 (DRAFT)
**Last Updated:** 2025-11-30
