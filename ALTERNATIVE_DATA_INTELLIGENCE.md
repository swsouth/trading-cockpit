# Alternative Data Intelligence

**Domains 8-12: Competitive Edge Through Non-Traditional Signals**

---

## Quick Reference

**Goal:** Add alternative data signals (Phases 4-6) to achieve institutional-grade intelligence
**Coverage:** +35 points (Domains 8-12) on top of core 100 points
**Timeline:** Phases 4-6, Months 7-24
**Cost:** $0 (Phase 4) → $200-500/mo (Phase 5) → +$1000/mo (Phase 6)

**12 Quick Win Signals:** [Jump to Playbook](#12-quick-win-signals)

**See Also:**
- [INTELLIGENCE_PLATFORM_MASTER_PLAN.md](./INTELLIGENCE_PLATFORM_MASTER_PLAN.md) - Overall strategy
- [docs/QUICK_WINS_PLAYBOOK.md](./docs/QUICK_WINS_PLAYBOOK.md) - Tactical implementation guide
- [AltData_Sourcing_and_MCP_Plan.csv](./AltData_Sourcing_and_MCP_Plan.csv) - Complete source catalog

---

## Why Alternative Data Creates Competitive Edge

### The Three-Tier Landscape

**Tier 1 Platforms** (80% of retail tools):
- Use only traditional data (price, volume, fundamentals, news)
- Coverage: 80/135 points (59%)
- Examples: TradingView, Seeking Alpha

**Tier 2 Platforms** (95% of retail tools):
- Add analyst consensus, on-chain metrics
- Coverage: 90/135 points (67%)
- Examples: TradeIdeas, Benzinga Pro

**Tier 3 Platforms** (Institutional-grade):
- Full alternative data intelligence
- Coverage: 125/135 points (93%)
- Examples: Bloomberg Terminal ($2000/mo), proprietary hedge fund systems

**Your Opportunity:** Build Tier 3 intelligence at Tier 2 pricing ($25-99/mo vs $2000/mo)

---

## 5 Alternative Data Domains (35 Points)

```
Domain 8: Supply Chain Intelligence (10 pts)
├─ Port Congestion: 5 pts (shipping delays → margin risk)
└─ Container Rates: 5 pts (logistics costs → COGS impact)

Domain 9: Consumer Demand Signals (10 pts)
├─ Foot Traffic: 4 pts (store visits → same-store sales)
├─ Web Traffic: 3 pts (digital engagement → revenue)
└─ App Rankings: 3 pts (install velocity → user growth)

Domain 10: Corporate Behavior (5 pts)
├─ Insider Trading: 3 pts (management conviction)
└─ Patent Filings: 2 pts (product pipeline proxy)

Domain 11: Geopolitical/Regulatory (5 pts)
├─ Regulatory Filings: 3 pts (FDA approvals, court dockets)
└─ Policy Changes: 2 pts (tariffs, sanctions)

Domain 12: Climate/Physical Risk (5 pts)
├─ Weather Anomalies: 3 pts (utility/ag earnings sensitivity)
└─ ESG Risk Scores: 2 pts (physical asset exposure)
```

---

## 12 Alternative Data Themes

**See CSV:** [AltData_Sourcing_and_MCP_Plan.csv](./AltData_Sourcing_and_MCP_Plan.csv) for complete source catalog

| Theme | Why It Moves Markets | Example Sources | Cost Tier |
|-------|---------------------|-----------------|-----------|
| **Supply Chain Strain** | Bottlenecks → COGS & revenue delays | MarineTraffic, Freightos FBX | B ($500+/mo) |
| **Real-World Foot Traffic** | Footfall → same-store sales | SafeGraph, Placer.ai | A ($1-2k/mo) |
| **Web & App Demand** | Digital engagement → bookings/ARR | SimilarWeb, Data.ai | A ($500-2k/mo) |
| **Hiring & Talent Flows** | Headcount → capacity & growth | LinkUp, Revelio Labs | A ($500-1k/mo) |
| **Regulatory & Legal** | FDA/court actions → sector repricing | CourtListener, FDA Calendar | C (FREE) |
| **Geopolitical Pressure** | Sanctions/tariffs → FX/commodities | GPR indices, Trade data | C (FREE) |
| **Energy & Climate** | Weather extremes → utility/ag costs | NOAA, EIA | B (FREE-$500) |
| **Consumer Spend** | Card data → real spend trends | Facteus, Earnest Analytics | B ($2-5k/mo) |
| **Corporate Behavior** | Insider buys, buybacks | SEC EDGAR | A (FREE) |
| **Infrastructure Outages** | Downtime → lost revenue | Downdetector, Cloudflare Radar | A (FREE) |
| **Cybersecurity** | Breaches → reputation costs | CVE feeds, dark web | C (variable) |
| **Developer Ecosystems** | GitHub activity → enterprise adoption | GitHub API | C (FREE) |

---

## 12 Quick Win Signals

**Ranked by Signal-to-Cost Ratio**

**See:** [docs/QUICK_WINS_PLAYBOOK.md](./docs/QUICK_WINS_PLAYBOOK.md) for detailed implementation

### 1. Port Pressure Index (Retail/Apparel) - **Phase 6**

**What:** Ships-at-anchor × container rate z-score
**Why:** Delays → inventory shortages → margin compression
**Sources:** MarineTraffic ($500+), Freightos FBX
**IR Lift:** +0.05-0.10
**Cost:** $$$ (Phase 6)

```typescript
portPressureIndex = shipsAtAnchor7dMA * containerRateZScore;
```

---

### 2. App Store Rank Velocity (SaaS/Gaming) - **Phase 5**

**What:** Daily rank change acceleration
**Why:** Install velocity → MAU growth → revenue nowcast
**Sources:** Data.ai ($500-2k/mo), App Annie
**IR Lift:** +0.10-0.15
**Cost:** $$ (Phase 5)

```typescript
rankVelocity = (rank_today - rank_7d_ago) / 7;
if (rankVelocity < -10) signal = 'bullish'; // Improving rank
```

---

### 3. Google Trends (Product/Brand Demand) - **Phase 4 (FREE)**

**What:** Search interest for brand/product terms
**Why:** Search volume → purchase intent → revenue inflection
**Sources:** Google Trends API (FREE)
**IR Lift:** +0.05-0.10
**Cost:** FREE ✅

```typescript
const trendScore = await googleTrends.interestOverTime({
  keyword: 'iPhone 16',
  startTime: thirtyDaysAgo
});
// Look for 20%+ spikes above 90-day average
```

---

### 4. Hiring Intensity (Forward Bookings) - **Phase 5**

**What:** Sales/CSM job postings by company
**Why:** Hiring → pipeline build (1-2 quarter lead)
**Sources:** LinkUp ($500-1k/mo), Revelio Labs
**IR Lift:** +0.05-0.10
**Cost:** $$ (Phase 5)

---

### 5. Insider Net Buys (Management Conviction) - **Phase 4 (FREE)**

**What:** SEC Form 4 filings, insider buy/sell ratio
**Why:** Insiders know more than market
**Sources:** SEC EDGAR (FREE)
**IR Lift:** +0.10-0.15
**Cost:** FREE ✅

```typescript
const insiderScore = (buyVolume - sellVolume) / (buyVolume + sellVolume);
// insiderScore > 0.5 = bullish (more buying than selling)
```

---

### 6. ETF Creation/Redemption (Flow Arb) - **Phase 5**

**What:** Daily ETF share creation/redemption
**Why:** Flow-driven dislocations → arb opportunities
**Sources:** ETF.com, Bloomberg (paid)
**IR Lift:** +0.05-0.10
**Cost:** $$ (Phase 5)

---

### 7. SaaS Outage Tracking (Churn Risk) - **Phase 4 (FREE)**

**What:** Downtime duration × customer base
**Why:** Outages → customer frustration → churn
**Sources:** Downdetector (FREE), Pingdom
**IR Lift:** +0.05-0.10
**Cost:** FREE ✅

```typescript
const outageRisk = outageDurationHours * estimatedAffectedUsers / totalMAU;
// High outageRisk → short signal for SaaS stocks
```

---

### 8. Weather Degree-Days (Utility Earnings) - **Phase 4 (FREE)**

**What:** Cooling/heating degree-day anomalies
**Why:** Extreme temps → utility demand spikes
**Sources:** NOAA (FREE)
**IR Lift:** +0.05-0.10
**Cost:** FREE ✅

---

### 9. FDA Calendar (Biotech Events) - **Phase 4 (FREE)**

**What:** Drug approval decision dates
**Why:** Binary catalyst events (approval/rejection)
**Sources:** FDA.gov (FREE)
**IR Lift:** +0.10-0.20 (event-driven)
**Cost:** FREE ✅

---

### 10. On-Chain Stablecoin Issuance (Crypto Regime) - **Phase 3**

**What:** Net USDT/USDC minting vs burning
**Why:** Stablecoin supply → crypto risk-on/risk-off
**Sources:** Glassnode (€29/mo)
**IR Lift:** +0.10-0.25
**Cost:** $ (Phase 3)

```typescript
const stablecoinNetFlow = usdtMinted - usdtBurned + usdcMinted - usdcBurned;
// Positive flow = capital entering crypto = risk-on
```

---

### 11. Patent/Trademark Filings (Product Pipeline) - **Phase 4 (FREE)**

**What:** New patent applications by company
**Why:** IP filings → future product launches
**Sources:** USPTO (FREE)
**IR Lift:** +0.05-0.10
**Cost:** FREE ✅

---

### 12. YouTube/TikTok Trend Acceleration (Consumer Products) - **Phase 4/5**

**What:** Viral video mentions of products/brands
**Why:** Viral trends → near-term demand pops
**Sources:** YouTube API (FREE), TikTok (scraping/paid)
**IR Lift:** +0.05-0.15
**Cost:** FREE (YouTube) to $$ (TikTok analytics)

---

## Implementation Framework: Event Bus Architecture

### Core Concept

**Traditional Approach:** Poll APIs, store in database, run queries
**Event Bus Approach:** Convert all alternative data into normalized events, process in real-time

```typescript
// lib/alternativeData/eventBus.ts

interface AltDataEvent {
  type: EventType;
  ticker: string;
  timestamp: Date;
  severity: number;      // Impact magnitude (z-score or 0-10)
  halfLife: number;      // Decay time in days
  source: string;        // Data provider
  metadata: Record<string, any>;
}

type EventType =
  | 'port_spike'
  | 'outage'
  | 'insider_buy'
  | 'filing'
  | 'storm'
  | 'trend_acceleration'
  | 'hiring_surge'
  | 'app_rank_jump';
```

### Example Events

**Port Congestion:**
```typescript
{
  type: 'port_spike',
  ticker: 'NKE',  // Nike (retail, apparel)
  timestamp: new Date('2025-01-20'),
  severity: 2.3,  // Z-score
  halfLife: 14,   // 2-week decay
  source: 'MarineTraffic',
  metadata: {
    port: 'LAX',
    shipsAtAnchor: 47,
    historicalAvg: 22,
    containerRateZScore: 1.8
  }
}
```

**SaaS Outage:**
```typescript
{
  type: 'outage',
  ticker: 'CRM',  // Salesforce
  timestamp: new Date('2025-01-21T14:30:00Z'),
  severity: 7,    // Duration in hours
  halfLife: 3,    // 3-day churn impact window
  source: 'Downdetector',
  metadata: {
    affectedRegions: ['US', 'EU'],
    estimatedUsers: 500000,
    serviceName: 'Salesforce.com'
  }
}
```

### Feature Engineering Patterns

**1. Trend Features:**
```typescript
// 7-day moving average, YoY change
const trendScore = (currentValue - historicalMean) / historicalStd;
```

**2. Shock Features:**
```typescript
// Z-score spike detection
const shockScore = Math.abs(todayValue - rolling30dMean) / rolling30dStd;
if (shockScore > 2.0) return { isShock: true, magnitude: shockScore };
```

**3. Diffusion Features:**
```typescript
// How many related tickers are affected?
const diffusionScore = affectedTickers.length / sectorUniverse.length;
```

**4. Exposure Features:**
```typescript
// Revenue or supply chain share
const exposureScore = (companyRevenueFromRegion / totalRevenue) * eventSeverity;
```

---

## Phase-by-Phase Rollout

### Phase 4: Free Quick Wins (Months 7-9, $0)

**Trigger:** Revenue >$200/mo

**Sources:**
- Google Trends (FREE)
- GitHub API (FREE)
- FDA Calendar (FREE)
- NOAA Weather (FREE)
- SEC EDGAR (FREE)
- Downdetector (FREE)

**Signals to Implement:**
1. Google Trends brand/product search
2. Patent filings (USPTO)
3. FDA approval calendar
4. Weather degree-days
5. Insider trading (SEC Form 4)
6. SaaS outage tracking

**Expected Impact:**
- IR lift: +0.05-0.10
- Cost: $0
- Coverage: +10/35 alt-data points

**See CSV:** [AltData_Sourcing_and_MCP_Plan-Roadmap.csv](./AltData_Sourcing_and_MCP_Plan-Roadmap.csv) Phase 2

---

### Phase 5: Mid-Tier Sources (Months 10-12, +$200-500/mo)

**Trigger:** Revenue >$500/mo

**Sources:**
- SimilarWeb / Data.ai ($500-2k/mo)
- LinkUp / Revelio Labs ($500-1k/mo)
- ETF flow data ($200/mo)

**Signals to Add:**
7. App store rank velocity
8. Web traffic trends
9. Hiring intensity (job postings)
10. ETF creation/redemption arb

**Expected Impact:**
- IR lift: +0.10-0.15 (cumulative)
- Cost: +$200-500/mo
- Coverage: +20/35 alt-data points

**See CSV:** [AltData_Sourcing_and_MCP_Plan-Roadmap.csv](./AltData_Sourcing_and_MCP_Plan-Roadmap.csv) Phase 3

---

### Phase 6: Enterprise Sources (Year 2+, +$1000+/mo)

**Trigger:** Revenue >$1000/mo

**Sources:**
- MarineTraffic / Freightos FBX ($500+/mo)
- Facteus / Earnest Analytics ($2-5k/mo)
- SafeGraph / Placer.ai ($1-2k/mo)

**Signals to Complete:**
11. Port pressure index
12. Consumer transaction data
13. Foot traffic analytics

**Expected Impact:**
- IR lift: +0.15-0.25 (cumulative)
- Cost: +$1000-3000/mo
- Coverage: +35/35 alt-data points (complete)

**See CSV:** [AltData_Sourcing_and_MCP_Plan-Roadmap.csv](./AltData_Sourcing_and_MCP_Plan-Roadmap.csv) Phase 4

---

## Risk & Compliance

### Data Quality Risks

**Coverage Bias:**
- Mobility data skews urban vs rural
- Card data skews issuer/merchant mix
- Web traffic sampling varies by source

**Mitigation:** Cross-validate multiple sources, normalize by demographic coverage

---

### Causality vs Correlation

**Risk:** Alternative signals may correlate with price but not cause moves

**Mitigation:**
1. Event study windows (-5 to +20 days)
2. Require confirmation from core domains (e.g., port congestion + weak fundamentals)
3. Track incremental IR contribution

---

### Look-Ahead Bias

**Risk:** Using data that wasn't available at prediction time

**Mitigation:**
- Tag each data feed with expected latency
- Backtest only uses data with timestamp < prediction time
- Document revision risk (some datasets revise, lock snapshots)

**See:** [lib/alternativeData/README.md](./lib/alternativeData/README.md) for latency control implementation

---

### Privacy & Licensing

**Risk:** PII exposure, TOS violations, redistribution issues

**Mitigation:**
- Avoid PII (no individual-level data)
- Respect robots.txt, rate limits, TOS
- Use licensed sources for production
- Check redistribution rights (especially for SaaS product)

---

## Database Schema for Alternative Data

**See CSV:** [AltData_Sourcing_and_MCP_Plan-Data_Schema.csv](./AltData_Sourcing_and_MCP_Plan-Data_Schema.csv)

```sql
-- Alternative data event store
CREATE TABLE alt_data_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  ticker TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  severity NUMERIC NOT NULL,
  half_life_days INTEGER NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast ticker + date lookups
CREATE INDEX idx_alt_events_ticker_date
  ON alt_data_events(ticker, event_timestamp DESC);

-- Example records
CREATE TABLE mobility (
  id UUID PRIMARY KEY,
  region TEXT,
  venue_id TEXT,
  footfall INTEGER,
  dwell_time INTEGER,
  date DATE,
  yoy_change NUMERIC -- Derived feature
);

CREATE TABLE web_activity (
  id UUID PRIMARY KEY,
  domain TEXT,
  rank INTEGER,
  visits BIGINT,
  date DATE,
  rank_change_7d INTEGER -- Derived feature
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  company TEXT,
  role TEXT,
  postings_count INTEGER,
  skill_tags TEXT[],
  date DATE,
  hiring_intensity NUMERIC -- Derived feature
);
```

---

## Expected Lift by Signal Group

**See CSV:** [AltData_Sourcing_and_MCP_Plan-Expected_Lift.csv](./AltData_Sourcing_and_MCP_Plan-Expected_Lift.csv)

| Signal Group | Alpha Horizon | Expected IR | Coverage |
|--------------|--------------|-------------|----------|
| Market/Fundamental | 1-3 months | 0.20-0.30 | 95% |
| Sentiment/News | 1-10 days | 0.10-0.20 | 80% |
| Mobility/Web | 2-6 weeks | 0.10-0.15 | 40-60% |
| Job/Labor | 1-2 quarters | 0.05-0.10 | 70% |
| Shipping/Energy | 1-2 months | 0.05-0.10 | 30% |
| On-Chain (crypto) | 1-3 weeks | 0.10-0.25 | Top 100 crypto |
| ESG/Climate | 3-12 months | 0.05-0.10 | 60% large-caps |

**Cumulative IR:** Core domains (0.20-0.30) + Alt-data (0.15-0.25) = **0.35-0.55 total**

---

## MCP Server Integration

**See CSV:** [AltData_Sourcing_and_MCP_Plan-MCP_Tool_Set.csv](./AltData_Sourcing_and_MCP_Plan-MCP_Tool_Set.csv)

Planned MCP servers:
- `weather_mcp` - NOAA weather anomalies
- `mobility_mcp` - SafeGraph/Placer foot traffic
- `jobs_mcp` - LinkUp/Revelio job postings
- `shipping_mcp` - MarineTraffic port dwell, Freightos rates
- `review_mcp` - Amazon/Trustpilot product sentiment
- `econ_mcp` - FRED macro series
- `github_mcp` - GitHub commits, stars, issues

**Implementation:** [docs/MCP_SERVERS_SETUP.md](./docs/MCP_SERVERS_SETUP.md)

---

## Summary: Phase 4-6 Transformation

| Metric | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
|--------|---------|---------|---------|---------|
| **Total Confidence** | 90/135 (67%) | 100/135 (74%) | 110/135 (81%) | 125/135 (93%) |
| **Alternative Data** | 0/35 | 10/35 | 20/35 | 35/35 |
| **Monthly Cost** | $118 | $118 | $318-618 | $1118-3118 |
| **Revenue Trigger** | $500 MRR | $200 MRR | $500 MRR | $1000 MRR |
| **Competitive Tier** | Tier 2 | Tier 2+ | Tier 2.5 | Tier 3 |

---

## See Also

- [INTELLIGENCE_PLATFORM_MASTER_PLAN.md](./INTELLIGENCE_PLATFORM_MASTER_PLAN.md) - Overall strategy
- [MULTI_MODAL_CONFIDENCE_STRATEGY.md](./MULTI_MODAL_CONFIDENCE_STRATEGY.md) - Core domains (Phases 1-3)
- [docs/QUICK_WINS_PLAYBOOK.md](./docs/QUICK_WINS_PLAYBOOK.md) - Tactical signal implementations
- [lib/alternativeData/README.md](./lib/alternativeData/README.md) - Event Bus technical architecture

**CSV References:**
- [AltData_Sourcing_and_MCP_Plan.csv](./AltData_Sourcing_and_MCP_Plan.csv) - Source catalog
- [AltData_Sourcing_and_MCP_Plan-Expected_Lift.csv](./AltData_Sourcing_and_MCP_Plan-Expected_Lift.csv) - IR estimates
- [AltData_Sourcing_and_MCP_Plan-Roadmap.csv](./AltData_Sourcing_and_MCP_Plan-Roadmap.csv) - Phase timeline
- [AltData_Sourcing_and_MCP_Plan-Data_Schema.csv](./AltData_Sourcing_and_MCP_Plan-Data_Schema.csv) - Database tables

---

**Last Updated:** 2025-01-24
**Status:** Planning complete, Phase 4 ready after Phase 3 completion
**Next Review:** After Phase 3 completion and revenue >$200 MRR
