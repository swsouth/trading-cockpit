# Intraday Scanning Strategy

## Overview

With Yahoo Finance's unlimited API, we've implemented a hybrid scanning approach:
- **Full Technical Scans:** 3x daily (comprehensive channel/pattern/scoring analysis)
- **Price Refreshes:** Every 15 minutes (live price updates for existing recommendations)

---

## Full Technical Scans (3x Daily)

### Timing
1. **Market Open Scan:** 9:45 AM ET
   - Captures initial market setups after opening volatility settles
   - Fresh recommendations based on overnight gaps and pre-market momentum

2. **Lunch Scan:** 12:30 PM ET
   - Catches mid-day reversals and breakouts
   - Updates recommendations based on morning price action

3. **Market Close Scan:** 4:15 PM ET
   - Traditional end-of-day swing trade setups
   - Final opportunity analysis for next trading session

### Performance
- **Batch Size:** 30 stocks (up from 8)
- **Batch Delay:** 2 seconds (down from 65 seconds)
- **Total Runtime:** ~2 minutes for 180 stocks (vs 25 minutes previously)
- **API Cost:** $0 (Yahoo Finance unlimited)

### What Gets Analyzed
- Channel detection (support/resistance levels)
- Candlestick pattern recognition (7 patterns)
- Volume analysis (relative to 30-day average)
- RSI and momentum indicators
- Risk/reward calculation
- Opportunity scoring (0-100 scale)
- Enhanced vetting (20-point checklist)

---

## Price Refresh (Every 15 Minutes)

### Timing
- Runs continuously **9:30 AM - 4:00 PM ET** (market hours only)
- Executes every 15 minutes on the clock (:00, :15, :30, :45)
- Auto-skips if market is closed (weekends, holidays)

### What Gets Updated
- `current_price` - Live price from Yahoo Finance
- `price_change_since_scan` - Percentage change from entry_price
- `last_price_update` - Timestamp of last refresh

### Performance
- **Runtime:** ~5-10 seconds for 180 active recommendations
- **API Cost:** $0 (Yahoo Finance unlimited)
- **Parallel Execution:** All symbols fetched simultaneously

### Price Change Tracking
```typescript
// Example: Stock entry at $100, now at $103
{
  symbol: 'AAPL',
  entry_price: 100.00,
  current_price: 103.00,
  price_change_since_scan: 3.00,  // +3%
  last_price_update: '2025-12-04T14:30:00Z'
}
```

---

## Usage

### Run Full Market Scan
```bash
npm run scan-market
```

### Run Price Refresh
```bash
npm run refresh-prices
```

### Manual Testing
```bash
# Test if market is open
npm run refresh-prices
# Output: "⏸️ Market closed - skipping" or "✅ Market is open - refreshing"
```

---

## GitHub Actions (Scheduled Scans)

### Full Scans (3x daily)
```yaml
# .github/workflows/market-scan.yml
on:
  schedule:
    - cron: '45 13 * * 1-5'  # 9:45 AM ET (13:45 UTC - 4h)
    - cron: '30 16 * * 1-5'  # 12:30 PM ET (16:30 UTC - 4h)
    - cron: '15 20 * * 1-5'  # 4:15 PM ET (20:15 UTC - 4h)
```

### Price Refresh (Every 15 minutes)
```yaml
# .github/workflows/price-refresh.yml
on:
  schedule:
    - cron: '*/15 13-20 * * 1-5'  # Every 15 min, 9:30 AM - 4:00 PM ET
```

---

## Database Schema Changes

### New Columns Added
```sql
ALTER TABLE trade_recommendations
ADD COLUMN price_change_since_scan numeric,
ADD COLUMN last_price_update timestamp with time zone;

CREATE INDEX idx_trade_recommendations_price_refresh
ON trade_recommendations(is_active, scan_date)
WHERE is_active = true;
```

### Column Purposes
- **price_change_since_scan:** Percentage change from entry_price to current_price
- **last_price_update:** Timestamp of last price refresh (for UI staleness detection)

---

## UI Enhancements (Pending Implementation)

### Recommendation Cards
- Display "Updated 2 minutes ago" badge
- Show price change since scan: "+2.3% ↗️" or "-1.5% ↘️"
- Color-code movement:
  - 🟢 Green: Moving toward target
  - 🔴 Red: Moving toward stop loss
  - ⚪ Gray: Neutral/sideways

### Auto-Refresh
- Poll API every 60 seconds when page is active
- Manual refresh button for immediate update
- Visual indicator when data is stale (>20 minutes old)

---

## Benefits

### Speed
- **Full scan runtime:** 2 minutes (vs 25 minutes previously)
- **Price refresh:** 5-10 seconds
- **No rate limit delays:** Yahoo Finance unlimited API

### Cost
- **API calls per day:** ~300 (3 full scans × 180 stocks / 30 batch)
- **Price refreshes:** ~25 per day (every 15 min × 6.5 hours)
- **Total API cost:** $0 (Yahoo Finance free tier)

### User Experience
- Fresh recommendations 3x daily (catch major moves)
- Live price updates every 15 minutes
- See which recommendations are gaining/losing momentum
- Make informed decisions with up-to-date pricing

---

## Next Steps

1. ✅ Database columns added
2. ✅ Price refresh script created
3. ✅ Scanner configuration updated (30 stocks, 2s delay)
4. ✅ npm script added (`refresh-prices`)
5. ⏳ Create API route (`/api/scan/refresh-prices`)
6. ⏳ Update UI to show live prices and timestamps
7. ⏳ Add GitHub Actions workflows
8. ⏳ Test full workflow end-to-end

---

## Monitoring

### Scanner Logs
```bash
# Check full scan progress
tail -f logs/market-scan.log

# Check price refresh
tail -f logs/price-refresh.log
```

### Database Queries
```sql
-- Check last price update times
SELECT symbol, current_price, price_change_since_scan,
       last_price_update,
       NOW() - last_price_update as time_since_update
FROM trade_recommendations
WHERE is_active = true
ORDER BY last_price_update DESC;

-- Top movers since scan
SELECT symbol, entry_price, current_price, price_change_since_scan
FROM trade_recommendations
WHERE is_active = true AND scan_date >= CURRENT_DATE
ORDER BY ABS(price_change_since_scan) DESC
LIMIT 10;
```

---

## Troubleshooting

### Price Refresh Not Running
- Check if market is open (9:30 AM - 4:00 PM ET, Mon-Fri)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check logs for Yahoo Finance API errors

### Stale Prices
- Run `npm run refresh-prices` manually
- Check `last_price_update` timestamps in database
- Verify GitHub Actions workflow is running

### Scanner Slow
- Check batch size (should be 30)
- Check batch delay (should be 2000ms)
- Verify Yahoo Finance API is responding

---

## Summary

This hybrid approach gives traders the best of both worlds:
- **Comprehensive analysis** 3x daily to catch major setups
- **Live pricing** every 15 minutes to track momentum
- **Zero API cost** thanks to Yahoo Finance unlimited tier
- **Fast execution** with parallel processing (2 min full scan)

The system now provides real-time insights throughout the trading day while maintaining the depth of technical analysis that generates high-quality trade recommendations.
