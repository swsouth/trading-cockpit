# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Personal Trading Cockpit** - A Next.js 13 trading analysis platform with automated market scanning, technical analysis, and trade recommendation generation. Uses Supabase for database/auth, deploys to Netlify, and runs daily market scans via GitHub Actions.

**Tech Stack:** Next.js 13 (App Router), TypeScript, Tailwind CSS, Supabase, Netlify

---

## Essential Commands

### Development
```bash
cd project                   # All commands run from project/ directory
npm run dev                  # Start dev server (port 3000)
npm run build               # Production build
npm run typecheck           # TypeScript validation (no emit)
npm run lint                # ESLint check
```

### Market Scanner
```bash
npm run populate-universe    # Populate scan_universe with 128 stocks (one-time setup)
npm run test-scanner        # Test scanner with 5 stocks (AAPL, MSFT, GOOGL, TSLA, NVDA)
npm run scan-market         # Full market scan (all 128 stocks)
npm run test-populate       # Generate 8 test recommendations for UI testing
```

### Environment Setup
All scripts use `npx tsx` and load `.env.local` via dotenv. Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (scripts only, never client-side)

Optional (fallback to mock data if missing):
- `NEXT_PUBLIC_FINNHUB_API_KEY` - Real-time quotes
- `FMP_API_KEY` - Historical candles

---

## Architecture Overview

### Core Analysis Pipeline

The market scanner implements a sophisticated technical analysis pipeline:

```
Raw Candles → Channel Detection → Pattern Recognition → Trade Setup → Scoring → Storage
```

**1. Channel Detection** (`lib/analysis.ts`)
- Identifies support/resistance levels using linear regression
- Requires minimum 2 support + 2 resistance touches
- Classifies price position: `near_support`, `near_resistance`, `inside`, `broken_out`
- Calculates channel width, slope, and out-of-band percentage

**2. Pattern Recognition** (`lib/analysis.ts`)
- Detects 7 candlestick patterns (bullish/bearish/neutral)
- Bullish: `bullish_engulfing`, `hammer`, `piercing_line`
- Bearish: `bearish_engulfing`, `shooting_star`, `dark_cloud_cover`
- Neutral: `doji`
- Uses strict percentage thresholds for pattern validation

**3. Opportunity Scoring** (`lib/scoring/`)
- **0-100 scale** composed of 5 factors:
  - Trend Strength: 30 pts (channel clarity, slope, price position)
  - Pattern Quality: 25 pts (pattern reliability score)
  - Volume Confirmation: 20 pts (recent vs 30-day average)
  - Risk/Reward: 15 pts (R:R ratio quality, channel-based targets)
  - Momentum/RSI: 10 pts (RSI positioning in optimal zones)
- **Confidence levels:** High (75+), Medium (60-74), Low (<60)
- Filters out scores below 60 for recommendations

**4. Trade Calculator** (`lib/tradeCalculator/`)
- **Entry:** Support/resistance based (near levels or pullback/bounce)
- **Stop Loss:** Lesser of channel-based (2% beyond S/R) or ATR-based (2.5x ATR), capped at 10%
- **Target:** Greater of channel-based (opposite boundary -2%) or R:R-based (minimum 2:1)
- Validates all prices: entry between stop/target, minimum 2:1 R:R, max 15% risk

**5. Setup Detection**
- **High Confidence:** Near S/R AND pattern detected
- **Medium Confidence:** Near S/R OR pattern detected
- **Low Confidence:** Filtered out (not actionable)

### Daily Market Scanner Flow

**Location:** `scripts/dailyMarketScan.ts`

```
Trigger (Cron/Manual)
  ↓
Fetch 128 stocks from scan_universe table
  ↓
Process in batches (25 stocks, 2s delay between batches)
  ↓
For each stock:
  - Fetch 60 days of OHLC candles (FMP or mock)
  - Run channel detection (support/resistance)
  - Run pattern recognition (candlestick patterns)
  - Generate trade recommendation (entry/target/stop)
  - Calculate opportunity score (0-100)
  ↓
Filter: Keep only score >= 60 (medium+ confidence)
  ↓
Sort by score descending, take top 30
  ↓
Store in trade_recommendations table
  ↓
Auto-cleanup: Delete recommendations >30 days old
  ↓
UI displays on /recommendations page
```

**Performance:**
- Batch size: 25 stocks (configurable)
- Rate limiting: 2s between batches
- Estimated runtime: 12-15 seconds for 128 stocks (excluding API delays)
- Graceful error handling for API failures or missing data

### Database Schema (Supabase)

**Key Tables:**

1. **`scan_universe`** - 128 stocks for daily scanning
   - S&P 500 constituents + high-volume stocks
   - Sectors: Technology (45), Financial (18), Healthcare (12), etc.
   - RLS: Read-only for authenticated users

2. **`trade_recommendations`** - Daily scan results (top 30)
   - Columns: symbol, scan_date, recommendation_type (long/short), entry_price, target_price, stop_loss, opportunity_score, confidence_level, rationale
   - Unique constraint: (symbol, scan_date)
   - Auto-expires after 7 days via trigger
   - RLS: Readable by authenticated users, writable by service_role only

3. **`watchlist_items`** - User watchlists
   - Supports stocks and crypto
   - User-specific (user_id isolation via RLS)

4. **`combined_signals`** - Trading signal history
   - Stores channel + pattern + bias combinations
   - Links to watchlist_items

**Migrations:** Located in `supabase/migrations/`
- Latest: `20251122000000_create_trade_recommendations_and_scan_universe.sql`
- Apply via Supabase Dashboard SQL Editor or CLI

### API Integration & Fallback Strategy

**Market Data Sources** (`lib/marketData.ts`):
- **Primary:** Finnhub (quotes), FMP (candles)
- **Fallback:** Mock data generators with realistic patterns
- **Caching:** 1-minute in-memory cache
- **Rate Limiting:** Respects API tier limits (60/min Finnhub, 250/day FMP free tier)

**Why Mock Data:**
- Allows development/testing without API keys
- Graceful degradation if API unavailable
- Generates realistic OHLC with trends, volatility, and patterns

**Crypto Data** (`lib/cryptoData.ts`):
- Sources: Coinbase, Binance, CoinGecko
- Same fallback strategy as stocks

---

## Important Patterns & Conventions

### File Organization
- **Business logic:** `lib/` - Pure functions, no UI dependencies
- **UI components:** `components/` and `components/ui/` (shadcn)
- **Pages:** `app/` - Next.js 13 App Router structure
- **Automation:** `scripts/` - CLI tools, scanner, data population
- **Database:** `supabase/migrations/` - Version-controlled schema

### Type Safety
- **Source of truth:** `lib/types.ts`
- All types match database schema exactly
- Shared across client/server
- Use `TradeRecommendation`, `CandleData`, `ChannelDetectionResult`, `OpportunityScore`, etc.

### State Management
- **Auth:** React Context (`lib/AuthContext.tsx`) with `useAuth()` hook
- **Local state:** `useState`/`useEffect` for component-level
- **Realtime:** Supabase subscriptions for live price alerts

### Error Handling
- All API calls wrapped in try/catch
- User-friendly messages via toast notifications
- Fallback to mock data on API failure
- Logs errors to console with context

### Authentication & RLS
- **Auth:** Supabase email/password (`/auth/login`, `/auth/signup`)
- **RLS:** All user tables filtered by `auth.uid() = user_id`
- **Protected routes:** Check `useAuth()` in page components
- **Service role:** Only for server-side scripts (never client-side)

---

## Deployment Architecture

### Netlify Configuration
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Plugin:** `@netlify/plugin-nextjs` (v5.14.5)
- **Functions:** Next.js API routes become Netlify Functions

### Environment Variables (Netlify)
**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for scanner API)
- `SCAN_SECRET_KEY` (for scanner API authentication)

**Optional:**
- `NEXT_PUBLIC_FINNHUB_API_KEY`
- `FMP_API_KEY`

### Scheduled Scanning (GitHub Actions)
**Workflow:** `.github/workflows/daily-market-scan.yml`
- **Schedule:** Mon-Fri at 5:00 PM ET (9 PM UTC)
- **Cron:** `0 21 * * 1-5`
- **Action:** POST to `/api/scan/trigger` with `SCAN_SECRET_KEY`
- **Duration:** ~30 seconds for full scan

**Secrets Required (GitHub):**
- `SCAN_SECRET_KEY` - Matches Netlify env var
- `SITE_URL` - Your Netlify domain (e.g., `your-site.netlify.app`)

---

## Session Continuity System

### Session Log
**Location:** `.claude/session-log.md`
- **Purpose:** Cross-session context preservation
- **Format:** Current Session + Previous Sessions + Guidelines
- **Update:** At end of each session with summary of work done
- **Read:** At start of each session via SessionStart hook

**Current Status (from session log):**
- Phase 7 (Cron Automation) complete
- Daily scanner runs Mon-Fri at 5 PM ET
- MCP servers configured (Supabase read-only, Netlify)
- Next: Test MCP connections or add real market data APIs

### Hooks Configuration
**Location:** `.claude/settings.local.json`
- **SessionStart:** Reads session log, provides 2-3 sentence status update
- **enableAllProjectMcpServers:** Auto-approves `.mcp.json` servers

---

## MCP Servers (Model Context Protocol)

**Configuration:** `.mcp.json`

### Supabase MCP Server
- **URL:** `https://mcp.supabase.com/mcp?project_ref=hjfokaueppsvpcjzrcjg`
- **Mode:** Read-only (safe - cannot modify data)
- **Capabilities:** Query database, inspect schema, count records
- **Example:** "Show me all recommendations with score > 80"

### Netlify MCP Server
- **Command:** `npx -y @netlify/mcp`
- **Capabilities:** Check deployments, view logs, trigger builds, manage env vars
- **Example:** "What's the status of the latest deployment?"

**Activation:** Restart Claude Code after configuration

**Documentation:** `docs/MCP_SERVERS_SETUP.md`

---

## Sub-Agent System

**Location:** `.claude/agents/`

Four specialized agents for specific tasks:

1. **trading-specialist-sme** (Red) - Trade analysis, feature reviews, risk management
2. **market-data-integrity** (Blue) - Data quality, corporate actions, QA
3. **strategy-signal-engineering** (Green) - Signal specs, filters, position sizing
4. **research-backtesting-scientist** (Purple) - Strategy validation, robustness testing

**Usage Protocol:** `.claude/agents/README.md`
- 3-question test: Viability, Feasibility, Functionality, Value (RICE scoring)
- Token/latency management guidelines
- When to use which agent

---

## Key Documentation Reference

### Implementation Plans
- `DAILY_SCANNER_IMPLEMENTATION.md` - Complete scanner roadmap (Phases 1-7)
- `MARKET_SCANNER_SPEC.md` - Premium feature spec, monetization strategy
- `AUTH_DEPLOYMENT.md` - Authentication and deployment guide

### Technical Documentation
- `lib/scoring/README.md` - Scoring algorithm deep dive
- `lib/tradeCalculator/README.md` - Trade calculator specifications
- `scripts/scanner/README.md` - Scanner implementation details

### Setup Guides
- `docs/PHASE7_CRON_AUTOMATION.md` - Cron automation setup
- `docs/MCP_SERVERS_SETUP.md` - MCP server configuration
- `docs/HOOKS_EXAMPLES.md` - Hook examples and best practices

### Project Context
- `.env.local.example` - Environment variable template
- `DEPLOYMENT_GUIDE.md` - Pre-deployment checklist
- `FUTURE_ENHANCEMENTS.md` - Feature backlog

---

## Common Development Scenarios

### Adding a New Stock to Scan Universe
1. Edit `scripts/stockUniverse.ts` - Add to appropriate sector array
2. Run `npm run populate-universe` - Updates database
3. Next scan will include new stock

### Testing Scanner Changes
1. Modify scanner logic in `lib/scoring/` or `lib/tradeCalculator/`
2. Run `npm run test-scanner` - Tests with 5 stocks (fast)
3. Check console output for scores, recommendations
4. Run `npm run test-populate` - Generates UI test data
5. View results at `localhost:3000/recommendations`

### Debugging Channel Detection
1. Open `lib/analysis.ts` - `detectChannels()` function
2. Add console.logs for support/resistance arrays
3. Run scanner on specific stock
4. Check: minimum touches (2+2), slope calculations, out-of-band %

### Adjusting Scoring Weights
1. Edit `lib/scoring/index.ts` - `calculateOpportunityScore()`
2. Modify component weights (trend 30pts, pattern 25pts, etc.)
3. Test with `npm run test-scanner`
4. Compare before/after scores in output

### Adding New Candlestick Pattern
1. Edit `lib/analysis.ts` - `detectPatterns()` function
2. Add pattern detection logic (check OHLC relationships)
3. Update `PatternType` in `lib/types.ts`
4. Add quality score in `lib/scoring/components.ts` - `scorePattern()`
5. Test with historical data that exhibits the pattern

### Deploying Changes
1. Ensure `.env.local` has correct Supabase project (not old `lvmkvmwicbthcymoijca`)
2. Run `npm run typecheck` - Fix type errors
3. Commit and push to GitHub
4. Netlify auto-deploys on push to `main`
5. Check Netlify dashboard for build logs
6. If functions fail, check environment variables match `.env.local`

---

## Troubleshooting

### Scanner Returns 0 Recommendations
**Check:**
1. API keys configured? (Or expect mock data)
2. Minimum score threshold - Default 60, may be too high
3. Console logs - Look for API errors or missing candle data
4. Database - Run `npm run test-populate` to verify table access

### Netlify Build Fails
**Common Issues:**
1. Missing environment variables (especially `NEXT_PUBLIC_SUPABASE_*`)
2. Secret scanner detects keys in docs (use placeholders, not actual keys)
3. TypeScript errors - Run `npm run typecheck` locally first
4. Node version mismatch - Netlify uses v18, update if needed

### Database Migration Issues
**Solutions:**
1. Check migration syntax in Supabase SQL Editor
2. Verify RLS policies allow expected operations
3. Test with `psql` or Supabase Studio
4. For service_role operations, ensure key is in `.env.local`

### MCP Servers Not Loading
**Checklist:**
1. `.mcp.json` exists in project root
2. `.claude/settings.local.json` has `enableAllProjectMcpServers: true`
3. Restart Claude Code completely
4. Check for error messages during startup

### Recommendations Page Shows Zeros
**Debug Steps:**
1. Check browser console (F12) for fetch errors
2. Verify user is authenticated (`useAuth()`)
3. Check Network tab - Is API call being made?
4. Check Netlify function logs for server-side errors
5. Verify environment variables match between local and Netlify

---

## Performance Considerations

### Scanner Optimization
- **Batch size:** 25 stocks (balance speed vs API limits)
- **Rate limiting:** 2s between batches (respects API quotas)
- **Timeout:** Netlify free tier = 10s function timeout (scanner may fail)
- **Solution:** Reduce universe to 50-75 stocks or upgrade to Pro (26s timeout)

### API Usage
- **Finnhub:** 60 calls/min free tier (batch carefully)
- **FMP:** 250 calls/day free tier (cache aggressively)
- **Mock data:** Zero API calls (use for development)

### Database Performance
- **Indexes:** Created on `scan_date`, `opportunity_score`, `is_active`
- **Cleanup:** Auto-deletes recommendations >30 days (via cron)
- **RLS:** Properly indexed user_id columns

---

## Production Readiness Checklist

Before going live:
- [ ] All environment variables set in Netlify
- [ ] Database migrations applied
- [ ] RLS policies tested (can't access other users' data)
- [ ] Stock universe populated (`npm run populate-universe`)
- [ ] GitHub Actions workflow tested (manual trigger first)
- [ ] Error handling verified (API failures, missing data)
- [ ] Real API keys added (or accept mock data)
- [ ] Session log updated with current status

---

## Quick Reference

| Task | Command | Location |
|------|---------|----------|
| Start dev server | `npm run dev` | `project/` |
| Test scanner | `npm run test-scanner` | `project/` |
| Full scan | `npm run scan-market` | `project/` |
| Populate DB | `npm run populate-universe` | `project/` |
| Type check | `npm run typecheck` | `project/` |
| View recommendations | `localhost:3000/recommendations` | Browser |
| Check session log | `.claude/session-log.md` | Root |
| Read scanner spec | `DAILY_SCANNER_IMPLEMENTATION.md` | `project/` |

**Current Supabase Project:** `hjfokaueppsvpcjzrcjg` ✅ (Not `lvmkvmwicbthcymoijca`)
