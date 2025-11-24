# API Usage Strategy

This document explains how different pages use different APIs to maximize efficiency and avoid rate limits.

---

## Overview

The platform uses **three data sources** strategically:
1. **Finnhub** - Real-time quotes for Scanner
2. **FMP (Financial Modeling Prep)** - Historical OHLC for Market Scan
3. **Database (stock_prices table)** - Historical data cache

---

## API Allocation by Feature

### Scanner Page (`/scanner`) - Personal Watchlist

**Purpose:** Scan YOUR watchlist (typically 10-20 stocks) for immediate trading opportunities

**Data Sources:**
- ✅ **Finnhub** - Real-time quotes
  - Free tier: 60 calls/minute
  - Usage: 1 call per stock
  - Example: 18 stocks = 18 calls (well under limit)

- ✅ **Database** - Historical OHLC (60 days)
  - Reads from `stock_prices` table
  - Zero API calls
  - Instant retrieval

**Why This Works:**
- Your watchlist is small (10-50 stocks typically)
- Only need current price for each stock
- Historical data already in database from daily market scan
- Never hits FMP rate limit

---

### Recommendations Page (`/recommendations`) - Market-Wide Analysis

**Purpose:** Show daily scan results for ALL 249 stocks in universe

**Data Source:**
- ✅ **FMP** - Historical OHLC (365 days per stock)
  - Free tier: 250 calls/day
  - Usage: 249 stocks = 249 calls
  - Runs once daily at 5 PM ET

**Why This Works:**
- Only runs once per day (GitHub Actions scheduled)
- Fetches 365 days of data per stock
- Stores ALL fetched data in database
- Never re-fetches same historical data

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Actions                         │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
    ┌───────────────┐              ┌────────────────┐
    │ Scanner Page  │              │ Recommendations│
    │  /scanner     │              │     /recommendations  │
    └───────────────┘              └────────────────┘
            │                               │
            │ Need current price            │ Display daily scan
            │ Need 60d history              │ results (from DB)
            │                               │
            ▼                               ▼
    ┌───────────────┐              ┌────────────────┐
    │   Finnhub     │              │   Database     │
    │ (quotes only) │              │ (stored scans) │
    └───────────────┘              └────────────────┘
            │                               ▲
            │ 18 calls                      │
            │                               │
            ▼                               │
    ┌───────────────┐                      │
    │   Database    │                      │
    │ (OHLC history)│                      │
    └───────────────┘                      │
                                           │
                                           │
                            ┌──────────────┘
                            │
                    ┌───────────────┐
                    │ Daily Market  │
                    │ Scan (cron)   │
                    │ 5 PM ET       │
                    └───────────────┘
                            │
                            │ 249 stocks
                            ▼
                    ┌───────────────┐
                    │      FMP      │
                    │ (365 days     │
                    │  per stock)   │
                    └───────────────┘
                            │
                            │ Store all
                            ▼
                    ┌───────────────┐
                    │   Database    │
                    │ stock_prices  │
                    │ trade_recommendations │
                    └───────────────┘
```

---

## API Rate Limits & Usage

### Finnhub (Scanner)
| Metric | Free Tier | Our Usage | Status |
|--------|-----------|-----------|--------|
| Limit | 60 calls/min | ~18 calls (watchlist) | ✅ Well under |
| Monthly | ~2.6M calls | ~540 calls/day | ✅ 0.02% used |
| Cost | Free | $0 | ✅ Free |

### FMP (Market Scan)
| Metric | Free Tier | Our Usage | Status |
|--------|-----------|-----------|--------|
| Limit | 250 calls/day | 249 calls/day | ⚠️ 99.6% used |
| Resets | Daily (midnight ET) | Once daily (5 PM ET) | ✅ Controlled |
| Cost | Free | $0 | ✅ Free |

**Note:** FMP limit is tight but works because:
- Scanner only runs once per day
- We store all fetched data
- No redundant calls
- Can upgrade to Starter ($14.99/mo) for 750 calls/day if needed

---

## Database Storage Strategy

### stock_prices Table

**Populated By:** Daily market scan (GitHub Actions)

**Contains:** Historical OHLC data for all 249 stocks
- 365+ days of history per stock
- ~91,000+ price records initially
- Grows by 249 records per day

**Used By:**
- Scanner page (reads 60-day windows)
- Future: Charts, backtesting, historical analysis

**Benefits:**
- Zero API calls for historical data
- Instant retrieval
- Permanent historical record
- Enables offline analysis

---

## Edge Cases & Fallbacks

### What if database is empty?

**Scanner Page:**
- Development: Falls back to mock data
- Production: Shows error, prompts to wait for daily scan

**Solution:** Run market scan once to populate database

### What if FMP rate limit hit during scan?

**Current:**
- Scan fails after ~249 stocks
- No data stored
- Need to wait for limit reset

**Mitigation:**
- Run scan after midnight ET (fresh limit)
- Scan only runs once per day
- Consider upgrading FMP tier

### What if Finnhub rate limit hit?

**Very unlikely** (60 calls/min, we use ~18)

**If it happens:**
- Development: Falls back to mock data
- Production: Shows error for affected stocks
- Cache prevents redundant calls

---

## Cost Optimization

### Current Setup (Free)
- Finnhub: Free tier (60 calls/min)
- FMP: Free tier (250 calls/day)
- **Total Cost:** $0/month

### If Scaling Up

**Option 1: Upgrade FMP to Starter ($14.99/mo)**
- Increases to 750 calls/day
- Can scan 750 stocks daily
- Or run multiple scans per day

**Option 2: Keep Free, Optimize**
- Reduce scan universe to 230 stocks (leave buffer)
- Add crypto via FreeCryptoAPI (100k calls/month free)
- Total: 230 stocks + 20 crypto + watchlist scanning

**Option 3: Premium Setup ($50+/mo)**
- FMP Professional (unlimited calls)
- Real-time WebSocket feeds
- More data sources

**Recommendation:** Stay free until user base requires more

---

## Development vs Production

### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_ENABLE_MOCK_DATA=true

# Falls back to mock data if API keys missing
# Allows testing without API limits
```

### Production (Netlify)
```bash
NODE_ENV=production
NEXT_PUBLIC_ENABLE_MOCK_DATA=false

# Requires real API keys
# Throws errors if data unavailable
# Never shows mock data to users
```

---

## Testing API Separation

### Test Scanner (Database-First)
```bash
npm run dev
# Navigate to /scanner
# Click "Run Scan"
# Check console: Should say "Using stored data from database"
```

### Test Market Scan (FMP API)
```bash
npm run scan-market
# Check console: Should fetch from FMP API
# Stores in database for scanner to use
```

---

## Monitoring API Usage

### Finnhub
- Dashboard: https://finnhub.io/dashboard
- Check: API calls used
- Alert: If approaching 60 calls/min

### FMP
- Dashboard: https://site.financialmodelingprep.com/dashboard
- Check: Daily usage (should be ~249)
- Alert: If hitting 250 limit before scan completes

### Database
```sql
-- Check stored price data
SELECT COUNT(*) FROM stock_prices;

-- Check latest prices
SELECT symbol, MAX(date) as latest_date
FROM stock_prices
GROUP BY symbol
ORDER BY latest_date DESC;
```

---

## Future Enhancements

### Short Term
- [ ] Add crypto scanning via FreeCryptoAPI
- [ ] Implement smarter database caching
- [ ] Add API usage tracking to UI

### Medium Term
- [ ] Support multiple data sources with fallbacks
- [ ] Add real-time WebSocket feeds
- [ ] Implement incremental updates (only fetch new bars)

### Long Term
- [ ] Build complete historical database (5+ years)
- [ ] Add backtesting with stored data
- [ ] Multi-exchange support

---

## Troubleshooting

### Scanner shows "No data available"

**Cause:** Database is empty (first time setup)

**Solution:**
1. Run market scan: `npm run scan-market` (locally)
2. OR wait for daily scan (5 PM ET)
3. Database will populate automatically

### Scanner still hitting FMP limit

**Cause:** Code not using database-first approach

**Check:**
```typescript
// In lib/scanner/scanner.ts, should see:
getDailyOHLC(symbol, 'auto')  // ✅ Tries database first
```

**Solution:** Verify code is deployed, clear cache

### Market scan fails with 429 errors

**Cause:** Already used 250 FMP calls today

**Solution:**
- Wait for midnight ET (limit resets)
- OR upgrade FMP tier
- OR reduce scan universe to <250 stocks

---

Last Updated: 2025-11-24
Author: Claude Code
Version: 1.0
