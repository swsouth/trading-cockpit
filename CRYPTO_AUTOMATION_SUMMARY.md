# Crypto Intraday Scanner - High-Frequency Automation

## Overview

Automated crypto scanner that runs **every 15 minutes, 24/7** via GitHub Actions, catching momentum shifts and directional moves in the top 10 most liquid cryptocurrencies.

---

## Scan Configuration

### Universe (10 Elite Cryptos)
1. **BTC/USD** - Market leader, highest liquidity
2. **ETH/USD** - DeFi king, massive volume
3. **SOL/USD** - Lightning fast, highly volatile
4. **BNB/USD** - Exchange token, reliable liquidity
5. **XRP/USD** - Institutional favorite, huge volume
6. **ADA/USD** - Consistent patterns, good TA
7. **AVAX/USD** - Fast chains = fast moves
8. **DOGE/USD** - Meme volatility, extreme swings
9. **MATIC/USD** - Layer 2 leader, steady volume
10. **LINK/USD** - Oracle leader, predictable patterns

### Scan Frequency
- **Interval:** Every 15 minutes (96 scans/day)
- **Schedule:** 24/7 (crypto markets never close)
- **Cron:** `0,15,30,45 * * * *`

### Cost Analysis
- **Per Scan:** 200 credits (10 cryptos × 20 credits each)
- **Daily:** 96 scans × 200 = **19,200 credits/day**
- **Monthly:** ~576,000 credits/month
- **Price:** ~$6.40/day (at $1 = 3,000 credits)

---

## Automation Architecture

### GitHub Actions Workflow
**File:** `.github/workflows/crypto-intraday-scan.yml`

**Triggers:**
1. **Scheduled:** Every 15 minutes via cron
2. **Manual:** Via GitHub Actions UI (workflow_dispatch)

**Process:**
1. GitHub Actions job starts on schedule
2. Makes POST request to `/api/scan/intraday/crypto`
3. Netlify function executes the scanner
4. Results saved to `intraday_opportunities` table
5. Day Trader page auto-refreshes every 10s to show new opportunities

### API Endpoint
**Route:** `/api/scan/intraday/crypto`
**Method:** POST
**Auth:** Bearer token (SCAN_SECRET_KEY)
**Timeout:** 60 seconds max (Netlify function limit)

### Database Storage
**Table:** `intraday_opportunities`
**Columns:**
- `user_id` - Foreign key to auth.users
- `symbol` - Crypto ticker (BTC, ETH, etc.)
- `timeframe` - "15min"
- `recommendation_type` - long/short
- `entry_price`, `target_price`, `stop_loss`
- `opportunity_score` - 0-100 scale
- `confidence_level` - high/medium/low
- `expires_at` - 1 hour from scan time
- `asset_type` - "crypto"
- `status` - "active"

---

## Required GitHub Secrets

Configure these in your GitHub repository settings:

1. **SITE_URL**
   - Your Netlify domain
   - Example: `your-site.netlify.app`

2. **SCAN_SECRET_KEY**
   - Authentication token for scanner API
   - Must match Netlify environment variable

3. **COINAPI_API_KEY** (set in Netlify, not GitHub)
   - CoinAPI credentials for market data
   - Free tier: $30 starting credits

4. **SUPABASE_SERVICE_ROLE_KEY** (set in Netlify, not GitHub)
   - Database write access
   - Never expose client-side

---

## Data Source: CoinAPI

### Why CoinAPI?
- ✅ **No harsh rate limits** (unlike TwelveData's 8 req/min)
- ✅ **Date-bounded queries** = fixed 10 credits per call
- ✅ **Multi-timeframe data** (15-min + 1H for trend alignment)
- ✅ **Real-time WebSocket feeds** from exchanges
- ✅ **400+ exchanges** supported

### Cost Optimization
- Uses date-bounded queries (10 credit cap regardless of bars returned)
- Fetches 15-min bars (72 hours = ~288 bars) = 10 credits
- Fetches 1H bars (240 hours = 240 bars) = 10 credits
- **Total:** 20 credits per crypto (fixed cost!)

---

## Multi-Timeframe Analysis (MTF)

### Trading Timeframe (15-min bars)
- **Purpose:** Entry timing, pattern detection
- **Data:** Last 3 days (288 bars)
- **Used for:** Candlestick patterns, support/resistance, scalp signals

### Higher Timeframe (1H bars)
- **Purpose:** Trend direction, regime detection
- **Data:** Last 10 days (240 bars)
- **Used for:** EMA trends, higher TF S/R, divergence detection

### Alignment Strategy
- **Aligned trades:** Entry direction matches higher TF trend (+1 bonus)
- **Divergent trades:** Entry against higher TF trend (-2 penalty)
- **Confluence zones:** Price near both 15m and 1H S/R (+2 bonus)

---

## Deployment Checklist

### 1. Netlify Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SCAN_SECRET_KEY=<random-secret-token>
COINAPI_API_KEY=<coinapi-key>
```

### 2. GitHub Secrets
```
SITE_URL=<your-netlify-domain>
SCAN_SECRET_KEY=<same-as-netlify>
```

### 3. Enable Workflow
- Go to GitHub repository → Actions tab
- Enable workflows if disabled
- Manually trigger first run to test

### 4. Monitor Logs
- **GitHub Actions:** Check workflow run logs
- **Netlify Functions:** View function execution logs
- **Supabase:** Query `intraday_opportunities` table

---

## Monitoring & Troubleshooting

### Check Scanner Health
1. **GitHub Actions tab:** View recent workflow runs
2. **Netlify Functions logs:** Check for errors
3. **Database:** Count active crypto opportunities:
   ```sql
   SELECT COUNT(*)
   FROM intraday_opportunities
   WHERE asset_type = 'crypto'
     AND status = 'active'
     AND expires_at > NOW();
   ```

### Common Issues

**Issue:** Workflow runs but no opportunities
- Check Netlify function logs for errors
- Verify CoinAPI key is valid
- Ensure Supabase credentials are correct

**Issue:** 409 Conflict errors
- ✅ **FIXED:** Scanner now deletes all existing crypto opportunities before inserting new ones

**Issue:** Workflow fails with timeout
- Increase `timeout-minutes` in workflow file
- Reduce universe size if needed

**Issue:** High credit usage
- Monitor CoinAPI dashboard
- Consider reducing scan frequency
- Check for stuck background processes

---

## Cost Management

### Free Tier Budget ($30 starting credits)
- **Daily usage:** 19,200 credits (~$6.40/day)
- **Free tier lasts:** ~4.7 days
- **After free tier:** Need to upgrade or reduce frequency

### Optimization Options
1. **Reduce frequency:** Every 30 min = 48 scans/day = 9,600 credits/day
2. **Reduce universe:** 5 cryptos = 100 credits/scan = 9,600 credits/day
3. **Peak hours only:** Scan 6am-10pm = 64 scans/day = 12,800 credits/day

---

## Next Steps

1. ✅ Deploy to production (push to GitHub main branch)
2. ✅ Monitor first automated scan (next :00, :15, :30, or :45 minute)
3. ✅ Verify opportunities appear on Day Trader page
4. 📊 Track credit usage in CoinAPI dashboard
5. 🔔 Set up alerts for scan failures (optional)

---

## Files Modified

1. `lib/cryptoScanner.ts` - Reduced universe to 10 cryptos
2. `.github/workflows/crypto-intraday-scan.yml` - Updated workflow for API trigger
3. `app/day-trader/page.tsx` - Already crypto-only (previous work)
4. `lib/cryptoData/coinApiAdapter.ts` - Already using CoinAPI

---

**Status:** ✅ Ready for production deployment
**Last Updated:** 2025-12-06
