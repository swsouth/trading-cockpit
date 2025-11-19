# Deployment Guide

## Netlify Environment Variables

Your application requires the following environment variables to be configured in Netlify:

### Required Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://your-project.supabase.co`
   - Find it in: Supabase Dashboard → Project Settings → API

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Find it in: Supabase Dashboard → Project Settings → API

### Optional Variables (for market data features)

3. **NEXT_PUBLIC_FINNHUB_API_KEY**
   - For real-time stock quotes
   - Get free key at: https://finnhub.io

4. **NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY**
   - For historical candlestick data
   - Get free key at: https://www.alphavantage.co/support/#api-key

## How to Add Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable** or **Add environment variables**
4. Add each variable with its corresponding value
5. Click **Save**
6. Trigger a new deployment (or it will deploy automatically)

## Verifying Your Deployment

After adding the environment variables and redeploying:

1. Visit your site URL
2. Try logging in or signing up
3. Check the browser console for any errors

If you see authentication errors, double-check that your Supabase URL and key are correct.
