# Day Trader - Quick Start (5 Minutes)

Get the intraday scanner running in 5 minutes.

---

## Step 1: Alpaca Signup (2 min)

1. Go to: **https://alpaca.markets**
2. Click **"Sign Up"** → Choose **"Paper Trading Only"** (FREE)
3. Verify email and log in
4. Go to **"Your API Keys"** → Copy both keys:
   - API Key ID (starts with `PK...`)
   - Secret Key (copy NOW - only shown once!)

---

## Step 2: Add Keys to `.env.local` (1 min)

```bash
ALPACA_API_KEY=PKxxxxxxxxxxxxxx
ALPACA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

**Save the file!**

---

## Step 3: Database Migration (1 min)

1. Open **Supabase Dashboard** → SQL Editor
2. Run this file: `supabase/migrations/20251126000000_create_intraday_opportunities.sql`
3. Click **"Run"**

---

## Step 4: Test It (1 min)

```bash
npm run test-intraday
```

**Expected:** ✅ API keys configured, ✅ Fetched 60 bars, ✅ SETUP FOUND

---

## Step 5: View UI

```bash
npm run dev
```

Go to: **http://localhost:3000/day-trader**

---

## Deploy to Netlify

1. Add Alpaca keys to **Netlify Environment Variables**
2. Push to GitHub: `git push`
3. Done! Scanner runs automatically every 5 min during market hours

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "API keys not found" | Check `.env.local` has correct variable names |
| "No opportunities" | Market may be closed or no valid setups |
| Test script fails | Verify Alpaca keys are correct |

---

**Full docs:** See `DAY_TRADER_SETUP.md`

**Questions?** Check Netlify function logs for errors.
