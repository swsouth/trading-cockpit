# Day Trader Feature - Setup Guide

Complete setup instructions for the intraday trading feature that scans 10 high-volume stocks every 5 minutes during market hours using 5-minute bars.

---

## Quick Overview

**What It Does:**
- Scans 10 liquid stocks (AAPL, MSFT, TSLA, NVDA, GOOGL, META, AMZN, AMD, SPY, QQQ)
- Every 5 minutes during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
- Uses 5-minute candles (60 bars = 5 hours of data)
- Detects channels + patterns using existing analysis logic
- Shows live opportunities on `/day-trader` page
- Auto-expires setups after 30 minutes
- **Cost: $0/month** (using Alpaca free tier)

---

## Step 1: Alpaca Account Setup (5 minutes)

### 1.1 Create Account

1. Go to **https://alpaca.markets**
2. Click **"Sign Up"** (top right)
3. Choose **"Paper Trading Only"** (free, no credit card required)
4. Complete registration (email verification required)

### 1.2 Get API Keys

1. Log in to Alpaca dashboard
2. Navigate to **"Your API Keys"** (left sidebar)
3. You'll see two keys:
   - **API Key ID** (starts with `PK...` for paper trading)
   - **Secret Key** (only shown once - copy immediately!)
4. **IMPORTANT:** Copy both keys - you'll need them in Step 2

---

## Step 2: Environment Variables (2 minutes)

### 2.1 Add to `.env.local`

Open your `.env.local` file and add:

```bash
# Alpaca Markets - Intraday Data (REQUIRED for Day Trader)
ALPACA_API_KEY=PKxxxxxxxxxxxxxx              # Your API Key ID
ALPACA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx   # Your Secret Key
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

**Replace the `xxx` with your actual keys from Step 1.2**

### 2.2 Verify Existing Variables

Make sure you also have these (already configured):

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Scanner secret (required for automated scans)
SCAN_SECRET_KEY=your_secret_key
```

---

## Step 3: Database Migration (3 minutes)

### 3.1 Apply Migration

1. Open **Supabase Dashboard** → Your project
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the contents of `supabase/migrations/20251126000000_create_intraday_opportunities.sql`
5. Paste into SQL Editor
6. Click **"Run"** (bottom right)

### 3.2 Verify Table Created

1. Go to **Table Editor** (left sidebar)
2. Look for **`intraday_opportunities`** table
3. Should see columns: `id`, `symbol`, `timeframe`, `entry_price`, etc.

---

## Step 4: Test the Scanner (5 minutes)

### 4.1 Run Test Script

In your terminal (from `project/` directory):

```bash
npm run test-intraday
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
  INTRADAY SCANNER TEST
═══════════════════════════════════════════════════════════

1. Checking Alpaca API keys...
✅ API keys configured

2. Checking market status...
   Status: OPEN (or CLOSED if outside market hours)
   Market open. Closes at 4:00 PM ET
   Is Open: ✅ YES

3. Testing intraday data fetch...

📊 AAPL:
   ✅ Fetched 60 bars (5-min interval)
   Latest: $182.50 @ 2025-11-26T15:45:00Z
   Channel: YES
   Support: $180.25, Resistance: $184.75
   ✅ SETUP FOUND: LONG @ $180.50
   Score: 72/100 (medium)

📊 MSFT:
   ✅ Fetched 60 bars (5-min interval)
   ...
```

**Troubleshooting:**
- ❌ **"Alpaca API keys not found"** → Check `.env.local` has correct variable names
- ❌ **"Authentication failed"** → Double-check your API keys are correct
- ❌ **"Market closed"** → Run test during market hours (9:30 AM - 4:00 PM ET)

### 4.2 Run Full Scanner (Optional)

If test passes, try the full scanner:

```bash
npm run scan-intraday
```

This will scan all 10 stocks and store opportunities in the database.

---

## Step 5: Start Local Dev Server (1 minute)

```bash
npm run dev
```

Navigate to: **http://localhost:3000/day-trader**

**You should see:**
- Market status card (OPEN or CLOSED)
- Live opportunities list (auto-refreshing every 10 seconds)
- Countdown timers for each setup ("Expires in 12m 35s")
- Entry/target/stop prices
- Opportunity scores

---

## Step 6: Deploy to Netlify (10 minutes)

### 6.1 Add Environment Variables to Netlify

1. Go to **Netlify Dashboard** → Your site → **Site Settings**
2. Navigate to **Environment Variables**
3. Add these variables (click **"Add variable"** for each):

```
ALPACA_API_KEY = PKxxxxxxxxxxxxxx
ALPACA_SECRET_KEY = xxxxxxxxxxxxxxxxxxxxxxxx
ALPACA_BASE_URL = https://paper-api.alpaca.markets
```

**IMPORTANT:** Make sure all existing variables are also present:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SCAN_SECRET_KEY`

### 6.2 Deploy

Commit and push your changes:

```bash
git add .
git commit -m "Add Day Trader intraday feature"
git push origin main
```

Netlify will auto-deploy. Check **Deploy Log** for any errors.

### 6.3 Verify Scheduled Function

1. Go to **Netlify Dashboard** → **Functions** tab
2. Look for **`intraday-scan-scheduled`**
3. Should show schedule: **"*/5 13-20 * * 1-5"** (every 5 min during market hours)

**Note:** Scheduled functions only run in production, not on local dev.

---

## Step 7: Test in Production (During Market Hours)

1. Wait for market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
2. Navigate to **https://your-site.netlify.app/day-trader**
3. Wait 5-10 minutes (scanner runs every 5 min)
4. Opportunities should appear automatically

**Check Netlify Function Logs:**
- Go to **Functions** → **`intraday-scan-scheduled`** → **Logs**
- Should see scan results every 5 minutes during market hours

---

## Usage Guide

### How It Works

1. **Automated Scanning:**
   - Runs every 5 minutes during market hours
   - Fetches latest 5-min bars (60 bars = 5 hours)
   - Analyzes 10 high-volume stocks
   - Stores opportunities in database

2. **UI Auto-Refresh:**
   - Page polls every 10 seconds for new opportunities
   - Shows countdown timers ("Expires in 12m 35s")
   - Color-coded by score:
     - **Green border:** Score 80+ (excellent)
     - **Orange border:** Expiring soon (<5 min)
     - **Red timer:** Expired

3. **Opportunity Lifecycle:**
   - **Created:** When scanner finds setup (score >= 50)
   - **Active:** Valid for 30 minutes from scan time
   - **Expired:** Auto-removed after 30 minutes

### Manual Testing (Trigger Scan On-Demand)

During market hours, you can manually trigger a scan:

```bash
curl -X POST https://your-site.netlify.app/api/scan/intraday \
  -H "Authorization: Bearer YOUR_SCAN_SECRET_KEY"
```

Or use the test script locally:

```bash
npm run scan-intraday
```

---

## Troubleshooting

### No Opportunities Showing Up

**Possible Causes:**
1. **Market is closed** → Check market status card on `/day-trader` page
2. **Scanner hasn't run yet** → Wait 5 minutes for next scheduled scan
3. **No setups found** → Stocks may not have valid setups right now (normal)
4. **Minimum score too high** → All setups scored below 50 (check scanner logs)

**Fix:**
- Run manual scan: `npm run scan-intraday`
- Check Netlify function logs for errors
- Verify database has `intraday_opportunities` table

### API Rate Limits

**Alpaca Free Tier:**
- **200 requests/minute**
- Scanning 10 stocks = 10 requests
- Running every 5 min = 12 scans/hour = 120 requests/hour
- **Well within limits** ✅

**If you hit limits:**
- Reduce stock count in `scripts/intradayMarketScan.ts`
- Increase scan interval (change cron to `*/10` for every 10 min)

### Netlify Function Timeout

**Free Tier:** 10 seconds max
**Pro Tier:** 26 seconds max

If scanner times out:
- Reduce stock count (10 → 5 stocks)
- Optimize API calls (batch requests)
- Upgrade to Netlify Pro ($19/mo for 26s timeout)

---

## Customization

### Change Scanned Stocks

Edit `scripts/intradayMarketScan.ts`:

```typescript
const INTRADAY_SYMBOLS = [
  'AAPL',  // Add or remove symbols here
  'MSFT',
  'TSLA',
  // ... up to 20-30 stocks (stay within API limits)
];
```

### Change Scan Frequency

Edit `netlify.toml`:

```toml
# Every 5 minutes (current)
schedule = "*/5 13-20 * * 1-5"

# Every 10 minutes (less frequent)
schedule = "*/10 13-20 * * 1-5"

# Every 15 minutes (least frequent)
schedule = "*/15 13-20 * * 1-5"
```

### Change Timeframe

Edit `scripts/intradayMarketScan.ts`:

```typescript
const DEFAULT_CONFIG: IntradayScanConfig = {
  timeframe: '5Min',        // Change to '1Min', '15Min', '30Min', '1Hour'
  lookbackBars: 60,         // Adjust bars (60 bars of 5-min = 5 hours)
  expirationMinutes: 30,    // How long setups stay valid
  minScore: 50,             // Minimum score threshold
};
```

### Change Expiration Time

Edit `scripts/intradayMarketScan.ts`:

```typescript
const DEFAULT_CONFIG: IntradayScanConfig = {
  expirationMinutes: 30,  // Change to 15, 45, 60, etc.
};
```

---

## Monitoring & Maintenance

### Daily Checks

1. **Check opportunities page:** Are new setups appearing during market hours?
2. **Check Netlify logs:** Any function errors?
3. **Check Alpaca usage:** Still within free tier limits?

### Weekly Cleanup

Database auto-expires old opportunities, but you can manually clean up:

```sql
-- Run in Supabase SQL Editor
DELETE FROM intraday_opportunities
WHERE expires_at < NOW() - INTERVAL '1 day';
```

---

## Cost Breakdown

| Component | Provider | Cost |
|-----------|----------|------|
| Intraday data | Alpaca (paper trading) | **$0/mo** |
| Scheduled scans | Netlify Free (100 hrs/mo) | **$0/mo** |
| Database | Supabase Free (500 MB) | **$0/mo** |
| Hosting | Netlify Free | **$0/mo** |
| **Total** | | **$0/mo** ✅ |

**Future Scaling (Optional):**
- Alpaca Live Trading: $0/mo (still free!)
- Netlify Pro: $19/mo (26s timeout, more functions)
- Supabase Pro: $25/mo (more storage, better performance)

---

## Next Steps

Once you have the Day Trader working:

1. **Track Performance:** Paper trade the setups, log which ones worked
2. **Optimize Scoring:** Adjust weights in `lib/scoring/` based on results
3. **Add More Stocks:** Gradually expand from 10 → 20 → 50 stocks
4. **Add Notifications:** Browser push notifications for new setups
5. **Add Charts:** Embed TradingView charts for each opportunity
6. **Auto-Trading:** Integrate with broker API (Alpaca supports auto-execution)

---

## Support

If you run into issues:

1. Check **Netlify function logs** (most common source of errors)
2. Check **Supabase database** (verify table exists, data is inserted)
3. Run **`npm run test-intraday`** locally (isolates API issues)
4. Check **Alpaca status page:** https://status.alpaca.markets

---

## Quick Reference Commands

```bash
# Test Alpaca connection + analysis
npm run test-intraday

# Run full intraday scan (manual)
npm run scan-intraday

# Start dev server
npm run dev

# Deploy to Netlify
git add . && git commit -m "Update" && git push
```

**URLs:**
- Local: http://localhost:3000/day-trader
- Production: https://your-site.netlify.app/day-trader
- Alpaca Dashboard: https://app.alpaca.markets/paper/dashboard/overview

---

**Ready to start day trading! 🚀**
