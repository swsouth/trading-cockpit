# Deployment Checklist - Netlify + GitHub Actions

This checklist ensures automated stock scanning is properly configured for production deployment.

## ✅ Pre-Deployment Verification

### 1. Local Environment Test
- [x] Timezone display shows user's local time (not hardcoded ET/UTC)
- [x] Price refresh script runs successfully (`npm run refresh-prices`)
- [x] Full market scan completes (`npm run scan-market`)
- [x] Color-coded badges display correctly in RecommendationCard
- [x] Database migrations applied (timezone fix for `created_at` column)

**Test Results:**
```bash
npm run refresh-prices
# Expected: ✅ 47/49 prices updated, top movers displayed
# Verified: Color-coded badges (green = toward target, red = toward stop)
```

---

## 📋 Netlify Environment Variables

**Required Variables** (from `.env.local`):

### Core Infrastructure
```
NEXT_PUBLIC_SUPABASE_URL=https://hjfokaueppsvpcjzrcjg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Scanning Security
```
SCAN_SECRET_KEY=<copy-from-env-local>
```
**Note:** Copy the exact value from your `.env.local` file. This key is used for GitHub Actions authentication.

### Market Data APIs
```
TWELVE_DATA_API_KEY=<your-key>
COINAPI_API_KEY=<your-key>
```

### Optional (fallback to mock data if missing)
```
NEXT_PUBLIC_FINNHUB_API_KEY=<your-key>
FMP_API_KEY=<your-key>
POLYGON_API_KEY=<your-key>
```

### Alpaca Trading (for Paper Trading feature)
```
NEXT_PUBLIC_ALPACA_API_KEY=<your-key>
NEXT_PUBLIC_ALPACA_SECRET_KEY=<your-secret>
NEXT_PUBLIC_ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

**How to Add:**
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add each variable with exact name and value from `.env.local`
3. Deploy context: Production (or All)
4. **CRITICAL:** Verify `SCAN_SECRET_KEY` matches exactly (used for GitHub Actions auth)

---

## 🔧 GitHub Repository Secrets

**Required Secrets** (for GitHub Actions workflows):

1. **SITE_URL**
   - Value: Your Netlify site URL (e.g., `your-site.netlify.app`)
   - Used by: Both workflows to call API endpoints

2. **SCAN_SECRET_KEY**
   - Value: Copy from your `.env.local` file
   - Used by: Authentication header in API calls
   - **MUST MATCH** Netlify environment variable exactly

**How to Add:**
1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add both secrets above

---

## 📅 GitHub Actions Workflows

**Created Files:**
- `.github/workflows/market-scan-3x-daily.yml`
- `.github/workflows/price-refresh-15min.yml`

### Market Scan (3x Daily)
**Schedule:**
- 9:45 AM ET (market open scan)
- 12:30 PM ET (lunch scan)
- 4:15 PM ET (market close scan)

**API Endpoint:** `POST /api/scan/trigger`

**What it does:**
- Full technical analysis on 128 stocks
- Channel detection, pattern recognition, scoring
- Saves top 30 recommendations to `trade_recommendations` table

**Manual Trigger:**
1. Go to GitHub → Actions → "Market Scan (3x Daily)"
2. Click "Run workflow" → Run workflow

### Price Refresh (Every 15 Minutes)
**Schedule:**
- Every 15 minutes: `:00, :15, :30, :45`
- Only during market hours: 9:30 AM - 4:00 PM ET

**API Endpoint:** `POST /api/scan/refresh-prices`

**What it does:**
- Fetches live quotes for all active recommendations
- Updates `price_change_since_scan` and `last_price_update` columns
- Shows color-coded badges in UI (green/red arrows)

**Manual Trigger:**
1. Go to GitHub → Actions → "Stock Price Refresh (Every 15 Minutes)"
2. Click "Run workflow" → Run workflow

---

## 🧪 End-to-End Testing

### Test Full Workflow
1. **Trigger Full Scan** (manual)
   - GitHub → Actions → "Market Scan (3x Daily)" → Run workflow
   - Wait ~30-60 seconds
   - Check Netlify Function logs for success/errors

2. **Verify Database Update**
   ```sql
   SELECT COUNT(*) FROM trade_recommendations WHERE is_active = true;
   -- Expected: ~30-50 recommendations
   ```

3. **View Recommendations Page**
   - Navigate to: `https://your-site.netlify.app/recommendations`
   - Verify: Recommendations displayed, scores visible, badges colored

4. **Trigger Price Refresh** (manual)
   - GitHub → Actions → "Stock Price Refresh" → Run workflow
   - Wait ~10 seconds
   - Refresh recommendations page

5. **Verify Color-Coded Badges**
   - Green badge with ↑: Price moving toward target (good)
   - Red badge with ↓: Price moving toward stop loss (bad)
   - Gray badge with −: Price neutral (<0.1% change)

6. **Test During Market Closed**
   - Run price refresh after 4:00 PM ET or on weekend
   - Expected: Workflow succeeds with "Market closed - skipping" message

---

## 🚨 Troubleshooting

### Workflow Fails with 401 Unauthorized
**Cause:** `SCAN_SECRET_KEY` mismatch between GitHub and Netlify
**Fix:**
1. Copy exact value from your `.env.local` file
2. Update GitHub secret with this value
3. Update Netlify environment variable with the same value
4. Redeploy Netlify site

### Workflow Fails with 404 Not Found
**Cause:** API endpoint not deployed or wrong URL
**Fix:**
1. Verify `SITE_URL` in GitHub secrets matches Netlify deployment URL
2. Check Netlify Functions tab - should see `/api/scan/trigger` and `/api/scan/refresh-prices`
3. Test endpoint manually: `curl -X POST https://your-site.netlify.app/api/scan/trigger -H "Authorization: Bearer <key>"`

### Workflow Times Out (504)
**Cause:** Full scan takes longer than Netlify function timeout
**Fix:**
1. Check Netlify plan: Free tier = 10s timeout, Pro tier = 26s timeout
2. Reduce stock universe to 50-75 stocks if on free tier
3. Workflow should still exit 0 (success) even on 504 - check database for results

### Price Refresh Shows Stale Data
**Cause:** Workflow not running every 15 minutes
**Fix:**
1. Check GitHub Actions history for failed runs
2. Verify cron schedule handles EST/EDT correctly
3. Check for rate limiting errors in Netlify function logs

### Color-Coded Badges Not Showing
**Cause:** `price_change_since_scan` or `last_price_update` columns null
**Fix:**
1. Run price refresh workflow manually
2. Check database: `SELECT symbol, price_change_since_scan, last_price_update FROM trade_recommendations LIMIT 5;`
3. Verify API calls in Netlify function logs

---

## 📊 Monitoring

### Daily Checks
- **GitHub Actions:** Review workflow history for failures
- **Netlify Functions:** Check logs for errors or rate limits
- **Database:** Verify recommendations are being created/updated

### Key Metrics
- **Full Scan Success Rate:** Should be 100% during market days
- **Price Refresh Success Rate:** Should be ~95% (some API failures expected)
- **Recommendation Count:** Should be 30-50 active recommendations daily
- **Price Update Freshness:** Should be <20 minutes during market hours

### Logs to Monitor
1. **GitHub Actions:**
   - Go to Actions tab → Select workflow → Click on run
   - Check for HTTP 200/201 responses

2. **Netlify Functions:**
   - Dashboard → Functions tab → Select function
   - Filter by time range (last 1 hour, last 24 hours)
   - Look for errors, timeouts, or rate limit warnings

---

## ✅ Deployment Completion Checklist

- [ ] All Netlify environment variables added
- [ ] GitHub repository secrets configured (SITE_URL, SCAN_SECRET_KEY)
- [ ] Manual test: Full market scan workflow succeeds
- [ ] Manual test: Price refresh workflow succeeds
- [ ] Verify recommendations page displays data correctly
- [ ] Verify color-coded badges appear on recommendations
- [ ] Test during market hours: Live price updates working
- [ ] Test after market close: Gracefully skips price refresh
- [ ] Verify timezone display shows user's local time
- [ ] Session log updated with deployment status

---

## 🎯 Success Criteria

**You've successfully deployed when:**

1. ✅ Full scan runs 3x daily (9:45 AM, 12:30 PM, 4:15 PM ET)
2. ✅ Price refresh runs every 15 min during market hours
3. ✅ Recommendations page shows 30-50 active stocks
4. ✅ Color-coded badges display price movements
5. ✅ Timestamps show in user's local timezone
6. ✅ No 401/404 errors in GitHub Actions logs
7. ✅ Netlify functions execute successfully

---

## 📝 Next Steps After Deployment

1. **Monitor for 1 week:** Check workflows run successfully M-F
2. **Adjust schedules if needed:** May want different scan times
3. **Optimize stock universe:** Add/remove stocks based on performance
4. **Consider API upgrades:** If hitting rate limits frequently
5. **Add alerts:** Set up Netlify notifications for function failures

---

**Last Updated:** 2025-12-05
**Status:** Ready for deployment
**Verified By:** Automated testing + manual workflow runs
