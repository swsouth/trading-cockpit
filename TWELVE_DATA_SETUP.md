# Twelve Data API Setup and Migration Plan

## Critical Discovery: The Root Cause of Price Discrepancies

**Problem**: Database prices are 2-2.5x lower than actual market prices (ACN: $99.24 vs $247.38, AMGN: $167.02 vs $340.14)

**Root Cause**: The `adjust` parameter in Twelve Data's `/time_series` endpoint **defaults to `splits`**, which returns split-adjusted historical prices. This makes historical prices appear lower to normalize for stock splits.

**Solution**: Use `adjust=none` to get actual, unadjusted prices.

---

## Twelve Data API Endpoints - Complete Reference

### 1. Historical OHLC Data (Primary Scanning Use Case)

**Endpoint**: `GET https://api.twelvedata.com/time_series`

**Purpose**: Fetch daily candles for technical analysis, channel detection, and pattern recognition

**Required Parameters**:
- `symbol`: Stock ticker (e.g., "AAPL")
- `interval`: Time interval - use `1day` for daily candles
- `apikey`: Your Twelve Data API key
- **`adjust=none`**: **CRITICAL** - Get unadjusted prices to match real market levels

**Optional Parameters**:
- `outputsize`: Number of data points (1-5000, default 30)
  - Use `365` for 1 year of daily data (our current configuration)
- `start_date`: Start date in YYYY-MM-DD format (alternative to outputsize)
- `end_date`: End date in YYYY-MM-DD format

**Cost**: 1 API credit per symbol

**Current Implementation**: `lib/marketData.ts:125-179` (fetchTwelveDataCandles)

**Required Fix**:
```typescript
// BEFORE (WRONG - returns split-adjusted prices):
const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${days}&apikey=${apiKey}`;

// AFTER (CORRECT - returns actual prices):
const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${days}&adjust=none&apikey=${apiKey}`;
```

**Response Format**:
```json
{
  "meta": {
    "symbol": "AAPL",
    "interval": "1day",
    "currency": "USD",
    "exchange_timezone": "America/New_York",
    "exchange": "NASDAQ",
    "mic_code": "XNGS",
    "type": "Common Stock"
  },
  "values": [
    {
      "datetime": "2025-11-25",
      "open": "148.44",
      "high": "148.97",
      "low": "147.22",
      "close": "148.56",
      "volume": "56789123"
    }
    // ... more bars
  ],
  "status": "ok"
}
```

---

### 2. Real-time Quote Data (Current Price + Stats)

**Endpoint**: `GET https://api.twelvedata.com/quote`

**Purpose**: Get current price with full market stats (bid/ask, day range, change %, market cap, etc.)

**Required Parameters**:
- `symbol`: Stock ticker
- `apikey`: Your Twelve Data API key

**Cost**: 1 API credit per symbol

**Use Cases**:
- Display current price in recommendations (`RecommendationCard.tsx:163-167`)
- Real-time price updates for watchlist
- Market open/close status checking

**Response Format**:
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc",
  "exchange": "NASDAQ",
  "mic_code": "XNGS",
  "currency": "USD",
  "datetime": "2025-11-25",
  "timestamp": 1700942400,
  "open": "148.44",
  "high": "148.97",
  "low": "147.22",
  "close": "148.56",
  "volume": "56789123",
  "previous_close": "147.89",
  "change": "0.67",
  "percent_change": "0.45",
  "average_volume": "58123456",
  "is_market_open": false,
  "fifty_two_week": {
    "low": "125.34",
    "high": "175.89",
    "low_change": "23.22",
    "high_change": "-27.33",
    "low_change_percent": "18.52",
    "high_change_percent": "-15.54",
    "range": "125.340000 - 175.890000"
  }
}
```

---

### 3. Latest Price Only (Lightweight Alternative)

**Endpoint**: `GET https://api.twelvedata.com/price`

**Purpose**: Get only the current price (no other stats) - fastest/cheapest option

**Required Parameters**:
- `symbol`: Stock ticker
- `apikey`: Your Twelve Data API key

**Cost**: 1 API credit per symbol

**Use Cases**:
- Quick price checks
- Lightweight updates when you don't need full quote stats
- Batch price fetching with minimal data transfer

**Response Format**:
```json
{
  "price": "148.56"
}
```

---

## API Rate Limits & Credits

**Free Tier** (Current Plan):
- **800 API credits per day**
- **8 API calls per minute**
- 1 credit = 1 symbol for most endpoints

**Current Scanner Configuration** (`scripts/dailyMarketScan.ts:19-27`):
- Batch size: 8 stocks (matches 8 calls/minute limit)
- Batch delay: 65 seconds (safe buffer above 60s)
- Stock universe: 249 stocks (will use 249 credits per scan)
- Daily scans: 1 per day (Mon-Fri)
- **Total daily usage**: ~250 credits (well within 800 limit)

**Headroom**: 550 credits remaining for ad-hoc queries, watchlist updates, real-time quotes

---

## Migration Action Plan

### Phase 1: Fix Current Twelve Data Implementation (URGENT)

**File**: `lib/marketData.ts:125-179`

**Current Code** (line 141):
```typescript
const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${days}&apikey=${apiKey}`;
```

**Fixed Code**:
```typescript
const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${days}&adjust=none&apikey=${apiKey}`;
```

**Impact**: All future scans will store actual prices instead of split-adjusted prices

---

### Phase 2: Update Data Source Tracking

**File**: `scripts/scanner/priceStorage.ts:27`

**Current Code**:
```typescript
export async function storePriceData(
  symbol: string,
  candles: Candle[],
  dataSource: string = 'fmp'  // ⚠️ WRONG DEFAULT
): Promise<number>
```

**Fixed Code**:
```typescript
export async function storePriceData(
  symbol: string,
  candles: Candle[],
  dataSource: string = 'twelvedata'  // ✅ CORRECT DEFAULT
): Promise<number>
```

**Impact**: New data stored in database will be correctly marked as coming from Twelve Data

---

### Phase 3: Remove FMP Fallback Logic (OPTIONAL)

**Files with FMP References**:
1. `lib/marketData.ts` - Contains FMP fallback in getDailyOHLC()
2. `scripts/checkRecommendations.ts` - May have FMP references
3. `scripts/dailyMarketScan.ts` - Scanner configuration
4. `scripts/scanner/priceStorage.ts` - Storage logic
5. `lib/stockUniverse.ts` - Stock list definitions
6. `app/recommendations/page.tsx` - Display page
7. `package.json` - Dependencies

**Decision Point**: Keep FMP as fallback or remove entirely?

**Option A: Keep FMP Fallback (Recommended)**
- Provides redundancy if Twelve Data is down
- Existing fallback logic already works
- Just needs `adjust=none` fix for consistency
- Update FMP URL to use unadjusted prices: `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}&adjusted=false`

**Option B: Remove FMP Entirely**
- Simpler codebase
- Fewer API keys to manage
- Risk: No fallback if Twelve Data fails
- Would need to comment out lines 241-297 in `lib/marketData.ts`

---

### Phase 4: Re-scan Stock Universe with Correct Prices

**Problem**: Database has 15,195 price records with incorrect (split-adjusted) prices

**Options**:

**Option A: Delete Old Data and Re-scan** (Recommended)
```sql
-- Delete all old FMP data
DELETE FROM stock_prices WHERE data_source = 'fmp';

-- Delete all old recommendations (based on bad data)
DELETE FROM trade_recommendations;
```

Then run: `npm run scan-market` (will take ~15-20 minutes)

**Option B: Keep Old Data, Mark as Deprecated**
```sql
-- Add column to mark data quality
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS is_deprecated BOOLEAN DEFAULT false;

-- Mark old data as deprecated
UPDATE stock_prices SET is_deprecated = true WHERE data_source = 'fmp';

-- Update queries to exclude deprecated data
-- Add WHERE is_deprecated = false to all queries
```

**Recommendation**: Option A (delete and re-scan) is cleaner. Old data is unreliable anyway.

---

### Phase 5: Verify Data Quality

After re-scanning, verify prices match market reality:

```sql
-- Get sample of latest prices
SELECT
  symbol,
  date,
  close,
  data_source
FROM stock_prices
WHERE date = (SELECT MAX(date) FROM stock_prices)
  AND symbol IN ('ACN', 'AMGN', 'AMD', 'AAPL', 'MSFT')
ORDER BY symbol;
```

Compare against Yahoo Finance or Twelve Data `/quote` endpoint to confirm accuracy.

---

## Implementation Checklist

- [ ] **CRITICAL**: Add `adjust=none` to fetchTwelveDataCandles() URL (line 141)
- [ ] Update storePriceData() default parameter from 'fmp' to 'twelvedata' (line 27)
- [ ] Decide: Keep FMP fallback or remove?
- [ ] If keeping FMP: Add `adjusted=false` to FMP URL
- [ ] Delete old FMP data from database
- [ ] Delete old recommendations (based on bad data)
- [ ] Run full market scan: `npm run scan-market`
- [ ] Verify prices match reality (compare 5 stocks against Yahoo Finance)
- [ ] Update documentation to reflect Twelve Data as primary source
- [ ] Monitor API credit usage (should be ~250/day, well under 800 limit)

---

## Expected Results After Migration

**Before** (Current State):
- ACN database price: $99.24
- ACN actual price: $247.38
- Discrepancy: 149% (2.49x)

**After** (Post-Migration):
- ACN database price: $247.38 (or within $0.50)
- ACN actual price: $247.38
- Discrepancy: <0.5% (accurate)

**Impact on Recommendations**:
- Entry prices will match real market levels
- Stop loss levels will be at correct distances
- Target prices will reflect actual price movements
- Risk/reward ratios will be accurate
- All 242 current recommendations will be replaced with new, accurate ones

---

## API Key Configuration

**Environment Variables** (`.env.local`):
```bash
# Primary data source (800 credits/day, 8 calls/minute)
TWELVE_DATA_API_KEY=your_twelve_data_api_key_here

# Fallback data source (250 calls/day) - OPTIONAL
FMP_API_KEY=your_fmp_api_key_here

# Real-time quotes (60 calls/minute) - OPTIONAL
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key_here
```

**Key Management**:
- Twelve Data key is in `.env.local` as `TWELVE_DATA_API_KEY`
- Retrieved via `process.env.TWELVE_DATA_API_KEY` in code
- Never commit actual keys to git (use `.env.local.example` for templates)

---

## Monitoring & Troubleshooting

**Check API Credit Usage**:
```bash
# View Twelve Data dashboard
https://twelvedata.com/account/usage

# Shows:
# - Credits used today
# - Credits remaining
# - Rate limit status
# - Request history
```

**Common Issues**:

1. **"API key not configured"**: Check `.env.local` has `TWELVE_DATA_API_KEY`
2. **"Rate limit exceeded"**: Batch size too large or delay too short (current: 8/batch, 65s delay is correct)
3. **"Invalid symbol"**: Ticker not found on Twelve Data (use Yahoo Finance format)
4. **"No data returned"**: Check symbol format, date range, and market hours

**Debug Logging**:
- Scanner logs all API calls to console
- Check Netlify function logs for production errors
- Use `npm run test-scanner` to test 5 stocks quickly

---

## Next Steps

1. **Review this document** - Ensure approach makes sense
2. **Make code changes** - Apply Phase 1 & 2 fixes
3. **Test with 5 stocks** - Run `npm run test-scanner` to verify correct prices
4. **Full re-scan** - Run `npm run scan-market` to populate with accurate data
5. **Verify accuracy** - Compare database prices against Yahoo Finance
6. **Deploy** - Push changes to production

**Estimated Time**: 30-45 minutes (mostly waiting for re-scan)
