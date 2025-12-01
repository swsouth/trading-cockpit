# Signal Engineering - Executive Summary

**Date:** 2025-11-30
**Document:** Technical recommendations for enhanced signal quality

---

## Quick Overview

This document summarizes the key technical recommendations from the full [Signal Engineering Specification](./SIGNAL_ENGINEERING_SPECIFICATION.md) for improving signal generation accuracy and confidence.

---

## Current State Assessment

### Strengths ✅
- **Modular architecture** - Clean separation (analysis → scoring → trade calc)
- **ATR-normalized thresholds** - Volatility-aware channel detection
- **Multi-component scoring** - 5-factor model (30+25+20+15+10 points)
- **Absorption detection** - Order flow edge (Jay Ortani methodology)
- **Intraday support** - Time-of-day normalized volume

### Gaps ⚠️
- No multi-timeframe confirmation
- Limited regime detection (no ADX/volatility classification)
- No pattern validation (missing volume/range checks)
- No pre-trade filters (earnings, spread, liquidity)
- No pattern performance tracking
- Fixed confidence thresholds don't adapt to market conditions

---

## Top 5 Priority Recommendations

### 1. Signal Determinism (Weeks 1-2)

**Problem:** Non-deterministic behavior makes debugging impossible.

**Solution:**
```typescript
// Enforce strict reproducibility
- Normalize timestamps to UTC
- Use epsilon tolerance for price comparisons (0.01%)
- Return null during indicator warmup (no default values)
- Explicit edge case handling (zero volume, gaps, extreme moves)

// Test: 100 runs with same input → 100 identical outputs
```

**Impact:** Foundation for all other improvements.

---

### 2. Pre-Trade Filters (Weeks 3-4)

**Problem:** Signals generate regardless of quality/context.

**Solution:** Add 5 filters before signal reaches users:

```typescript
✅ Liquidity: ADV >= 500K shares, Dollar Volume >= $5M
✅ Risk/Reward: Minimum 1.5:1 ratio
✅ Max Risk: Cap at 15% (stocks) / 20% (crypto)
✅ Volatility: Suppress if ATR > 95th percentile (extreme)
✅ Earnings: Suppress within 48h of earnings (optional - needs API)
```

**Impact:** 30% reduction in low-quality signals.

---

### 3. Regime Detection (Weeks 5-6)

**Problem:** Breakout patterns fail in ranging markets (and vice versa).

**Solution:** Detect market regime using ADX + ATR:

```typescript
Regimes:
- trending_bullish (ADX > 25, slope > 1%)     → Favor trend-following
- trending_bearish (ADX > 25, slope < -1%)    → Favor trend-following
- ranging_high_vol (ADX < 20, ATR > 60th pct) → Favor mean-reversion
- ranging_low_vol (ADX < 20, ATR < 40th pct)  → Avoid (low opportunity)
- transitional (ADX 20-25)                    → Wait for clarity

// Adjust score: +10% for regime-aligned, -20% for regime-conflicting
```

**Impact:** +5% win rate improvement on backtests.

---

### 4. Multi-Timeframe Confirmation (Weeks 7-8)

**Problem:** Daily hammer at support looks bullish, but weekly is bearish.

**Solution:** Add optional weekly timeframe analysis:

```typescript
MTF Bonus Points (0-15):
- Higher TF trend aligned: +10 points
- Higher TF pattern aligned: +5 points

Example:
  Daily: Bullish hammer at support (score: 72)
  Weekly: Uptrend confirmed
  Final Score: 72 + 10 = 82 (high confidence)
```

**Impact:** 20% increase in high-confidence signals (>75 score).

---

### 5. Signal Conflict Detection (Week 9)

**Problem:** Bullish pattern + selling absorption = conflicting signals.

**Solution:** Detect and penalize conflicts:

```typescript
Conflicts:
- Pattern vs Absorption (bullish pattern + selling absorption)
- Setup vs Regime (long breakout in ranging market)
- Pattern vs Higher TF (daily bullish, weekly bearish)

Penalty: -10% to -30% score reduction
Warning: Display conflict to user (they can still trade but informed)
```

**Impact:** Fewer false signals, better user trust.

---

## Crypto-Specific Adjustments

```typescript
Parameter Adjustments for Crypto:

Channel Detection:
  - Min width: 3% (vs 2% stocks) - wider due to volatility
  - Max width: 40% (vs 25% stocks)
  - Touch tolerance: 0.5x ATR (vs 0.3x ATR)

Risk Management:
  - Max risk: 20% (vs 15% stocks)
  - Min R:R: 2:1 (vs 1.5:1 stocks)

Volume:
  - High volume threshold: 2x avg (vs 1.5x stocks)
  - Lookback: 20 days (vs 30 days stocks)

Patterns:
  - Min body size: 0.5% (vs 0.2% stocks)
  - Min range: 1% (vs 0.5% stocks)
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Determinism enhancements
- Edge case handling
- Unit tests

### Phase 2: Pre-Trade Filters (Weeks 3-4)
- Filter pipeline
- 5 core filters
- UI integration

### Phase 3: Regime Detection (Weeks 5-6)
- ADX calculation
- Regime classification
- Adaptive scoring

### Phase 4: Multi-Timeframe (Weeks 7-8)
- Weekly data pipeline
- MTF confluence scoring
- UI visualization

### Phase 5: Conflicts (Week 9)
- Conflict detection
- Penalty application
- Warning system

### Phase 6: Crypto (Week 10)
- Crypto-specific config
- Volume/pattern adjustments
- Testing

### Phase 7: Backtesting (Weeks 11-14)
- Performance tracking
- Walk-forward validation
- Adaptive pattern scoring

### Phase 8: Deployment (Weeks 15-16)
- Load testing
- Documentation
- Production release

---

## Expected Outcomes

### Technical Metrics
- **Determinism:** 100% reproducible signals
- **Signal Quality:** 30% fewer low-confidence, 20% more high-confidence
- **Win Rate:** +5% improvement on backtested signals
- **Performance:** < 30s scan time for 128 stocks

### User Experience
- **Clarity:** 100% signals with complete rationale
- **Conflicts:** < 5% signals with major conflicts
- **Actionability:** > 80% high-confidence signals pass all filters

### Business Impact
- **Engagement:** +30% on recommendations page
- **Paper Trades:** +50% executions
- **Retention:** +20% WAU, -15% churn

---

## Quick Start: What to Implement First

**If you have 1 week:**
1. Implement determinism (timestamp normalization, epsilon comparisons)
2. Add liquidity + R:R filters only
3. Test with 100x identical output test

**If you have 1 month:**
1. Complete Phase 1 (Determinism)
2. Complete Phase 2 (Pre-Trade Filters)
3. Complete Phase 3 (Regime Detection)

**If you have 3 months:**
- Complete all 8 phases
- Full multi-timeframe + backtesting integration
- Production deployment

---

## Key Formulas

### Final Score Aggregation
```
Final Score = Base Score × Regime Multiplier × Conflict Penalty + MTF Bonus

Where:
  Base Score         = 0-100 (current 5-factor model)
  Regime Multiplier  = 0.85-1.1 (based on regime alignment)
  Conflict Penalty   = 0.7-1.0 (major conflict = 0.7, minor = 0.9, none = 1.0)
  MTF Bonus          = 0-15 points (higher timeframe confirmation)

Example:
  Base: 72
  Regime: trending_bullish (×1.1) = 79.2
  Conflict: none (×1.0) = 79.2
  MTF: weekly uptrend aligned (+10) = 89.2
  Final: 89 (high confidence)
```

### Regime Classification
```
IF ADX > 25 AND slope > 1%:
  → trending_bullish (favor pullbacks, avoid shorts)

ELSE IF ADX > 25 AND slope < -1%:
  → trending_bearish (favor bounces to short, avoid longs)

ELSE IF ADX < 20 AND ATR_percentile > 60:
  → ranging_high_vol (favor S/R bounces, widen stops)

ELSE IF ADX < 20 AND ATR_percentile < 40:
  → ranging_low_vol (low opportunity, consider sitting out)

ELSE:
  → transitional (wait for clarity, reduce position sizes)
```

---

## Code Snippets: Most Critical Additions

### 1. Determinism Test (must pass before any deployment)
```typescript
describe('Signal Determinism', () => {
  it('produces identical output for identical input', () => {
    const candles = loadTestData('AAPL_60d');
    const results = [];

    for (let i = 0; i < 100; i++) {
      const score = calculateOpportunityScore({...});
      results.push(JSON.stringify(score));
    }

    const unique = new Set(results);
    expect(unique.size).toBe(1); // ALL 100 must be identical
  });
});
```

### 2. Pre-Trade Filter Pipeline
```typescript
export async function runPreTradeFilters(input: SignalInput) {
  const results = {};
  const failed = [];

  for (const filter of [liquidityFilter, rrFilter, maxRiskFilter, volFilter]) {
    const result = await filter.check(input);
    results[filter.name] = result;

    if (!result.pass && result.severity === 'error') {
      failed.push(filter.name);
    }
  }

  return {
    pass: failed.length === 0,
    failedFilters: failed,
    allResults: results,
  };
}
```

### 3. Regime Detection
```typescript
export function detectMarketRegime(candles: Candle[]): RegimeAnalysis {
  const adx = calculateADX(candles, 14);
  const channel = detectChannel(candles);
  const slope = calculateChannelSlope(candles, channel.support, channel.resistance);

  if (adx > 25 && slope > 0.01) return { regime: 'trending_bullish', ... };
  if (adx > 25 && slope < -0.01) return { regime: 'trending_bearish', ... };
  if (adx < 20) return { regime: 'ranging_...', ... };
  return { regime: 'transitional', ... };
}
```

---

## Next Steps

1. **Review** this summary with your team
2. **Prioritize** which phases to tackle first (recommend 1→2→3)
3. **Assign** owners for each phase
4. **Set** milestone dates
5. **Begin** implementation with Phase 1 (determinism)

---

## Full Documentation

For complete technical details, formulas, code examples, and unit test specs, see:
- **[Full Specification](./SIGNAL_ENGINEERING_SPECIFICATION.md)** (62 pages)
- **Current Code:** `lib/analysis.ts`, `lib/scoring/`, `lib/tradeCalculator/`

---

**Questions or clarifications?** Contact the Strategy & Signal Engineering Specialist.
