# Production Deployment Guide

## Mock Data Prevention

This application is configured to **prevent mock/fake data in production** while allowing it in development for testing.

### How It Works

**Environment Detection** (`lib/marketData.ts`):
```typescript
const isProduction = process.env.NODE_ENV === 'production' ||
                     process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'false';
```

**Behavior by Environment:**

| Environment | API Key Missing | API Call Fails | Result |
|-------------|----------------|----------------|--------|
| Development | ✅ Mock data | ✅ Mock data | Continues working |
| Production | ❌ Error thrown | ❌ Error thrown | Shows error message |

### What This Means

**In Development (local):**
- Missing API keys → Uses realistic mock data
- API failures → Falls back to mock data
- Allows testing UI without API keys

**In Production (Netlify):**
- Missing API keys → Throws error "API key not configured"
- API failures → Throws error "Failed to fetch market data"
- **No mock data ever shown to users**
- Users see clear error messages instead

## Pre-Deployment Checklist

### 1. Environment Variables (Netlify Dashboard)

**Required:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role for scanner
- [ ] `SCAN_SECRET_KEY` - For cron trigger authentication
- [ ] `FMP_API_KEY` - Financial Modeling Prep API key
- [ ] `NEXT_PUBLIC_FINNHUB_API_KEY` - Finnhub API key (optional, will use FMP for quotes)

**Optional (for disabling mock data explicitly):**
- [ ] `NEXT_PUBLIC_ENABLE_MOCK_DATA=false` - Extra safety to prevent mock data

### 2. Database Preparation

**Clean test data:**
```bash
npm run clean-recommendations
```

**Verify scan universe is populated:**
```bash
# Check database has 250 stocks in scan_universe table
# Via Supabase Dashboard or psql
```

### 3. API Key Validation

**Test API keys locally:**
```bash
# Test FMP API
npx tsx scripts/testFmpApi.ts

# Test market scanner with real data
npm run test-scanner
```

**Expected behavior:**
- ✅ API calls succeed with 200 status
- ✅ Real market data returned
- ❌ No "using mock data" warnings in console

### 4. Daily Scanner Setup

**Verify GitHub Actions workflow:**
- [ ] `.github/workflows/daily-market-scan.yml` exists
- [ ] GitHub secrets configured:
  - `SCAN_SECRET_KEY` (matches Netlify env var)
  - `SITE_URL` (your Netlify domain)
- [ ] Workflow enabled (not disabled)

**Test manual trigger:**
```bash
# Via GitHub Actions UI → Run workflow manually
# Check Netlify function logs for POST /api/scan/trigger
```

### 5. Error Handling Verification

**Test production behavior locally:**
```bash
# Temporarily rename API keys in .env.local
mv .env.local .env.local.backup

# Start app with production flag
NODE_ENV=production npm run dev

# Visit site - should see errors, NOT mock data
# Restore API keys when done
mv .env.local.backup .env.local
```

**What you should see:**
- ❌ Errors: "Failed to fetch market data"
- ❌ Errors: "FMP API key not configured"
- ✅ Clear error messages in UI
- ✅ **No mock data displayed**

## Production Deployment Steps

### Step 1: Final Local Verification
```bash
# Clean test data
npm run clean-recommendations

# Type check
npm run typecheck

# Build locally to catch errors
npm run build
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Production ready: Remove mock data, add error handling"
git push origin main
```

### Step 3: Netlify Auto-Deploy
- Netlify detects push to `main`
- Triggers automatic build
- Deploys to production

### Step 4: Post-Deployment Checks

**Immediately after deployment:**
1. Visit live site (logged out) → Should see landing page
2. Sign up/log in → Should see dashboard (may be empty)
3. Check `/recommendations` page:
   - If no recommendations: ✅ Expected (clean database)
   - If see mock data: ❌ **PROBLEM** - Check env vars
4. Check browser console for errors
5. Check Netlify function logs for any issues

**Within 24 hours:**
1. Wait for daily scan to run (5 PM ET Monday-Friday)
2. Check `/recommendations` page for real data
3. Verify:
   - Real stock symbols (from scan_universe)
   - Realistic prices (match current market)
   - Scan date is today
   - No obvious test data (AAPL @ $225.50, etc.)

## Monitoring Production

### Daily Checks
- [ ] Scanner runs successfully (GitHub Actions log)
- [ ] Recommendations appear on site
- [ ] Prices match real market data
- [ ] No errors in Netlify logs

### Weekly Checks
- [ ] API usage within limits:
  - FMP: 250 calls/day (free tier)
  - Finnhub: 60 calls/min (free tier)
- [ ] No rate limit errors in logs
- [ ] Recommendations quality (scores 60+)

## Troubleshooting

### "No recommendations available"

**Possible causes:**
1. Scanner hasn't run yet (first time deployment)
2. Scanner found no setups with score ≥ 60
3. Scanner failed due to API issues

**How to check:**
```bash
# Check GitHub Actions log for scanner execution
# Check Netlify function logs for /api/scan/trigger
# Manually trigger scan via Netlify CLI or Actions
```

### "Failed to fetch market data"

**Possible causes:**
1. API key not configured in Netlify
2. API rate limit exceeded
3. API service outage

**How to fix:**
1. Verify env vars in Netlify Dashboard
2. Check API usage in provider dashboard
3. Check provider status page

### Mock data appearing in production

**This should NEVER happen if setup correctly**

**Immediate steps:**
1. Check Netlify env vars - Is `NODE_ENV=production` set?
2. Add `NEXT_PUBLIC_ENABLE_MOCK_DATA=false` to Netlify
3. Redeploy site
4. Clear browser cache

## Rollback Procedure

If production deployment has issues:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or revert to specific commit
git reset --hard <previous-commit-hash>
git push origin main --force

# Netlify will auto-deploy the reverted code
```

## Support & Maintenance

**Key Files to Monitor:**
- `lib/marketData.ts` - Market data fetching logic
- `scripts/dailyMarketScan.ts` - Scanner logic
- `.github/workflows/daily-market-scan.yml` - Automation

**Regular Maintenance:**
- Update stock universe quarterly
- Review API usage and costs
- Clean old recommendations (>30 days auto-deleted)
- Monitor error rates

---

## Summary

✅ **Production-ready features:**
- No mock data in production
- Real market data only
- Clear error messages
- Automated daily scanning
- Rate limiting and caching

✅ **User experience:**
- Real trade recommendations
- Accurate pricing
- Professional charts (TradingView)
- Reliable data sources

✅ **Safety measures:**
- Environment-based behavior
- Graceful error handling
- No test data leakage
- Database cleanup tools

---

Last updated: 2025-11-23
