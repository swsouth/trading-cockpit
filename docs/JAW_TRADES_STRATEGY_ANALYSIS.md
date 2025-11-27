# Jaw Trades Strategy Analysis

**Source:** Chart Fanatics Podcast - Jay Ortani Interview (47-page transcript)
**Trader Profile:** Jay Ortani (@JawTrades) - Took $3K to 7 figures using order flow strategy
**Date Analyzed:** November 2024

---

## Executive Summary

Jay Ortani's "Market DNA" strategy represents a fundamental shift from traditional technical analysis to **order flow analysis**. Rather than relying on lagging indicators created by price action, his approach focuses on the actual buyers and sellers creating those price movements.

**Core Philosophy:** "I don't use indicators because they're created by price action, which is created by buyers and sellers. I go straight to the source - the buyers and sellers."

**Key Differentiator:** His edge comes from understanding **action vs reaction** - detecting when large selling pressure doesn't move price down (buyers absorbing) or when buying pressure doesn't move price up (sellers absorbing).

---

## 8 Core Concepts from Jaw Trades

### 1. Order Flow Over Indicators

**What:** Focus on actual buyers and sellers, not derived indicators
**Why:** Indicators are lagging - they're created by price action, which is created by buyers/sellers
**How to Apply:**
- Track bid/ask ratio (% of orders hitting bid vs ask)
- Monitor large order imbalances (>5000 shares)
- Identify aggressive buyers (market orders hitting ask) vs aggressive sellers (hitting bid)

**Quote:** "When you're watching the buyers and sellers, you're watching the DNA of the market being created in real-time."

### 2. Level 2 Market Depth Analysis

**What:** Real-time order book showing buy/sell orders at different price levels
**Why:** Reveals where institutional money is positioned and potential support/resistance
**Key Metrics:**
- Bid size vs ask size at each level
- Large order placement/removal (spoofing detection)
- Order stacking patterns (multiple large orders creating walls)

**Example from Transcript:** Jay watches for "5,000+ share orders on the bid side when price pulls back - that's institutions stepping in."

### 3. Levels of Significance (Not Random Levels)

**What:** Identify 1-2 truly important price levels, not 15 random support/resistance lines
**Criteria for Significance:**
- **Major reversals:** Price moved 27%+ from this level
- **All-time highs/lows:** Psychological significance
- **High volume nodes:** Large volume concentration at specific price
- **Gap levels:** Previous day close or gap fill levels
- **Camera pivots:** Intraday R3, R4, S3, S4 levels

**Current App Weakness:** We mark many support/resistance levels. Should filter to only "levels of significance."

**Quote:** "I see traders marking 15 levels on their chart. That's not helpful. Find the ONE level that matters."

### 4. Action vs Reaction (Absorption Detection)

**What:** Detecting when order flow (action) doesn't create expected price movement (reaction)
**Why:** This reveals hidden institutional buying/selling before price moves

**Absorption Patterns:**
- **Buyer Absorption:** Heavy selling pressure + price holds/rises = buyers absorbing supply
- **Seller Absorption:** Heavy buying pressure + price doesn't rally = sellers distributing

**How to Detect:**
- High volume bar + small price movement = absorption
- Multiple large sell orders + price doesn't drop = buying absorption
- Multiple large buy orders + price doesn't rally = selling absorption

**Example:** "I saw 50,000 shares sold into NVDA at $145 and price only dropped 10 cents. That's massive buying absorption - I went long immediately."

### 5. Stock Personality & Context

**What:** Each stock behaves differently - learn individual patterns
**Key Patterns to Track:**
- **Post-earnings behavior:** Does it gap-and-go or gap-and-fade?
- **Gap behavior:** Continuation vs reversal percentage
- **Relative strength:** How does it move vs SPY/QQQ?
- **Typical large order size:** What's "big" for this stock? (AAPL 10K vs penny stock 500 shares)

**Quote:** "Tesla is a beast. It can gap down 3% and rip to green within the first hour. Apple doesn't do that. Know your stock's personality."

**Current App Enhancement:** Create `StockPersonality` profiles that learn from historical data.

### 6. Entry Precision Exponentially Improves R:R

**What:** Small improvements in entry (waiting for better level) dramatically improve risk/reward
**Example from Jay:**
- Entry at $145.50: Risk $1.50, Reward $1.50 = **1:1 R:R**
- Wait for $144.20 (better level): Risk $0.70, Reward $2.30 = **3.5:1 R:R**

**Current App Opportunity:** We calculate entries at support/resistance, but don't optimize for precision within the level.

**Quote:** "Most traders lose because they're impatient. They enter too early. Wait for the level, wait for confirmation, then go."

### 7. Volume Context (Time-of-Day Normalization)

**What:** Adjust volume analysis based on time of day
**Why:** 9:30 AM volume is always higher than 2:00 PM - need to normalize

**Our Current Implementation:** ✅ We already do this!
- See `lib/scoring/indicators.ts` - `analyzeIntradayVolume()` function
- Already normalizes by time of day for intraday scanning

**Jay's Approach:** "I expect 500K volume at 9:45 AM but only 100K at 2:00 PM. Don't compare raw numbers."

### 8. Continuation Setups (Closing Strength)

**What:** Stocks that close strong tend to continue that direction next day
**Criteria:**
- Close in top 25% of daily range (for longs)
- Close in bottom 25% of daily range (for shorts)
- Relative strength vs market (stock up while SPY flat)

**Implementation Idea:** Add to our scoring:
```typescript
function scoreClosingStrength(candles: Candle[]): number {
  const lastCandle = candles[candles.length - 1];
  const range = lastCandle.high - lastCandle.low;
  const closePosition = (lastCandle.close - lastCandle.low) / range;

  // Top 25% = bullish continuation
  if (closePosition > 0.75) return 10;
  // Bottom 25% = bearish continuation
  if (closePosition < 0.25) return -10;
  return 0;
}
```

---

## Implementation Priorities

### Priority 1: Order Flow Indicators ⭐⭐⭐⭐⭐

**Impact:** High - This is Jay's core edge
**Complexity:** High - Requires Level 2 data integration
**Timeline:** 2-3 weeks

**Implementation:**

```typescript
// lib/orderflow/types.ts
interface OrderFlowMetrics {
  bidAskRatio: number;           // % of orders hitting bid vs ask (0-100)
  largeOrderImbalance: number;   // Net large orders (positive = buying, negative = selling)
  absorptionScore: number;       // 0-100 (high = strong absorption detected)
  aggressiveBuyers: number;      // Count of market orders hitting ask
  aggressiveSellers: number;     // Count of market orders hitting bid
  timeAndSales: TimeAndSalesData[]; // Recent trades with bid/ask flag
}

interface TimeAndSalesData {
  timestamp: Date;
  price: number;
  size: number;
  side: 'bid' | 'ask';  // Which side was hit
  aggressive: boolean;   // Market order vs limit
}

// lib/orderflow/index.ts
export function calculateOrderFlow(
  level2Data: Level2OrderBook,
  timeAndSales: TimeAndSalesData[]
): OrderFlowMetrics {
  // Calculate bid/ask ratio from time and sales
  const askHits = timeAndSales.filter(t => t.side === 'ask').length;
  const bidHits = timeAndSales.filter(t => t.side === 'bid').length;
  const bidAskRatio = (bidHits / (bidHits + askHits)) * 100;

  // Detect large orders (>5000 shares or dynamic based on stock personality)
  const largeOrders = timeAndSales.filter(t => t.size >= 5000);
  const largeOrderImbalance = largeOrders.reduce((sum, order) => {
    return sum + (order.side === 'ask' ? order.size : -order.size);
  }, 0);

  // Detect absorption (high volume + small price movement)
  const absorptionScore = detectAbsorption(timeAndSales, level2Data);

  return {
    bidAskRatio,
    largeOrderImbalance,
    absorptionScore,
    aggressiveBuyers: askHits,
    aggressiveSellers: bidHits,
    timeAndSales,
  };
}

function detectAbsorption(
  timeAndSales: TimeAndSalesData[],
  level2Data: Level2OrderBook
): number {
  // Look for high volume without price movement
  const recentVolume = timeAndSales.slice(-20).reduce((sum, t) => sum + t.size, 0);
  const priceChange = Math.abs(
    timeAndSales[timeAndSales.length - 1].price - timeAndSales[timeAndSales.length - 20].price
  );

  // High volume (>2x average) + small price change (<0.3%) = absorption
  const avgVolume = timeAndSales.reduce((sum, t) => sum + t.size, 0) / timeAndSales.length;
  const volumeRatio = recentVolume / (avgVolume * 20);
  const priceChangePct = priceChange / timeAndSales[0].price;

  if (volumeRatio > 2 && priceChangePct < 0.003) {
    return Math.min(100, volumeRatio * 30); // High absorption score
  }

  return 0;
}
```

**Data Sources for Level 2:**
- Alpaca (if available on their plan)
- Polygon.io - Has Level 2 quotes
- TDAmeritrade API - Free with account
- Interactive Brokers API - Requires account

**Integration with Scoring:**
```typescript
// lib/scoring/index.ts - Add to scoring components
const orderFlowScore = scoreOrderFlow(orderFlowMetrics);  // +15 points potential

// lib/scoring/components.ts
export function scoreOrderFlow(metrics: OrderFlowMetrics): number {
  let score = 0;

  // Bid/ask ratio (for longs, prefer >60% bid hits)
  if (metrics.bidAskRatio > 60) score += 5;
  else if (metrics.bidAskRatio > 50) score += 2;

  // Large order imbalance
  if (Math.abs(metrics.largeOrderImbalance) > 10000) score += 5;

  // Absorption detection
  score += (metrics.absorptionScore / 100) * 5;

  return Math.min(15, score);
}
```

### Priority 2: Enhanced Level Detection ⭐⭐⭐⭐

**Impact:** Medium-High - Improves entry precision
**Complexity:** Medium - Uses existing candle data
**Timeline:** 1 week

**Implementation:**

```typescript
// lib/analysis/levels.ts
interface LevelOfSignificance {
  price: number;
  significanceScore: number;  // 0-100
  reasons: string[];          // ["27% reversal", "all-time high", "gap fill"]
  volumeAtLevel: number;      // Total volume traded near this level
  touchCount: number;         // How many times tested
  largestMove: {
    up: number;               // Largest % move up from this level
    down: number;             // Largest % move down from this level
  };
  type: 'support' | 'resistance' | 'both';
}

export function identifySignificantLevels(
  candles: Candle[],
  minSignificanceScore: number = 70
): LevelOfSignificance[] {
  const levels: LevelOfSignificance[] = [];

  // 1. All-time high/low
  const allTimeHigh = Math.max(...candles.map(c => c.high));
  const allTimeLow = Math.min(...candles.map(c => c.low));

  levels.push({
    price: allTimeHigh,
    significanceScore: 95,
    reasons: ['All-time high'],
    volumeAtLevel: calculateVolumeNearPrice(candles, allTimeHigh, 0.01),
    touchCount: countTouches(candles, allTimeHigh, 0.01),
    largestMove: calculateLargestMoves(candles, allTimeHigh),
    type: 'resistance',
  });

  // 2. Major reversal points (27%+ moves)
  const reversalLevels = findReversalLevels(candles, 0.27);
  levels.push(...reversalLevels);

  // 3. Gap levels (previous day close)
  const gapLevels = findGapLevels(candles);
  levels.push(...gapLevels);

  // 4. High volume nodes
  const volumeNodes = findHighVolumeNodes(candles, 2.0); // 2x average volume
  levels.push(...volumeNodes);

  // Filter by significance score and merge nearby levels
  return levels
    .filter(l => l.significanceScore >= minSignificanceScore)
    .sort((a, b) => b.significanceScore - a.significanceScore)
    .slice(0, 5); // Top 5 most significant levels
}

function findReversalLevels(candles: Candle[], minMove: number): LevelOfSignificance[] {
  const reversals: LevelOfSignificance[] = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const current = candles[i];
    const before = candles[i - 1];
    const after = candles[i + 1];

    // Check for major reversal (27%+ move from this candle)
    const moveUp = findMaxMove(candles, i, 'up');
    const moveDown = findMaxMove(candles, i, 'down');

    if (moveUp >= minMove || moveDown >= minMove) {
      reversals.push({
        price: current.close,
        significanceScore: Math.min(100, (Math.max(moveUp, moveDown) / minMove) * 80),
        reasons: [`${Math.max(moveUp, moveDown).toFixed(0)}% reversal`],
        volumeAtLevel: current.volume,
        touchCount: countTouches(candles, current.close, 0.01),
        largestMove: { up: moveUp, down: moveDown },
        type: moveUp > moveDown ? 'support' : 'resistance',
      });
    }
  }

  return reversals;
}

function findMaxMove(candles: Candle[], startIndex: number, direction: 'up' | 'down'): number {
  const startPrice = candles[startIndex].close;
  let maxMove = 0;

  for (let i = startIndex + 1; i < Math.min(startIndex + 20, candles.length); i++) {
    const currentPrice = direction === 'up' ? candles[i].high : candles[i].low;
    const move = direction === 'up'
      ? (currentPrice - startPrice) / startPrice
      : (startPrice - currentPrice) / startPrice;

    maxMove = Math.max(maxMove, move);
  }

  return maxMove;
}
```

**Integration with Current System:**
```typescript
// Modify lib/analysis.ts - detectChannel() to use significant levels
export function detectChannel(candles: Candle[], lookback?: number): ChannelDetectionResult {
  // First, identify significant levels
  const significantLevels = identifySignificantLevels(candles);

  // Use these as anchors for channel detection instead of pure linear regression
  // This ensures we're marking MEANINGFUL support/resistance, not arbitrary lines

  // ... existing channel detection, but weighted toward significant levels
}
```

### Priority 3: Stock Personality Profiles ⭐⭐⭐

**Impact:** Medium - Improves context-aware scoring
**Complexity:** Medium - Requires historical data collection
**Timeline:** 1-2 weeks

**Database Schema:**

```sql
-- supabase/migrations/XXXXXX_create_stock_personality_profiles.sql

CREATE TABLE stock_personalities (
  symbol TEXT PRIMARY KEY,

  -- Post-earnings behavior
  post_earnings_behavior TEXT CHECK (post_earnings_behavior IN ('gap-and-go', 'gap-and-fade', 'volatile', 'stable')),
  earnings_gap_continuation_pct DECIMAL,  -- % of time gaps continue direction

  -- Gap behavior (general)
  gap_up_continuation_pct DECIMAL,
  gap_down_continuation_pct DECIMAL,
  avg_gap_size_pct DECIMAL,

  -- Typical characteristics
  avg_daily_atr DECIMAL,
  avg_daily_volume BIGINT,
  large_order_threshold INTEGER,  -- What's "big" for this stock

  -- Relative strength
  avg_beta DECIMAL,  -- Correlation with SPY
  outperformance_pct DECIMAL,  -- % of days it outperforms market

  -- Intraday patterns
  best_trading_hours TEXT[],  -- ['09:30-10:30', '14:00-15:00']
  typical_range_by_hour JSONB,  -- { '09:30': 0.5, '10:00': 0.3, ... }

  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  sample_size INTEGER  -- How many days analyzed
);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_stock_personality()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate personality when new candle data added
  -- This runs nightly after market close
  PERFORM refresh_stock_personality(NEW.symbol);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Implementation:**

```typescript
// lib/personality/index.ts
interface StockPersonality {
  symbol: string;
  postEarningsBehavior: 'gap-and-go' | 'gap-and-fade' | 'volatile' | 'stable';
  gapBehaviorStats: {
    gapUpContinuation: number;     // % (0-100)
    gapDownContinuation: number;   // % (0-100)
  };
  typicalATR: number;
  largeOrderThreshold: number;  // What's considered a "large" order
  bestTradingHours: string[];   // ['09:30-10:30', '14:00-15:00']
}

export async function getStockPersonality(symbol: string): Promise<StockPersonality> {
  // Fetch from database or calculate if not cached
  const cached = await supabase
    .from('stock_personalities')
    .select('*')
    .eq('symbol', symbol)
    .single();

  if (cached.data && isRecentEnough(cached.data.last_updated)) {
    return cached.data;
  }

  // Calculate from historical data
  return await calculatePersonality(symbol);
}

async function calculatePersonality(symbol: string): Promise<StockPersonality> {
  // Fetch last 90 days of daily candles
  const candles = await getDailyOHLC(symbol, 90);

  // Analyze gap behavior
  const gapStats = analyzeGapBehavior(candles);

  // Analyze post-earnings (requires earnings dates)
  const earningsStats = await analyzePostEarnings(symbol, candles);

  // Calculate typical ATR
  const atr = calculateAverageTrueRange(candles);

  // Determine large order threshold (volume-based)
  const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
  const largeOrderThreshold = Math.floor(avgVolume * 0.01); // 1% of daily volume

  // Identify best trading hours (requires intraday data)
  const bestHours = await identifyBestTradingHours(symbol);

  const personality: StockPersonality = {
    symbol,
    postEarningsBehavior: earningsStats.behavior,
    gapBehaviorStats: {
      gapUpContinuation: gapStats.upContinuation,
      gapDownContinuation: gapStats.downContinuation,
    },
    typicalATR: atr,
    largeOrderThreshold,
    bestTradingHours: bestHours,
  };

  // Cache in database
  await supabase
    .from('stock_personalities')
    .upsert(personality);

  return personality;
}
```

**Integration with Scoring:**

```typescript
// lib/scoring/index.ts - Add personality-aware adjustments
export function calculateOpportunityScore(input: ScoringInput): OpportunityScore {
  // ... existing scoring

  // Adjust based on stock personality
  const personality = await getStockPersonality(input.symbol);

  // If it's a gap-and-go stock and we're in first hour after gap up, boost score
  if (personality.postEarningsBehavior === 'gap-and-go' && isFirstHourAfterGap(input)) {
    components.patternQuality += 5;
  }

  // If outside best trading hours, reduce score
  if (!isInBestTradingHours(personality.bestTradingHours)) {
    components.momentumScore -= 3;
  }

  // ... rest of scoring
}
```

### Priority 4: Absorption Detection ⭐⭐⭐⭐

**Impact:** High - Core to Jay's edge
**Complexity:** Medium-High - Requires volume + price analysis
**Timeline:** 1 week

**Implementation:**

```typescript
// lib/orderflow/absorption.ts
interface AbsorptionPattern {
  type: 'buying' | 'selling' | 'none';
  confidence: number;  // 0-100
  description: string;
  volumeRatio: number;  // How much volume vs expected
  priceReaction: number;  // How little price moved (%)
  detectionIndex: number;  // Which candle detected it
}

export function detectAbsorption(
  candles: Candle[],
  volume: VolumeAnalysis
): AbsorptionPattern {
  // Look at last 5 candles for absorption pattern
  const recentCandles = candles.slice(-5);
  const avgVolume = volume.avgVolume;

  for (let i = recentCandles.length - 1; i >= 0; i--) {
    const candle = recentCandles[i];
    const volumeRatio = candle.volume / avgVolume;
    const bodySize = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    const priceChangePct = bodySize / candle.open;

    // Absorption criteria:
    // 1. Volume > 2x average (high action)
    // 2. Price change < 0.5% (low reaction)
    // 3. Small body relative to range (indecision)

    if (volumeRatio > 2.0 && priceChangePct < 0.005) {
      const bodyRatio = bodySize / range;

      // Buying absorption: High volume, closes near high despite selling
      if (candle.close > candle.open && bodyRatio < 0.4) {
        return {
          type: 'buying',
          confidence: Math.min(100, volumeRatio * 30),
          description: `Heavy selling absorbed by buyers. ${candle.volume.toLocaleString()} shares traded, price only ${(priceChangePct * 100).toFixed(2)}% change`,
          volumeRatio,
          priceReaction: priceChangePct,
          detectionIndex: i,
        };
      }

      // Selling absorption: High volume, closes near low despite buying
      if (candle.close < candle.open && bodyRatio < 0.4) {
        return {
          type: 'selling',
          confidence: Math.min(100, volumeRatio * 30),
          description: `Heavy buying absorbed by sellers. ${candle.volume.toLocaleString()} shares traded, price only ${(priceChangePct * 100).toFixed(2)}% change`,
          volumeRatio,
          priceReaction: priceChangePct,
          detectionIndex: i,
        };
      }
    }
  }

  return {
    type: 'none',
    confidence: 0,
    description: 'No absorption pattern detected',
    volumeRatio: 1,
    priceReaction: 0,
    detectionIndex: -1,
  };
}
```

**Integration with Opportunity Scoring:**

```typescript
// lib/scoring/components.ts
export function scoreAbsorption(absorption: AbsorptionPattern): number {
  if (absorption.type === 'none') return 0;

  // High confidence absorption adds 10 points
  return Math.min(10, (absorption.confidence / 100) * 10);
}

// lib/scoring/index.ts - Add to scoring
const absorptionPattern = detectAbsorption(candles, volume);
const absorptionScore = scoreAbsorption(absorptionPattern);
components.absorptionScore = absorptionScore;
```

---

## Integration Roadmap

### Phase 1: Foundation (Week 1)
- ✅ Document Jay's strategy (this file)
- [ ] Create `lib/orderflow/` directory structure
- [ ] Define TypeScript interfaces for order flow, absorption, levels
- [ ] Research Level 2 data providers (Alpaca, Polygon, TD Ameritrade)

### Phase 2: Basic Order Flow (Week 2-3)
- [ ] Implement `calculateOrderFlow()` function
- [ ] Integrate Level 2 data source (start with one provider)
- [ ] Add time and sales tracking
- [ ] Create basic absorption detection algorithm
- [ ] Add order flow metrics to UI (new "Order Flow" tab)

### Phase 3: Enhanced Levels (Week 4)
- [ ] Implement `identifySignificantLevels()` function
- [ ] Modify `detectChannel()` to use significant levels
- [ ] Add significance scoring to existing support/resistance
- [ ] Update UI to show level significance scores
- [ ] Filter out low-significance levels from charts

### Phase 4: Stock Personalities (Week 5-6)
- [ ] Create database schema for `stock_personalities` table
- [ ] Implement `calculatePersonality()` function
- [ ] Build historical data collection pipeline
- [ ] Track post-earnings and gap behaviors
- [ ] Integrate personality data into scoring algorithm

### Phase 5: Advanced Absorption (Week 7)
- [ ] Enhance absorption detection with multiple timeframes
- [ ] Add large order tracking (>5000 shares)
- [ ] Create absorption event alerts
- [ ] Build UI visualization for absorption patterns
- [ ] Add absorption confidence to recommendation rationale

### Phase 6: Scoring Enhancement (Week 8)
- [ ] Add order flow score component (+15 pts)
- [ ] Add absorption score component (+10 pts)
- [ ] Weight levels by significance
- [ ] Adjust scoring based on stock personality
- [ ] Add closing strength continuation bonus
- [ ] Test with historical data and compare results

### Phase 7: UI/UX Polish (Week 9-10)
- [ ] Create "Order Flow" panel in stock detail view
- [ ] Add large order tracker visualization
- [ ] Build absorption heatmap/indicator
- [ ] Add tape reading summary display
- [ ] Create "Stock DNA" profile page showing personality
- [ ] Add educational tooltips explaining order flow concepts

---

## Expected Impact on Opportunity Detection

### Current Scoring Breakdown (0-100):
- Trend Strength: 30 pts
- Pattern Quality: 25 pts
- Volume Confirmation: 20 pts
- Risk/Reward: 15 pts
- Momentum/RSI: 10 pts

### Enhanced Scoring Breakdown (0-125, normalized to 0-100):
- Trend Strength: 25 pts (reduced weight, still important)
- Pattern Quality: 20 pts (reduced weight)
- Volume Confirmation: 15 pts (reduced weight)
- Risk/Reward: 15 pts (unchanged)
- Momentum/RSI: 10 pts (unchanged)
- **Order Flow Score: 15 pts** ⭐ NEW
- **Absorption Score: 10 pts** ⭐ NEW
- **Level Significance: 10 pts** ⭐ NEW
- **Closing Strength: 5 pts** ⭐ NEW

**Total: 125 pts → normalized to 0-100 scale**

### Confidence Level Adjustments:
- **High (75+):** Requires order flow confirmation OR absorption pattern
- **Medium (60-74):** Traditional technical setup without order flow
- **Low (<60):** Filtered out (unchanged)

---

## Key Quotes from Jay Ortani

> "Most traders fail because they're looking at the effect (price) instead of the cause (buyers and sellers)."

> "I don't mark 15 levels on my chart. I mark THE level - the one that actually matters. If you can't explain why a level is significant in one sentence, it's not significant."

> "Entry precision is everything. The difference between a 1:1 trade and a 3:1 trade is often just waiting 10 more cents for a better entry."

> "When I see 50,000 shares sold and price doesn't move, I know institutions are absorbing that supply. That's when I go long."

> "Every stock has a personality. Tesla can gap down 3% and rip to green. Apple doesn't do that. Know your stock."

> "Volume at 9:45 AM means something different than volume at 2:00 PM. You have to normalize for time of day."

> "The best setups are the ones where the stock closes strong (top 25% of range) and continues that strength the next day."

---

## Data Requirements

### New Data Needed:
1. **Level 2 Market Depth** (for order flow analysis)
   - Real-time order book (bid/ask levels with sizes)
   - Time and sales (trades with bid/ask flags)
   - Suggested providers: Polygon.io, Alpaca, TD Ameritrade

2. **Historical Intraday Data** (for stock personality)
   - 5-minute bars for last 90 days per stock
   - Used to identify best trading hours
   - Calculate hourly volatility patterns

3. **Earnings Dates** (for personality tracking)
   - Historical earnings announcement dates
   - Used to track post-earnings behavior
   - Suggested source: FMP API or Finnhub

### Existing Data (Already Have):
- ✅ Daily OHLC candles (FMP API or mock)
- ✅ Volume data with time-of-day normalization
- ✅ Real-time quotes (Finnhub)
- ✅ Stock universe (128 stocks in scan_universe)

---

## Success Metrics

### Current Performance (Baseline):
- Average opportunity score: ~65/100
- High confidence rate: ~20% of scans
- False positive rate: Unknown (need backtesting)

### Target Performance (After Implementation):
- Average opportunity score: ~70/100 (+5 pts from order flow)
- High confidence rate: ~35% of scans (+15% from better filtering)
- False positive rate: <30% (measured via backtesting)
- Win rate improvement: +10-15% (Jay's edge from order flow)

### Measurement Plan:
1. **A/B Testing:** Run old scoring vs new scoring in parallel for 30 days
2. **Backtesting:** Test on historical data (2023-2024)
3. **User Feedback:** Track which recommendations users act on
4. **Win Rate Tracking:** For users who log trades, calculate actual win rates

---

## References

- **Podcast Source:** Chart Fanatics - Jay Ortani (@JawTrades)
- **Related Tools:** Bookmap (order flow visualization software Jay uses)
- **Recommended Reading:** "Volume Profile" trading strategies
- **Related Concepts:** Market microstructure, tape reading, institutional order flow

---

## Next Steps

1. **Immediate:** Create `lib/orderflow/` directory structure and type definitions
2. **This Week:** Research and select Level 2 data provider
3. **Next Week:** Implement basic order flow calculation
4. **Month 1:** Complete order flow and absorption detection
5. **Month 2:** Add stock personality profiles
6. **Month 3:** Full integration and testing

---

*This document serves as the master reference for implementing Jay Ortani's "Market DNA" strategy into our trading application. All implementation decisions should trace back to concepts documented here.*
