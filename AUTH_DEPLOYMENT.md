# Authentication & Production Deployment Guide

## Overview

Authentication has been fully implemented using Supabase Auth with email/password authentication. The application now requires users to sign in before accessing any features, with proper Row Level Security (RLS) policies ensuring data isolation between users.

---

## Authentication Features Implemented

### 1. **Auth Pages**
- `/auth/login` - Sign in page
- `/auth/signup` - Create new account page
- `/auth/forgot-password` - Password reset page

### 2. **Route Protection**
- All app routes (/, /library, /settings, /ticker/*) require authentication
- Unauthenticated users are automatically redirected to `/auth/login`
- Auth pages are accessible without authentication

### 3. **Session Management**
- Centralized auth context (`AuthContext`)
- Automatic session refresh
- Persistent login across page reloads
- Sign out functionality

### 4. **Database Security**
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Foreign key constraints enforced
- Demo mode removed

---

## Deployment Steps

### Step 1: Run the RLS Migration

Before deploying to production, you MUST run the RLS migration to secure your database:

```bash
cd project
```

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

**Option B: Manual via Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Open `supabase/migrations/20251117000000_enable_production_rls.sql`
5. Copy and paste the entire migration SQL
6. Click "Run"

### Step 2: Configure Email Authentication

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider (should be enabled by default)
3. Configure email templates (optional):
   - Go to Authentication → Email Templates
   - Customize "Confirm signup", "Invite user", "Reset password" templates

### Step 3: Set Up Email Sending

**For Development:**
- Supabase's default email sending works fine
- Check spam folder for confirmation emails

**For Production:**
1. Go to Supabase Dashboard → Project Settings → Auth
2. Configure SMTP settings with your email provider:
   - SendGrid
   - AWS SES
   - Mailgun
   - etc.

### Step 4: Configure Site URL & Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to your production domain (e.g., `https://trading-cockpit.vercel.app`)
3. Add **Redirect URLs**:
   ```
   https://your-domain.com/**
   https://your-domain.com/auth/**
   ```

### Step 5: Deploy to Vercel/Netlify

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Environment Variables:**
Make sure these are set in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FINNHUB_API_KEY`
- `FMP_API_KEY`

---

## Testing Authentication

### Test Signup Flow
1. Navigate to `/auth/signup`
2. Enter email and password (min 6 characters)
3. Click "Sign Up"
4. Check email for confirmation link
5. Click confirmation link
6. You'll be redirected to the dashboard

### Test Login Flow
1. Navigate to `/auth/login`
2. Enter credentials
3. Click "Sign In"
4. Should redirect to dashboard

### Test Password Reset
1. Navigate to `/auth/forgot-password`
2. Enter your email
3. Check email for reset link
4. Click link and set new password

### Test Route Protection
1. Sign out using the sidebar button
2. Try to access `/` - should redirect to `/auth/login`
3. Try to access `/library` - should redirect to `/auth/login`
4. Try to access `/settings` - should redirect to `/auth/login`

### Test Data Isolation
1. Sign up with two different accounts
2. Create watchlist items, notes, alerts in account 1
3. Sign out and sign in with account 2
4. Verify you cannot see account 1's data
5. Create different data in account 2
6. Sign out and back into account 1
7. Verify account 1's data is intact and account 2's data is not visible

---

## Security Checklist

Before going to production, verify:

- [ ] RLS migration has been run
- [ ] Demo policies have been removed
- [ ] Foreign key constraints are enforced
- [ ] Email confirmation is enabled (optional but recommended)
- [ ] SMTP is configured for production emails
- [ ] Site URL is set to production domain
- [ ] Redirect URLs are configured
- [ ] All environment variables are set in deployment platform
- [ ] API rate limits are configured (FMP: 250 requests/day free tier)

---

## Important Notes

### Demo Mode Removed
- The demo UUID `00000000-0000-0000-0000-000000000000` no longer works
- All users must create an account to use the app
- Previous demo data will be deleted by the migration

### Email Confirmation
By default, Supabase sends a confirmation email. You can disable this in:
- Supabase Dashboard → Authentication → Settings
- Toggle "Enable email confirmations"

### Rate Limiting
- Consider implementing rate limiting for auth endpoints
- Supabase has built-in rate limiting (60 requests/hour by default)

### Password Requirements
Current requirements:
- Minimum 6 characters
- You can customize this in Supabase Dashboard → Authentication → Settings

---

## Troubleshooting

### "Email not confirmed" error
- Check spam folder for confirmation email
- Disable email confirmation in Supabase (not recommended for production)
- Check Supabase logs for email delivery issues

### Redirect loop after login
- Verify Site URL is set correctly in Supabase
- Clear browser cookies and local storage
- Check browser console for errors

### RLS policy errors
- Verify migration was run successfully
- Check Supabase Dashboard → Database → Policies
- Ensure policies exist for all tables

### API errors in production
- Verify all environment variables are set
- Check API key quotas (FMP has 250 req/day limit on free tier)
- Monitor Supabase logs for database errors

---

## Next Steps After Deployment

1. **Monitor Usage**
   - Check Supabase Dashboard for user signups
   - Monitor API usage (Finnhub, FMP)
   - Watch for errors in Supabase logs

2. **Consider Upgrading API Plans**
   - FMP free tier: 250 requests/day
   - Finnhub free tier: 60 requests/minute
   - Upgrade if you exceed limits

3. **Add Features** (Optional)
   - Social login (Google, GitHub)
   - Magic link (passwordless) authentication
   - Two-factor authentication
   - Email notifications for price alerts

4. **Performance Optimization**
   - Add database indexes for frequently queried fields
   - Implement caching for market data
   - Monitor and optimize slow queries

---

## Architecture Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─── /auth/login ──────► Supabase Auth
       ├─── /auth/signup ─────► Supabase Auth
       ├─── / (protected) ────► AuthProvider ──► Dashboard
       ├─── /library ─────────► AuthProvider ──► Library
       └─── /settings ────────► AuthProvider ──► Settings
                                     │
                                     ├─── useAuth() hook
                                     ├─── Session management
                                     └─── Automatic redirect

Database RLS:
  watchlist_items    ──► user_id = auth.uid()
  ticker_notes       ──► user_id = auth.uid()
  research_uploads   ──► user_id = auth.uid()
  price_alerts       ──► user_id = auth.uid()
  combined_signals   ──► user_id = auth.uid()
  profiles           ──► id = auth.uid()
```

---

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Check browser console for JavaScript errors
3. Verify RLS policies are active (Dashboard → Database → Policies)
4. Test with a fresh incognito window to rule out caching issues
