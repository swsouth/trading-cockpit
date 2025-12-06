# UX Implementation Plan - Phase 1 (P0 Critical Items)

**Based on:** UX_ASSESSMENT_REPORT.md
**Priority:** P0 - Critical improvements for immediate impact
**Timeline:** Sprints 1-2 (2-4 weeks)
**Goal:** Address core usability issues causing decision paralysis and trust gaps

---

## Overview

This plan addresses the 4 critical (P0) UX issues identified in the assessment:

1. **Dashboard Identity Crisis** → Mission Control Hub
2. **Cognitive Overload in Recommendations** → Progressive Disclosure
3. **Missing AI Trust Signals** → Score Transparency
4. **Poor Mobile Optimization (Day Trader)** → Touch-Optimized Interface

---

## P0-1: Dashboard → Mission Control Hub

### Problem Statement
Current Dashboard is a redundant watchlist page with no unique strategic value. Users have no clear entry point showing "what's important right now."

### Success Metrics
- **Time to first action**: <60 seconds from login
- **Dashboard engagement**: >80% of sessions start here
- **Quick navigation**: >60% use dashboard links vs sidebar

### Implementation Details

#### Phase 1.1: Data Aggregation Components

**New API Endpoints:**
```typescript
// app/api/dashboard/summary/route.ts
GET /api/dashboard/summary
Returns: {
  performance: {
    totalPL: number,
    winRate: number,
    openPositions: number,
    todaysPL: number
  },
  topOpportunities: TradeRecommendation[] (limit 3),
  activePositions: Position[] (limit 3),
  scanStatus: {
    lastScan: Date,
    nextScan: Date,
    opportunitiesFound: number
  }
}
```

**New Components to Create:**
1. `components/dashboard/PerformanceHeader.tsx`
   - Account summary card (P/L, win rate, positions)
   - Green/red visual indicators
   - "View Full Analytics →" link

2. `components/dashboard/TopOpportunities.tsx`
   - Compact recommendation cards (3 max)
   - Score + Symbol + Direction only
   - "View All Recommendations →" link

3. `components/dashboard/ActivePositionsSummary.tsx`
   - Position cards with P/L emphasis
   - Quick "Close Position" action
   - "Manage All Positions →" link

4. `components/dashboard/CompactWatchlist.tsx`
   - Horizontal scroll ticker-style display
   - Quick add/remove symbols
   - "Scan Watchlist" button

#### Phase 1.2: Layout Redesign

**File to Modify:** `app/page.tsx`

**New Layout Structure:**
```jsx
<DashboardLayout>
  {/* Hero Section */}
  <PerformanceHeader
    totalPL={accountData.totalPL}
    winRate={analyticsData.winRate}
    openPositions={positions.length}
    todaysPL={positions.reduce(...)}
  />

  {/* Two-Column Grid */}
  <Grid cols={2} gap={6} className="mt-6">
    {/* Left Column: Opportunities */}
    <Card>
      <CardHeader>
        <h2>Top Opportunities</h2>
        <Badge>3 High-Confidence Setups</Badge>
      </CardHeader>
      <TopOpportunities
        recommendations={topRecs}
        onViewAll={() => navigate('/recommendations')}
      />
    </Card>

    {/* Right Column: Positions */}
    <Card>
      <CardHeader>
        <h2>Active Positions</h2>
        <Badge variant={positions.length > 0 ? 'default' : 'secondary'}>
          {positions.length} Open
        </Badge>
      </CardHeader>
      <ActivePositionsSummary
        positions={positions.slice(0, 3)}
        onManageAll={() => navigate('/paper-trading/positions')}
      />
    </Card>
  </Grid>

  {/* Bottom Section: Watchlist (Deprioritized) */}
  <Card className="mt-6">
    <CardHeader>
      <h2>Watchlist</h2>
      <Button variant="outline" size="sm">Scan Now</Button>
    </CardHeader>
    <CompactWatchlist
      symbols={watchlist}
      onScan={handleScan}
    />
  </Card>
</DashboardLayout>
```

**Visual Hierarchy:**
```
┌─────────────────────────────────────────────┐
│ Performance Header (HERO)                   │
│ +$1,234 (12.3%) | 65% Win Rate | 3 Positions│
└─────────────────────────────────────────────┘
        ↓ PRIMARY FOCUS (largest text)

┌─────────────────────┐ ┌─────────────────────┐
│ Top Opportunities   │ │ Active Positions    │
│ ────────────────    │ │ ────────────────    │
│ BTC  LONG  Score 85 │ │ AAPL  +$234  +5.2%  │
│ ETH  LONG  Score 82 │ │ MSFT  -$45   -1.1%  │
│ SOL  SHORT Score 78 │ │ NVDA  +$890  +8.9%  │
│                     │ │                     │
│ [View All Recs →]   │ │ [Manage Positions →]│
└─────────────────────┘ └─────────────────────┘
        ↓ SECONDARY FOCUS (cards)

┌─────────────────────────────────────────────┐
│ Watchlist (Compact Ticker)                  │
│ [+] AAPL 150.00 ▲ | MSFT 380.50 ▼ | ...    │
│ [Scan Watchlist]                            │
└─────────────────────────────────────────────┘
        ↓ TERTIARY (minimal visual weight)
```

#### Phase 1.3: Implementation Steps

**Step 1: Create API endpoint** (1 day)
- [ ] File: `app/api/dashboard/summary/route.ts`
- [ ] Aggregate data from recommendations, positions, analytics
- [ ] Add caching (5-minute TTL)
- [ ] Test response time (<500ms target)

**Step 2: Build reusable components** (2 days)
- [ ] `PerformanceHeader.tsx` - Account metrics display
- [ ] `TopOpportunities.tsx` - Compact rec cards
- [ ] `ActivePositionsSummary.tsx` - P/L focused position cards
- [ ] `CompactWatchlist.tsx` - Horizontal ticker

**Step 3: Redesign Dashboard page** (1 day)
- [ ] Update `app/page.tsx` with new layout
- [ ] Remove old watchlist-centric code
- [ ] Add loading states for async data
- [ ] Test responsive breakpoints

**Step 4: Add navigation shortcuts** (0.5 days)
- [ ] Quick links from each card to full pages
- [ ] "View All" buttons with proper routing
- [ ] Maintain breadcrumb context

**Step 5: Testing & refinement** (0.5 days)
- [ ] User flow testing: Login → Dashboard → Action
- [ ] Performance testing: Load time, data freshness
- [ ] Mobile testing: Touch targets, card stacking

**Total Estimated Time:** 5 days

---

## P0-2: Recommendation Cards → Progressive Disclosure

### Problem Statement
11+ fields per card create decision paralysis. Users can't quickly scan for actionable setups.

### Success Metrics
- **Card scroll depth**: >50% users view 3+ cards (up from unknown)
- **Time to evaluate**: <10 seconds per card (measured via heatmaps)
- **Expand rate**: >30% expand cards for full details

### Implementation Details

#### Phase 2.1: Collapsed Card State (Default)

**File to Modify:** `components/RecommendationCard.tsx`

**New Collapsed Layout:**
```jsx
<Card className="collapsed-card">
  {/* Header: Symbol + Score + Direction */}
  <CardHeader className="flex justify-between items-center">
    <div className="flex items-center gap-4">
      <h3 className="text-3xl font-bold">{symbol}</h3>
      <Badge variant={direction === 'long' ? 'default' : 'destructive'}>
        {direction.toUpperCase()}
      </Badge>
    </div>

    <OpportunityScoreDisplay
      score={opportunityScore}
      size="large"
      showBreakdown // Triggers tooltip on hover
    />
  </CardHeader>

  {/* Price Levels Grid - EMPHASIZED */}
  <div className="grid grid-cols-4 gap-2 mt-4 p-4 bg-muted/20 rounded">
    <PriceLevel label="Entry" value={entryPrice} />
    <PriceLevel label="Target" value={targetPrice} change={targetPercent} />
    <PriceLevel label="Stop" value={stopLoss} change={stopPercent} />
    <PriceLevel label="R:R" value={`${riskReward}:1`} highlight />
  </div>

  {/* Rationale Summary - ONE LINE */}
  <p className="text-sm text-muted-foreground mt-3 line-clamp-1">
    {rationaleOneLine}
  </p>

  {/* Action Bar */}
  <CardFooter className="flex justify-between items-center mt-4">
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleExpand}
      className="flex items-center gap-1"
    >
      {isExpanded ? 'Show Less' : 'Show Details'}
      <ChevronDown className={isExpanded ? 'rotate-180' : ''} />
    </Button>

    <div className="flex gap-2">
      <Button variant="outline" size="sm">
        View Chart
      </Button>
      <Button size="sm">
        Paper Trade
      </Button>
    </div>
  </CardFooter>
</Card>
```

**Visual Comparison:**

**BEFORE (Current):**
```
┌────────────────────────────────────┐
│ AAPL  LONG  82  HIGH  ★HOT         │ ← 5 badges
│ Scanned 2 days ago                 │
│ Setup: bullish_high                │
│ Pattern: bullish_engulfing         │
│ Score: 82 | Vetting: 85            │
│ Entry: $150 | Target: $165 | Stop  │
│ Timeframe: 3-5 days                │
│ R:R: 3.0:1                         │
│ Channel: inside | Trend: up        │
│ Near support at $148.50...full text│ ← Long rationale
│ [Technical Details]                │
│ [Vetting Breakdown]                │
│ [Chart] [Paper Trade]              │
└────────────────────────────────────┘
```

**AFTER (Collapsed):**
```
┌────────────────────────────────────┐
│ AAPL            LONG           82  │ ← Large, clear
│                                    │
│ Entry    Target   Stop      R:R   │
│ $150.00  $165.00  $145.00   3.0:1 │ ← Grid emphasis
│ ────────────────────────────────── │
│ Near support, bullish pattern...  │ ← 1 line only
│                                    │
│ [Show Details ▼]    [Chart][Trade]│
└────────────────────────────────────┘
```

#### Phase 2.2: Expanded Card State (On Click)

**Expanded Content (Hidden by Default):**
```jsx
{isExpanded && (
  <CardContent className="mt-4 space-y-4 border-t pt-4">
    {/* Full Rationale */}
    <div>
      <h4 className="font-semibold text-sm">Analysis</h4>
      <p className="text-sm text-muted-foreground">{fullRationale}</p>
    </div>

    {/* Vetting Breakdown */}
    <VettingBreakdown checks={vettingChecks} score={vettingScore} />

    {/* Technical Details */}
    <div className="grid grid-cols-2 gap-2 text-xs">
      <Detail label="Pattern" value={patternDetected} />
      <Detail label="Channel" value={channelStatus} />
      <Detail label="Trend" value={trend} />
      <Detail label="Timeframe" value={expectedTimeframe} />
    </div>

    {/* Metadata */}
    {scanDate && (
      <p className="text-xs text-muted-foreground">
        Scanned {formatDistanceToNow(scanDate)} ago
      </p>
    )}
  </CardContent>
)}
```

#### Phase 2.3: State Management

**Add to component:**
```typescript
const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

const toggleExpand = (recommendationId: string) => {
  setExpandedCards(prev => {
    const next = new Set(prev);
    if (next.has(recommendationId)) {
      next.delete(recommendationId);
    } else {
      next.add(recommendationId);
    }
    return next;
  });
};

// Persist to localStorage
useEffect(() => {
  localStorage.setItem('expandedCards', JSON.stringify([...expandedCards]));
}, [expandedCards]);
```

#### Phase 2.4: Implementation Steps

**Step 1: Refactor RecommendationCard** (2 days)
- [ ] Create `CollapsedCardView` component
- [ ] Create `ExpandedCardView` component
- [ ] Add expand/collapse state management
- [ ] Test transitions (smooth animation)

**Step 2: Extract subcomponents** (1 day)
- [ ] `PriceLevelGrid.tsx` - 4-column price display
- [ ] `OpportunityScoreDisplay.tsx` - Score with hover tooltip
- [ ] `VettingBreakdown.tsx` - Checks visualization
- [ ] `RationaleSummary.tsx` - Truncated text with expand

**Step 3: Update Recommendations page** (0.5 days)
- [ ] Pass expand state to cards
- [ ] Add "Expand All" / "Collapse All" toggle
- [ ] Persist preferences to localStorage

**Step 4: Accessibility** (0.5 days)
- [ ] Keyboard navigation (Enter to expand)
- [ ] ARIA labels for screen readers
- [ ] Focus management on expand/collapse

**Step 5: Testing** (1 day)
- [ ] User testing: Can users find details when needed?
- [ ] Performance: Measure render time for 20 cards
- [ ] Mobile: Test touch targets and animations

**Total Estimated Time:** 5 days

---

## P0-3: AI Score Transparency → Breakdown Tooltips

### Problem Statement
Users see "Score: 75" but have no idea how it's calculated, eroding trust in AI recommendations.

### Success Metrics
- **Tooltip usage**: >40% hover on scores (heatmap tracking)
- **Trust indicator**: Survey shows >70% understand scoring
- **Paper trade conversion**: +10% increase (from current unknown baseline)

### Implementation Details

#### Phase 3.1: Score Breakdown Component

**New Component:** `components/ai/ScoreBreakdownTooltip.tsx`

```typescript
interface ScoreComponent {
  label: string;
  value: number;
  maxValue: number;
  explanation: string;
  color: 'green' | 'yellow' | 'red';
}

interface ScoreBreakdownTooltipProps {
  score: number;
  components: ScoreComponent[];
  historicalWinRate?: number;
}

export function ScoreBreakdownTooltip({
  score,
  components,
  historicalWinRate
}: ScoreBreakdownTooltipProps) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Badge
          variant={score >= 75 ? 'default' : score >= 60 ? 'secondary' : 'destructive'}
          className="text-2xl px-4 py-2 cursor-help"
        >
          {score}
        </Badge>
      </HoverCardTrigger>

      <HoverCardContent className="w-96" side="right">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h4 className="font-semibold">Opportunity Score Breakdown</h4>
            <p className="text-xs text-muted-foreground">
              How this {score}/100 score was calculated
            </p>
          </div>

          {/* Components */}
          {components.map(comp => (
            <div key={comp.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{comp.label}</span>
                <span className="font-medium">
                  {comp.value}/{comp.maxValue}
                </span>
              </div>

              <Progress
                value={(comp.value / comp.maxValue) * 100}
                className="h-2"
                indicatorColor={comp.color}
              />

              <p className="text-xs text-muted-foreground">
                {comp.explanation}
              </p>
            </div>
          ))}

          {/* Historical Context */}
          {historicalWinRate && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-muted-foreground">
                Similar setups (last 30 days):
                <span className="font-semibold text-foreground ml-1">
                  {historicalWinRate}% win rate
                </span>
              </p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

**Example Breakdown Data:**
```typescript
const exampleBreakdown = {
  score: 75,
  components: [
    {
      label: 'Trend Strength',
      value: 28,
      maxValue: 30,
      explanation: 'Strong upward channel with clear support/resistance',
      color: 'green'
    },
    {
      label: 'Pattern Quality',
      value: 22,
      maxValue: 25,
      explanation: 'Bullish engulfing pattern with strong confirmation',
      color: 'green'
    },
    {
      label: 'Volume Confirmation',
      value: 15,
      maxValue: 20,
      explanation: 'Volume 25% above 30-day average',
      color: 'yellow'
    },
    {
      label: 'Risk/Reward',
      value: 10,
      maxValue: 15,
      explanation: '3.0:1 risk/reward ratio (target: 2.5+)',
      color: 'green'
    },
    {
      label: 'Momentum/RSI',
      value: 7,
      maxValue: 10,
      explanation: 'RSI at 65 (optimal 60-70 zone)',
      color: 'yellow'
    }
  ],
  historicalWinRate: 68
};
```

#### Phase 3.2: Database Schema Extension

**Migration:** Add `score_components` JSONB column to `trade_recommendations`

```sql
-- Migration: 20250107000000_add_score_components.sql
ALTER TABLE trade_recommendations
ADD COLUMN score_components JSONB;

-- Example data structure:
-- {
--   "trend_strength": { "value": 28, "max": 30 },
--   "pattern_quality": { "value": 22, "max": 25 },
--   "volume_confirmation": { "value": 15, "max": 20 },
--   "risk_reward": { "value": 10, "max": 15 },
--   "momentum_rsi": { "value": 7, "max": 10 }
-- }
```

**Update Scoring Logic:** Modify `lib/scoring/index.ts`

```typescript
export function calculateOpportunityScore(/* ... */): OpportunityScoreResult {
  // Calculate individual components
  const trendScore = scoreTrend(channel, candles);
  const patternScore = scorePattern(pattern);
  const volumeScore = scoreVolume(candles);
  const rrScore = scoreRiskReward(riskReward);
  const momentumScore = scoreMomentum(rsi);

  // Total score
  const totalScore = trendScore.value + patternScore.value + volumeScore.value + rrScore.value + momentumScore.value;

  // Return breakdown for database storage
  return {
    score: totalScore,
    confidence: determineConfidence(totalScore),
    components: {
      trend_strength: trendScore,
      pattern_quality: patternScore,
      volume_confirmation: volumeScore,
      risk_reward: rrScore,
      momentum_rsi: momentumScore
    }
  };
}
```

#### Phase 3.3: Implementation Steps

**Step 1: Create breakdown component** (1 day)
- [ ] Build `ScoreBreakdownTooltip.tsx`
- [ ] Style progress bars with color coding
- [ ] Add hover animations
- [ ] Test accessibility (keyboard, screen reader)

**Step 2: Update scoring engine** (2 days)
- [ ] Modify `lib/scoring/index.ts` to return components
- [ ] Update `lib/scoring/components.ts` with explanations
- [ ] Add historical win rate calculation
- [ ] Test scoring consistency

**Step 3: Database migration** (0.5 days)
- [ ] Create migration for `score_components` column
- [ ] Update scanner to save breakdown
- [ ] Backfill existing recommendations (optional)

**Step 4: Integrate into UI** (1 day)
- [ ] Replace simple Badge with ScoreBreakdownTooltip
- [ ] Add to RecommendationCard
- [ ] Add to Day Trader opportunities
- [ ] Test tooltip positioning on mobile

**Step 5: Analytics & testing** (0.5 days)
- [ ] Add heatmap tracking for tooltip hovers
- [ ] User testing: Does breakdown increase trust?
- [ ] A/B test: Tooltip vs no tooltip conversion rates

**Total Estimated Time:** 5 days

---

## P0-4: Day Trader Mobile Optimization → Touch Targets

### Problem Statement
Time-sensitive trades require precise taps on small buttons, causing missed opportunities on mobile.

### Success Metrics
- **Mobile tap success rate**: >95% (vs current unknown)
- **Time to execute trade**: <3 seconds from decision
- **Mobile bounce rate**: <30% (measure via GA4)

### Implementation Details

#### Phase 4.1: Responsive Button Sizing

**File to Modify:** `app/day-trader/page.tsx`

**Mobile-First Button Approach:**
```jsx
<div className="flex gap-2 flex-col sm:flex-row">
  {/* Mobile: Full-width, large touch targets */}
  <Button
    variant="outline"
    size="lg"
    className="w-full sm:w-auto min-h-[48px]" // Apple HIG minimum
    onClick={handleViewChart}
  >
    <TrendingUp className="w-5 h-5 mr-2" />
    View Chart
  </Button>

  <Button
    size="lg"
    className="w-full sm:w-auto min-h-[48px]"
    onClick={handlePaperTrade}
  >
    <ArrowUpRight className="w-5 h-5 mr-2" />
    Paper Trade
  </Button>
</div>
```

**Responsive Card Layout:**
```jsx
{/* Desktop: Side-by-side layout */}
<Card className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
  <div className="space-y-3">
    {/* Opportunity details */}
  </div>

  {/* Desktop: Vertical action stack */}
  <div className="hidden md:flex flex-col gap-2 justify-center">
    <Button size="sm">Chart</Button>
    <Button size="sm">Trade</Button>
  </div>

  {/* Mobile: Full-width bottom actions */}
  <div className="md:hidden flex gap-2">
    <Button size="lg" variant="outline" className="flex-1 min-h-[48px]">
      Chart
    </Button>
    <Button size="lg" className="flex-1 min-h-[48px]">
      Trade
    </Button>
  </div>
</Card>
```

#### Phase 4.2: Touch Gesture Support

**Add Swipe Actions:**
```typescript
import { useSwipeable } from 'react-swipeable';

function IntradayOpportunityCard({ opportunity }) {
  const handlers = useSwipeable({
    onSwipedRight: () => handlePaperTrade(opportunity),
    onSwipedLeft: () => handleDismiss(opportunity),
    trackMouse: false // Only on touch devices
  });

  return (
    <div {...handlers} className="swipeable-card">
      {/* Swipe hint indicator */}
      <div className="absolute inset-y-0 left-0 w-2 bg-green-500 opacity-0 swipe-indicator" />
      <div className="absolute inset-y-0 right-0 w-2 bg-red-500 opacity-0 swipe-indicator" />

      {/* Card content */}
    </div>
  );
}
```

**CSS for Swipe Feedback:**
```css
.swipeable-card {
  position: relative;
  transition: transform 0.2s ease;
}

.swipeable-card:active {
  transform: scale(0.98);
}

/* Show swipe indicators during drag */
.swipeable-card[data-swiping="right"] .swipe-indicator:first-child {
  opacity: 1;
  transition: opacity 0.2s;
}

.swipeable-card[data-swiping="left"] .swipe-indicator:last-child {
  opacity: 1;
  transition: opacity 0.2s;
}
```

#### Phase 4.3: Haptic Feedback

**Add Vibration API:**
```typescript
function handlePaperTrade(opportunity: IntradayOpportunity) {
  // Haptic feedback on mobile
  if ('vibrate' in navigator) {
    navigator.vibrate(50); // 50ms pulse
  }

  // Execute trade
  executePaperTrade(opportunity);
}

function handleCountdownExpiry() {
  // Double pulse for expiration
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
}
```

#### Phase 4.4: Implementation Steps

**Step 1: Update button sizing** (1 day)
- [ ] Audit all Day Trader buttons for touch target size
- [ ] Apply responsive classes (min-h-[48px] on mobile)
- [ ] Test on physical devices (iPhone, Android)
- [ ] Ensure adequate spacing between buttons (8px minimum)

**Step 2: Implement swipe gestures** (2 days)
- [ ] Install `react-swipeable` library
- [ ] Add swipe handlers to opportunity cards
- [ ] Implement visual feedback (swipe indicators)
- [ ] Add confirmation modal for accidental swipes

**Step 3: Add haptic feedback** (0.5 days)
- [ ] Implement vibration on trade execution
- [ ] Add pulse on countdown expiry
- [ ] Test across devices (iOS, Android)

**Step 4: Responsive layout refinement** (1 day)
- [ ] Test card layouts at all breakpoints
- [ ] Optimize countdown timer visibility on mobile
- [ ] Ensure execution quality badges don't wrap poorly
- [ ] Test landscape orientation

**Step 5: User testing on mobile** (0.5 days)
- [ ] Physical device testing (5 users minimum)
- [ ] Measure tap success rate
- [ ] Collect feedback on swipe gestures
- [ ] Refine based on results

**Total Estimated Time:** 5 days

---

## Summary: Phase 1 Timeline

| Task | Duration | Dependencies | Owner |
|------|----------|--------------|-------|
| P0-1: Dashboard Hub | 5 days | None | Frontend Dev |
| P0-2: Card Progressive Disclosure | 5 days | None | Frontend Dev |
| P0-3: Score Breakdown | 5 days | Scoring engine access | Frontend + Backend |
| P0-4: Mobile Touch Targets | 5 days | None | Frontend Dev |

**Total Time:** 20 days (4 weeks with 1 developer, 2 weeks with 2 developers)

**Recommended Approach:**
- **Sprint 1 (Week 1-2)**: P0-1 (Dashboard) + P0-3 (Score transparency)
- **Sprint 2 (Week 3-4)**: P0-2 (Progressive disclosure) + P0-4 (Mobile)

**Post-Implementation:**
- User testing session (2 days)
- Refinement based on feedback (3 days)
- Analytics setup and monitoring (1 day)

---

## Next Steps

After Phase 1 completion, proceed to:
- **Phase 2 (P1)**: Settings expansion, Library realignment, Navigation reorganization
- **Phase 3 (P2)**: Keyboard shortcuts, WebSocket integration, Advanced analytics

**Success Validation:**
1. A/B test new Dashboard vs old (conversion rates)
2. Heatmap analysis on Recommendations page (scroll depth)
3. Mobile analytics (bounce rate, time on page)
4. User surveys (trust in AI scores, perceived value)

---

**Document Status:** Ready for Implementation
**Last Updated:** 2025-12-06
**Next Review:** After Sprint 1 completion
