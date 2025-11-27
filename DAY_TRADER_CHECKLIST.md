# Day Trader - Setup Checklist

Quick checklist to get the Day Trader feature running. Check off each item as you complete it.

---

## Pre-Deployment (Local Testing)

### 1. Alpaca Account Setup
- [ ] Signed up at https://alpaca.markets
- [ ] Chose "Paper Trading Only" (free)
- [ ] Verified email
- [ ] Logged into dashboard
- [ ] Copied API Key ID (starts with `PK...`)
- [ ] Copied Secret Key (save somewhere safe!)

### 2. Environment Variables
- [ ] Opened `.env.local` file
- [ ] Added `ALPACA_API_KEY=PKxxxxxxxxx`
- [ ] Added `ALPACA_SECRET_KEY=xxxxxxxxx`
- [ ] Added `ALPACA_BASE_URL=https://paper-api.alpaca.markets`
- [ ] Saved file

### 3. Database Migration
- [ ] Opened Supabase Dashboard
- [ ] Went to SQL Editor
- [ ] Opened file: `supabase/migrations/20251126000000_create_intraday_opportunities.sql`
- [ ] Copied entire contents
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run"
- [ ] Verified success (no errors)
- [ ] Checked Table Editor - `intraday_opportunities` table exists

### 4. Test Locally
- [ ] Ran `npm run test-intraday` in terminal
- [ ] Saw "✅ API keys configured"
- [ ] Saw "✅ Fetched XX bars" for each stock
- [ ] No errors in console
- [ ] (Optional) Ran `npm run scan-intraday` - full scan works

### 5. View UI Locally
- [ ] Ran `npm run dev`
- [ ] Opened http://localhost:3000/day-trader
- [ ] Saw market status card (OPEN or CLOSED)
- [ ] Saw opportunities list (if market open and scan ran)
- [ ] Page auto-refreshes (check every 10 seconds)
- [ ] Countdown timers work (update every second)

---

## Deployment to Netlify

### 6. Add Environment Variables to Netlify
- [ ] Logged into Netlify Dashboard
- [ ] Selected your site
- [ ] Went to Site Settings → Environment Variables
- [ ] Added `ALPACA_API_KEY` = your key
- [ ] Added `ALPACA_SECRET_KEY` = your secret
- [ ] Added `ALPACA_BASE_URL` = https://paper-api.alpaca.markets
- [ ] Verified existing variables are present:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SCAN_SECRET_KEY`

### 7. Deploy Code
- [ ] Committed changes: `git add .`
- [ ] Created commit: `git commit -m "Add Day Trader intraday feature"`
- [ ] Pushed to GitHub: `git push origin main`
- [ ] Netlify auto-deployed (check Deploy Log)
- [ ] Build succeeded (green checkmark)
- [ ] No errors in deploy log

### 8. Verify Netlify Functions
- [ ] Went to Functions tab in Netlify Dashboard
- [ ] Saw `intraday-scan-scheduled` function
- [ ] Schedule shows: `*/5 13-20 * * 1-5`
- [ ] (Optional) Manually triggered function (click "Trigger")
- [ ] Checked function logs (no errors)

---

## Production Testing (During Market Hours)

### 9. Test Production Site
- [ ] Waited for market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
- [ ] Opened https://your-site.netlify.app/day-trader
- [ ] Saw "Market Status: OPEN"
- [ ] Waited 5-10 minutes (for first scheduled scan)
- [ ] Opportunities appeared on page
- [ ] Countdown timers work
- [ ] Score colors correct (green 80+, yellow 60-79, red <60)
- [ ] Auto-refresh working (new opportunities appear)

### 10. Verify Scheduled Function is Running
- [ ] Went to Netlify Dashboard → Functions → `intraday-scan-scheduled`
- [ ] Clicked "Logs" tab
- [ ] Saw log entries every 5 minutes during market hours
- [ ] Logs show "Scanner completed successfully"
- [ ] No errors in logs

### 11. Verify Database
- [ ] Opened Supabase Dashboard → Table Editor
- [ ] Opened `intraday_opportunities` table
- [ ] Saw new records (from last 30 minutes)
- [ ] `status` = 'active'
- [ ] `expires_at` is in the future
- [ ] `user_id` matches your user ID

---

## Ongoing Monitoring

### Daily Checks
- [ ] Check `/day-trader` page during market hours (are opportunities appearing?)
- [ ] Check Netlify function logs (any errors?)
- [ ] Check Alpaca usage (still within 200 req/min limit?)

### Weekly Maintenance
- [ ] Review opportunities - which setups worked?
- [ ] Adjust scoring if needed (`lib/scoring/`)
- [ ] Clean up old data (auto-expires after 30 min, but can manually delete)

---

## Troubleshooting (If Something Doesn't Work)

### No Opportunities Showing
- [ ] Market is open? (check market status card)
- [ ] Scanner ran? (wait 5 min or check Netlify logs)
- [ ] Database has data? (check Supabase table)
- [ ] Scores above 50? (check scanner console output)

### Test Script Fails
- [ ] API keys correct in `.env.local`?
- [ ] Alpaca account active?
- [ ] Internet connection working?
- [ ] Check Alpaca status: https://status.alpaca.markets

### Netlify Function Errors
- [ ] Environment variables set correctly?
- [ ] Function timeout (<10s for free tier)?
- [ ] Check function logs for specific error message
- [ ] Redeploy if needed

### Database Errors
- [ ] Migration ran successfully?
- [ ] Table exists in Supabase?
- [ ] RLS policies correct?
- [ ] Service role key in Netlify env vars?

---

## Success Criteria

You know it's working when:

✅ Test script passes without errors
✅ Local UI shows opportunities during market hours
✅ Production UI shows opportunities during market hours
✅ Netlify function logs show successful scans every 5 min
✅ Database has new records every 5 min
✅ Countdown timers update smoothly
✅ Market status card shows correct status

---

## Done! 🎉

Once all checkboxes are complete, your Day Trader feature is fully operational!

**Next:** Start paper trading the setups and track which ones work best.

---

**Need help?** See `DAY_TRADER_SETUP.md` for detailed troubleshooting.
