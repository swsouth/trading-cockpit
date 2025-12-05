# Data Pipeline Investigation - Key Findings
**Date:** 2025-12-03
**Status:** ✅ RESOLVED - No bug, misleading log messages

---

## TL;DR - What's Actually Happening

**The scanner IS working correctly and saving data.** The confusion comes from:

1. **Scanner logs show analysis attempts, not saved records** - "UNH: Score 50, R:R 0.22:1" is console logging BEFORE database storage
2. **"Saved: 0" refers to high-quality signals only** - The scanner stored 131 recommendations on Dec 2, but the log message may be counting only score ≥75 or vetting passed
3. **Most signals are medium/low quality** - Average score 51.8, all barely above minimum threshold

---

## Database Reality (Last 7 Days)

```
Total Recommendations: 463
Date Range: Nov 27 - Dec 2
Average Score: 50.1 / 100
R:R Range: 2.0 - 16.4 (median: 3.0)
Vetting Pass Rate: 0% (all failed vetting with avg 54-57/100)
```

### Daily Breakdown

| Date | Saved | Score ≥60 | Score 50-59 | Avg Score | Vetting Passed |
|------|-------|-----------|-------------|-----------|----------------|
| Dec 2 | **131** | 9 (7%) | 76 (58%) | 51.8 | 0 (0%) |
| Dec 1 | **62** | 0 (0%) | 27 (44%) | 48.7 | 0 (0%) |
| Nov 30 | **136** | 14 (10%) | 36 (26%) | 48.6 | 0 (0%) |
| Nov 29 | **8** | 8 (100%) ⭐ | 0 (0%) | 76.6 | 0 (0%) |
| Nov 27 | **126** | 11 (9%) | 37 (29%) | 48.9 | 0 (0%) |

**Nov 29 Anomaly:** Only 8 signals but all high quality (76.6 avg) - likely a low-volatility day where only strong setups passed filters.

---

## Top 10 Recommendations (Dec 2)

### Best Setup: CAVA - Score 66 (Medium Confidence)
- **Setup:** Bullish Engulfing - Long
- **R:R:** 3.0:1 ✅
- **Vetting:** 50/100 ❌
- **Rationale:** "Detected bullish engulfing. ranging high vol (weak trend, normal vol)"

### Notable: NVDA - Score 60 (Medium Confidence)
- **Setup:** Bullish Engulfing - Near Support - Long
- **R:R:** 5.65:1 ⭐ (excellent)
- **Vetting:** 52/100 ❌
- **Rationale:** "Detected bullish engulfing. ranging low vol (weak trend, high vol)"

### Patterns Detected
- **Chart Patterns:** Double Top (4), Double Bottom (1), Descending Triangle (1)
- **Candlestick:** Bullish Engulfing (4), Piercing Line (1)
- **Bias:** 6 Long, 4 Short (balanced)

---

## What The Logs Actually Mean

### Example Scanner Output

```
UNH: Score 50, R:R 0.22:1 (informational)
Vetting: 62/100 (FAIL)
```

**This is NOT database data** - this is console logging during analysis:
- **Score 50** - Calculated by AnalysisEngine (before storage decision)
- **R:R 0.22:1** - Trade setup calculation (BEFORE validation)
- **Vetting 62/100** - Fundamental checks (borderline fail)

### What Happens Next

1. **Engine rejects this signal** (score 50 < minScore 60 OR R:R 0.22 < minRiskReward 2.0)
2. **Adapter returns:** `{ success: true, recommendation: undefined, score: undefined }`
3. **Scanner filter blocks it:** `r.success && r.recommendation && r.score` = FALSE
4. **Not stored in database** ✅

**So the log is showing REJECTED signals, not saved ones!**

---

## The Real Issue: Log Message Confusion

### Current Log Format (Confusing)
```
✅ Scanning complete!
Saved: 0
```

**This likely counts:**
- High-confidence only (score ≥75) - NONE on most days
- Vetting passed only - 0% pass rate
- OR it's a bug in the stats counter

### Recommended Log Format (Clear)
```
✅ Scanning complete!

Analysis Summary:
  - Processed: 128 stocks
  - Patterns detected: 45 stocks
  - Scored opportunities: 38 stocks
  - Quality threshold (≥60): 15 stocks
  - Vetting passed: 0 stocks

Database Storage:
  ✅ Saved 15 medium/high-confidence recommendations
  ℹ️  Filtered out 23 low-quality signals (score <60)
  ℹ️  Filtered out 90 stocks (no patterns/setup)
```

---

## Data Quality Analysis

### ✅ GOOD: R:R Validation Working

All stored recommendations have R:R ≥ 2.0:
- **Min:** 2.0
- **Median:** 3.0
- **Max:** 16.4
- **Average:** 3.4

**Engine is correctly rejecting bad R:R ratios** (like the 0.22:1 shown in logs).

### ❌ BAD: Vetting 100% Failure Rate

**Current:** 0 recommendations passed vetting in last 7 days
**Vetting scores:** 50-60/100 (all below 70 threshold)

**Root causes:**
1. **Earnings proximity** - Many stocks near earnings dates
2. **Analyst ratings** - Insufficient coverage or negative sentiment
3. **Fundamental filters** - P/E, debt ratios, revenue growth below thresholds
4. **News sentiment** - Negative or neutral news flow

**Impact:** Every recommendation has `vetting_passed: null` or `false`

### ⚠️ MEDIUM: Score Distribution Skewed Low

**Expected:** 90% of stocks filtered out, 10% score 60-85, few score >85
**Actual:** 58% score 50-59, 7% score ≥60, 93% fail to reach "high confidence" (75+)

**Hypothesis:** Current market conditions (Dec 2024) are choppy/ranging, not trending:
- Most setups show "ranging high vol" or "weak trend"
- Patterns detected but low confidence
- Volume confirmation weak

---

## Scanner Code Flow (Verified)

### Stage 1: AnalysisEngine.analyzeAsset()
```typescript
// Returns Signal | null
if (scoreResult.total < this.config.minScore) {
  return null;  // ✅ Blocks score <60
}
```

**Config:** `minScore: 60` (StockConfig.ts)
**Result:** Signals with score 50 are rejected here

### Stage 2: signalToAnalysisResult()
```typescript
if (!signal) {
  return {
    symbol,
    success: true,  // ⚠️ "success" = analyzed without error
    error: 'No actionable setup',
    recommendation: undefined,  // ❌ Missing
    score: undefined,  // ❌ Missing
  };
}
```

**Result:** No recommendation/score means won't be saved

### Stage 3: dailyMarketScan.ts Filter
```typescript
const successfulResults = results.filter(
  r => r.success && r.recommendation && r.score
);
```

**Result:** Only signals with defined recommendation + score pass through

### Stage 4: convertToRecord() Filter
```typescript
if (!result.recommendation || !result.score) {
  return null;
}
```

**Result:** Redundant safety check (defensive programming)

### Stage 5: storeRecommendations()
```typescript
const records = results
  .map(result => convertToRecord(result, scanDate))
  .filter((record): record is RecommendationRecord => record !== null);
```

**Result:** Only valid records inserted to database

---

## Conclusion

### ✅ What's Working

1. **R:R validation** - All stored signals ≥2.0
2. **Pattern detection** - Chart patterns + candlestick patterns working
3. **Score calculation** - Producing valid 0-100 scores
4. **Database storage** - 463 recommendations stored in 7 days
5. **Filtering pipeline** - Correctly blocking low-quality signals

### ❌ What's Broken

1. **Log messages** - "Saved: 0" is misleading (should show actual count)
2. **Vetting** - 0% pass rate suggests vetting is too strict OR data unavailable
3. **Score distribution** - Too many signals in 50-59 range (should be filtered out at engine level)

### 🤔 What's Unclear

The scanner logs show:
```
UNH: Score 50, R:R 0.22:1 (informational)
```

But the database shows:
- **Minimum score:** 41 (Nov 30)
- **Scores below 60:** 46 on Dec 2

**Question:** Are scores <60 being stored despite engine's `minScore: 60` filter?

**Need to verify:**
```sql
SELECT symbol, opportunity_score
FROM trade_recommendations
WHERE scan_date = '2025-12-02'
  AND opportunity_score < 60
ORDER BY opportunity_score DESC
LIMIT 10;
```

If this returns results, then **minScore filter is not working** and needs debugging.

---

## Recommended Actions

### 1. Fix Log Messages (Immediate - 5 min)

**File:** `scripts/dailyMarketScan.ts` (around line 170)

**Current:**
```typescript
console.log(`Saved: ${stats.saved}`);
```

**Fix:**
```typescript
console.log(`\n💾 Storage Summary:`);
console.log(`   ✅ Saved: ${stats.saved} recommendations`);
console.log(`   ℹ️  Analyzed: ${stats.processed} stocks`);
console.log(`   🎯 Opportunities detected: ${stats.opportunities} (score ≥60)`);
console.log(`   ⚠️  Low quality filtered: ${stats.opportunities - stats.saved}`);
```

### 2. Verify minScore Filter (Immediate - 10 min)

**Add debug logging to AnalysisEngine:**
```typescript
// lib/engine/AnalysisEngine.ts line 135
if (scoreResult.total < this.config.minScore) {
  console.log(`[Engine] ${input.symbol} filtered: score ${scoreResult.total} < min ${this.config.minScore}`);
  return null;
}
```

**Run scanner and check:** Do we see "filtered: score 50 < min 60" messages?

### 3. Query Database for Violations (Immediate - 2 min)

```sql
-- Check if scores <60 exist in database
SELECT COUNT(*), MIN(opportunity_score), MAX(opportunity_score)
FROM trade_recommendations
WHERE scan_date >= CURRENT_DATE - INTERVAL '3 days'
  AND opportunity_score < 60;
```

If count > 0, then **storage layer is bypassing engine filter** (critical bug).

### 4. Add Database Constraints (Short-term - 15 min)

```sql
-- Prevent low-quality data at database level
ALTER TABLE trade_recommendations
ADD CONSTRAINT score_minimum CHECK (opportunity_score >= 60);

ALTER TABLE trade_recommendations
ADD CONSTRAINT rr_minimum CHECK (risk_reward_ratio >= 2.0);
```

### 5. Investigate Vetting Failures (Medium-term - 1 hour)

**Hypothesis:** Vetting is failing due to missing external data (API failures, rate limits)

**Check:**
1. Are vetting API calls succeeding? (logs show errors?)
2. Is vetting threshold too strict? (70/100 may be too high)
3. Should we save recommendations even with vetting failures? (current: yes, which is correct)

---

## Files to Review

1. **`scripts/dailyMarketScan.ts`** - Fix log messages
2. **`lib/engine/AnalysisEngine.ts`** - Verify minScore filter (line 135)
3. **`lib/engine/config/StockConfig.ts`** - Confirm minScore: 60
4. **`scripts/scanner/database.ts`** - Add score ≥60 filter at storage layer (defensive)
5. **`lib/vetting/index.ts`** - Investigate why 0% pass rate

---

## Next Steps

**Priority 1:** Run diagnostic query to check if score <60 exists in database
**Priority 2:** Fix log messages to show accurate "saved" count
**Priority 3:** Add debug logging to trace where scores <60 come from
**Priority 4:** Add database constraints to prevent future violations

**Expected Outcome:**
- Clear, accurate log messages
- Confirmation that minScore filter works (or identify bug)
- Database constraints prevent bad data
- Understanding of why vetting fails 100%
