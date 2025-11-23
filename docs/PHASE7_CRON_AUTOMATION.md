# Phase 7: Cron Automation - Daily Market Scanner

Automatically scan the market for trade opportunities on a daily schedule.

---

## Overview

The daily market scanner:
- Analyzes 128 stocks from your scan universe
- Generates trade recommendations with entry/exit/stop prices
- Stores top 30 opportunities in the database
- Runs automatically every weekday at 5:00 PM ET (after market close)

---

## Architecture

### 1. Scan Trigger API Endpoint
**Location:** `app/api/scan/trigger/route.ts`

- Secured with `SCAN_SECRET_KEY` bearer token
- Calls the `runDailyMarketScan()` function
- Returns success/failure status

### 2. GitHub Actions Workflow
**Location:** `.github/workflows/daily-market-scan.yml`

- Scheduled to run Mon-Fri at 5:00 PM ET
- Makes POST request to trigger endpoint
- Can also be triggered manually

### 3. Scanner Logic
**Location:** `scripts/dailyMarketScan.ts`

- Fetches 128 stocks from `scan_universe` table
- Analyzes each stock for trade setups
- Scores opportunities 0-100
- Stores top 30 in `trade_recommendations` table

---

## Setup Instructions

### Step 1: Add SCAN_SECRET_KEY to Netlify

1. Go to **Netlify Dashboard** → Your Site → **Site configuration** → **Environment variables**
2. Click **Add a variable**
3. Add:
   - **Key:** `SCAN_SECRET_KEY`
   - **Value:** `[YOUR_GENERATED_SECRET_KEY]` (from your .env.local file)
   - **Scopes:** All (Production, Deploy Previews, Branch deploys)
   - **Contains secret values:** ✅ YES (check this box)
4. Click **Create variable**
5. Redeploy your site: **Deploys** → **Trigger deploy** → **Deploy site**

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add two secrets:

   **Secret 1: SCAN_SECRET_KEY**
   - Name: `SCAN_SECRET_KEY`
   - Value: `[YOUR_GENERATED_SECRET_KEY]` (from your .env.local file)
   - Click **Add secret**

   **Secret 2: SITE_URL**
   - Name: `SITE_URL`
   - Value: `your-site-name.netlify.app` (just the domain, no https://)
   - Click **Add secret**

### Step 3: Enable GitHub Actions

1. Go to your repository → **Actions** tab
2. If prompted, click **I understand my workflows, go ahead and enable them**
3. You should see the "Daily Market Scanner" workflow listed
4. The workflow will run automatically at the scheduled time (5 PM ET weekdays)

### Step 4: Test Manual Trigger

1. Go to **Actions** tab in GitHub
2. Click **Daily Market Scanner** workflow
3. Click **Run workflow** dropdown
4. Select branch `main`
5. Click **Run workflow**
6. Watch the job run - it should complete successfully
7. Check your `/recommendations` page to see the results

---

## Schedule Details

**Default Schedule:**
- **Time:** 5:00 PM ET (after market close at 4:00 PM ET)
- **Days:** Monday-Friday (weekdays only)
- **Cron:** `0 21 * * 1-5` (9 PM UTC = 5 PM ET during standard time)

**Note about Daylight Saving Time:**
- The cron expression in the workflow uses UTC time
- 5 PM ET = 9 PM UTC (Nov-Mar, standard time)
- 5 PM ET = 10 PM UTC (Mar-Nov, daylight time)
- You may need to update the cron schedule twice a year

**To change the schedule:**
1. Edit `.github/workflows/daily-market-scan.yml`
2. Update the `cron` expression
3. Commit and push
4. Use https://crontab.guru/ to help build cron expressions

---

## Manual Trigger Options

### Option 1: GitHub Actions UI (Easiest)
1. Go to **Actions** → **Daily Market Scanner**
2. Click **Run workflow**
3. Click **Run workflow** button

### Option 2: API Call (for testing)
```bash
curl -X POST https://your-site.netlify.app/api/scan/trigger \
  -H "Authorization: Bearer YOUR_SCAN_SECRET_KEY"
```

### Option 3: Add a Button to Admin UI
Create an admin page that calls the API endpoint when clicked.

---

## Alternative Scheduling Methods

### 1. Netlify Scheduled Functions (Paid Plans Only)
If you have a Netlify Pro plan, you can use native scheduled functions:

```typescript
// netlify/functions/daily-scan.ts
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const { runDailyMarketScan } = await import('../../scripts/dailyMarketScan');
  await runDailyMarketScan();
  return new Response("Scan complete", { status: 200 });
};

export const config: Config = {
  schedule: "@daily"
};
```

### 2. External Cron Services (Free)
Use a free cron service to call your API:

- **EasyCron:** https://www.easycron.com/
- **cron-job.org:** https://cron-job.org/
- **UptimeRobot:** https://uptimerobot.com/ (monitors + cron)

Setup:
1. Create account
2. Add new cron job
3. Set URL: `https://your-site.netlify.app/api/scan/trigger`
4. Set schedule: Daily at 5:00 PM ET
5. Add custom header: `Authorization: Bearer YOUR_SECRET_KEY`

### 3. Vercel Cron Jobs
If you deploy to Vercel instead of Netlify, you get native cron support:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/scan/trigger",
    "schedule": "0 21 * * 1-5"
  }]
}
```

---

## Monitoring & Logs

### View Scan Results
- Go to `/recommendations` page
- Check "Latest scan" date at the top
- Should update daily after 5 PM ET

### GitHub Actions Logs
1. Go to **Actions** tab
2. Click on a workflow run
3. Click **Run Market Scanner**
4. View detailed logs

### Netlify Function Logs
1. Go to Netlify Dashboard
2. Click **Functions** (or **Logs**)
3. Find `/api/scan/trigger` function
4. View execution logs

---

## Troubleshooting

### Workflow doesn't run
- **Check:** GitHub Actions enabled? Go to Settings → Actions → General
- **Check:** Workflow file syntax correct? View in Actions tab
- **Check:** Secrets added correctly? Settings → Secrets and variables

### Scan fails with 401 Unauthorized
- **Problem:** SCAN_SECRET_KEY mismatch
- **Solution:** Verify secret in both GitHub and Netlify match exactly
- **Check:** No extra spaces, quotes, or newlines in secret value

### Scan fails with 500 error
- **Check:** Netlify function logs for detailed error
- **Check:** SUPABASE_SERVICE_ROLE_KEY is set in Netlify
- **Check:** Database tables exist (trade_recommendations, scan_universe)

### No recommendations generated
- **Check:** Stock universe populated? Run `npm run populate-universe`
- **Check:** API keys configured for market data
- **Check:** Minimum score threshold (default: 60)

### Scan times out
- **Problem:** Netlify free functions timeout after 10 seconds
- **Solution:** Upgrade to Pro plan (26 second timeout) or reduce `batchSize` in scanner config
- **Workaround:** Run scanner locally and upload results manually

---

## Performance Notes

**Estimated Scan Duration:**
- 128 stocks at ~200ms per stock = ~25 seconds
- Netlify free tier: 10 second timeout ⚠️
- Netlify pro tier: 26 second timeout ✅

**Optimization Options:**
1. Reduce batch size to improve responsiveness
2. Reduce stock universe to 50-75 most liquid stocks
3. Run scanner locally and use API to upload results only
4. Upgrade to Netlify Pro for longer function timeout

---

## Cost Analysis

**GitHub Actions:**
- ✅ Free for public repos
- ✅ Free for private repos (2,000 minutes/month)
- Scanner uses ~1 minute/day = 20-30 min/month
- **Cost: $0**

**Netlify Functions:**
- Free tier: 125,000 requests/month
- Scanner uses 1 request/day = 30/month
- **Cost: $0**

**Alternative Services:**
- EasyCron: Free plan (1 job)
- cron-job.org: Free
- UptimeRobot: Free (50 monitors)

**Total Monthly Cost: $0** 🎉

---

## Security Notes

1. **SCAN_SECRET_KEY** is stored securely in:
   - GitHub Secrets (encrypted)
   - Netlify Environment Variables (marked as secret)
   - Never exposed in logs or client code

2. **Service Role Key** is NEVER exposed:
   - Only used server-side in Netlify functions
   - Not accessible from browser
   - Not in GitHub Actions (scanner runs on Netlify, not GitHub)

3. **Public Keys** (NEXT_PUBLIC_*):
   - Intentionally public
   - Protected by Supabase RLS policies
   - Safe to expose in client code

---

## Next Steps

1. ✅ Add secrets to GitHub and Netlify (see Step 1 & 2 above)
2. ✅ Test manual trigger from GitHub Actions
3. ✅ Wait for first scheduled run (next weekday at 5 PM ET)
4. ✅ Monitor `/recommendations` page for daily updates
5. Consider adding email notifications on scan completion
6. Consider adding Slack integration for new opportunities

---

## Related Files

- Trigger API: `app/api/scan/trigger/route.ts`
- Scanner Logic: `scripts/dailyMarketScan.ts`
- Stock Analyzer: `scripts/scanner/stockAnalyzer.ts`
- Database Operations: `scripts/scanner/database.ts`
- GitHub Workflow: `.github/workflows/daily-market-scan.yml`
- UI: `app/recommendations/page.tsx`
