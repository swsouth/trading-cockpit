# 5-Day Rotating Universe + Hot List Feature - Implementation Plan

**Date:** December 2, 2025
**Status:** Design Complete, Ready for Implementation
**Estimated Timeline:** 2-3 days for MVP

---

## Executive Summary

This document outlines the implementation plan for two major features:

1. **5-Day Rotating Stock Universe:** Scan 200 different stocks each weekday (1,000 total) to expose users to 5× more opportunities without overwhelming them
2. **Hot List Feature:** Allow users to "pin" interesting recommendations for later review, with separate tab navigation

**Key Benefits:**
- Users see 5× more stock coverage (1,000 vs 200)
- Recommendations naturally accumulate throughout the week (Mon+Tue+Wed+Thu+Fri)
- Users can save/triage opportunities without losing them
- No API cost constraints (Yahoo Finance = free unlimited)
- Database already supports multi-day recommendations

---

## Problem Statement

### Current Limitations

**Single Universe Scanning:**
- Current system scans 493 stocks daily
- Users see only opportunities from yesterday's scan
- Limited exposure to market opportunities
- Recommendations expire after 7 days (replaced by next day's scan)

**No Persistence Mechanism:**
- User finds interesting opportunity on Monday
- Not ready to trade immediately
- Tuesday's scan populates, Monday opportunity lost in the noise
- No way to "bookmark" opportunities for later review

### User Impact

Traders need:
- Broad market coverage (not just 493 stocks)
- Time to research opportunities (can't act on everything immediately)
- Ability to compare opportunities across multiple days
- Clean separation between "new scans" and "saved opportunities"

---

## Solution Overview

### Feature 1: 5-Day Rotating Stock Universe

**Concept:**
- Monday: Scan 200 stocks (Tech-heavy)
- Tuesday: Scan 200 different stocks (Finance/Energy)
- Wednesday: Scan 200 different stocks (Healthcare/Consumer)
- Thursday: Scan 200 different stocks (Industrials/Materials)
- Friday: Scan 200 different stocks (Cyclical/Small-cap)

**Total Coverage:** 1,000 unique stocks per week (vs. 493 daily)

**Database Behavior:**
- Each day's scan creates new `trade_recommendations` rows with unique `scan_date`
- Recommendations expire 7 days after scan date (via `expires_at` timestamp)
- User sees cumulative opportunities from all active scan dates
- By Friday, user potentially sees Mon+Tue+Wed+Thu+Fri recommendations (100-500 total)

**Example Timeline:**
```
Monday:    Scan 200 stocks → Find 20 opportunities → User sees 20 recommendations
Tuesday:   Scan 200 stocks → Find 25 opportunities → User sees 45 recommendations (Mon+Tue)
Wednesday: Scan 200 stocks → Find 18 opportunities → User sees 63 recommendations (Mon+Tue+Wed)
Thursday:  Scan 200 stocks → Find 22 opportunities → User sees 85 recommendations (Mon+Tue+Wed+Thu)
Friday:    Scan 200 stocks → Find 30 opportunities → User sees 115 recommendations (all 5 days)
Weekend:   No scan → User sees 115 recommendations (still active)
Next Mon:  Previous Monday recommendations expire, new Monday scan populates
```

### Feature 2: Hot List (Pin Feature)

**Concept:**
- User can "pin" any recommendation to their "Hot List"
- Pinned items persist beyond 7-day expiration
- Hot List displayed in separate tab (doesn't clutter daily recommendations)
- User can remove items when done reviewing

**User Workflow:**
1. Browse daily recommendations (Today/This Week tabs)
2. Find interesting opportunity (not ready to trade yet)
3. Click star icon → "NVDA added to Hot List"
4. Continue browsing
5. Later: Switch to "Hot List" tab
6. Review saved opportunities at leisure
7. Take action or remove from list

**Example Use Cases:**
- "Waiting for breakout confirmation before entering"
- "Interesting setup but need to research fundamentals first"
- "Good opportunity but already at max position size this week"
- "Want to watch this setup develop over next few days"

---

## Technical Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ DAILY SCANNER (Cron Job 5 PM ET Mon-Fri)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ getTodaysUniverse()                                          │
│ - Monday → 200 stocks (Tech focus)                          │
│ - Tuesday → 200 stocks (Finance/Energy)                     │
│ - Wednesday → 200 stocks (Healthcare/Consumer)              │
│ - Thursday → 200 stocks (Industrials/Materials)             │
│ - Friday → 200 stocks (Cyclical/Small-cap)                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Analysis Engine v2.0.0                                       │
│ - Fetch Yahoo Finance data (250 bars per stock)             │
│ - Run channel detection + pattern recognition               │
│ - Generate trade recommendations                            │
│ - Calculate opportunity scores                               │
│ - Vetting system filtering                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ trade_recommendations TABLE                                  │
│ - Insert with scan_date = TODAY                             │
│ - Set expires_at = scan_date + 7 days                       │
│ - No deactivation of old scans (natural expiration)         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ /recommendations PAGE                                        │
│ ┌──────────┬────────────────┬─────────────┐                │
│ │ Today    │ This Week      │ Hot List    │                │
│ │ (20)     │ (115)          │ (5)         │                │
│ └──────────┴────────────────┴─────────────┘                │
│                                                              │
│ Today Tab: scan_date = today (20 items)                     │
│ This Week: scan_date >= 5 days ago (115 items)              │
│ Hot List: user's pinned items (5 items)                     │
└─────────────────────────────────────────────────────────────┘
```

### Hot List Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION: Click ☆ star on NVDA recommendation            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ POST /api/hot-list/add                                       │
│ Body: { recommendation_id: "uuid-123" }                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ hot_list_items TABLE                                         │
│ INSERT {                                                     │
│   user_id: current_user.id,                                 │
│   recommendation_id: "uuid-123",                            │
│   pinned_at: NOW()                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ UI UPDATE                                                    │
│ - Star icon changes: ☆ → ★                                  │
│ - Toast notification: "✓ NVDA added to Hot List"            │
│ - Hot List badge updates: (4) → (5)                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ USER NAVIGATES TO HOT LIST TAB                               │
│ GET /api/hot-list                                            │
│ Returns: Array of pinned recommendations with metadata       │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Existing Tables (No Changes Required)

**trade_recommendations** (Already Perfect!)
```sql
CREATE TABLE trade_recommendations (
  id UUID PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  scan_date DATE NOT NULL,
  expires_at TIMESTAMP NOT NULL,  -- scan_date + 7 days
  is_active BOOLEAN DEFAULT true,

  -- Trade details
  recommendation_type VARCHAR(20),  -- 'long' or 'short'
  entry_price DECIMAL(10,2),
  target_price DECIMAL(10,2),
  stop_loss DECIMAL(10,2),
  opportunity_score INTEGER,
  confidence_level VARCHAR(20),
  rationale TEXT,

  -- ... other fields

  CONSTRAINT unique_symbol_scan_date UNIQUE(symbol, scan_date)
);
```

**Why No Changes Needed:**
- `UNIQUE(symbol, scan_date)` allows same stock on different days (AAPL on Mon + AAPL on Fri)
- `expires_at` handles cleanup automatically (no manual deactivation needed)
- `is_active` boolean remains true until expiration (supports multi-day active recommendations)

### New Table: hot_list_items

```sql
-- Migration: supabase/migrations/[timestamp]_create_hot_list_items.sql

CREATE TABLE hot_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES trade_recommendations(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure user can't pin same recommendation twice
  CONSTRAINT unique_user_recommendation UNIQUE(user_id, recommendation_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_hot_list_user ON hot_list_items(user_id);
CREATE INDEX idx_hot_list_recommendation ON hot_list_items(recommendation_id);
CREATE INDEX idx_hot_list_pinned_at ON hot_list_items(pinned_at DESC);

-- Row Level Security (RLS)
ALTER TABLE hot_list_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/modify their own pins
CREATE POLICY "Users can view their own hot list"
  ON hot_list_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own hot list"
  ON hot_list_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own hot list"
  ON hot_list_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE hot_list_items IS 'User-pinned trade recommendations for later review (persists beyond 7-day expiration)';
COMMENT ON COLUMN hot_list_items.pinned_at IS 'When user added this recommendation to their Hot List';
```

**Design Rationale:**
- Separate table (not boolean on `trade_recommendations`) allows tracking per-user pins
- Foreign key to `trade_recommendations` (recommendation can have multiple users pinning it)
- `ON DELETE CASCADE` ensures cleanup if recommendation or user deleted
- RLS policies enforce user isolation (multi-tenant ready)

---

## API Routes

### POST /api/hot-list/add

**Purpose:** Add a recommendation to user's Hot List

**Request:**
```typescript
POST /api/hot-list/add
Headers: {
  Authorization: Bearer <token>
}
Body: {
  recommendation_id: string  // UUID of trade_recommendation
}
```

**Response:**
```typescript
{
  success: true,
  message: "Added to Hot List",
  hotListItem: {
    id: "uuid",
    recommendation_id: "uuid",
    pinned_at: "2025-12-02T10:30:00Z"
  }
}
```

**Error Cases:**
- 401: Unauthorized (no valid token)
- 404: Recommendation not found
- 409: Already in Hot List (duplicate)
- 500: Database error

**Implementation:**
```typescript
// app/api/hot-list/add/route.ts
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // 1. Get auth token from header
  // 2. Verify user with Supabase auth
  // 3. Parse request body (recommendation_id)
  // 4. Insert into hot_list_items table
  // 5. Return success response
}
```

---

### DELETE /api/hot-list/remove/:id

**Purpose:** Remove a recommendation from user's Hot List

**Request:**
```typescript
DELETE /api/hot-list/remove/[recommendation_id]
Headers: {
  Authorization: Bearer <token>
}
```

**Response:**
```typescript
{
  success: true,
  message: "Removed from Hot List"
}
```

**Error Cases:**
- 401: Unauthorized
- 404: Hot List item not found
- 500: Database error

---

### GET /api/hot-list

**Purpose:** Fetch all items in user's Hot List

**Request:**
```typescript
GET /api/hot-list
Headers: {
  Authorization: Bearer <token>
}
Query Params:
  ?sort=pinned_at  // Default: newest first
  ?limit=50        // Default: all
```

**Response:**
```typescript
{
  success: true,
  hotList: [
    {
      id: "hot-list-item-uuid",
      pinned_at: "2025-12-02T10:30:00Z",
      recommendation: {
        id: "recommendation-uuid",
        symbol: "AAPL",
        scan_date: "2025-12-01",
        recommendation_type: "long",
        entry_price: 150.00,
        target_price: 165.00,
        stop_loss: 145.00,
        opportunity_score: 87,
        confidence_level: "high",
        rationale: "Hammer pattern at channel support, RSI 38",
        expires_at: "2025-12-08T23:59:59Z",
        // ... other fields
      }
    },
    // ... more items
  ],
  count: 5
}
```

**Implementation:**
```typescript
// app/api/hot-list/route.ts
export async function GET(request: Request) {
  // 1. Verify auth
  // 2. Query hot_list_items WHERE user_id = current_user
  // 3. JOIN with trade_recommendations to get full recommendation data
  // 4. Order by pinned_at DESC
  // 5. Return array of pinned recommendations
}
```

**SQL Query:**
```sql
SELECT
  hli.*,
  tr.*
FROM hot_list_items hli
JOIN trade_recommendations tr ON tr.id = hli.recommendation_id
WHERE hli.user_id = $1
ORDER BY hli.pinned_at DESC
LIMIT $2;
```

---

## Frontend Implementation

### Component Hierarchy

```
app/recommendations/page.tsx (Main Page)
├── TabNavigation (Today | This Week | Hot List)
│   ├── TodayTab
│   │   └── RecommendationCard[] (scan_date = today)
│   ├── ThisWeekTab
│   │   └── RecommendationCard[] (scan_date >= 5 days ago)
│   └── HotListTab
│       └── RecommendationCard[] (isHotList={true})
│
├── FilterBar (Confidence, Score, Type, Scan Date)
├── SortDropdown (Score, Symbol, Confidence, Vetting)
└── SearchBar (Filter by symbol)
```

### RecommendationCard Component Updates

**Current Card:**
```tsx
<div className="card">
  <div className="card-header">
    <span>{symbol}</span>
    <span>Score: {score}</span>
  </div>
  <div className="card-body">
    <p>Entry: {entry} | Target: {target} | Stop: {stop}</p>
    <p>{rationale}</p>
  </div>
  <div className="card-footer">
    <button>Paper Trade</button>
  </div>
</div>
```

**Updated Card (with Hot List feature):**
```tsx
<div className={`card ${getFreshnessColor(scanDate)}`}>
  {/* Left accent bar (color-coded by freshness) */}
  <div className="accent-bar" />

  <div className="card-header">
    <span>{symbol}</span>
    <ScanDateBadge scanDate={scanDate} /> {/* "●Today" / "◉2d ago" */}
    <span>Score: {score}</span>
    <StarButton
      isPinned={isPinned}
      onToggle={() => handleHotListToggle(recommendation.id)}
    />
  </div>

  <div className="card-body">
    <p>Entry: {entry} | Target: {target} | Stop: {stop}</p>
    <p>{rationale}</p>
  </div>

  <div className="card-footer">
    <button>Paper Trade</button>
    {isHotList && <button>Remove from Hot List</button>}
  </div>
</div>
```

### New Components

**1. StarButton.tsx**
```tsx
interface StarButtonProps {
  isPinned: boolean;
  onToggle: () => void;
}

export function StarButton({ isPinned, onToggle }: StarButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`star-button ${isPinned ? 'pinned' : 'unpinned'}`}
      aria-label={isPinned ? "Remove from Hot List" : "Add to Hot List"}
    >
      {isPinned ? '★' : '☆'} Hot List
    </button>
  );
}
```

**2. ScanDateBadge.tsx**
```tsx
interface ScanDateBadgeProps {
  scanDate: string;  // ISO date string
}

export function ScanDateBadge({ scanDate }: ScanDateBadgeProps) {
  const age = calculateAge(scanDate);
  const { icon, color, text } = getFreshnessInfo(age);

  return (
    <span className={`scan-badge ${color}`}>
      {icon} {text}
    </span>
  );
}

function getFreshnessInfo(ageInDays: number) {
  if (ageInDays === 0) return { icon: '●', color: 'green', text: 'Today' };
  if (ageInDays <= 2) return { icon: '◉', color: 'blue', text: `${ageInDays}d ago` };
  if (ageInDays <= 5) return { icon: '◐', color: 'amber', text: `${ageInDays}d ago` };
  return { icon: '◯', color: 'red', text: `${ageInDays}d ago` };
}
```

**3. TabNavigation.tsx**
```tsx
type Tab = 'today' | 'thisWeek' | 'hotList';

export function TabNavigation({ activeTab, onTabChange, hotListCount }) {
  return (
    <div className="tabs">
      <button
        className={activeTab === 'today' ? 'active' : ''}
        onClick={() => onTabChange('today')}
      >
        Today
      </button>
      <button
        className={activeTab === 'thisWeek' ? 'active' : ''}
        onClick={() => onTabChange('thisWeek')}
      >
        This Week
      </button>
      <button
        className={activeTab === 'hotList' ? 'active' : ''}
        onClick={() => onTabChange('hotList')}
      >
        Hot List {hotListCount > 0 && `(${hotListCount})`}
      </button>
    </div>
  );
}
```

### Page Logic Updates

**app/recommendations/page.tsx**
```tsx
export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [recommendations, setRecommendations] = useState([]);
  const [hotList, setHotList] = useState([]);

  // Fetch recommendations based on active tab
  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayRecommendations();
    } else if (activeTab === 'thisWeek') {
      fetchThisWeekRecommendations();
    } else {
      fetchHotList();
    }
  }, [activeTab]);

  // Handle pin/unpin
  async function handleHotListToggle(recommendationId: string) {
    const isPinned = hotList.some(item => item.recommendation_id === recommendationId);

    if (isPinned) {
      await removeFromHotList(recommendationId);
      toast.success('Removed from Hot List');
    } else {
      await addToHotList(recommendationId);
      toast.success('Added to Hot List');
    }

    // Refresh hot list count
    fetchHotList();
  }

  return (
    <div>
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hotListCount={hotList.length}
      />

      <FilterBar />
      <SortDropdown />

      {activeTab === 'hotList' ? (
        <HotListTab
          recommendations={hotList}
          onRemove={handleHotListToggle}
        />
      ) : (
        <RecommendationList
          recommendations={recommendations}
          onToggleHotList={handleHotListToggle}
          pinnedIds={hotList.map(item => item.recommendation_id)}
        />
      )}
    </div>
  );
}
```

---

## Backend Implementation

### 1. Rotating Universe Logic

**File:** `scripts/stockUniverseRotation.ts`

```typescript
/**
 * 5-Day Rotating Stock Universe
 *
 * Each weekday scans 200 different stocks
 * Total coverage: 1,000 unique stocks per week
 */

export const MONDAY_UNIVERSE = [
  // 200 stocks - Technology focus
  'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'TSLA', 'AMZN', 'NFLX', 'ADBE', 'CRM',
  // ... 190 more stocks
];

export const TUESDAY_UNIVERSE = [
  // 200 stocks - Financial + Energy focus
  'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'XOM', 'CVX', 'COP', 'SLB',
  // ... 190 more stocks
];

export const WEDNESDAY_UNIVERSE = [
  // 200 stocks - Healthcare + Consumer Staples
  'UNH', 'JNJ', 'PFE', 'ABBV', 'TMO', 'PG', 'KO', 'PEP', 'WMT', 'COST',
  // ... 190 more stocks
];

export const THURSDAY_UNIVERSE = [
  // 200 stocks - Industrials + Materials
  'CAT', 'BA', 'HON', 'UPS', 'GE', 'MMM', 'DD', 'DOW', 'LIN', 'APD',
  // ... 190 more stocks
];

export const FRIDAY_UNIVERSE = [
  // 200 stocks - Consumer Cyclical + Small-caps
  'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'DIS', 'BKNG', 'CMG', 'ORLY',
  // ... 190 more stocks
];

/**
 * Get stocks to scan based on current day of week
 * @returns Array of stock symbols (200 stocks)
 */
export function getTodaysUniverse(): string[] {
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  switch (dayOfWeek) {
    case 1: // Monday
      return MONDAY_UNIVERSE;
    case 2: // Tuesday
      return TUESDAY_UNIVERSE;
    case 3: // Wednesday
      return WEDNESDAY_UNIVERSE;
    case 4: // Thursday
      return THURSDAY_UNIVERSE;
    case 5: // Friday
      return FRIDAY_UNIVERSE;
    default: // Weekend
      return []; // No scan on weekends
  }
}

/**
 * Get day name for logging
 */
export function getTodayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}
```

**Usage in Scanner:**
```typescript
// scripts/dailyMarketScan.ts
import { getTodaysUniverse, getTodayName } from './stockUniverseRotation';

async function runDailyMarketScan() {
  console.log(`📅 ${getTodayName()} Market Scan`);

  const stocks = getTodaysUniverse();

  if (stocks.length === 0) {
    console.log('⏸️  Weekend - No scan scheduled');
    return;
  }

  console.log(`🎯 Scanning ${stocks.length} stocks from ${getTodayName()}'s universe`);

  // ... rest of scanner logic (unchanged)
}
```

### 2. Remove Deactivation Logic

**File:** `scripts/scanner/database.ts`

**DELETE THIS FUNCTION:**
```typescript
// ❌ REMOVE THIS ENTIRE FUNCTION
export async function deactivateOldRecommendations(currentScanDate: string): Promise<void> {
  const { error } = await supabase
    .from('trade_recommendations')
    .update({ is_active: false })
    .neq('scan_date', currentScanDate)
    .eq('is_active', true);

  if (error) {
    console.error('Error deactivating old recommendations:', error.message);
  }
}
```

**UPDATE THIS FUNCTION:**
```typescript
export async function storeRecommendations(
  results: StockAnalysisResult[],
  scanDate: string
): Promise<number> {
  const records = results
    .map(result => convertToRecord(result, scanDate))
    .filter((record): record is RecommendationRecord => record !== null);

  if (records.length === 0) {
    console.log('No recommendations to store');
    return 0;
  }

  // ❌ REMOVE THIS LINE:
  // await deactivateOldRecommendations(scanDate);

  // ✅ INSTEAD: Rely on natural expiration via expires_at
  // Recommendations automatically expire 7 days after scan_date

  // Insert new recommendations (rest unchanged)
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const { error } = await supabase
      .from('trade_recommendations')
      .upsert(batch, {
        onConflict: 'symbol,scan_date',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  return inserted;
}
```

**Why Remove Deactivation:**
- Old approach: Deactivate all recommendations not from today's scan
- New approach: Let recommendations naturally expire after 7 days
- Benefit: Multiple scan dates can be active simultaneously (Mon+Tue+Wed+Thu+Fri)
- Cleanup: Database already has automatic expiration via `expires_at` timestamp

### 3. Query Logic for Tabs

**Today Tab Query:**
```typescript
async function fetchTodayRecommendations() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('trade_recommendations')
    .select('*')
    .eq('scan_date', today)
    .eq('is_active', true)
    .order('opportunity_score', { ascending: false });

  return data || [];
}
```

**This Week Tab Query:**
```typescript
async function fetchThisWeekRecommendations() {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const startDate = fiveDaysAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('trade_recommendations')
    .select('*')
    .gte('scan_date', startDate)
    .eq('is_active', true)
    .order('opportunity_score', { ascending: false });

  return data || [];
}
```

**Hot List Tab Query:**
```typescript
async function fetchHotList() {
  const { data, error } = await supabase
    .from('hot_list_items')
    .select(`
      *,
      recommendation:trade_recommendations(*)
    `)
    .eq('user_id', currentUser.id)
    .order('pinned_at', { ascending: false });

  return data?.map(item => ({
    ...item.recommendation,
    pinned_at: item.pinned_at,
    hot_list_id: item.id
  })) || [];
}
```

---

## UX Design Specifications

### Color System (Freshness Indicators)

**Accent Bar Colors:**
```css
/* Scan freshness colors */
.accent-fresh {
  border-left: 4px solid #10B981; /* Green - Today */
}

.accent-recent {
  border-left: 4px solid #3B82F6; /* Blue - 1-2 days */
}

.accent-aging {
  border-left: 4px solid #F59E0B; /* Amber - 3-5 days */
}

.accent-expiring {
  border-left: 4px solid #EF4444; /* Red - 6-7 days */
}

/* Mobile: Thicker bars for thumb scrolling */
@media (max-width: 768px) {
  .accent-bar {
    border-left-width: 6px;
  }
}
```

**Badge Colors:**
```tsx
function getScanBadgeClass(ageInDays: number): string {
  if (ageInDays === 0) return 'text-green-600 bg-green-50';
  if (ageInDays <= 2) return 'text-blue-600 bg-blue-50';
  if (ageInDays <= 5) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}
```

### Typography

**Scan Date Badge:**
```css
.scan-badge {
  font-size: 0.75rem;        /* 12px */
  font-weight: 500;          /* Medium */
  text-transform: uppercase;
  letter-spacing: 0.05em;    /* Tracking */
  padding: 2px 8px;
  border-radius: 4px;
}
```

**Hot List Gold Accent:**
```css
.star-button.pinned {
  color: #F59E0B;            /* Amber/Gold */
}

.star-button.pinned:hover {
  color: #D97706;            /* Darker gold */
}
```

### Mobile Responsiveness

**Bottom Tab Bar (Mobile Only):**
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
  <div className="flex justify-around p-2">
    <button className="tab">Today</button>
    <button className="tab">This Week</button>
    <button className="tab">Hot List (5)</button>
  </div>
</div>
```

**Card Layout Adaptations:**
```css
/* Desktop: Horizontal layout */
.recommendation-card {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

/* Mobile: Stacked layout */
@media (max-width: 768px) {
  .recommendation-card {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .star-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    min-width: 48px;  /* Touch target */
    min-height: 48px;
  }
}
```

---

## Implementation Checklist

### Phase 1A: Rotating Universe (Day 1 - 4-5 hours)

- [ ] **Task 1.1:** Create `scripts/stockUniverseRotation.ts`
  - [ ] Define MONDAY_UNIVERSE (200 stocks - Tech focus)
  - [ ] Define TUESDAY_UNIVERSE (200 stocks - Finance/Energy)
  - [ ] Define WEDNESDAY_UNIVERSE (200 stocks - Healthcare/Consumer)
  - [ ] Define THURSDAY_UNIVERSE (200 stocks - Industrials/Materials)
  - [ ] Define FRIDAY_UNIVERSE (200 stocks - Cyclical/Small-cap)
  - [ ] Export `getTodaysUniverse()` function
  - [ ] Export `getTodayName()` helper function

- [ ] **Task 1.2:** Update `scripts/dailyMarketScan.ts`
  - [ ] Import `getTodaysUniverse()` and `getTodayName()`
  - [ ] Replace database universe query with `getTodaysUniverse()`
  - [ ] Add weekend check (return early if array is empty)
  - [ ] Update console logs to show day name
  - [ ] Test locally: `npm run scan-market` on different weekdays

- [ ] **Task 1.3:** Remove deactivation logic
  - [ ] Delete `deactivateOldRecommendations()` function from `scripts/scanner/database.ts`
  - [ ] Remove call to `deactivateOldRecommendations()` in `storeRecommendations()`
  - [ ] Add comment explaining natural expiration via `expires_at`
  - [ ] Verify existing `expires_at` calculation is correct (scan_date + 7 days)

- [ ] **Task 1.4:** Test rotation system
  - [ ] Mock `new Date().getDay()` to test each weekday
  - [ ] Verify correct universe loads for each day
  - [ ] Verify recommendations insert with correct scan_date
  - [ ] Verify no deactivation occurs (old scans remain active)

### Phase 1B: Hot List Database (Day 1 - 1 hour)

- [ ] **Task 2.1:** Create migration file
  - [ ] File: `supabase/migrations/[timestamp]_create_hot_list_items.sql`
  - [ ] Create `hot_list_items` table with correct schema
  - [ ] Add indexes (user_id, recommendation_id, pinned_at)
  - [ ] Add UNIQUE constraint (user_id, recommendation_id)
  - [ ] Enable RLS
  - [ ] Create SELECT policy (auth.uid() = user_id)
  - [ ] Create INSERT policy (auth.uid() = user_id)
  - [ ] Create DELETE policy (auth.uid() = user_id)
  - [ ] Add table/column comments

- [ ] **Task 2.2:** Apply migration
  - [ ] Run migration in Supabase dashboard SQL editor
  - [ ] Verify table created successfully
  - [ ] Verify indexes created
  - [ ] Verify RLS policies active
  - [ ] Test with sample INSERT (should work for authenticated user)

### Phase 1C: Hot List Backend (Day 2 - 3-4 hours)

- [ ] **Task 3.1:** Create `POST /api/hot-list/add` route
  - [ ] File: `app/api/hot-list/add/route.ts`
  - [ ] Verify authentication (extract token from header)
  - [ ] Parse request body (recommendation_id)
  - [ ] Insert into hot_list_items table
  - [ ] Handle duplicate error (409 Conflict)
  - [ ] Return success response with inserted item
  - [ ] Add error handling (401, 404, 500)

- [ ] **Task 3.2:** Create `DELETE /api/hot-list/remove/[id]/route.ts`
  - [ ] Verify authentication
  - [ ] Extract recommendation_id from URL params
  - [ ] Delete from hot_list_items WHERE user_id = current_user AND recommendation_id = $1
  - [ ] Return success response
  - [ ] Handle 404 if item not found

- [ ] **Task 3.3:** Create `GET /api/hot-list` route
  - [ ] File: `app/api/hot-list/route.ts`
  - [ ] Verify authentication
  - [ ] Query hot_list_items with JOIN to trade_recommendations
  - [ ] Order by pinned_at DESC
  - [ ] Return array of recommendations with pinned_at metadata
  - [ ] Add count to response

- [ ] **Task 3.4:** Test API routes
  - [ ] Test POST /api/hot-list/add (success case)
  - [ ] Test POST /api/hot-list/add (duplicate case)
  - [ ] Test GET /api/hot-list (empty, 1 item, multiple items)
  - [ ] Test DELETE /api/hot-list/remove (success case)
  - [ ] Test authentication failures (401)

### Phase 1D: Hot List Frontend (Day 2 - 3-4 hours)

- [ ] **Task 4.1:** Create `components/StarButton.tsx`
  - [ ] Accept props: isPinned, onToggle
  - [ ] Render star icon (☆ unpinned, ★ pinned)
  - [ ] Add "Hot List" text label (hide on mobile)
  - [ ] Style with gold color when pinned
  - [ ] Add hover effect (scale, color shift)
  - [ ] Add ARIA labels for accessibility

- [ ] **Task 4.2:** Create `components/ScanDateBadge.tsx`
  - [ ] Calculate age: today - scan_date
  - [ ] Determine freshness: 0d=fresh, 1-2d=recent, 3-5d=aging, 6-7d=expiring
  - [ ] Render icon + text: "●Today" / "◉2d ago" / "◐5d ago" / "◯6d ago"
  - [ ] Apply color classes (green/blue/amber/red)
  - [ ] Add tooltip with full date on hover

- [ ] **Task 4.3:** Update `components/RecommendationCard.tsx`
  - [ ] Add left accent bar with conditional color (based on scan_date age)
  - [ ] Add ScanDateBadge to header
  - [ ] Add StarButton to header
  - [ ] Wire up onToggleHotList prop
  - [ ] Show "Remove from Hot List" button when isHotList={true}
  - [ ] Add "Saved X days ago" text when isHotList={true}

- [ ] **Task 4.4:** Create `components/TabNavigation.tsx`
  - [ ] Render 3 tabs: Today, This Week, Hot List
  - [ ] Show badge count on Hot List tab: (5)
  - [ ] Apply active state styling
  - [ ] Emit onTabChange event
  - [ ] Mobile: Render at bottom with fixed position

- [ ] **Task 4.5:** Update `app/recommendations/page.tsx`
  - [ ] Add useState for activeTab ('today' | 'thisWeek' | 'hotList')
  - [ ] Add useState for recommendations array
  - [ ] Add useState for hotList array
  - [ ] Add useEffect to fetch data on tab change
  - [ ] Implement fetchTodayRecommendations() (scan_date = today)
  - [ ] Implement fetchThisWeekRecommendations() (scan_date >= 5 days ago)
  - [ ] Implement fetchHotList() (query hot_list_items with JOIN)
  - [ ] Implement handleHotListToggle() (call add/remove API)
  - [ ] Show toast notifications on success/error
  - [ ] Pass pinnedIds to RecommendationList (for star state)

- [ ] **Task 4.6:** Styling updates
  - [ ] Add Tailwind classes for accent bars (border-l-4)
  - [ ] Add color variants (green, blue, amber, red)
  - [ ] Style tabs (active state, hover effects)
  - [ ] Style star button (gold when pinned)
  - [ ] Add mobile breakpoints (bottom tabs, thicker bars)
  - [ ] Test responsive layout (desktop, tablet, mobile)

### Phase 1E: Testing (Day 3 - 3-4 hours)

- [ ] **Task 5.1:** Test rotating universe
  - [ ] Run scanner on Monday (verify Monday universe loads)
  - [ ] Check database: scan_date = Monday, 20-40 recommendations
  - [ ] Run scanner on Tuesday (verify Tuesday universe loads)
  - [ ] Check database: Monday recommendations still active (not deactivated)
  - [ ] Verify "This Week" tab shows Mon + Tue recommendations

- [ ] **Task 5.2:** Test Hot List workflow
  - [ ] Open /recommendations page (Today tab)
  - [ ] Click star on NVDA recommendation
  - [ ] Verify toast: "✓ NVDA added to Hot List"
  - [ ] Verify star fills in (☆ → ★)
  - [ ] Switch to Hot List tab
  - [ ] Verify NVDA appears in Hot List
  - [ ] Verify "Saved X days ago" badge shows
  - [ ] Click "Remove from Hot List"
  - [ ] Verify NVDA removed from Hot List

- [ ] **Task 5.3:** Test tab navigation
  - [ ] Today tab shows only today's scan
  - [ ] This Week tab shows last 5 days
  - [ ] Hot List tab shows pinned items
  - [ ] Badge count updates correctly
  - [ ] Filters work across all tabs

- [ ] **Task 5.4:** Test mobile experience
  - [ ] Tabs render at bottom (fixed position)
  - [ ] Star button in top-right corner (48px touch target)
  - [ ] Accent bars thicker (6px)
  - [ ] Cards stack vertically
  - [ ] Swipe gestures work (optional - Phase 3)

- [ ] **Task 5.5:** Test multi-user isolation
  - [ ] Create 2 test users
  - [ ] User 1 pins AAPL
  - [ ] User 2 logs in
  - [ ] Verify User 2 does NOT see AAPL in their Hot List
  - [ ] Verify RLS policies working correctly

- [ ] **Task 5.6:** Test expiration behavior
  - [ ] Mock scan_date to 8 days ago
  - [ ] Run query: SELECT * FROM trade_recommendations WHERE is_active = true
  - [ ] Verify 8-day-old recommendation does NOT appear (expired)
  - [ ] Verify pinned items still appear in Hot List (persist beyond expiration)

---

## Testing Strategy

### Unit Tests

**Hot List API Routes:**
```typescript
// __tests__/api/hot-list.test.ts
describe('POST /api/hot-list/add', () => {
  it('should add recommendation to Hot List', async () => {
    const response = await fetch('/api/hot-list/add', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recommendation_id: 'uuid-123' })
    });
    expect(response.status).toBe(200);
    expect(response.json()).toHaveProperty('success', true);
  });

  it('should return 409 if already in Hot List', async () => {
    // Add twice
    await fetch('/api/hot-list/add', { /* ... */ });
    const response = await fetch('/api/hot-list/add', { /* ... */ });
    expect(response.status).toBe(409);
  });
});
```

**getTodaysUniverse() Function:**
```typescript
// __tests__/stockUniverseRotation.test.ts
describe('getTodaysUniverse', () => {
  it('should return Monday universe on Monday', () => {
    jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1);
    const universe = getTodaysUniverse();
    expect(universe).toHaveLength(200);
    expect(universe).toContain('AAPL'); // Tech stock
  });

  it('should return empty array on Sunday', () => {
    jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0);
    const universe = getTodaysUniverse();
    expect(universe).toHaveLength(0);
  });
});
```

### Integration Tests

**Full Hot List Workflow:**
```typescript
describe('Hot List Feature', () => {
  it('should allow user to pin and unpin recommendations', async () => {
    // 1. Login as test user
    const { user, token } = await loginTestUser();

    // 2. Fetch recommendations
    const recommendations = await fetchRecommendations(token);
    expect(recommendations.length).toBeGreaterThan(0);

    // 3. Pin first recommendation
    const recommendation = recommendations[0];
    const pinResponse = await pinRecommendation(recommendation.id, token);
    expect(pinResponse.success).toBe(true);

    // 4. Verify appears in Hot List
    const hotList = await fetchHotList(token);
    expect(hotList).toContainEqual(
      expect.objectContaining({ recommendation_id: recommendation.id })
    );

    // 5. Unpin
    const unpinResponse = await unpinRecommendation(recommendation.id, token);
    expect(unpinResponse.success).toBe(true);

    // 6. Verify removed from Hot List
    const updatedHotList = await fetchHotList(token);
    expect(updatedHotList).not.toContainEqual(
      expect.objectContaining({ recommendation_id: recommendation.id })
    );
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/hot-list.spec.ts
test('user can add and remove from Hot List', async ({ page }) => {
  // Login
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Navigate to recommendations
  await page.goto('/recommendations');

  // Pin first recommendation
  await page.click('.recommendation-card:first-child .star-button');
  await expect(page.locator('.toast')).toContainText('Added to Hot List');

  // Verify star is filled
  const star = page.locator('.recommendation-card:first-child .star-button');
  await expect(star).toHaveClass(/pinned/);

  // Switch to Hot List tab
  await page.click('button:has-text("Hot List")');

  // Verify recommendation appears
  await expect(page.locator('.recommendation-card')).toHaveCount(1);

  // Remove from Hot List
  await page.click('button:has-text("Remove from Hot List")');
  await expect(page.locator('.toast')).toContainText('Removed from Hot List');

  // Verify Hot List is empty
  await expect(page.locator('.recommendation-card')).toHaveCount(0);
});
```

---

## Performance Considerations

### Database Optimization

**Index Strategy:**
```sql
-- Fast lookup of active recommendations by scan date
CREATE INDEX idx_recs_active_scan_date
  ON trade_recommendations(scan_date DESC)
  WHERE is_active = true;

-- Fast lookup of user's Hot List items
CREATE INDEX idx_hot_list_user_pinned
  ON hot_list_items(user_id, pinned_at DESC);

-- Fast JOIN between hot_list_items and recommendations
CREATE INDEX idx_recs_id_active
  ON trade_recommendations(id)
  WHERE is_active = true;
```

**Query Performance:**
- Today tab: `scan_date = today` → Fast with index (~10ms)
- This Week tab: `scan_date >= 5 days ago` → Fast with index (~20ms)
- Hot List tab: JOIN between 2 tables → Fast with indexes (~15ms)
- Expected total page load: <100ms for query time

### Frontend Optimization

**Lazy Loading:**
```typescript
// Load 20 cards initially, load more on scroll
function useInfiniteScroll(recommendations: Recommendation[]) {
  const [displayCount, setDisplayCount] = useState(20);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY + window.innerHeight > document.body.scrollHeight - 500) {
        setDisplayCount(prev => prev + 20);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return recommendations.slice(0, displayCount);
}
```

**Caching Strategy:**
```typescript
// Cache recommendations in React Query
const { data: todayRecs } = useQuery(
  ['recommendations', 'today'],
  fetchTodayRecommendations,
  { staleTime: 60000 } // Cache for 1 minute
);

const { data: hotList, refetch: refetchHotList } = useQuery(
  ['hot-list'],
  fetchHotList,
  { staleTime: 30000 } // Cache for 30 seconds
);
```

### API Rate Limiting

**Prevent Spam Clicks:**
```typescript
// Debounce star button clicks
const debouncedToggle = useMemo(
  () => debounce(handleHotListToggle, 300),
  []
);

<StarButton
  isPinned={isPinned}
  onToggle={debouncedToggle}
/>
```

---

## Monitoring & Analytics

### Success Metrics

**Hot List Adoption:**
- Track: % of users who pin at least 1 recommendation
- Goal: >40% adoption within first week
- Metric: `COUNT(DISTINCT user_id) FROM hot_list_items / total_users`

**Pin Engagement:**
- Track: Average pins per user
- Goal: 3-5 pins per active user
- Metric: `COUNT(*) FROM hot_list_items / COUNT(DISTINCT user_id)`

**Pin → Trade Conversion:**
- Track: % of pinned items that result in paper trades
- Goal: >25% conversion rate
- Metric: Requires linking hot_list_items to paper_trading_orders

**Recommendation Volume:**
- Track: Daily recommendation count by tab
- Expected:
  - Today: 20-40 recommendations
  - This Week: 100-200 recommendations
  - Hot List: 3-10 per user

### Logging

**Scanner Logs:**
```typescript
console.log(`📅 ${getTodayName()} Scan Started`);
console.log(`🎯 Universe: ${stocks.length} stocks (${getTodayName()} rotation)`);
console.log(`✅ Found ${opportunities.length} opportunities`);
console.log(`💾 Stored ${inserted} recommendations (scan_date: ${scanDate})`);
console.log(`📊 Active recommendations: ${totalActive} (multi-day cumulative)`);
```

**Hot List API Logs:**
```typescript
console.log(`[Hot List] User ${userId} added recommendation ${recommendationId}`);
console.log(`[Hot List] User ${userId} removed recommendation ${recommendationId}`);
console.log(`[Hot List] User ${userId} has ${hotListCount} pinned items`);
```

### Error Tracking

**Sentry Integration:**
```typescript
// app/api/hot-list/add/route.ts
try {
  // ... add to Hot List
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'hot-list',
      action: 'add',
      user_id: currentUser.id
    }
  });
  return NextResponse.json({ error: 'Failed to add to Hot List' }, { status: 500 });
}
```

---

## Migration & Rollout Plan

### Phase 1: Pilot (Week 1)

**Goal:** Validate rotation concept with existing users

**Actions:**
1. Deploy rotating universe (200 stocks/day)
2. Monitor daily scan performance (execution time, opportunities found)
3. Collect user feedback on multi-day recommendation experience
4. Measure database growth (recommendations table size)

**Success Criteria:**
- Scanner completes successfully 5/5 days
- Users report finding valuable opportunities across multiple days
- Database performance acceptable (<100ms query times)
- No major bugs or errors

### Phase 2: Hot List Launch (Week 2)

**Goal:** Enable user curation and triage

**Actions:**
1. Deploy Hot List database schema
2. Deploy Hot List API routes
3. Deploy Hot List frontend UI
4. Monitor adoption metrics (% of users pinning)
5. Collect user feedback on Hot List UX

**Success Criteria:**
- >40% of active users pin at least 1 recommendation
- Average 3-5 pins per user
- Toast notifications working correctly
- No RLS policy violations (user isolation working)

### Phase 3: Optimization (Week 3-4)

**Goal:** Refine based on user behavior

**Actions:**
1. Add freshness indicators (color-coded bars, scan date badges)
2. Optimize mobile experience (bottom tabs, swipe gestures)
3. Add filter for "Expiring Soon" (6-7 days old)
4. Implement lazy loading for large lists

**Success Criteria:**
- Mobile usage >50% of total Hot List interactions
- Users report improved ability to find fresh opportunities
- Page load time <2 seconds (including 500 recommendations)

### Phase 4: Future Enhancements (Month 2+)

**Potential Features:**
1. User notes on pinned items ("Waiting for earnings")
2. Price alerts on Hot List items ("Notify when hits entry")
3. Performance tracking ("Up 5.2% since scan")
4. Share Hot List with other users
5. Export Hot List to CSV/PDF

---

## Risks & Mitigations

### Risk 1: Recommendation Overload

**Problem:** Users overwhelmed by 100-500 recommendations

**Mitigation:**
- Default to "Today" tab (20-40 items)
- Require explicit action to view "This Week" (opt-in)
- Add filter: "High Confidence Only" (reduces noise)
- Improve sorting: Prioritize fresh scans + high scores

### Risk 2: Stale Setups

**Problem:** 5-day-old recommendation no longer valid

**Mitigation:**
- Color-coded freshness indicators (red = expiring soon)
- Explicit "Scanned Monday" badge (users know age)
- Natural expiration after 7 days (auto-cleanup)
- Filter: "Fresh Only" (0-2 days old)

### Risk 3: Database Growth

**Problem:** Recommendations table grows too large

**Current:**
- Single universe: ~30 recs/day × 7 days = ~210 rows
- Rotating universe: ~70 recs/day × 7 days = ~490 rows

**Mitigation:**
- Auto-cleanup via `expires_at` (already implemented)
- Weekly cleanup job: DELETE WHERE expires_at < NOW() - 30 days
- Indexes on scan_date for fast queries
- Partitioning by month if needed (future optimization)

### Risk 4: API Rate Limits (Yahoo Finance)

**Problem:** 200 stocks/day × 5 days = 1,000 API calls/week

**Current Status:**
- Yahoo Finance has no hard rate limits
- Some throttling if excessive (>1000 calls/hour)
- Scanner spreads calls over ~5 minutes (200 stocks in batches)

**Mitigation:**
- Batch processing (8 stocks per batch, 2s delay)
- Retry logic with exponential backoff
- Fallback to Twelve Data if Yahoo fails
- Monitor error logs for rate limit errors

### Risk 5: User Confusion

**Problem:** Users don't understand why Monday's scan still appears on Friday

**Mitigation:**
- Tooltip: "This opportunity was scanned on Monday (4 days ago)"
- Help text: "Recommendations expire 7 days after scan date"
- Onboarding modal (first time seeing multi-day recs)
- Color-coded freshness (visual cue)

---

## Documentation for Users

### Help Text: Understanding Multi-Day Recommendations

**Title:** "How does the 5-day rotating universe work?"

**Content:**

> **What You'll See:**
>
> Each weekday, we scan 200 different stocks (1,000 total per week). Recommendations remain active for 7 days, so by Friday you'll see opportunities from Monday through Friday scans.
>
> **Color Indicators:**
> - 🟢 Green: Scanned today (freshest)
> - 🔵 Blue: 1-2 days old (recent)
> - 🟡 Amber: 3-5 days old (aging)
> - 🔴 Red: 6-7 days old (expiring soon)
>
> **Tips:**
> - Focus on "Today" tab for the freshest opportunities
> - Use "This Week" tab to see broader market coverage
> - Pin interesting setups to your "Hot List" for later review
> - Older recommendations (red) may have already moved - review carefully

### Help Text: Using the Hot List

**Title:** "What is the Hot List?"

**Content:**

> **Your Personal Watchlist:**
>
> The Hot List lets you save interesting trade opportunities for later review. Unlike daily recommendations that expire after 7 days, Hot List items persist until you remove them.
>
> **How to Use:**
> 1. Browse daily recommendations (Today or This Week tabs)
> 2. Click the ⭐ star icon on any opportunity you want to save
> 3. Switch to the "Hot List" tab to review your saved items
> 4. Take action or click "Remove from Hot List" when done
>
> **Use Cases:**
> - "I like this setup but need to research the company first"
> - "Good opportunity but I'm at max position size this week"
> - "Waiting for this pattern to fully develop before entering"
> - "Want to compare this against other similar setups"

---

## Conclusion

This implementation plan provides a comprehensive roadmap for:

1. **5-Day Rotating Universe:** Expose users to 5× more stocks (1,000 vs 200) without overwhelming them
2. **Hot List Feature:** Enable user curation and deferred decision-making

**Key Benefits:**
- ✅ Broader market coverage (1,000 stocks/week)
- ✅ Multi-day recommendation accumulation (Mon+Tue+Wed+Thu+Fri)
- ✅ User triage and research workflow (pin → review → act)
- ✅ No API costs (Yahoo Finance free unlimited)
- ✅ Database already supports multi-day active recommendations
- ✅ Clean UX with tabs (Today | This Week | Hot List)

**Estimated Timeline:**
- Day 1: Rotating universe + database schema (5 hours)
- Day 2: API routes + frontend UI (7 hours)
- Day 3: Freshness indicators + testing (4 hours)
- **Total: 2-3 days for MVP**

**Next Steps:**
1. Curate 1,000 stocks (200 per weekday) organized by sector
2. Implement rotating universe logic
3. Create Hot List database + API routes
4. Build frontend tabs + star button UI
5. Test full workflow
6. Deploy to production
7. Monitor adoption metrics

---

## Appendix A: Stock Universe Curation Guidelines

### Selection Criteria

**Liquidity Requirements:**
- Average daily volume >500K shares
- Market cap >$500M
- Actively traded on major exchanges (NYSE, NASDAQ)

**Sector Diversification:**
- Monday (Tech): 60% technology, 40% communication services
- Tuesday (Finance/Energy): 50% financial, 50% energy
- Wednesday (Healthcare/Consumer): 60% healthcare, 40% consumer staples
- Thursday (Industrials/Materials): 60% industrials, 40% basic materials
- Friday (Cyclical/Small-cap): Consumer cyclical + small-cap growth

**Data Quality:**
- Available on Yahoo Finance (no delisted stocks)
- Clean historical data (no excessive gaps)
- No penny stocks (<$5)
- No leveraged ETFs

### Stock Sources

1. **S&P 500:** ~500 large-cap stocks (use as foundation)
2. **Russell 1000:** Add liquid mid-caps not in S&P 500
3. **High-Volume NASDAQ:** Tech growth stocks (NVDA, TSLA, etc.)
4. **Sector ETF Holdings:** XLF (finance), XLE (energy), XLV (healthcare), etc.
5. **Avoid:** Delisted stocks (ANSS, ATVI, BLL, DFS, HES, GOLD from scan errors)

---

## Appendix B: Color Accessibility Reference

### Color Blindness Considerations

**Protanopia (Red-Green):**
- Green (●Today) → Use with icon to differentiate
- Blue (◉Recent) → Distinct from green
- Amber (◐Aging) → May appear similar to green
- Red (◯Expiring) → May appear similar to green

**Solution:**
- Always pair color with icon (●, ◉, ◐, ◯)
- Include text label ("Today", "2d ago", "5d ago", "6d ago")
- Icons have different shapes (filled, outlined, half-filled, empty)

### WCAG Compliance

**Contrast Ratios:**
- Text on background: Minimum 4.5:1 (AA)
- Large text: Minimum 3:1 (AA)
- Accent bars: Decorative (no minimum required)

**Touch Targets:**
- Star button: 48px × 48px (AAA compliant)
- Tab buttons: 48px height minimum
- Card clickable area: Full card (easy to tap)

---

## Appendix C: Mobile Swipe Gesture Implementation (Phase 3)

### Swipe Left = Add to Hot List

```typescript
// components/RecommendationCard.tsx
import { useSwipeable } from 'react-swipeable';

export function RecommendationCard({ recommendation, onToggleHotList }) {
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setSwipeOffset(eventData.deltaX);
    },
    onSwipedLeft: () => {
      if (!isPinned) {
        onToggleHotList(recommendation.id);
        setSwipeOffset(0);
      }
    },
    onSwipedRight: () => {
      if (isPinned) {
        onToggleHotList(recommendation.id);
        setSwipeOffset(0);
      }
    },
    trackMouse: false,  // Only touch gestures
    preventScrollOnSwipe: true
  });

  return (
    <div
      {...handlers}
      style={{ transform: `translateX(${swipeOffset}px)` }}
      className="recommendation-card"
    >
      {/* Card content */}

      {/* Swipe hint (visible during swipe) */}
      {swipeOffset < -50 && !isPinned && (
        <div className="swipe-hint-left">
          ⭐ Add to Hot List
        </div>
      )}

      {swipeOffset > 50 && isPinned && (
        <div className="swipe-hint-right">
          🗑️ Remove
        </div>
      )}
    </div>
  );
}
```

**Haptic Feedback:**
```typescript
// Trigger when swipe completes
if (navigator.vibrate) {
  navigator.vibrate(50); // 50ms vibration
}
```

---

**End of Document**
