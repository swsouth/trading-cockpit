# Deployment Guide - Market Scanner Feature

## Pre-Deployment Checklist

### ✅ Step 1: Apply Database Migration

**IMPORTANT:** You must apply the database migration before deploying, or the scanner will not work.

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the **entire contents** of this file:
   ```
   supabase/migrations/20251118000000_create_market_opportunities.sql
   ```
5. Click **Run** to execute the migration
6. You should see: "Success. No rows returned"

#### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
cd project
npx supabase db push
```

---

### ✅ Step 2: Verify Environment Variables

Make sure these are set in **Netlify Dashboard → Site settings → Environment variables**:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Optional (but recommended for better data):**
- `NEXT_PUBLIC_FINNHUB_API_KEY` - For real-time stock quotes
- `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY` - For historical stock data
- `NEXT_PUBLIC_COINGECKO_API_KEY` - For crypto data (optional)

**Note:** Without the optional API keys, the app will use mock data for development.

---

### ✅ Step 3: Deploy to Netlify

Your Netlify configuration is already set up correctly in `netlify.toml`.

#### Deploy Methods:

**Method 1: Git Push (Automatic)**
1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add market scanner feature"
   git push
   ```
2. Netlify will auto-deploy (if connected to your repo)

**Method 2: Netlify CLI**
```bash
netlify deploy --prod
```

**Method 3: Manual Deploy via Netlify Dashboard**
1. Go to Netlify Dashboard
2. Click **Deploys**
3. Click **Trigger deploy → Deploy site**

---

## Verifying Deployment

After deployment completes:

1. **Check Scanner Page**
   - Navigate to `https://your-site.netlify.app/scanner`
   - You should see the Market Scanner interface

2. **Test the Scanner**
   - Make sure you have symbols in your watchlist first
   - Click **"Run Scan"**
   - You should see scanning progress
   - Results should appear with trading recommendations

3. **Check for Errors**
   - Open browser console (F12)
   - Look for any red errors
   - Check Netlify function logs if API calls fail

---

## Troubleshooting

### "No symbols in watchlist to scan"
- Add stocks to your watchlist from the Dashboard first
- The scanner needs at least one symbol to analyze

### "Failed to run scan"
- Check browser console for errors
- Verify environment variables are set correctly
- Check Netlify function logs for API errors

### Database errors
- Make sure you applied the migration (Step 1)
- Verify RLS policies are enabled
- Check you're logged in with a valid user

### API rate limit errors
- Free tier API limits may be hit with large watchlists
- Scanner batches requests (5 at a time) to help avoid this
- Consider upgrading API keys if needed

---

## Post-Deployment: What's New

Users will see:

1. **New "Scanner" menu item** in the sidebar
2. **Scanner page** at `/scanner` with:
   - "Run Scan" button
   - Filters for action types, confidence, R/R ratio
   - Results showing specific trading recommendations
   - Entry prices, targets, stops, and risk/reward ratios

3. **Opportunity Cards** showing:
   - BUY/SELL/BREAKOUT recommendations
   - Specific entry zones and target prices
   - Stop loss levels
   - Reasoning why the setup is valid
   - Confidence levels

---

## Known Issues

### Build Warnings (Safe to Ignore)
You may see warnings during build about:
- "Multiple modules with names that only differ in casing"
- This is due to OneDrive path casing (`OneDrive` vs `onedrive`)
- **Does not affect functionality**
- Netlify Next.js plugin handles this correctly

### Static Generation Errors (Safe to Ignore)
You may see errors about:
- "Cannot read properties of null (reading 'useContext')"
- This happens during local builds with Next.js static generation
- **Netlify's Next.js plugin handles this properly**
- App works correctly when deployed

---

## Feature Scaling Notes

This is currently the **personal watchlist scanner** (Option A).

When ready to scale to **market-wide scanner** (Option B):

1. The database schema is already multi-tenant ready
2. Scanner library supports any symbol list
3. Just need to:
   - Add stock universe definitions
   - Create scheduled Supabase Edge Function
   - Set `user_id = null` for market-wide scans
   - Add email notification system

---

## Support

If issues persist:
- Check Netlify deploy logs
- Check Supabase logs
- Verify all environment variables
- Ensure database migration was applied successfully

Database migration location:
```
supabase/migrations/20251118000000_create_market_opportunities.sql
```
