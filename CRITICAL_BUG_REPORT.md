# 🚨 CRITICAL BUG: minScore Filter Not Enforced

**Date:** 2025-12-03
**Severity:** HIGH
**Impact:** Database pollution with low-quality recommendations

---

## The Bug

**Expected:** AnalysisEngine filters out signals with score <60
**Actual:** 184 recommendations with score <60 stored in last 3 days (39-59 range)

### Database Evidence

```
Last 3 Days (Dec 2, Dec 1, Nov 30):
  - Total recommendations: 329
  - Score <60: 184 (56% ❌)
  - Score ≥60: 145 (44% ✅)
  - Lowest score: 39
  - Highest violation: 59
```

**Examples of violations:**
- UHS, TDG, RBLX, IR, JNJ, FDX, HLT, STT, HCA, RSG, AAPL, NVDA...
- Total: 184 symbols

---

## Root Cause Analysis

### Code Location: `lib/engine/AnalysisEngine.ts` (line 135)

```typescript
// Filter out low confidence signals using config threshold
if (scoreResult.total < this.config.minScore) {
  return null;
}
```

### Config: `lib/engine/config/StockConfig.ts`

```typescript
export const StockConfig: AnalysisConfig = {
  assetType: 'stock',
  timeframe: 'daily',
  minScore: 60,  // ⚠️ This should filter out scores <60
  // ...
};
```

### Hypothesis: Config Not Loaded

**Suspect:** `AnalysisEngine` constructor not loading config correctly

**File:** `lib/engine/AnalysisEngine.ts` (lines 30-50)

**Possible issues:**
1. `loadConfig()` returns wrong config (default instead of StockConfig)
2. `this.config` not initialized before `analyzeAsset()` called
3. `minScore` property missing or overwritten

---

## Impact Assessment

### Data Quality Degradation

**Current database state:**
- 56% of recommendations are LOW QUALITY (score <60)
- Users seeing 184 setups that should have been filtered
- "Medium confidence" label misleading (score 50-59 is actually LOW)

### User Experience Impact

**Problem:** Users trust recommendations with score 50-59 thinking they're "medium confidence"
**Reality:** These are BELOW threshold and should never be shown

**Example:** NVDA score 60 vs. UHS score 39 - both shown to users, but UHS is 35% below minimum!

### Trading Risk

**If users trade these signals:**
- Win rate likely <45% (below breakeven with commissions)
- R:R ratios may be valid (≥2.0) but pattern reliability is too low
- Increased likelihood of stop-outs and losses

---

## Diagnostic Steps

### 1. Verify Config Loading

**Add logging to AnalysisEngine constructor:**

```typescript
constructor(options?: Partial<EngineOptions>) {
  // ... existing code ...

  console.log('[AnalysisEngine] Loaded config:', {
    assetType: this.config.assetType,
    timeframe: this.config.timeframe,
    minScore: this.config.minScore,  // ⚠️ CHECK THIS
  });
}
```

**Expected output:**
```
[AnalysisEngine] Loaded config: { assetType: 'stock', timeframe: 'daily', minScore: 60 }
```

**If minScore is NOT 60, config loading is broken.**

---

### 2. Verify Filter Logic

**Add logging at filter point:**

```typescript
// lib/engine/AnalysisEngine.ts line 135
if (scoreResult.total < this.config.minScore) {
  console.log(`[AnalysisEngine] ${input.symbol} FILTERED: score ${scoreResult.total} < minScore ${this.config.minScore}`);
  return null;
}

console.log(`[AnalysisEngine] ${input.symbol} PASSED: score ${scoreResult.total} >= minScore ${this.config.minScore}`);
```

**Run scanner on known violations:**
```bash
npm run test-scanner  # Should show NVDA (score 60 = PASS), UHS (score <60 = FILTERED)
```

**If UHS shows "PASSED", the filter is broken.**

---

### 3. Check Config File Import

**File:** `scripts/scanner/stockAnalyzer.ts` (line 38)

```typescript
const engine = new AnalysisEngine({
  assetType: 'stock',
  timeframe: 'daily',
});
```

**Potential issue:** Passing partial options might override config defaults

**Check:** Does `AnalysisEngine` constructor merge options correctly?

```typescript
// lib/engine/AnalysisEngine.ts
constructor(options?: Partial<EngineOptions>) {
  this.version = '2.0.0';
  this.config = loadConfig(options);  // ⚠️ Does this respect minScore?
}
```

---

### 4. Inspect loadConfig Function

**File:** `lib/engine/config/index.ts`

```typescript
export function loadConfig(options?: Partial<EngineOptions>): AnalysisConfig {
  // ... implementation ...
}
```

**Verify:**
1. Does it load `StockConfig` when `assetType: 'stock'`?
2. Does it merge partial options without overwriting `minScore`?
3. Does it return a complete config with all required fields?

**Add assertion:**
```typescript
const config = loadConfig(options);
console.assert(config.minScore > 0, 'minScore must be set!');
return config;
```

---

## Immediate Fix (Defensive Layer)

### Add Storage-Level Filter

**File:** `scripts/scanner/database.ts` (line 115)

**Current:**
```typescript
const records = results
  .map(result => convertToRecord(result, scanDate))
  .filter((record): record is RecommendationRecord => record !== null);
```

**Fix:**
```typescript
const records = results
  .map(result => convertToRecord(result, scanDate))
  .filter((record): record is RecommendationRecord =>
    record !== null && record.opportunity_score >= 60  // ⚠️ DEFENSIVE FILTER
  );

// Log filtered count
const filteredLowQuality = results.length - records.length;
if (filteredLowQuality > 0) {
  console.warn(`⚠️  Filtered ${filteredLowQuality} low-quality signals at storage layer (score <60)`);
}
```

**Rationale:** Defense-in-depth - even if engine filter fails, storage layer blocks bad data

---

## Database Cleanup

### Option 1: Delete Violations (Aggressive)

```sql
-- CAUTION: This permanently deletes data
DELETE FROM trade_recommendations
WHERE opportunity_score < 60;

-- Check count before running
SELECT COUNT(*) FROM trade_recommendations WHERE opportunity_score < 60;
-- Expected: ~184+ records
```

**Pros:** Clean slate, only quality data remains
**Cons:** Lose historical data (can't analyze what went wrong)

---

### Option 2: Soft Delete (Recommended)

```sql
-- Add a quality flag column
ALTER TABLE trade_recommendations
ADD COLUMN IF NOT EXISTS quality_flagged BOOLEAN DEFAULT false;

-- Flag violations
UPDATE trade_recommendations
SET quality_flagged = true
WHERE opportunity_score < 60;

-- Modify application queries to exclude flagged
-- WHERE quality_flagged = false OR quality_flagged IS NULL
```

**Pros:** Preserve data for debugging, gradually phase out
**Cons:** Need to update all queries

---

### Option 3: Add Database Constraint (Preventive)

```sql
-- Prevent future violations at database level
ALTER TABLE trade_recommendations
ADD CONSTRAINT score_minimum
CHECK (opportunity_score >= 60);

-- Test constraint (should fail)
INSERT INTO trade_recommendations (symbol, scan_date, opportunity_score, ...)
VALUES ('TEST', CURRENT_DATE, 50, ...);
-- Expected: ERROR: new row violates check constraint "score_minimum"
```

**Pros:** Future-proof, prevents bad data at database level
**Cons:** Need to clean existing violations first (or drop constraint on them)

---

## Recommended Action Plan

### Phase 1: Immediate (Today - 30 minutes)

1. ✅ **Run diagnostic query** (DONE - found 184 violations)
2. 🔧 **Add storage-level filter** (database.ts) - Blocks new violations
3. 📝 **Add debug logging** (AnalysisEngine.ts) - Identify why filter fails
4. 🧪 **Test with known symbols:** Run scanner on NVDA (pass) and UHS (should fail)

### Phase 2: Root Cause Fix (Today - 1 hour)

5. 🔍 **Trace config loading** - Add logging to verify minScore = 60
6. 🐛 **Fix engine filter** - Ensure `scoreResult.total < this.config.minScore` works
7. ✅ **Validate fix** - Re-run scanner, confirm 0 violations in new scans

### Phase 3: Database Cleanup (Tomorrow - 30 minutes)

8. 🗑️ **Soft delete violations** - Flag low-quality records
9. 🔒 **Add constraint** - Prevent future violations at DB level
10. 📊 **Update UI queries** - Exclude quality_flagged = true records

### Phase 4: Monitoring (Ongoing)

11. 📈 **Add quality dashboard** - Track score distribution daily
12. 🚨 **Alert on violations** - Notify if score <60 appears in database
13. 📝 **Document learnings** - Update architecture docs with this incident

---

## Test Plan

### Test 1: Config Loading

**Command:**
```bash
npm run test-scanner
```

**Check logs for:**
```
[AnalysisEngine] Loaded config: { assetType: 'stock', timeframe: 'daily', minScore: 60 }
```

**If minScore ≠ 60:** Config loading is broken

---

### Test 2: Filter Logic

**Expected logs:**
```
[AnalysisEngine] AAPL PASSED: score 65 >= minScore 60
[AnalysisEngine] UHS FILTERED: score 39 < minScore 60
```

**If UHS shows "PASSED":** Filter logic is broken

---

### Test 3: Storage Layer Defense

**After adding storage filter, run:**
```bash
npm run scan-market
```

**Check logs for:**
```
⚠️  Filtered 23 low-quality signals at storage layer (score <60)
```

**Query database:**
```sql
SELECT COUNT(*) FROM trade_recommendations
WHERE scan_date = CURRENT_DATE AND opportunity_score < 60;
-- Expected: 0
```

---

## Success Criteria

**After fix is deployed:**
1. ✅ No recommendations with score <60 in database (query returns 0)
2. ✅ Scanner logs show "FILTERED" messages for low scores
3. ✅ Config loading shows `minScore: 60` in logs
4. ✅ Storage layer filter reports 0 violations (nothing to filter)
5. ✅ Users only see medium+ confidence recommendations (score ≥60)

**Quality metrics target:**
- Score distribution: 70% in 60-74, 30% in 75+
- Average score: 65-70 (up from 50.1)
- Recommendations per day: 10-30 (down from 130)

---

## Communication Plan

### Internal (Development Team)

**Subject:** Critical Bug Fix - Score Filter Not Enforced

**Message:**
"We discovered that the AnalysisEngine's minScore filter (60 threshold) is not working, allowing 184 low-quality recommendations (score 39-59) to be stored in the last 3 days. This represents 56% of all recommendations and significantly degrades data quality.

**Immediate actions:**
- Storage-level filter added as defense
- Debug logging added to trace root cause
- Database cleanup planned for tomorrow

**Impact:** Users may have seen/traded on low-quality setups. We'll soft-delete violations and add DB constraints to prevent recurrence."

### External (Users) - IF NEEDED

**Only if users report issues or losses:**

"We identified and resolved a data quality issue affecting stock recommendations from Nov 30 - Dec 2. Some recommendations scored below our published minimum threshold (60/100) due to a configuration bug in the analysis engine.

**What we did:**
- Fixed the filtering logic
- Added database-level validation
- Flagged affected recommendations for review

**What you should do:**
- Review any trades placed from recommendations in this date range
- Focus on recommendations with score ≥65 for higher reliability

We apologize for the inconvenience and have implemented additional safeguards to prevent similar issues."

---

## Files to Modify

1. **`lib/engine/AnalysisEngine.ts`** - Add debug logging (lines 40, 135)
2. **`lib/engine/config/index.ts`** - Verify loadConfig() implementation
3. **`scripts/scanner/database.ts`** - Add storage filter (line 115-120)
4. **`supabase/migrations/YYYYMMDD_add_quality_constraints.sql`** - DB constraints

---

## Next Steps

**RIGHT NOW:**
1. Add storage-level filter (5 min)
2. Add debug logging (5 min)
3. Run test scanner (2 min)
4. Review logs and identify root cause (10 min)

**Want me to create the code fixes?**
