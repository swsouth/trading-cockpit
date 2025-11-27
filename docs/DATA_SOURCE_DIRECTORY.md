# Data Source Directory

**Quick Provider Lookup by Use Case**

---

## Quick Reference

**Purpose:** Fast decision guide - "I need X data → Use Provider Y"
**Not a comprehensive comparison:** See CSV files for detailed provider specifications

**Key Decision Factors:**
1. **Cost** (FREE vs paid tiers)
2. **Rate Limits** (calls/min, calls/day)
3. **Data Quality** (tick-accurate vs aggregated)
4. **MCP Availability** (native integration vs custom wrapper)

**Primary Data Source:** [Market_Data_Providers_Comprehensive-Vendors_Master.csv](../Market_Data_Providers_Comprehensive-Vendors_Master.csv) (36 providers detailed)

---

## By Use Case

### Daily OHLC for 100-500 US Stocks

**Recommended (FREE):**
- **Twelve Data** - 800 calls/day FREE, global coverage, unified API
- **Alpha Vantage** - 500 calls/day FREE, includes technical indicators
- **Fallback:** FMP (250 calls/day FREE, paid $19-59/mo for unlimited)

**When to Upgrade:**
- Universe >200 stocks → Polygon ($89/mo, 100 calls/min)
- Need real-time (not 15-min delayed) → Polygon or IEX Cloud

**See CSV:** Vendors_Master.csv rows 2 (Polygon), 3 (Alpha Vantage), 4 (Twelve Data), 5 (FMP)

---

### Company Fundamentals (IS/BS/CF, Ratios)

**Recommended (FREE):**
- **Alpha Vantage** - FREE, clean JSON, covers major metrics (PE, EPS growth, debt/equity)
- **FMP** - 250 calls/day FREE, deeper history on paid tiers

**When to Upgrade:**
- Need 10+ years history → FMP Professional ($30-60/mo)
- Need institutional-grade → Financial Datasets or LSEG ($$$ enterprise)

**See CSV:** Vendors_Master.csv rows 3 (Alpha Vantage), 5 (FMP), 6 (Finnhub fundamentals)

---

### News & Sentiment

**Recommended (FREE):**
- **Finnhub** - FREE 60 calls/min, company news with timestamps, basic sentiment
- **Fallback:** Polygon News (requires $89/mo Polygon subscription)

**Upgrade Path:**
- Better sentiment analysis → Polygon News ($89/mo)
- Social sentiment → CryptoCompare (crypto), LunarCrush

**See CSV:** Vendors_Master.csv rows 2 (Polygon News), 9 (Finnhub)

---

### Analyst Ratings & Price Targets

**Recommended (FREE):**
- **Finnhub** - FREE, recommendation trends (buy/hold/sell counts), price targets

**Alternative:**
- Benzinga Pro (paid, $$$)
- FactSet/LSEG (enterprise)

**See CSV:** Vendors_Master.csv row 9 (Finnhub)

---

### Macro/Economic Data

**Recommended (FREE):**
- **Alpha Vantage** - FREE, econ endpoints (GDP, CPI, unemployment, etc.)
- **FRED** - FREE, authoritative US macro data from St. Louis Fed

**See CSV:** Vendors_Master.csv rows 3 (Alpha Vantage), 28 (FRED)

---

### Crypto Market Data (OHLCV)

**Recommended (FREE):**
- **CoinGecko** - FREE ~30 calls/min, 10k+ coins, broad coverage
- **CryptoCompare** - FREE ~100k calls/mo, good for EOD data
- **FreeCryptoAPI** - FREE 100k calls/mo, 3k+ coins, technical analysis endpoints

**Upgrade Path:**
- Venue-accurate data → CoinAPI ($79+/mo), Kaiko (enterprise)
- Real-time WebSocket → Binance/Kraken/Coinbase direct APIs

**See CSV:** Vendors_Master.csv rows 15 (CoinAPI), 16 (CoinGecko), 17 (CoinMarketCap), 18 (CryptoCompare), 23 (FreeCryptoAPI)

---

### On-Chain Metrics (Crypto)

**Recommended:**
- **Glassnode** - €29-799/mo, best-in-class on-chain (BTC/ETH)
- **Messari** - $29-199/mo, crypto fundamentals & metrics
- **CoinGecko** - FREE basic on-chain proxy via market data

**When to Use:**
- Crypto scanner (Phase 3) → Glassnode Starter (€29/mo)
- Deep on-chain research → Glassnode Advanced/Professional

**See CSV:** Vendors_Master.csv rows 19 (Messari), 21 (Glassnode)

---

### Paper/Live Trading Execution

**Recommended (FREE):**
- **Alpaca** - FREE paper trading, free delayed stock data, free crypto data
- **Binance/Kraken/Coinbase** - FREE APIs (pay exchange fees on live trades)

**Upgrade Path:**
- Real-time stock data → Alpaca Algo Trader Plus ($99/mo)
- Options trading → IBKR (complex setup, exchange fees)

**See CSV:** Vendors_Master.csv rows 13 (Alpaca), 14 (IBKR), 25 (Binance), 26 (Kraken), 27 (Coinbase)

---

### Alternative Data (Supply Chain, Foot Traffic, Web Analytics)

**See:** [ALTERNATIVE_DATA_INTELLIGENCE.md](../ALTERNATIVE_DATA_INTELLIGENCE.md) and [AltData_Sourcing_and_MCP_Plan.csv](../AltData_Sourcing_and_MCP_Plan.csv)

**Quick Summary:**

| Data Type | FREE Sources | Paid Sources | Cost |
|-----------|-------------|--------------|------|
| **Weather/Climate** | NOAA, OpenWeather | Weather.com API | FREE-$200/mo |
| **Regulatory Filings** | SEC EDGAR, FDA.gov, USPTO | N/A | FREE |
| **Developer Activity** | GitHub API | N/A | FREE |
| **Web Traffic** | Google Trends | SimilarWeb, Data.ai | $500-2k/mo |
| **Job Postings** | N/A (scraped) | LinkUp, Revelio Labs | $500-1k/mo |
| **Foot Traffic** | N/A | SafeGraph, Placer.ai | $1-2k/mo |
| **Supply Chain** | N/A | MarineTraffic, Freightos | $500+/mo |
| **Consumer Spend** | N/A | Facteus, Earnest | $2-5k/mo |

---

## By Domain (12-Domain Framework)

### Domain 1: Market/Technical (30 pts)

**Primary:** Twelve Data, Alpha Vantage, Polygon
**Backup:** FMP, Marketstack
**FREE Options:** Twelve Data (800/day), Alpha Vantage (500/day)
**Best For:** Daily scanner with 100-200 stock universe

---

### Domain 2: Fundamentals (20 pts)

**Primary:** Alpha Vantage, FMP
**Backup:** Finnhub, Financial Datasets
**FREE Options:** Alpha Vantage (500/day), FMP (250/day)
**Best For:** Valuation scoring, earnings growth analysis

---

### Domain 3: Sentiment/News (20 pts)

**Primary:** Finnhub, Polygon News
**Backup:** CryptoCompare (crypto), Aylien (paid)
**FREE Options:** Finnhub (60 calls/min)
**Best For:** Catalyst detection, sentiment scoring

---

### Domain 4: Analyst Consensus (10 pts)

**Primary:** Finnhub
**Backup:** Benzinga Pro (paid)
**FREE Options:** Finnhub
**Best For:** Consensus ratings, price target analysis

---

### Domain 5: Macro Regime (10 pts)

**Primary:** Alpha Vantage, FRED
**Backup:** N/A (FRED is authoritative)
**FREE Options:** Both FREE
**Best For:** Market regime detection, sector rotation

---

### Domain 6: On-Chain (5 pts, crypto)

**Primary:** Glassnode
**Backup:** Messari, CoinGecko
**FREE Options:** CoinGecko (limited)
**Best For:** Crypto scanner, exchange flow analysis

---

### Domain 7: Order Flow (5 pts, advanced)

**Primary:** Polygon
**Backup:** Kaiko (enterprise crypto)
**FREE Options:** None (requires paid tier)
**Best For:** Institutional activity detection

---

### Domains 8-12: Alternative Data

**See:** [AltData_Sourcing_and_MCP_Plan.csv](../AltData_Sourcing_and_MCP_Plan.csv)

---

## FREE Source Highlight

**What you can get for $0/month:**

| Provider | What It Offers | Rate Limits | Best Use |
|----------|---------------|-------------|----------|
| **Alpha Vantage** | OHLCV, fundamentals, macro, 100+ indicators | 500 calls/day, 5/min | Daily scanner, fundamentals, macro |
| **Twelve Data** | Global OHLCV, multi-asset | 800 calls/day, 8/min | Daily scanner, global stocks |
| **Finnhub** | News, sentiment, analyst ratings | 60 calls/min | Sentiment, analyst consensus |
| **FMP** | OHLCV, fundamentals | 250 calls/day | Fundamentals backup |
| **CoinGecko** | Crypto OHLCV, 10k+ coins | ~30 calls/min | Crypto scanner |
| **Alpaca** | Paper trading, delayed stock data | Unlimited paper trading | Validation loop, execution |
| **FRED** | US macro/econ data | Generous | Macro regime detection |
| **SEC EDGAR** | Insider trading, filings | Public data | Corporate behavior |
| **GitHub API** | Repo activity, stars, commits | 5000 calls/hour (authed) | Developer ecosystem |
| **Google Trends** | Search interest | Rate-limited | Consumer demand signals |
| **NOAA** | Weather data | Public | Climate/energy sensitivity |
| **FDA.gov** | Drug approval calendar | Public | Biotech catalysts |
| **USPTO** | Patent/trademark filings | Public | Product pipeline proxy |

**Total Cost:** $0/mo
**Coverage:** Domains 1-5 (80/100 core pts) + Domains 8-12 (FREE subset, ~10/35 pts) = **90/135 total (67%)**

---

## Cost-Effective Combinations

### Phase 1: Multi-Modal Foundation ($0/mo)

**Stack:**
- Alpha Vantage (market data, fundamentals, macro)
- Finnhub (news, sentiment, analyst)
- Alpaca (paper trading)

**Coverage:** 80/135 (59%)
**Domains:** 5 core (technical, fundamentals, sentiment, analyst, macro)
**Scanner Runtime:** 2-3 minutes (128 stocks)
**Revenue Needed:** $0 (start here)

---

### Phase 2: Scale & Depth ($89/mo)

**Stack:**
- Polygon ($89/mo) - market data, real-time news, corporate actions
- Alpha Vantage (FREE) - macro, indicators
- Finnhub (FREE) - analyst
- Alpaca (FREE) - execution

**Coverage:** 85/135 (63%)
**Domains:** 5 core (better depth)
**Scanner Runtime:** <30 seconds
**Revenue Needed:** $200/mo MRR (20+ users @ $10/mo)

---

### Phase 3: Multi-Asset ($118/mo)

**Stack:**
- Polygon ($89/mo) - stocks
- Glassnode (€29/mo ≈ $31) - on-chain crypto
- CoinGecko (FREE) - crypto OHLCV
- Alpha Vantage (FREE) - macro
- Finnhub (FREE) - analyst
- Alpaca (FREE) - execution

**Coverage:** 90/135 (67%)
**Domains:** 6 (add on-chain)
**Scanner Runtime:** <45 seconds (stocks + crypto)
**Revenue Needed:** $500/mo MRR (50+ users @ $10/mo)

---

### Phase 6: Institutional-Grade ($1118-3118/mo)

**Stack:**
- All Phase 3 providers ($118)
- Google Trends, GitHub, FDA, NOAA, SEC EDGAR, USPTO (FREE)
- SimilarWeb/Data.ai ($500-2k/mo)
- LinkUp/Revelio ($500-1k/mo)
- MarineTraffic/Freightos ($500+/mo)
- Facteus/Earnest ($2-5k/mo)

**Coverage:** 125/135 (93%)
**Domains:** All 12 (complete)
**Revenue Needed:** $5000/mo MRR (200+ users @ $25/mo)

---

## Decision Flowchart

```
Do you need fundamentals?
├─ YES → Alpha Vantage (FREE) or FMP (FREE 250/day, $19-59/mo unlimited)
└─ NO → Skip

Do you need news/sentiment?
├─ YES → Finnhub (FREE 60/min)
│   └─ Need real-time (not delayed)? → Polygon News ($89/mo upgrade)
└─ NO → Skip

Do you need crypto data?
├─ YES → CoinGecko (FREE OHLCV)
│   └─ Need on-chain metrics? → Glassnode (€29-799/mo)
└─ NO → Skip

Do you have >200 stocks in universe?
├─ YES → Polygon ($89/mo, 100 calls/min)
└─ NO → Twelve Data or Alpha Vantage (FREE, slower)

Do you need alternative data?
├─ YES → Start with FREE (Google Trends, GitHub, SEC EDGAR, etc.)
│   └─ Revenue >$500/mo? → Add paid (SimilarWeb, job data, etc.)
└─ NO → Skip for now (add in Phase 4+)
```

---

## Migration Paths

### From FMP + Finnhub (Current) → Alpha Vantage + Finnhub (Phase 1)

**Why:** Consolidate to 1 provider for market data + fundamentals (Alpha Vantage)
**Steps:**
1. Add Alpha Vantage adapter (`lib/alphaVantageData.ts`)
2. Test with 5 stocks (`npm run test-scanner`)
3. Switch scanner to Alpha Vantage
4. Keep Finnhub for news/analyst (still FREE)

**Result:** Same cost ($0), but unified provider reduces complexity

---

### From Alpha Vantage → Polygon (Phase 2)

**Why:** Faster scanner (100 calls/min vs 5 calls/min), real-time news, corporate actions
**When:** Revenue >$200/mo
**Steps:**
1. Add Polygon adapter
2. Test candles + news integration
3. Switch scanner to Polygon for candles/news
4. Keep Alpha Vantage for fundamentals/macro (FREE)

**Result:** +$89/mo cost, but 10x faster scanner + better data

---

## Common Pitfalls & Solutions

### Pitfall 1: Rate Limit Exceeded

**Problem:** Free tiers hit 5 calls/min limit, scanner times out
**Solution:**
- Batch API calls (group by provider)
- Add caching (1-minute for quotes, EOD for fundamentals)
- Upgrade to paid tier if universe >200 stocks

---

### Pitfall 2: Missing Data (NULL values)

**Problem:** Some tickers don't have fundamentals or news
**Solution:**
- Implement fallback to mock data
- Cross-validate between providers (e.g., try FMP if Alpha Vantage returns null)
- Filter out tickers with incomplete data in scanner

---

### Pitfall 3: Overlapping Costs

**Problem:** Paying for same data from multiple providers
**Solution:**
- Use decision flowchart above to assign domains to specific providers
- Example: Don't pay for both Polygon + Alpha Vantage OHLCV
  - Use Polygon for OHLCV, Alpha Vantage for fundamentals/macro only

---

## See Also

- [INTELLIGENCE_PLATFORM_MASTER_PLAN.md](../INTELLIGENCE_PLATFORM_MASTER_PLAN.md) - Overall strategy
- [MULTI_MODAL_CONFIDENCE_STRATEGY.md](../MULTI_MODAL_CONFIDENCE_STRATEGY.md) - Phases 1-3 provider roadmap
- [docs/API_PROVIDER_COMPARISON.md](./API_PROVIDER_COMPARISON.md) - Strategic provider guidance
- [docs/MCP_SERVERS_SETUP.md](./MCP_SERVERS_SETUP.md) - MCP server configuration

**CSV References (Authoritative Data):**
- [Market_Data_Providers_Comprehensive-Vendors_Master.csv](../Market_Data_Providers_Comprehensive-Vendors_Master.csv) - 36 providers detailed
- [Market_Data_Providers_Comprehensive-Scenario Mapping.csv](../Market_Data_Providers_Comprehensive-Scenario%20Mapping.csv) - Use case recommendations
- [AI_Confidence_Stack.csv](../AI_Confidence_Stack.csv) - Provider confidence rankings
- [AltData_Sourcing_and_MCP_Plan.csv](../AltData_Sourcing_and_MCP_Plan.csv) - Alternative data sources

---

**Last Updated:** 2025-01-24
**Status:** Complete, ready for use
**Next Review:** After Phase 1 implementation (when selecting providers)
