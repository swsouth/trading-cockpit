# Library Page Enhancement Plan
## Transform Library into Configuration & Portfolio Management Hub

**Current State:** File upload/storage for trading research documents

**Future Vision:** Unified control center for managing stock universes across all scanner features with performance analytics

---

## Core Concept

The Library page becomes a **multi-purpose dashboard** showing:

1. **Stock Universe Management** - View, pause, add, remove stocks for each scanner
2. **Performance Analytics** - Opportunity generation metrics per stock/scanner
3. **Research Files** - Existing document library (keep current functionality)

---

## Feature 1: Stock Universe Manager

### Overview

Show configurable stock lists for each scanner with performance data:

**Three Scanner Types:**
- **Daily Market Scanner** (`scan_universe` table, 128 stocks)
- **Recommendations Page** (same as daily scanner)
- **Day Trader** (`INTRADAY_SYMBOLS` array, 50 stocks)

### UI Design

**Tab Navigation:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Daily Scanner] [Day Trader] [Research Files]              │
└─────────────────────────────────────────────────────────────┘
```

**Daily Scanner Tab:**
```
┌─────────────────────────────────────────────────────────────┐
│  Daily Market Scanner - Stock Universe (128 stocks)          │
│                                                               │
│  [+ Add Stock]  [Import CSV]  [Export CSV]                  │
│                                                               │
│  Filter: [Symbol ▼] [Sector ▼] [Status ▼] [Performance ▼]  │
│                                                               │
│  ┌──────┬────────┬───────────┬──────────────┬──────────────┐│
│  │Symbol│Sector  │Status     │Opportunities │Actions       ││
│  │      │        │           │(30/60/90 days)│              ││
│  ├──────┼────────┼───────────┼──────────────┼──────────────┤│
│  │AAPL  │Tech    │🟢 Active  │12 / 18 / 24  │⏸️ Pause  ❌  ││
│  │MSFT  │Tech    │🟢 Active  │8 / 14 / 19   │⏸️ Pause  ❌  ││
│  │TSLA  │Auto    │🟡 Paused  │0 / 6 / 12    │▶️ Resume ❌  ││
│  │GOOGL │Tech    │🟢 Active  │15 / 22 / 28  │⏸️ Pause  ❌  ││
│  │AMD   │Tech    │🟢 Active  │10 / 16 / 21  │⏸️ Pause  ❌  ││
│  └──────┴────────┴───────────┴──────────────┴──────────────┘│
│                                                               │
│  Summary: 125 Active, 3 Paused | Total Opportunities: 347    │
└─────────────────────────────────────────────────────────────┘
```

**Day Trader Tab:**
```
┌─────────────────────────────────────────────────────────────┐
│  Day Trader - Intraday Scanner (50 stocks)                   │
│                                                               │
│  [+ Add Stock]  [Import from Daily]  [Reset to Default]     │
│                                                               │
│  Filter: [Symbol ▼] [Liquidity ▼] [Status ▼]                │
│                                                               │
│  ┌──────┬────────┬───────────┬──────────────┬──────────────┐│
│  │Symbol│Sector  │Status     │Opportunities │Avg Score     ││
│  │      │        │           │(7/30/90 days)│              ││
│  ├──────┼────────┼───────────┼──────────────┼──────────────┤│
│  │AAPL  │Tech    │🟢 Active  │45 / 178 / 512│68           ││
│  │MSFT  │Tech    │🟢 Active  │38 / 156 / 445│72           ││
│  │TSLA  │Auto    │🟡 Paused  │0 / 98 / 289  │54 (paused)  ││
│  │GOOGL │Tech    │🟢 Active  │52 / 201 / 578│74           ││
│  │COIN  │Crypto  │🟢 Active  │61 / 245 / 701│62           ││
│  └──────┴────────┴───────────┴──────────────┴──────────────┘│
│                                                               │
│  ⚠️ Changes require restart of scanner (manual or next 5min) │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature 2: Performance Analytics

### Metrics Per Stock

**30/60/90 Day Opportunity Counts:**
- How many opportunities each stock generated
- Identify "hot" stocks vs "dead" stocks
- Data source: `trade_recommendations` table (daily), `intraday_opportunities` table (day trader)

**Average Opportunity Score:**
- Mean score for opportunities from each stock
- Helps identify quality vs quantity
- Example: "AAPL avg score: 68/100"

**Win Rate (Future):**
- If user tracks which setups worked, show % success rate
- Requires new table: `opportunity_outcomes`

**Query Example:**
```sql
-- Daily scanner: Opportunities per stock (last 90 days)
SELECT
  symbol,
  COUNT(*) FILTER (WHERE scan_date >= NOW() - INTERVAL '30 days') as opps_30d,
  COUNT(*) FILTER (WHERE scan_date >= NOW() - INTERVAL '60 days') as opps_60d,
  COUNT(*) FILTER (WHERE scan_date >= NOW() - INTERVAL '90 days') as opps_90d,
  AVG(opportunity_score)::INT as avg_score
FROM trade_recommendations
WHERE scan_date >= NOW() - INTERVAL '90 days'
GROUP BY symbol
ORDER BY opps_90d DESC;
```

### Visual Indicators

**Status Badges:**
- 🟢 **Active** - Currently being scanned
- 🟡 **Paused** - Excluded from scans (user choice)
- 🔴 **Removed** - Deleted from universe
- ⚪ **Low Performance** - Hasn't generated opportunities in 60+ days

**Performance Colors:**
- **Green:** 15+ opportunities in 90 days (hot stock)
- **Yellow:** 5-14 opportunities (moderate)
- **Red:** <5 opportunities (consider removing)

---

## Feature 3: Stock Universe Management Actions

### Add Stock

**UI:**
```
┌─────────────────────────────────┐
│  Add Stock to Scanner            │
│                                  │
│  Symbol: [NVDA___]              │
│  Sector:  [Technology ▼]        │
│  Market Cap: [Mega-Cap ▼]       │
│                                  │
│  Add to:                         │
│  ☑ Daily Scanner                │
│  ☑ Day Trader                   │
│                                  │
│  [Cancel]  [Add Stock]          │
└─────────────────────────────────┘
```

**Backend:**
- Daily Scanner: `INSERT INTO scan_universe (symbol, sector, ...)`
- Day Trader: Update `scripts/intradayMarketScan.ts` (file edit or new config table)

### Pause Stock

**Purpose:** Temporarily exclude from scans without deleting

**Implementation Options:**

**Option A: Status Column**
```sql
ALTER TABLE scan_universe ADD COLUMN status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'paused', 'removed'));

-- Scanner query becomes:
SELECT symbol FROM scan_universe WHERE status = 'active';
```

**Option B: Boolean Flag**
```sql
ALTER TABLE scan_universe ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Scanner query:
SELECT symbol FROM scan_universe WHERE is_active = true;
```

**Day Trader:**
- Store config in new table: `intraday_scanner_config`
```sql
CREATE TABLE intraday_scanner_config (
  symbol TEXT PRIMARY KEY,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ
);
```

### Remove Stock

**Soft Delete vs Hard Delete:**
- **Soft:** Set `status = 'removed'` (keep historical data)
- **Hard:** `DELETE FROM scan_universe WHERE symbol = 'X'` (lose history)

**Recommendation:** Soft delete to preserve analytics

### Bulk Operations

**Import CSV:**
```csv
symbol,sector,market_cap,scanner
AAPL,Technology,Mega-Cap,both
MSFT,Technology,Mega-Cap,both
TSLA,Automotive,Large-Cap,day-trader
```

**Export CSV:**
- Download current universe as CSV
- Useful for backup or sharing configurations

---

## Feature 4: Smart Recommendations

### Auto-Suggest Stocks to Add

**Based on:**
- Stocks generating opportunities in user's watchlist
- High-volume stocks not in universe
- Stocks mentioned in uploaded research files

**Example:**
```
💡 Suggested Stocks to Add:

NFLX - Generated 5 opportunities in watchlist (last 30 days)
      [Add to Daily Scanner] [Add to Day Trader]

META - High volume, not in universe, sector: Technology
      [Add to Daily Scanner] [Add to Day Trader]
```

### Auto-Suggest Stocks to Remove

**Criteria:**
- 0 opportunities in 90 days
- Consistently low scores (<40)
- Low liquidity (if trading volume data available)

**Example:**
```
⚠️ Underperforming Stocks:

AAL - 0 opportunities in 90 days
     [Pause] [Remove] [Keep]

GME - Average score: 32/100 (below threshold)
     [Pause] [Remove] [Keep]
```

---

## Feature 5: Real-Time Configuration Updates

### Challenge: How to Apply Changes

**Daily Scanner:**
- Easy: Changes take effect on next scheduled scan (5 PM ET)
- Or: Trigger manual scan via API

**Day Trader:**
- **Current:** Hardcoded array in `scripts/intradayMarketScan.ts`
- **Problem:** Changing array requires code deployment
- **Solution:** Store config in database table

### Proposed Solution: Database-Driven Config

**New Table:**
```sql
CREATE TABLE intraday_scanner_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  sector TEXT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX idx_intraday_active ON intraday_scanner_config(is_active, symbol);
```

**Scanner Changes:**
```typescript
// OLD (hardcoded):
const INTRADAY_SYMBOLS = ['AAPL', 'MSFT', ...];

// NEW (database-driven):
async function getActiveIntradaySymbols(): Promise<string[]> {
  const { data } = await supabase
    .from('intraday_scanner_config')
    .select('symbol')
    .eq('is_active', true)
    .order('symbol');

  return data?.map(row => row.symbol) || [];
}

// In scanner:
const symbols = await getActiveIntradaySymbols();
for (const symbol of symbols) { ... }
```

**Benefits:**
- ✅ User changes take effect on next scan (5 min)
- ✅ No code deployment needed
- ✅ Multi-user support (each user has own config)
- ✅ Historical tracking (when stock was added/removed)

---

## Feature 6: Multi-User Support

### Current State
- Daily Scanner: Global universe (all users see same opportunities)
- Day Trader: Global universe

### Future State (Optional)
- Each user has custom stock universe
- User A scans AAPL, MSFT, GOOGL
- User B scans TSLA, NVDA, AMD

**Schema Change:**
```sql
-- Add user_id to scan_universe
ALTER TABLE scan_universe ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Or create user-specific override table
CREATE TABLE user_scan_preferences (
  user_id UUID REFERENCES auth.users(id),
  symbol TEXT,
  scanner_type TEXT CHECK (scanner_type IN ('daily', 'intraday')),
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, symbol, scanner_type)
);
```

**Trade-off:**
- **Pros:** Full customization per user
- **Cons:** More complex, higher API usage (N users × M stocks)

---

## Implementation Phases

### Phase 1: Read-Only Analytics (Easiest)
**Effort:** 4-6 hours

- Show current stock universes for each scanner
- Display 30/60/90 day opportunity counts
- No editing, just visibility
- Reuse existing database queries

**Files to Create/Edit:**
- `app/library/page.tsx` - Add tabs for scanners
- `components/StockUniverseViewer.tsx` - New component
- `lib/analytics.ts` - Query functions for metrics

### Phase 2: Pause/Resume (Medium)
**Effort:** 6-8 hours

- Add `status` column to `scan_universe`
- Add pause/resume buttons
- Update daily scanner to filter by `status = 'active'`
- Create `intraday_scanner_config` table
- Update day trader scanner to query config table

**Files to Edit:**
- `supabase/migrations/` - New migration for status column
- `scripts/dailyMarketScan.ts` - Add WHERE clause
- `scripts/intradayMarketScan.ts` - Replace hardcoded array
- `components/StockUniverseManager.tsx` - Add action buttons

### Phase 3: Add/Remove Stocks (Complex)
**Effort:** 8-12 hours

- Add stock form with validation
- Sector/market cap dropdowns
- Bulk import/export CSV
- Remove stock with soft delete
- Update scanner to handle dynamic universe

**Files to Create/Edit:**
- `components/AddStockDialog.tsx` - Modal form
- `components/BulkImportDialog.tsx` - CSV upload
- `app/api/stock-universe/route.ts` - CRUD API
- `lib/stockValidation.ts` - Validate symbols (check if real stock)

### Phase 4: Smart Suggestions (Advanced)
**Effort:** 12-16 hours

- Auto-suggest high-performers to add
- Auto-suggest low-performers to remove
- Machine learning for recommendations (optional)
- A/B testing framework (which universe performs better)

**New Tables:**
```sql
CREATE TABLE stock_suggestions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  symbol TEXT,
  suggestion_type TEXT CHECK (suggestion_type IN ('add', 'remove', 'pause')),
  reason TEXT,
  confidence_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false
);
```

---

## Database Schema Changes Summary

### New Tables

**1. intraday_scanner_config**
```sql
CREATE TABLE intraday_scanner_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  sector TEXT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  notes TEXT
);
```

**2. stock_suggestions (Phase 4)**
```sql
CREATE TABLE stock_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol TEXT NOT NULL,
  suggestion_type TEXT CHECK (suggestion_type IN ('add', 'remove', 'pause')),
  reason TEXT,
  confidence_score INT CHECK (confidence_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false,
  UNIQUE (user_id, symbol, suggestion_type)
);
```

### Modified Tables

**scan_universe (add status column)**
```sql
ALTER TABLE scan_universe
  ADD COLUMN status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'paused', 'removed'));

CREATE INDEX idx_scan_universe_status ON scan_universe(status, symbol);
```

---

## Analytics Queries

### Daily Scanner Performance
```sql
-- Opportunities per stock (last 90 days)
SELECT
  symbol,
  COUNT(*) FILTER (WHERE scan_date >= NOW() - INTERVAL '30 days') as count_30d,
  COUNT(*) FILTER (WHERE scan_date >= NOW() - INTERVAL '60 days') as count_60d,
  COUNT(*) FILTER (WHERE scan_date >= NOW() - INTERVAL '90 days') as count_90d,
  AVG(opportunity_score)::INT as avg_score,
  MAX(opportunity_score) as max_score,
  MIN(opportunity_score) as min_score
FROM trade_recommendations
WHERE scan_date >= NOW() - INTERVAL '90 days'
GROUP BY symbol
ORDER BY count_90d DESC;
```

### Day Trader Performance
```sql
-- Intraday opportunities per stock (last 90 days)
SELECT
  symbol,
  COUNT(*) FILTER (WHERE scan_timestamp >= NOW() - INTERVAL '7 days') as count_7d,
  COUNT(*) FILTER (WHERE scan_timestamp >= NOW() - INTERVAL '30 days') as count_30d,
  COUNT(*) FILTER (WHERE scan_timestamp >= NOW() - INTERVAL '90 days') as count_90d,
  AVG(opportunity_score)::INT as avg_score,
  COUNT(DISTINCT DATE(scan_timestamp)) as days_active
FROM intraday_opportunities
WHERE scan_timestamp >= NOW() - INTERVAL '90 days'
GROUP BY symbol
ORDER BY count_90d DESC;
```

### Underperformers (candidates for removal)
```sql
-- Stocks with 0 opportunities in 90 days (daily scanner)
SELECT su.symbol, su.sector
FROM scan_universe su
LEFT JOIN trade_recommendations tr
  ON su.symbol = tr.symbol
  AND tr.scan_date >= NOW() - INTERVAL '90 days'
WHERE tr.symbol IS NULL
  AND su.status = 'active';
```

---

## UI/UX Considerations

### Visual Design

**Color Coding:**
- 🟢 Green: High performers (15+ opps/90d)
- 🟡 Yellow: Moderate (5-14 opps/90d)
- 🔴 Red: Low performers (<5 opps/90d)
- ⚪ Gray: Paused stocks

**Sort Options:**
- By symbol (alphabetical)
- By opportunities (most → least)
- By average score (highest → lowest)
- By sector
- By status

**Responsive Design:**
- Desktop: Table view with all columns
- Tablet: Condensed table
- Mobile: Card view with tap-to-expand

### User Permissions

**Read Access:** All authenticated users
**Write Access:**
- Option A: All users (self-service)
- Option B: Admin only (controlled curation)
- Option C: Per-user universes (each user manages own)

---

## Alternative Approach: Separate Pages

Instead of cramming into Library, create dedicated pages:

**Option A: Single "Library" Hub**
```
/library
  - [Daily Scanner] tab
  - [Day Trader] tab
  - [Research Files] tab
```

**Option B: Separate Pages**
```
/stock-universe       - Stock management
/performance          - Analytics/metrics
/library              - Research files (keep as-is)
```

**Option C: Settings Integration**
```
/settings
  - [Account] tab
  - [Stock Universe] tab  ← New
  - [Preferences] tab
```

**Recommendation:** Option A (single hub) for simplicity, but Option B (separate pages) for scalability as features grow.

---

## Example User Flows

### Flow 1: Pause Underperforming Stock
1. User visits `/library` → Daily Scanner tab
2. Sees TSLA with 0 opportunities in 90 days (red indicator)
3. Clicks "⏸️ Pause" button
4. Confirmation: "TSLA will be excluded from next scan. Resume anytime."
5. Next daily scan (5 PM ET) skips TSLA
6. User can resume later with "▶️ Resume" button

### Flow 2: Add High-Volume Stock
1. User visits `/library` → Day Trader tab
2. Clicks "[+ Add Stock]" button
3. Modal opens:
   - Symbol: COIN
   - Sector: Cryptocurrency (auto-detected)
4. Clicks "Add Stock"
5. COIN appears in table with status 🟢 Active
6. Next intraday scan (5 min) includes COIN
7. User sees COIN opportunities on `/day-trader` page

### Flow 3: Review Performance
1. User visits `/library` → Daily Scanner tab
2. Sorts by "Opportunities (90d)" descending
3. Sees NVDA at top with 45 opportunities
4. Sees AAL at bottom with 0 opportunities
5. Decision: Keep NVDA, pause AAL
6. Exports current universe as CSV for backup

---

## Technical Implementation Notes

### Real-Time Updates

**Challenge:** Scanner is cron job, not real-time
**Solution:** Changes take effect on next scheduled run

**Daily Scanner:** Next run at 5 PM ET (max wait: 23h)
**Day Trader:** Next run in 5 min (max wait: 5 min)

**Improvement (Future):**
- Add "Trigger Manual Scan Now" button
- Calls API endpoint to run scanner immediately
- Useful for testing new stock additions

### Code Changes Required

**1. Daily Scanner (scripts/dailyMarketScan.ts)**
```typescript
// OLD:
const { data: stockUniverse } = await supabase
  .from('scan_universe')
  .select('symbol, sector');

// NEW:
const { data: stockUniverse } = await supabase
  .from('scan_universe')
  .select('symbol, sector')
  .eq('status', 'active');  // ← Add this filter
```

**2. Day Trader (scripts/intradayMarketScan.ts)**
```typescript
// OLD:
const INTRADAY_SYMBOLS = ['AAPL', 'MSFT', ...];

// NEW:
async function getActiveIntradaySymbols(): Promise<string[]> {
  const { data } = await supabase
    .from('intraday_scanner_config')
    .select('symbol')
    .eq('is_active', true)
    .order('symbol');
  return data?.map(row => row.symbol) || FALLBACK_SYMBOLS;
}

const symbols = await getActiveIntradaySymbols();
for (const symbol of symbols) { ... }
```

**3. New Component (components/StockUniverseManager.tsx)**
```typescript
export function StockUniverseManager({ scannerType }: { scannerType: 'daily' | 'intraday' }) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);

  // Load stocks and performance metrics
  // Render table with pause/resume/remove actions
  // Handle add stock dialog
}
```

---

## Success Metrics

**After Implementation:**

**User Engagement:**
- % of users who customize stock universe
- Average # of stocks added/removed per user
- Most paused/removed stocks (identify patterns)

**Performance Improvement:**
- Does removing low-performers increase average opportunity score?
- Does adding suggested stocks increase opportunity count?
- A/B test: Custom universe vs default universe

**System Efficiency:**
- Reduced API calls (if users remove stocks)
- Faster scan times (smaller universes)
- Database storage optimization (paused stocks don't generate rows)

---

## Future Enhancements (Beyond This Plan)

### Portfolio Tracking
- Link opportunities to actual trades
- Track which setups were executed
- Win rate analytics per stock/pattern/setup

### Backtesting
- Run historical scans on different universes
- "What if I had scanned NVDA 6 months ago?"
- Optimize universe for max opportunity generation

### AI-Powered Curation
- GPT suggests stocks based on news/trends
- Sentiment analysis of uploaded research files
- Auto-pause stocks with negative sentiment

### Social Features
- Share stock universes with other users
- "Top Performing Universes" leaderboard
- Community voting on suggested stocks

---

## Conclusion

Transforming the Library page into a **Stock Universe Management Hub** provides:

✅ **Visibility** - See what you're scanning and how it performs
✅ **Control** - Pause/resume/add/remove stocks easily
✅ **Optimization** - Data-driven decisions on universe composition
✅ **Efficiency** - Focus scans on high-performing stocks

**Recommended First Step:** Phase 1 (read-only analytics) to validate user interest, then expand to full CRUD operations.

**Effort Estimate:** 40-60 hours for full implementation (Phases 1-4)

**ROI:** Higher quality opportunities, better user experience, reduced wasted scans on dead stocks

---

**Next Session Tasks:**
1. Review this plan and prioritize phases
2. Decide: Single hub vs separate pages
3. Create database migration for Phase 1
4. Build analytics queries for 30/60/90 day metrics
5. Design UI mockups for stock universe table
