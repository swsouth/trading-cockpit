# Apply Library Page Migration

## Overview

This migration adds Stock Universe Management features to the Library page:
- Status column to `scan_universe` (active/paused/removed)
- `intraday_scanner_config` table for day trader stock management
- Analytics views for 30/60/90 day performance metrics
- Pause/resume helper functions

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/hjfokaueppsvpcjzrcjg

2. Navigate to **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy the ENTIRE contents of:
   ```
   supabase/migrations/20251127000000_add_stock_universe_management.sql
   ```

5. Paste into the SQL Editor

6. Click **Run** (or press Ctrl+Enter)

7. Verify success:
   - Check for green success message
   - No error messages in console

### Option 2: Via Supabase CLI

```bash
# From project root
supabase db push
```

## What This Migration Does

### 1. Adds Status Column to scan_universe

```sql
ALTER TABLE scan_universe
  ADD COLUMN status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'paused', 'removed'));
```

- **active**: Stock is being scanned (default for all existing stocks)
- **paused**: User temporarily excluded stock from scans
- **removed**: Soft-deleted (keeps historical data)

### 2. Creates intraday_scanner_config Table

Stores the 50 stocks for the day trader scanner (previously hardcoded).

```sql
CREATE TABLE intraday_scanner_config (
  id UUID PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  sector TEXT,
  market_cap TEXT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  notes TEXT
);
```

Seeded with all 50 current INTRADAY_SYMBOLS from `scripts/intradayMarketScan.ts`.

### 3. Creates Analytics Views

**daily_scanner_analytics:**
- Shows 30/60/90 day opportunity counts per stock
- Average score, max score, last opportunity date
- For daily market scanner

**intraday_scanner_analytics:**
- Shows 7/30/90 day opportunity counts per stock
- Average score, days active
- For day trader scanner

### 4. Creates Helper Functions

- `pause_daily_stock(symbol)` - Pause a stock in daily scanner
- `resume_daily_stock(symbol)` - Resume a paused daily stock
- `pause_intraday_stock(symbol)` - Pause a stock in day trader
- `resume_intraday_stock(symbol)` - Resume a paused day trader stock

### 5. Sets Up Row Level Security

- All authenticated users can read both tables
- All authenticated users can pause/resume stocks
- Service role can do anything (for scanners)

## Verify Migration Success

After applying, run these queries to verify:

### Check scan_universe has status column:
```sql
SELECT symbol, status
FROM scan_universe
LIMIT 5;
```

Expected: All stocks have `status = 'active'`

### Check intraday_scanner_config is populated:
```sql
SELECT COUNT(*) as total_stocks,
       COUNT(*) FILTER (WHERE is_active = true) as active_stocks
FROM intraday_scanner_config;
```

Expected: `total_stocks = 50, active_stocks = 50`

### Check analytics views exist:
```sql
SELECT * FROM daily_scanner_analytics LIMIT 3;
SELECT * FROM intraday_scanner_analytics LIMIT 3;
```

Expected: Returns data with opportunity counts

## Test Pause/Resume Functions

```sql
-- Pause TSLA in daily scanner
SELECT pause_daily_stock('TSLA');

-- Verify it's paused
SELECT symbol, status FROM scan_universe WHERE symbol = 'TSLA';
-- Should show: status = 'paused'

-- Resume TSLA
SELECT resume_daily_stock('TSLA');

-- Verify it's active again
SELECT symbol, status FROM scan_universe WHERE symbol = 'TSLA';
-- Should show: status = 'active'
```

## Rollback (If Needed)

If something goes wrong, rollback with:

```sql
-- Drop new objects
DROP VIEW IF EXISTS daily_scanner_analytics;
DROP VIEW IF EXISTS intraday_scanner_analytics;
DROP TABLE IF EXISTS intraday_scanner_config;
DROP FUNCTION IF EXISTS pause_daily_stock;
DROP FUNCTION IF EXISTS resume_daily_stock;
DROP FUNCTION IF EXISTS pause_intraday_stock;
DROP FUNCTION IF EXISTS resume_intraday_stock;

-- Remove status column
ALTER TABLE scan_universe DROP COLUMN IF EXISTS status;
ALTER TABLE scan_universe DROP COLUMN IF EXISTS paused_at;
ALTER TABLE scan_universe DROP COLUMN IF EXISTS removed_at;
```

## After Migration

1. **Restart dev server** (if running):
   ```bash
   # Stop: Ctrl+C
   npm run dev
   ```

2. **Visit Library page**:
   ```
   http://localhost:3000/library
   ```

3. **You should see**:
   - Two tabs: "Stock Universe" and "Research Files"
   - Stock Universe tab shows:
     - Daily Scanner sub-tab (128 stocks)
     - Day Trader sub-tab (50 stocks)
   - Performance metrics (30/60/90 day opportunities)
   - Pause/Resume buttons for each stock

4. **Test pause/resume**:
   - Click "⏸️ Pause" on any stock
   - Verify status changes to "🟡 Paused"
   - Click "▶️ Resume"
   - Verify status changes back to "🟢 Active"

5. **Next scanner run**:
   - Paused stocks will be excluded
   - Daily scanner: Next run at 5 PM ET
   - Day trader: Next run in 5 minutes (during market hours)

## Troubleshooting

### Error: "relation scan_universe already has column status"

The migration already ran. This is safe - Supabase uses `IF NOT EXISTS` clauses.

### Error: "permission denied for table scan_universe"

You need to run the migration with a user that has admin privileges. Use the Supabase Dashboard SQL Editor (runs as admin).

### Views return no data

This is normal if you haven't run the scanners yet. The views join with `trade_recommendations` and `intraday_opportunities` which may be empty.

### Functions don't work

Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'scan_universe';
SELECT * FROM pg_policies WHERE tablename = 'intraday_scanner_config';
```

Should see policies for authenticated users to UPDATE.

## Migration Complete! 🎉

You now have:
- ✅ Pause/resume functionality for both scanners
- ✅ Performance analytics (30/60/90 day metrics)
- ✅ Database-driven stock universes (no more hardcoded arrays)
- ✅ Foundation for future add/remove features

Next steps (optional):
- Phase 3: Add "Add Stock" / "Remove Stock" features
- Phase 4: Smart suggestions (auto-suggest high performers to add)
