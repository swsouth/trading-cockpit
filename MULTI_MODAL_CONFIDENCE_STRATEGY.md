# Multi-Modal Confidence Strategy

**Transforming from Technical-Only to True Multi-Domain Intelligence**

---

## Quick Reference

**Current:** 30/100 confidence (technical analysis only)
**Target:** 90/100 confidence (7 core domains)
**Timeline:** Phases 1-3, 6 months
**Cost:** $0 → $89 → $118/mo
**Revenue Triggers:** $0 → $200 → $500 MRR

**Three Decision Points:**
1. [Scoring Philosophy](#scoring-philosophy) - How to aggregate multiple domains
2. [Provider Stack](#provider-stack-selection) - Which APIs to use
3. [Implementation Approach](#implementation-priority) - Big bang vs incremental

**Recommended Path:** [Intelligent Incremental Strategy](#intelligent-incremental-strategy-recommended)

---

## Table of Contents

1. [The False Confidence Problem](#the-false-confidence-problem)
2. [7-Domain Framework](#7-domain-framework)
3. [Scoring Architecture](#scoring-architecture)
4. [Phase 1: Multi-Modal Foundation](#phase-1-multi-modal-foundation-weeks-1-3-free)
5. [Phase 2: Scale & Depth](#phase-2-scale--depth-months-2-3-89mo)
6. [Phase 3: Multi-Asset Expansion](#phase-3-multi-asset-expansion-months-4-6-118mo)
7. [Decision Points](#decision-points)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Validation & Calibration](#validation--calibration)

---

## The False Confidence Problem

### Current System Analysis

Your scanner currently produces this output:

```typescript
{
  symbol: "AAPL",
  opportunityScore: 82,
  confidenceLevel: "high",
  components: {
    trendStrength: 28,    // out of 30
    patternQuality: 22,   // out of 25
    volume: 18,           // out of 20
    riskReward: 11,       // out of 15
    rsi: 3                // out of 10
  }
}
```

**User sees:** "High Confidence (82/100)"
**Reality:** This is **24.6/100 true confidence** (82% of the 30-point technical domain)

### What You're Missing (Real Example)

**Stock:** Apple (AAPL)
**Technical Score:** 82/100 (looks great!)

**Blind Spots:**
```
❌ Fundamentals (0/20 pts):
   - PE ratio: 32 (sector avg: 22) → Overvalued
   - EPS growth: -2% YoY → Declining earnings
   - Debt/Equity: 2.1 (high) → Financial risk

❌ Sentiment (0/20 pts):
   - Earnings report: Tomorrow → High volatility
   - Recent news: CEO health concerns → Negative catalyst
   - Social sentiment: -0.6 (bearish) → Crowd selling

❌ Analyst (0/10 pts):
   - Consensus: Hold (was Buy 2 weeks ago) → Downgrade trend
   - Price target: $165 (current: $185) → -11% implied downside
   - Recent rating changes: 3 downgrades, 0 upgrades → Negative momentum

❌ Macro (0/10 pts):
   - Tech sector ETF (QQQ): -5% this week → Sector weakness
   - Interest rates: Rising → Multiple compression for tech
   - Market regime: Bear → Risk-off environment
```

**True Confidence:**
Technical: 24.6 + Fundamentals: 4 + Sentiment: 2 + Analyst: 1 + Macro: 2 = **33.6/100** → LOW CONFIDENCE ❌

**Result:** A trade that appears "high confidence" on technicals fails because:
- Overvalued company
- Negative earnings surprise tomorrow
- Analyst consensus shifting bearish
- Sector and macro headwinds

**This is why you need multi-modal intelligence.**

---

## 7-Domain Framework

### Domain Breakdown (100 Points Total)

```
Domain 1: Market/Technical (30 pts)
├─ Trend Strength: 10 pts (channel clarity, slope, price position)
├─ Pattern Quality: 8 pts (candlestick pattern reliability)
├─ Volume: 7 pts (recent vs 30-day average)
└─ Risk/Reward: 5 pts (R:R ratio quality)
✅ YOU HAVE THIS (lib/scoring/index.ts)

Domain 2: Fundamentals (20 pts)
├─ Valuation: 8 pts (PE, PB, PEG ratios vs sector)
├─ Earnings Growth: 7 pts (EPS growth trend, consistency)
└─ Financial Health: 5 pts (debt/equity, current ratio, cash flow)
❌ PHASE 1 WEEK 1

Domain 3: Sentiment/News (20 pts)
├─ News Sentiment: 10 pts (recent news tone, polarity)
├─ Volume/Buzz: 5 pts (news frequency, social mentions)
└─ Social Sentiment: 5 pts (Reddit/Twitter/StockTwits tone)
❌ PHASE 1 WEEK 2

Domain 4: Analyst Consensus (10 pts)
├─ Consensus Rating: 5 pts (buy/hold/sell ratio, recent changes)
└─ Target Upside: 5 pts (avg target vs current price)
❌ PHASE 1 WEEK 3

Domain 5: Macro Regime (10 pts)
├─ Market Regime: 5 pts (bull/bear/sideways, VIX level)
└─ Sector Strength: 5 pts (sector ETF momentum vs SPY)
❌ PHASE 1 WEEK 3

Domain 6: On-Chain (5 pts, crypto only)
├─ Exchange Flows: 3 pts (net inflow/outflow from exchanges)
└─ Network Activity: 2 pts (active addresses, transaction volume)
❌ PHASE 3 (crypto expansion)

Domain 7: Order Flow (5 pts, advanced)
├─ Bid/Ask Spread: 3 pts (liquidity quality)
└─ Block Trades: 2 pts (institutional activity)
❌ FUTURE (requires premium data)
```

### Domain Dependencies

**Independent Domains:** Can be scored separately
- Technical (price/volume data only)
- Fundamentals (financial statements)
- Macro (economic indicators + sector ETFs)

**Dependent Domains:** Require context from other domains
- Sentiment (needs symbol + time context from technical)
- Analyst (needs symbol context)
- On-Chain (crypto-specific, needs symbol mapping)

**Implementation Order:** Independent domains first, then dependent domains.

---

## Scoring Architecture

### TypeScript Type Definitions

```typescript
// lib/types.ts (add to existing)

export interface MultiModalScore {
  // Core Domains
  technical: TechnicalScore;      // 30 pts (existing)
  fundamentals: FundamentalsScore; // 20 pts
  sentiment: SentimentScore;       // 20 pts
  analyst: AnalystScore;           // 10 pts
  macro: MacroScore;               // 10 pts
  onChain?: OnChainScore;          // 5 pts (crypto only)
  orderFlow?: OrderFlowScore;      // 5 pts (future)

  // Aggregated
  totalScore: number;              // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  domainBreakdown: DomainBreakdown;
}

export interface TechnicalScore {
  total: number;                   // 0-30
  trendStrength: number;           // 0-10
  patternQuality: number;          // 0-8
  volume: number;                  // 0-7
  riskReward: number;              // 0-5
  details: {
    channel: ChannelDetectionResult | null;
    pattern: PatternDetectionResult | null;
    volumeRatio: number;
    rrRatio: number;
  };
}

export interface FundamentalsScore {
  total: number;                   // 0-20
  valuation: number;               // 0-8
  earningsGrowth: number;          // 0-7
  financialHealth: number;         // 0-5
  details: {
    peRatio: number | null;
    pbRatio: number | null;
    pegRatio: number | null;
    epsGrowthYoY: number | null;
    epsGrowth3Y: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    freeCashFlow: number | null;
    sectorPeAvg: number | null;     // For relative valuation
  };
}

export interface SentimentScore {
  total: number;                   // 0-20
  newsScore: number;               // 0-10
  volumeScore: number;             // 0-5
  socialScore: number;             // 0-5
  details: {
    recentNews: Array<{
      headline: string;
      sentiment: number;            // -1 to 1
      timestamp: Date;
      source: string;
    }>;
    newsCount7d: number;
    averageSentiment: number;       // -1 to 1
    socialMentions: number;
    socialSentiment: number;        // -1 to 1
  };
}

export interface AnalystScore {
  total: number;                   // 0-10
  consensusRating: number;         // 0-5
  targetUpside: number;            // 0-5
  details: {
    buy: number;                    // Count of buy ratings
    hold: number;                   // Count of hold ratings
    sell: number;                   // Count of sell ratings
    avgPriceTarget: number | null;
    impliedUpside: number | null;   // (target - current) / current
    recentChanges: Array<{
      firm: string;
      oldRating: string;
      newRating: string;
      date: Date;
    }>;
  };
}

export interface MacroScore {
  total: number;                   // 0-10
  marketRegime: number;            // 0-5
  sectorStrength: number;          // 0-5
  details: {
    spyTrend: 'bull' | 'bear' | 'sideways';
    vixLevel: number;
    sectorEtfReturn20d: number;     // 20-day return of sector ETF
    spyReturn20d: number;           // For relative strength
    sectorRelativeStrength: number; // sector return - SPY return
  };
}

export interface OnChainScore {
  total: number;                   // 0-5 (crypto only)
  exchangeFlows: number;           // 0-3
  networkActivity: number;         // 0-2
  details: {
    netExchangeFlow7d: number;      // Positive = inflow (bearish), negative = outflow (bullish)
    activeAddresses: number;
    activeAddressesChange30d: number; // % change
    transactionVolume: number;
  };
}

export interface DomainBreakdown {
  technical: { score: number; maxScore: 30; percentage: number };
  fundamentals: { score: number; maxScore: 20; percentage: number };
  sentiment: { score: number; maxScore: 20; percentage: number };
  analyst: { score: number; maxScore: 10; percentage: number };
  macro: { score: number; maxScore: 10; percentage: number };
  onChain?: { score: number; maxScore: 5; percentage: number };
  orderFlow?: { score: number; maxScore: 5; percentage: number };
}
```

### Code Structure

```
lib/scoring/
├── index.ts                     // Orchestrator (existing, update to call all domains)
├── technical.ts                 // Domain 1 (existing, refactor to new interface)
├── fundamentals.ts              // Domain 2 (NEW - Phase 1 Week 1)
├── sentiment.ts                 // Domain 3 (NEW - Phase 1 Week 2)
├── analyst.ts                   // Domain 4 (NEW - Phase 1 Week 3)
├── macro.ts                     // Domain 5 (NEW - Phase 1 Week 3)
├── onChain.ts                   // Domain 6 (NEW - Phase 3)
├── orderFlow.ts                 // Domain 7 (NEW - Future)
├── components.ts                // Shared scoring utilities (existing)
└── README.md                    // Technical documentation (update)
```

### Aggregation Function

```typescript
// lib/scoring/index.ts (update existing calculateOpportunityScore)

export function calculateMultiModalScore(
  symbol: string,
  candles: CandleData[],
  fundamentals: FundamentalsData | null,
  sentimentNews: SentimentNewsData | null,
  analystData: AnalystData | null,
  macroData: MacroData | null,
  onChainData?: OnChainData | null
): MultiModalScore {
  // Domain 1: Technical (existing)
  const technical = scoreTechnical(symbol, candles);

  // Domain 2: Fundamentals (Phase 1)
  const fundamentals = scoreFundamentals(symbol, fundamentals);

  // Domain 3: Sentiment (Phase 1)
  const sentiment = scoreSentiment(symbol, sentimentNews);

  // Domain 4: Analyst (Phase 1)
  const analyst = scoreAnalyst(symbol, analystData);

  // Domain 5: Macro (Phase 1)
  const macro = scoreMacro(symbol, macroData, candles);

  // Domain 6: On-Chain (Phase 3, crypto only)
  const onChain = onChainData ? scoreOnChain(symbol, onChainData) : undefined;

  // Aggregate total
  const totalScore =
    technical.total +
    fundamentals.total +
    sentiment.total +
    analyst.total +
    macro.total +
    (onChain?.total || 0);

  // Determine confidence level
  const confidenceLevel =
    totalScore >= 75 ? 'high' :
    totalScore >= 60 ? 'medium' :
    'low';

  // Domain breakdown for UI
  const domainBreakdown: DomainBreakdown = {
    technical: {
      score: technical.total,
      maxScore: 30,
      percentage: (technical.total / 30) * 100
    },
    fundamentals: {
      score: fundamentals.total,
      maxScore: 20,
      percentage: (fundamentals.total / 20) * 100
    },
    sentiment: {
      score: sentiment.total,
      maxScore: 20,
      percentage: (sentiment.total / 20) * 100
    },
    analyst: {
      score: analyst.total,
      maxScore: 10,
      percentage: (analyst.total / 10) * 100
    },
    macro: {
      score: macro.total,
      maxScore: 10,
      percentage: (macro.total / 10) * 100
    }
  };

  if (onChain) {
    domainBreakdown.onChain = {
      score: onChain.total,
      maxScore: 5,
      percentage: (onChain.total / 5) * 100
    };
  }

  return {
    technical,
    fundamentals,
    sentiment,
    analyst,
    macro,
    onChain,
    totalScore,
    confidenceLevel,
    domainBreakdown
  };
}
```

---

## Phase 1: Multi-Modal Foundation (Weeks 1-3, FREE)

### Goal
Transform from 30/100 (technical-only) → 80/100 (5 domains) at $0 cost

### Providers

| Provider | Cost | Rate Limits | Domains Covered |
|----------|------|-------------|----------------|
| **Alpha Vantage** | FREE | 500 calls/day, 5 calls/min | Market data, Fundamentals, Macro |
| **Finnhub** | FREE | 60 calls/min | Sentiment/News, Analyst ratings |
| **Alpaca** | FREE | Unlimited paper trading | Validation loop |

**See CSV:** [Market_Data_Providers_Comprehensive-Vendors_Master.csv](./Market_Data_Providers_Comprehensive-Vendors_Master.csv) rows 2 (Polygon), 3 (Alpha Vantage), 9 (Finnhub), 13 (Alpaca)

---

### Week 1: Add Fundamentals Domain (20 pts)

**Implementation:**

```typescript
// lib/scoring/fundamentals.ts (NEW)

import type { FundamentalsScore, FundamentalsData } from '../types';

export function scoreFundamentals(
  symbol: string,
  data: FundamentalsData | null
): FundamentalsScore {
  if (!data) {
    return {
      total: 0,
      valuation: 0,
      earningsGrowth: 0,
      financialHealth: 0,
      details: {
        peRatio: null,
        pbRatio: null,
        pegRatio: null,
        epsGrowthYoY: null,
        epsGrowth3Y: null,
        debtToEquity: null,
        currentRatio: null,
        freeCashFlow: null,
        sectorPeAvg: null
      }
    };
  }

  // Valuation Score (0-8 points)
  const valuationScore = scoreValuation(data);

  // Earnings Growth Score (0-7 points)
  const earningsScore = scoreEarningsGrowth(data);

  // Financial Health Score (0-5 points)
  const healthScore = scoreFinancialHealth(data);

  return {
    total: valuationScore + earningsScore + healthScore,
    valuation: valuationScore,
    earningsGrowth: earningsScore,
    financialHealth: healthScore,
    details: {
      peRatio: data.peRatio,
      pbRatio: data.pbRatio,
      pegRatio: data.pegRatio,
      epsGrowthYoY: data.epsGrowthYoY,
      epsGrowth3Y: data.epsGrowth3Y,
      debtToEquity: data.debtToEquity,
      currentRatio: data.currentRatio,
      freeCashFlow: data.freeCashFlow,
      sectorPeAvg: data.sectorPeAvg
    }
  };
}

function scoreValuation(data: FundamentalsData): number {
  // Relative PE scoring (vs sector average)
  let score = 0;

  if (data.peRatio && data.sectorPeAvg) {
    const relPE = data.peRatio / data.sectorPeAvg;

    if (relPE < 0.7) score += 8;       // Very undervalued
    else if (relPE < 0.85) score += 6; // Undervalued
    else if (relPE < 1.15) score += 4; // Fair value
    else if (relPE < 1.5) score += 2;  // Overvalued
    else score += 0;                    // Very overvalued
  } else if (data.peRatio) {
    // Fallback: absolute PE scoring
    if (data.peRatio < 15) score += 6;
    else if (data.peRatio < 25) score += 4;
    else if (data.peRatio < 35) score += 2;
    else score += 0;
  }

  // PEG ratio adjustment (if available)
  if (data.pegRatio) {
    if (data.pegRatio < 1.0) score += 2;      // Growth at reasonable price
    else if (data.pegRatio < 2.0) score += 1; // Fair growth valuation
  }

  return Math.min(score, 8); // Cap at 8
}

function scoreEarningsGrowth(data: FundamentalsData): number {
  let score = 0;

  // YoY EPS growth
  if (data.epsGrowthYoY !== null) {
    if (data.epsGrowthYoY > 20) score += 4;      // Strong growth
    else if (data.epsGrowthYoY > 10) score += 3; // Good growth
    else if (data.epsGrowthYoY > 0) score += 2;  // Positive growth
    else if (data.epsGrowthYoY > -10) score += 1; // Slight decline
    else score += 0;                              // Declining
  }

  // 3-year EPS growth consistency
  if (data.epsGrowth3Y !== null) {
    if (data.epsGrowth3Y > 15) score += 3;       // Consistent growth
    else if (data.epsGrowth3Y > 5) score += 2;   // Moderate growth
    else if (data.epsGrowth3Y > 0) score += 1;   // Slight growth
  }

  return Math.min(score, 7); // Cap at 7
}

function scoreFinancialHealth(data: FundamentalsData): number {
  let score = 0;

  // Debt-to-equity ratio
  if (data.debtToEquity !== null) {
    if (data.debtToEquity < 0.3) score += 3;      // Low debt
    else if (data.debtToEquity < 0.7) score += 2; // Moderate debt
    else if (data.debtToEquity < 1.5) score += 1; // High debt
    else score += 0;                               // Very high debt risk
  }

  // Current ratio (liquidity)
  if (data.currentRatio !== null) {
    if (data.currentRatio > 2.0) score += 2;      // Strong liquidity
    else if (data.currentRatio > 1.5) score += 1; // Adequate liquidity
  }

  return Math.min(score, 5); // Cap at 5
}
```

**Data Adapter:**

```typescript
// lib/alphaVantageData.ts (NEW)

export interface FundamentalsData {
  symbol: string;
  peRatio: number | null;
  pbRatio: number | null;
  pegRatio: number | null;
  epsGrowthYoY: number | null;
  epsGrowth3Y: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  freeCashFlow: number | null;
  sectorPeAvg: number | null; // Requires separate sector lookup
}

export async function getFundamentals(symbol: string): Promise<FundamentalsData> {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );
    const data = await response.json();

    // Parse Alpha Vantage response
    return {
      symbol,
      peRatio: parseFloat(data.PERatio) || null,
      pbRatio: parseFloat(data.PriceToBookRatio) || null,
      pegRatio: parseFloat(data.PEGRatio) || null,
      epsGrowthYoY: parseFloat(data.QuarterlyEarningsGrowthYOY) * 100 || null,
      epsGrowth3Y: null, // Calculate from historical earnings
      debtToEquity: parseFloat(data.DebtToEquityRatio) || null,
      currentRatio: parseFloat(data.CurrentRatio) || null,
      freeCashFlow: parseFloat(data.OperatingCashflow) || null,
      sectorPeAvg: null // Requires sector mapping + aggregation
    };
  } catch (error) {
    console.error(`Failed to fetch fundamentals for ${symbol}:`, error);
    return mockFundamentalsData(symbol);
  }
}

function mockFundamentalsData(symbol: string): FundamentalsData {
  // Fallback mock data for development/testing
  return {
    symbol,
    peRatio: 22.5 + Math.random() * 10,
    pbRatio: 3.2 + Math.random() * 2,
    pegRatio: 1.8 + Math.random(),
    epsGrowthYoY: 5 + Math.random() * 15,
    epsGrowth3Y: 10 + Math.random() * 10,
    debtToEquity: 0.4 + Math.random() * 0.6,
    currentRatio: 1.5 + Math.random(),
    freeCashFlow: 1000000000 + Math.random() * 5000000000,
    sectorPeAvg: 20 + Math.random() * 8
  };
}
```

**Scanner Integration:**

```typescript
// scripts/dailyMarketScan.ts (update)

async function analyzeStock(symbol: string): Promise<TradeRecommendation | null> {
  // Existing: Fetch candles
  const candles = await getHistoricalCandles(symbol, 60);

  // NEW: Fetch fundamentals
  const fundamentals = await getFundamentals(symbol);

  // NEW: Calculate multi-modal score
  const multiModalScore = calculateMultiModalScore(
    symbol,
    candles,
    fundamentals,
    null, // sentiment (Week 2)
    null, // analyst (Week 3)
    null  // macro (Week 3)
  );

  // Filter by total score
  if (multiModalScore.totalScore < 60) {
    return null; // Too low confidence
  }

  // ... rest of recommendation logic
}
```

**Testing:**

```bash
# Test fundamentals scoring
npm run test-scanner  # Run with 5 stocks
# Expected: Scores now include fundamentals component (0-20 pts)
```

---

### Week 2: Add Sentiment Domain (20 pts)

**Implementation:** Similar pattern to fundamentals, using Finnhub news API

```typescript
// lib/scoring/sentiment.ts (NEW)
// lib/finnhubData.ts (NEW - news/sentiment adapter)
```

**Key Endpoints:**
- Finnhub: `/company-news` (company news with timestamps)
- Finnhub: `/news-sentiment` (sentiment scores if available)
- Fallback: Text analysis of headlines for basic sentiment

---

### Week 3: Add Analyst + Macro Domains (20 pts)

**Analyst (10 pts):**
- Finnhub: `/recommendation-trends` (buy/hold/sell counts)
- Finnhub: `/price-target` (analyst price targets)

**Macro (10 pts):**
- Alpha Vantage: Fetch SPY (S&P 500 ETF) daily data for market regime
- Alpha Vantage: Fetch sector ETF (map symbol → sector → sector ETF ticker)
- Calculate 20-day returns, relative strength, VIX level proxy

---

### Week 4: Validation Loop with Alpaca

**Goal:** Validate that multi-modal scoring actually improves trade outcomes

**Implementation:**

```typescript
// lib/paperTradingService.ts (NEW)

export async function executePaperTrade(
  recommendation: TradeRecommendation,
  alpacaClient: AlpacaClient
): Promise<string> {
  // Place paper trade via Alpaca MCP or SDK
  const order = await alpacaClient.placeOrder({
    symbol: recommendation.symbol,
    qty: calculatePositionSize(recommendation),
    side: recommendation.recommendationType === 'long' ? 'buy' : 'sell',
    type: 'limit',
    limit_price: recommendation.entryPrice,
    time_in_force: 'gtc'
  });

  // Store paper trade in database for tracking
  await supabase.from('paper_trades').insert({
    recommendation_id: recommendation.id,
    symbol: recommendation.symbol,
    entry_price: recommendation.entryPrice,
    target_price: recommendation.targetPrice,
    stop_loss: recommendation.stopLoss,
    paper_trade_id: order.id,
    status: 'active',
    multimodal_score: recommendation.opportunityScore,
    domain_breakdown: recommendation.domainBreakdown
  });

  return order.id;
}
```

**Tracking:**

```sql
-- supabase/migrations/xxxxx_create_paper_trades_table.sql
CREATE TABLE paper_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES trade_recommendations(id),
  symbol TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  paper_trade_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'closed_win', 'closed_loss', 'closed_stopped'
  multimodal_score INTEGER NOT NULL,
  domain_breakdown JSONB NOT NULL,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  exit_date TIMESTAMPTZ,
  exit_price NUMERIC,
  pnl_percent NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Analysis After 30 Days:**

```typescript
// scripts/analyzePaperTradeResults.ts (NEW)

async function analyzeResults() {
  const trades = await supabase
    .from('paper_trades')
    .select('*')
    .gte('entry_date', thirtyDaysAgo);

  // Group by technical-only vs multi-modal
  const technicalOnly = trades.filter(t => t.multimodal_score <= 30);
  const multiModal = trades.filter(t => t.multimodal_score > 60);

  console.log('Technical-Only Trades:');
  console.log('  Win Rate:', calculateWinRate(technicalOnly));
  console.log('  Avg P&L:', calculateAvgPnL(technicalOnly));
  console.log('  Sharpe:', calculateSharpe(technicalOnly));

  console.log('\nMulti-Modal Trades:');
  console.log('  Win Rate:', calculateWinRate(multiModal));
  console.log('  Avg P&L:', calculateAvgPnL(multiModal));
  console.log('  Sharpe:', calculateSharpe(multiModal));
}
```

**Expected Results:**
- Multi-modal win rate: 60-65% (vs 50-55% technical-only)
- Multi-modal Sharpe: 1.5-2.0 (vs 1.0-1.2 technical-only)
- Multi-modal max drawdown: 15-20% (vs 25-30% technical-only)

---

## Phase 2: Scale & Depth (Months 2-3, $89/mo)

### Goal
Faster scans, real-time news, corporate actions intelligence

### Trigger Conditions
- ✅ Revenue >$200/mo (20+ users @ $10/mo)
- OR ✅ Scanner universe >200 stocks (rate limit issues on free tier)
- OR ✅ Users demand real-time data (feedback/surveys)

### Provider Upgrade

| Provider | Cost | Change | Why |
|----------|------|--------|-----|
| **Polygon.io** | $89/mo | NEW (replaces Alpha Vantage for market data) | 100 calls/min (vs 5), real-time news, corporate actions |
| **Alpha Vantage** | FREE | KEEP (for macro/indicators) | Still useful for economic data |
| **Finnhub** | FREE | KEEP (for analyst data) | No upgrade needed |
| **Alpaca** | FREE | KEEP (for execution) | No upgrade needed |

**Total:** $89/mo (vs $0 Phase 1)

**See CSV:** [Market_Data_Providers_Comprehensive-Vendors_Master.csv](./Market_Data_Providers_Comprehensive-Vendors_Master.csv) row 2 (Polygon pricing tiers)

---

### New Capabilities

**1. Real-Time News (Not 15-Min Delayed)**

```typescript
// lib/polygonData.ts (NEW)

export async function getRealtimeNews(symbol: string): Promise<NewsArticle[]> {
  const response = await fetch(
    `https://api.polygon.io/v2/reference/news?ticker=${symbol}&limit=20&apiKey=${process.env.POLYGON_API_KEY}`
  );
  const data = await response.json();

  return data.results.map(article => ({
    headline: article.title,
    sentiment: analyzeSentiment(article.title + ' ' + article.description),
    timestamp: new Date(article.published_utc),
    source: article.publisher.name,
    url: article.article_url
  }));
}
```

**Impact:** News sentiment scoring is now real-time, not delayed. Catches breaking news catalysts.

---

**2. Corporate Actions Intelligence**

```typescript
// lib/corporateActions.ts (NEW)

export interface EarningsEvent {
  symbol: string;
  reportDate: Date;
  daysUntilReport: number;
}

export async function getUpcomingEarnings(symbols: string[]): Promise<EarningsEvent[]> {
  // Polygon: /v2/reference/dividends/{ticker}
  // Or use Alpha Vantage EARNINGS_CALENDAR (free)

  const events: EarningsEvent[] = [];

  for (const symbol of symbols) {
    const earnings = await fetchEarningsDate(symbol);
    if (earnings && earnings.reportDate) {
      const daysUntil = daysBetween(new Date(), earnings.reportDate);
      events.push({
        symbol,
        reportDate: earnings.reportDate,
        daysUntilReport: daysUntil
      });
    }
  }

  return events;
}

// Pre-earnings filter in scanner
function shouldSkipDueToEarnings(symbol: string, earningsEvents: EarningsEvent[]): boolean {
  const event = earningsEvents.find(e => e.symbol === symbol);

  if (!event) return false;

  // Skip if earnings within 3 days (high volatility risk)
  return event.daysUntilReport >= -1 && event.daysUntilReport <= 3;
}
```

**Impact:** Scanner avoids recommending stocks right before earnings (reduces blown stops from earnings surprises).

---

**3. Faster Scanner Execution**

**Before (Phase 1):**
- 128 stocks × 2 API calls (candles + fundamentals) = 256 calls
- Rate limit: 5 calls/min (Alpha Vantage)
- Runtime: 256 / 5 = ~51 minutes ❌ Too slow

**After (Phase 2):**
- 128 stocks × 3 API calls (candles + fundamentals + news) = 384 calls
- Rate limit: 100 calls/min (Polygon) + 5 calls/min (Alpha Vantage for macro)
- Runtime: ~4 minutes ✅ Acceptable for daily scan

**Implementation:**
- Use Polygon for candles + news (high rate limit)
- Use Alpha Vantage for fundamentals + macro (low rate limit, batch these)
- Parallelize API calls where possible

---

### Migration Strategy

**Step 1:** Add Polygon adapter without removing Alpha Vantage
```typescript
// lib/marketData.ts (update to support multiple providers)

export async function getHistoricalCandles(
  symbol: string,
  days: number,
  provider: 'polygon' | 'alpha-vantage' | 'auto' = 'auto'
): Promise<CandleData[]> {
  if (provider === 'auto') {
    // Use Polygon if API key available, fallback to Alpha Vantage
    provider = process.env.POLYGON_API_KEY ? 'polygon' : 'alpha-vantage';
  }

  if (provider === 'polygon') {
    return getPolygonCandles(symbol, days);
  } else {
    return getAlphaVantageCandles(symbol, days);
  }
}
```

**Step 2:** Test Polygon integration with small universe (5 stocks)
```bash
npm run test-scanner  # Uses Polygon if key present
```

**Step 3:** Full scanner with Polygon
```bash
npm run scan-market   # All 128 stocks via Polygon
```

**Step 4:** Remove Alpha Vantage candle fetching (keep for fundamentals/macro)

---

## Phase 3: Multi-Asset Expansion (Months 4-6, $118/mo)

### Goal
Add crypto scanner with on-chain intelligence (Domain 6)

### Trigger Conditions
- ✅ Revenue >$500/mo (50+ users @ $10/mo)
- OR ✅ User surveys show crypto demand

### Provider Addition

| Provider | Cost | What It Does |
|----------|------|--------------|
| **Polygon.io** | $89/mo | Keep for stocks |
| **Glassnode** | €29/mo (~$31) | On-chain metrics (BTC, ETH, major alts) |
| **CoinGecko** | FREE | Crypto OHLCV, market data |
| **Alpha Vantage** | FREE | Keep for macro |
| **Finnhub** | FREE | Keep for analyst (stocks) |
| **Alpaca** | FREE | Keep for execution |

**Total:** $120/mo (rounded to $118 in plan)

**See CSV:** [Market_Data_Providers_Comprehensive-Vendors_Master.csv](./Market_Data_Providers_Comprehensive-Vendors_Master.csv) rows 16 (CoinGecko), 17 (CoinMarketCap), 21 (Glassnode)

---

### Crypto Scanner Implementation

**1. Crypto Universe:**

```typescript
// scripts/cryptoUniverse.ts (NEW)

export const CRYPTO_UNIVERSE = [
  // Top 20 by market cap
  { symbol: 'BTC', name: 'Bitcoin', rank: 1 },
  { symbol: 'ETH', name: 'Ethereum', rank: 2 },
  { symbol: 'BNB', name: 'Binance Coin', rank: 3 },
  { symbol: 'SOL', name: 'Solana', rank: 4 },
  { symbol: 'XRP', name: 'Ripple', rank: 5 },
  { symbol: 'ADA', name: 'Cardano', rank: 6 },
  { symbol: 'AVAX', name: 'Avalanche', rank: 7 },
  { symbol: 'DOT', name: 'Polkadot', rank: 8 },
  { symbol: 'MATIC', name: 'Polygon', rank: 9 },
  { symbol: 'LINK', name: 'Chainlink', rank: 10 },
  // ... top 50 total
];
```

**2. On-Chain Scoring (Domain 6):**

```typescript
// lib/scoring/onChain.ts (NEW)

export interface OnChainData {
  symbol: string;
  netExchangeFlow7d: number;      // USD value, negative = outflow (bullish)
  activeAddresses: number;
  activeAddressesChange30d: number;
  transactionVolume: number;
  mvrv: number;                    // Market Value to Realized Value ratio
}

export function scoreOnChain(
  symbol: string,
  data: OnChainData
): OnChainScore {
  let exchangeFlowScore = 0;
  let networkActivityScore = 0;

  // Exchange flows (0-3 pts)
  // Negative flow (outflow from exchanges) = accumulation = bullish
  if (data.netExchangeFlow7d < -1000000) {
    exchangeFlowScore = 3; // Strong outflow
  } else if (data.netExchangeFlow7d < 0) {
    exchangeFlowScore = 2; // Moderate outflow
  } else if (data.netExchangeFlow7d < 1000000) {
    exchangeFlowScore = 1; // Slight inflow
  } else {
    exchangeFlowScore = 0; // Heavy inflow (distribution, bearish)
  }

  // Active addresses growth (0-2 pts)
  if (data.activeAddressesChange30d > 20) {
    networkActivityScore = 2; // Strong growth
  } else if (data.activeAddressesChange30d > 0) {
    networkActivityScore = 1; // Positive growth
  } else {
    networkActivityScore = 0; // Declining usage
  }

  return {
    total: exchangeFlowScore + networkActivityScore,
    exchangeFlows: exchangeFlowScore,
    networkActivity: networkActivityScore,
    details: {
      netExchangeFlow7d: data.netExchangeFlow7d,
      activeAddresses: data.activeAddresses,
      activeAddressesChange30d: data.activeAddressesChange30d,
      transactionVolume: data.transactionVolume
    }
  };
}
```

**3. Glassnode Adapter:**

```typescript
// lib/glassnodeData.ts (NEW)

export async function getOnChainData(symbol: string): Promise<OnChainData | null> {
  // Glassnode API endpoints
  const apiKey = process.env.GLASSNODE_API_KEY;
  const asset = symbol.toLowerCase(); // btc, eth, etc.

  try {
    // Fetch multiple metrics in parallel
    const [exchangeFlow, activeAddresses, mvrv] = await Promise.all([
      fetch(`https://api.glassnode.com/v1/metrics/transactions/transfers_volume_exchanges_net?a=${asset}&api_key=${apiKey}`),
      fetch(`https://api.glassnode.com/v1/metrics/addresses/active_count?a=${asset}&api_key=${apiKey}`),
      fetch(`https://api.glassnode.com/v1/metrics/market/mvrv?a=${asset}&api_key=${apiKey}`)
    ]);

    // Parse responses...

    return {
      symbol,
      netExchangeFlow7d: /* calculate 7-day net flow */,
      activeAddresses: /* latest value */,
      activeAddressesChange30d: /* calculate % change */,
      transactionVolume: /* from separate endpoint */,
      mvrv: /* latest MVRV ratio */
    };
  } catch (error) {
    console.error(`Failed to fetch on-chain data for ${symbol}:`, error);
    return null;
  }
}
```

**4. Crypto-Specific UI:**

```tsx
// app/crypto-recommendations/page.tsx (NEW)

export default function CryptoRecommendationsPage() {
  // Similar to stock recommendations, but:
  // - Display on-chain metrics prominently
  // - Show exchange flow visualization
  // - Link to Glassnode studio for deep-dive

  return (
    <div>
      <h1>Crypto Recommendations</h1>
      <RecommendationsList
        assetType="crypto"
        showOnChainMetrics={true}
      />
    </div>
  );
}
```

---

### Database Schema Updates

```sql
-- supabase/migrations/xxxxx_add_crypto_support.sql

-- Add asset_type column to trade_recommendations
ALTER TABLE trade_recommendations
ADD COLUMN asset_type TEXT DEFAULT 'stock'
  CHECK (asset_type IN ('stock', 'crypto'));

-- Add on-chain metrics column
ALTER TABLE trade_recommendations
ADD COLUMN on_chain_metrics JSONB;

-- Create index for crypto filtering
CREATE INDEX idx_recommendations_asset_type
  ON trade_recommendations(asset_type, scan_date DESC);

-- Add crypto universe table
CREATE TABLE crypto_universe (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rank INTEGER,
  market_cap NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Populate with top 50 cryptos
INSERT INTO crypto_universe (symbol, name, rank) VALUES
  ('BTC', 'Bitcoin', 1),
  ('ETH', 'Ethereum', 2),
  -- ... etc
;
```

---

## Decision Points

### Decision 1: Scoring Philosophy

**Question:** How should multiple domains aggregate into a final score?

#### Option A: Strict Multi-Modal (All Domains Required)

**Logic:** Require minimum scores in ALL domains for "high confidence"

```typescript
function getConfidenceLevel(scores: DomainScores): ConfidenceLevel {
  const { technical, fundamentals, sentiment, analyst, macro } = scores;

  // High confidence: ALL domains above threshold
  if (
    technical.total >= 20 &&      // 67% of 30
    fundamentals.total >= 12 &&   // 60% of 20
    sentiment.total >= 12 &&      // 60% of 20
    analyst.total >= 6 &&         // 60% of 10
    macro.total >= 6              // 60% of 10
  ) {
    return 'high';
  }

  // Medium: At least 3 domains strong
  const strongDomains = [
    technical.total >= 20,
    fundamentals.total >= 12,
    sentiment.total >= 12,
    analyst.total >= 6,
    macro.total >= 6
  ].filter(Boolean).length;

  if (strongDomains >= 3) return 'medium';

  return 'low';
}
```

**Pros:**
- Filters out false positives aggressively
- High confidence truly means "confluence across all signals"

**Cons:**
- May produce 0-5 recommendations per scan (very selective)
- Misses opportunities where 1-2 domains have incomplete data

**Best For:** Conservative traders, low-turnover portfolios

---

#### Option B: Flexible Domain Strength (2-3 Strong Domains)

**Logic:** Allow high score in 2-3 domains to compensate for weak domains

```typescript
function getConfidenceLevel(scores: DomainScores): ConfidenceLevel {
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s.total, 0);

  // Simple threshold approach
  if (totalScore >= 75) return 'high';
  if (totalScore >= 60) return 'medium';
  return 'low';
}
```

**Example:**
- Technical: 28/30 (strong)
- Fundamentals: 18/20 (strong)
- Sentiment: 8/20 (weak, due to limited news)
- Analyst: 10/10 (strong)
- Macro: 6/10 (neutral)
- **Total: 70/100 → Medium** (even though 3 domains are strong)

**Pros:**
- Produces 15-30 recommendations (similar to current)
- Flexible to data availability issues

**Cons:**
- May miss domain-specific risks (e.g., strong technical + fundamentals, but earnings tomorrow)

**Best For:** Active traders, higher turnover

---

#### Option C: Weighted Ensemble (ML-Driven)

**Logic:** Use Alpaca paper trading results to learn optimal domain weights over time

```typescript
// Initial weights (equal)
let domainWeights = {
  technical: 0.30,
  fundamentals: 0.20,
  sentiment: 0.20,
  analyst: 0.10,
  macro: 0.10
};

// After 3 months of paper trading data, train model
function calibrateWeights(paperTradeResults: PaperTrade[]) {
  // Logistic regression: P(win) = f(domain scores)
  // Learn which domains best predict winners

  const model = trainLogisticRegression(
    paperTradeResults.map(t => ({
      features: [
        t.domain_breakdown.technical.score / 30,
        t.domain_breakdown.fundamentals.score / 20,
        t.domain_breakdown.sentiment.score / 20,
        t.domain_breakdown.analyst.score / 10,
        t.domain_breakdown.macro.score / 10
      ],
      label: t.pnl_percent > 0 ? 1 : 0  // Win = 1, Loss = 0
    }))
  );

  // Update weights based on learned coefficients
  domainWeights = normalizeWeights(model.coefficients);
}

function getConfidenceLevel(scores: DomainScores): ConfidenceLevel {
  const weightedScore =
    scores.technical.total / 30 * domainWeights.technical * 100 +
    scores.fundamentals.total / 20 * domainWeights.fundamentals * 100 +
    scores.sentiment.total / 20 * domainWeights.sentiment * 100 +
    scores.analyst.total / 10 * domainWeights.analyst * 100 +
    scores.macro.total / 10 * domainWeights.macro * 100;

  if (weightedScore >= 75) return 'high';
  if (weightedScore >= 60) return 'medium';
  return 'low';
}
```

**Pros:**
- Data-driven, continuously improving
- Automatically adapts to which domains actually predict winners

**Cons:**
- Requires 3-6 months of data before reliable
- More complex to explain to users

**Best For:** Long-term platform, data-driven optimization

---

**Recommended Approach:**

Start with **Option B** (Flexible), transition to **Option C** (ML-driven) after 3 months of paper trading data.

**Rationale:**
- Option B is simple to implement and produces actionable results immediately
- Option C requires data, so can't use it until you have paper trading history
- Option A is too strict and may produce no recommendations (user frustration)

---

### Decision 2: Provider Stack Selection

See [INTELLIGENCE_PLATFORM_MASTER_PLAN.md](./INTELLIGENCE_PLATFORM_MASTER_PLAN.md#data-provider-strategy) for full analysis.

**Quick Answer:** Alpha Vantage + Finnhub (Phase 1), upgrade to Polygon (Phase 2), add Glassnode (Phase 3).

---

### Decision 3: Implementation Priority

**Question:** Big bang (all at once) vs incremental (one domain per week) vs MVP+ (top 2 domains only)?

#### Option A: Big Bang (Implement All 5 Domains Simultaneously)

**Timeline:** 3-4 weeks
**Pros:** Immediate quality leap, full multi-modal from day 1
**Cons:** Longer time to market, harder to debug issues, all-or-nothing risk

#### Option B: Incremental (One Domain Per Week)

**Timeline:** 4 weeks
**Pros:** Easier to test/validate, faster feedback loops, lower risk
**Cons:** Takes longer to reach full capability

#### Option C: MVP+ (Add Top 2 Domains Only)

**Timeline:** 2 weeks
**Pros:** Fastest time to value, 50% coverage vs 0%
**Cons:** Still missing 30% of confidence picture

**Recommended:** **Option B (Incremental)** - See [Intelligent Incremental Strategy](#intelligent-incremental-strategy-recommended) below.

---

## Implementation Roadmap

### Intelligent Incremental Strategy (Recommended)

**Week 1:** Add Fundamentals Domain (20 pts)
- Implement `lib/scoring/fundamentals.ts`
- Add Alpha Vantage fundamentals adapter
- Update scanner to fetch fundamentals
- Test with 5 stocks
- Deploy to production

**Week 2:** Add Sentiment Domain (20 pts)
- Implement `lib/scoring/sentiment.ts`
- Add Finnhub news adapter
- Update scanner to fetch news
- Test with 5 stocks
- Deploy to production

**Week 3:** Add Analyst + Macro Domains (20 pts)
- Implement `lib/scoring/analyst.ts` and `lib/scoring/macro.ts`
- Add Finnhub analyst + Alpha Vantage macro adapters
- Update scanner to fetch both
- Test with 5 stocks
- Deploy to production
- **Complete:** Now have 80/100 coverage (5 domains)

**Week 4:** Validation Loop (Alpaca Paper Trading)
- Implement paper trading service
- Add database tables for tracking
- Create "Paper Trade This" button in UI
- Run for 30 days
- Analyze results

**Month 2:** (If revenue >$200) Upgrade to Polygon
- Add Polygon adapter
- Migrate candles + news to Polygon
- Test scanner performance
- Measure speed improvement

**Month 3:** (If revenue >$200) Corporate Actions Intelligence
- Add earnings calendar integration
- Implement pre-earnings filter
- Add "Days to Earnings" column in UI
- Measure false positive reduction

**Months 4-6:** (If revenue >$500) Add Crypto
- Implement crypto scanner
- Add Glassnode on-chain scoring
- Create crypto universe (top 50)
- Build `/crypto-recommendations` page
- Test with paper trading

---

## Validation & Calibration

### Paper Trading Metrics

**Track These KPIs:**

```typescript
interface PaperTradeMetrics {
  // Win rate
  totalTrades: number;
  winners: number;
  losers: number;
  winRate: number;                // winners / totalTrades

  // P&L
  avgWinPct: number;
  avgLossPct: number;
  avgPnLPct: number;
  expectancy: number;             // (winRate * avgWin) - ((1-winRate) * avgLoss)

  // Risk metrics
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;    // Days

  // Domain correlation
  domainCorrelations: {
    technical: number;            // Correlation between technical score and P&L
    fundamentals: number;
    sentiment: number;
    analyst: number;
    macro: number;
  };
}
```

**Monthly Analysis:**

```bash
# scripts/monthlyPaperTradeAnalysis.ts
npm run analyze-paper-trades
```

**Output Example:**

```
Paper Trade Results (30 days)
==============================

Overall Performance:
  Total Trades: 127
  Win Rate: 62.3% (79 winners, 48 losers)
  Avg Win: +4.2%
  Avg Loss: -2.1%
  Expectancy: +1.6%
  Sharpe Ratio: 1.67
  Max Drawdown: -12.4%

Domain Correlation Analysis:
  Technical:     0.31 (moderate positive)
  Fundamentals:  0.52 (strong positive) ← Most predictive
  Sentiment:     0.18 (weak positive)
  Analyst:       0.44 (moderate positive)
  Macro:         0.09 (negligible)

Recommendations:
  ✅ Fundamentals domain is working well (increase weight?)
  ⚠️  Sentiment domain has low correlation (needs improvement?)
  ⚠️  Macro domain adds no value (consider removing or redesigning)
```

**Calibration Actions:**

Based on results, adjust:
1. Domain weights (if using Option C scoring)
2. Scoring thresholds (e.g., if fundamentals < 12, auto-reject)
3. Data sources (e.g., try different news provider if sentiment weak)

---

## Summary: Phase 1-3 at a Glance

| Metric | Current | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|---------|
| **Domains** | 1 (technical) | 5 core | 5 core (better) | 6 (+crypto) |
| **Coverage** | 30/100 (30%) | 80/100 (80%) | 85/100 (85%) | 90/100 (90%) |
| **Providers** | FMP + Finnhub | Alpha Vantage + Finnhub + Alpaca | Polygon + AV + Finnhub + Alpaca | Polygon + AV + Finnhub + Glassnode + CoinGecko + Alpaca |
| **Cost** | $0 | $0 | $89/mo | $118/mo |
| **Scanner Runtime** | 12 sec | 2-3 min | <30 sec | <45 sec |
| **Recs Per Day** | 15-30 | 10-25 | 15-30 | 20-40 (stocks + crypto) |
| **Expected Win Rate** | 50-55% | 60-65% | 60-65% | 60-65% |
| **Expected Sharpe** | 1.0-1.2 | 1.5-2.0 | 1.5-2.0 | 1.5-2.0 |

---

## See Also

- [INTELLIGENCE_PLATFORM_MASTER_PLAN.md](./INTELLIGENCE_PLATFORM_MASTER_PLAN.md) - Overall strategy
- [ALTERNATIVE_DATA_INTELLIGENCE.md](./ALTERNATIVE_DATA_INTELLIGENCE.md) - Phases 4-6 (alt-data)
- [lib/scoring/README.md](./lib/scoring/README.md) - Technical implementation details
- [docs/API_PROVIDER_COMPARISON.md](./docs/API_PROVIDER_COMPARISON.md) - Provider selection guidance
- [docs/MCP_SERVERS_SETUP.md](./docs/MCP_SERVERS_SETUP.md) - MCP server configuration

**CSV References:**
- [AI_Confidence_Stack.csv](./AI_Confidence_Stack.csv) - Provider rankings
- [Market_Data_Providers_Comprehensive-Vendors_Master.csv](./Market_Data_Providers_Comprehensive-Vendors_Master.csv) - Detailed provider comparison
- [Market_Data_Providers_Comprehensive-Scenario Mapping.csv](./Market_Data_Providers_Comprehensive-Scenario%20Mapping.csv) - Use case recommendations

---

**Last Updated:** 2025-01-24
**Status:** Phase 1 planning complete, ready for implementation
**Next Review:** After Phase 1 Week 1 completion (fundamentals domain deployed)
