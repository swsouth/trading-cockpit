# Future Enhancements

## Real-Time Data Integration

**Status:** Future consideration
**Priority:** TBD

### Current State
- **Stock quotes**: Real-time via Finnhub (free tier)
- **Stock charts**: Daily OHLC via FMP (end-of-day data, 250 calls/day)
- **Crypto**: Near real-time via CoinGecko (updated every few minutes)

### Potential Upgrades

#### For Intraday Charts
- **FMP Premium** ($14/mo Starter plan)
  - 1min, 5min, 15min, 30min, 60min intervals
  - 300 calls/min
  - Better for swing trading with intraday analysis

#### For True Real-Time Streaming
- **Polygon.io** ($199/mo)
  - Real-time stock data with WebSockets
  - Tick-by-tick updates
  - Best for day trading

- **IEX Cloud** ($9-$499/mo)
  - Real-time quotes and trades
  - Flexible pricing tiers

- **Alpaca Markets** (Free with trading account)
  - Real-time market data
  - Potential trading integration

#### For Crypto Real-Time
- **Exchange WebSockets** (Free)
  - Direct connections to Binance, Coinbase, Kraken
  - True real-time crypto prices

- **CryptoCompare** ($50-$500/mo)
  - Aggregated real-time crypto data
  - Professional-grade streaming

---

## Crypto Intraday Scanner with 5-Minute Bars

**Status:** Proof-of-concept phase
**Priority:** Medium - Validate with 5-10 cryptos first
**Current Provider:** Twelve Data (free tier) for POC
**Upgrade Path:** CoinAPI or Twelve Data Pro when scaling to 100+ cryptos

### Current State (POC - 5-10 Cryptos)

**Using Twelve Data Free Tier:**
- 800 API calls/day (free)
- Native 5-minute OHLC support for crypto
- Covers BTC, ETH, SOL, DOGE, ADA, AVAX, MATIC, LINK, DOT, UNI
- 180+ cryptocurrency exchanges
- Cost: **$0/month**

**Limitations:**
- Free tier sufficient for 5-10 cryptos maximum
- 10 cryptos × 288 scans/day (24/7 at 5-min intervals) = 2,880 calls/day
- Would exceed free tier limit (800/day)
- **Solution:** Scan 5-10 cryptos OR reduce scan frequency to hourly for POC

**POC Architecture:**
```typescript
// Scan 5-10 cryptos hourly (24/7)
// 10 cryptos × 24 scans/day = 240 API calls/day ✅ Fits in free tier
// Store in intraday_opportunities table with asset_type: 'crypto'
// Display on Day Trader page crypto tab
```

### Scaling Options (When Proven)

#### Option 1: Twelve Data Pro ($79/month) - Good for 100 Cryptos
**Capacity:**
- 30,000 API calls/day
- 100 cryptos × 288 scans/day = 28,800 calls/day ✅ Fits with buffer
- REST API only (no WebSocket)

**Pros:**
- ✅ Simple REST API (reuse existing patterns)
- ✅ Clean pricing ($79/month flat)
- ✅ Covers 100 cryptos comfortably
- ✅ Same provider as stocks (if we use Twelve Data for stocks)

**Cons:**
- ⚠️ REST API = higher latency than WebSocket
- ⚠️ Limited headroom for growth beyond 100 cryptos
- ⚠️ No order book or Level 2 data

**Best For:**
- Scaling from POC to production with minimal changes
- Maintaining consistency with existing REST patterns
- 100 cryptos is enough for foreseeable future

**Documentation:** [Twelve Data Crypto APIs](https://twelvedata.com/cryptocurrency)

#### Option 2: CoinAPI Professional ($79/month) - Best for 100+ Cryptos
**Capacity:**
- 100,000 REST API credits/day
- 100,000 WebSocket messages/day (Professional plan)
- 100 cryptos × 1 WebSocket subscription each = 100 connections
- Updates pushed every 5 seconds automatically
- **Effective daily REST calls: ~100** (only for historical backfill)

**Pros:**
- ✅ WebSocket = 99% reduction in API calls (28,800 → 100/day)
- ✅ 100,000 credit/day headroom = can scale to 200+ cryptos
- ✅ Real-time updates (<100ms latency vs 1-2s REST)
- ✅ Order book data available (future order flow analysis)
- ✅ 370+ exchanges with standardized data
- ✅ Professional-grade data quality
- ✅ Future-proof for advanced features

**Cons:**
- ⚠️ WebSocket implementation more complex than REST
- ⚠️ Need connection management, reconnection logic
- ⚠️ Different API than stocks (if not using CoinAPI for stocks)

**Best For:**
- Scaling to 100+ cryptos
- Adding order flow/absorption analysis to crypto
- Professional-grade real-time data
- Future features (order books, Level 2, tick data)

**Documentation:**
- [CoinAPI OHLCV Guide](https://docs.coinapi.io/market-data/how-to-guides/get-historical-ohlcv-data-using-coinapi)
- [CoinAPI vs CoinGecko Comparison](https://www.coinapi.io/blog/coinapi-vs-coingecko-crypto-api-comparison)
- [CoinAPI Pricing](https://www.coinapi.io/products/market-data-api/pricing)
- [CoinAPI Rate Limits](https://www.coinapi.io/blog/api-rate-limits-and-credit-consumption-guide-coinapi-usage-and-billing-explained)

#### Option 3: Hybrid Multi-Source (Recommended for Production)
**Strategy:**
- **Stocks (Daily/Swing):** FMP + Finnhub (current setup)
- **Stocks (Intraday):** Twelve Data Basic ($29/mo) - 25 stocks max
- **Crypto (Intraday):** CoinAPI Professional ($79/mo) - 100+ cryptos via WebSocket
- **Crypto (Daily):** CoinGecko Free - swing trades

**Total Cost:** $108/month
**Total Capacity:** 25 stocks intraday + 100+ cryptos intraday + unlimited daily

**Pros:**
- ✅ Best tool for each job
- ✅ Most efficient API usage
- ✅ Highest quality data
- ✅ Maximum flexibility

**Cons:**
- ⚠️ Managing multiple providers
- ⚠️ Slightly higher cost

### Capacity Comparison Table

| Provider | Plan | Cost/Month | Daily Calls | Cryptos (5-min, 24/7) | Stocks (5-min) | Notes |
|----------|------|------------|-------------|----------------------|----------------|-------|
| **Twelve Data** | Free | $0 | 800 | ~2-3 ⚠️ | ~2-3 | POC only |
| **Twelve Data** | Basic | $29 | 8,000 | ~27 | ~27 | Not worth it |
| **Twelve Data** | Pro | $79 | 30,000 | ~100 ✅ | ~100 | Tight fit |
| **CoinAPI** | Pro | $79 | 100,000 REST | ~200+ ✅ | ~200+ | With WebSocket |
| **CoinAPI** | Pro (WebSocket) | $79 | Unlimited updates | **300+** ✅✅ | **300+** | Best efficiency |
| **CoinGecko** | Free | $0 | ~7,200-21,600 | ❌ No 5-min bars | ❌ | Daily only |

### Data Quality Comparison

| Feature | CoinGecko Free | Twelve Data | CoinAPI |
|---------|---------------|-------------|---------|
| **5-Minute Bars** | ❌ No (30-min minimum) | ✅ Yes | ✅ Yes (1-min available) |
| **WebSocket** | ❌ No | Limited | ✅ Full support |
| **Volume Data** | ⚠️ Missing in OHLC | ✅ Included | ✅ Included |
| **Exchange Coverage** | 900+ (aggregated) | 180+ | 370+ (granular) |
| **Order Book** | ❌ No | ❌ No | ✅ Yes (Pro plan) |
| **Latency** | High (~15 min) | Medium (1-2s REST) | Low (<100ms WebSocket) |
| **Best For** | Daily/swing trades | POC/small scale | Production/scale |

### Recommended Implementation Path

**Phase 1: Proof of Concept (FREE - Twelve Data)**
1. Use Twelve Data free tier
2. Scan 5-10 major cryptos (BTC, ETH, SOL, DOGE, ADA)
3. Scan hourly instead of every 5 minutes (240 calls/day vs 2,880)
4. Validate scanner logic, UI, user value
5. **Cost: $0/month**

**Phase 2: Production Launch (Twelve Data Pro - $79/month)**
When POC proves valuable:
1. Upgrade to Twelve Data Pro
2. Scan 100 cryptos every 5 minutes (28,800 calls/day)
3. Same REST API patterns as POC
4. Minimal code changes
5. **Cost: $79/month**

**Phase 3: Scale & Optimize (CoinAPI Pro - $79/month)**
When hitting limits or need better data:
1. Migrate to CoinAPI WebSocket
2. Scale to 200+ cryptos without hitting limits
3. Add order flow/absorption detection
4. Enable multi-exchange analysis
5. **Cost: $79/month (same price, 3x capacity)**

### Why NOT CoinGecko for Intraday

**Fatal Flaw:** No 5-minute bars available
- Free tier: 30-minute minimum granularity
- Paid plans: Hourly minimum (not 5-minute)
- Data updates every 15 minutes (too slow for intraday)
- **Verdict:** CoinGecko is great for daily/swing, not intraday

**Source:** [CoinGecko OHLC Documentation](https://support.coingecko.com/hc/en-us/articles/4538892425113-How-to-get-Candlestick-OHLC-Kline-data-using-API)

### Implementation Notes

**Database Schema:** Already created
- Migration: `20251128000000_add_asset_type_to_intraday.sql`
- Column: `asset_type TEXT DEFAULT 'stock' CHECK (asset_type IN ('stock', 'crypto'))`
- Indexes: Created for efficient filtering

**UI:** Already implemented
- Day Trader page has separate Stocks/Crypto tabs
- Counts displayed on each tab
- Crypto-specific messaging ("24/7 trading")
- Empty states for each asset type

**Scanner Logic:** Reusable
- Same channel detection, pattern recognition, scoring
- Uses `calculateIntradayOpportunityScore()` for 5-min bars
- Time-of-day volume normalization already built-in
- Just need crypto data source integration

### Next Steps for POC

1. Add `TWELVE_DATA_API_KEY` to `.env.local` (already in `.env.local.example`)
2. Create `lib/twelveDataCrypto.ts` integration
3. Create `scripts/cryptoIntradayScan.ts` scanner (hourly cron)
4. Test with 5 cryptos: BTC, ETH, SOL, DOGE, ADA
5. Monitor API usage vs free tier limit (800/day)
6. Validate user value before upgrading

**Estimated Effort:** 4-6 hours for POC implementation

### Success Criteria for Upgrading

Before spending $79/month, validate:
- ✅ Scanner finds actionable crypto setups
- ✅ Users engage with crypto tab regularly
- ✅ Scoring algorithm works for crypto (volatility adjusted)
- ✅ 5-10 cryptos generate enough opportunities
- ✅ Users request more cryptos ("Can you add XYZ?")

**If POC succeeds:** Upgrade to Twelve Data Pro ($79/month) for 100 cryptos
**If users love it:** Consider CoinAPI Pro for WebSocket efficiency and scale

### Cost-Benefit Analysis

**POC Cost:** $0/month (Twelve Data free)
**POC Value:** Validate $79/month decision risk-free

**Production Cost:** $79/month (Twelve Data Pro or CoinAPI Pro)
**Production Value:**
- 100+ crypto opportunities daily (24/7 markets)
- Competitive differentiator (most apps don't scan crypto)
- Premium feature for monetization
- Attracts crypto traders (large market segment)

**ROI Calculation:**
- Need 3-4 paid users at $25/month to cover cost
- Or upsell existing users to premium for crypto access
- Break-even: Very achievable if crypto tab proves valuable

### Decision Factors
- Current use case: Technical analysis, pattern detection, swing trading
- Daily/end-of-day data is sufficient for position trading
- Consider upgrading when:
  - Need intraday chart analysis
  - Moving to day trading strategies
  - Want streaming real-time updates
  - Hit API rate limits

### Notes
- 2025-01-17: Discussed real-time options, decided to defer for now
- Daily candles work well for current technical analysis needs
- May revisit when scaling or changing trading strategies

---

## Price Alert Notifications

**Status:** Future consideration
**Priority:** TBD
**Estimated effort:** 2-6 hours depending on approach

### Current State
- Price alerts stored in database
- PriceAlertChecker runs in browser only (client-side)
- No notifications when app is closed
- User must be actively using the app to see alerts

### Email Notifications (Recommended First)

**Difficulty:** Easy to Medium (2-4 hours)

#### Service Options

**Resend (Recommended)**
- Free tier: 3,000 emails/month, 100/day
- Modern, developer-friendly API
- Great templates and React email support
- Setup time: ~30 minutes
- Cost: Free for most use cases

**SendGrid**
- Free tier: 100 emails/day (forever)
- Industry standard, very reliable
- More complex setup but powerful
- Setup time: ~1 hour
- Cost: Free tier sufficient

**AWS SES**
- Cost: $0.10 per 1,000 emails (very cheap)
- Requires domain verification
- Best for high volume
- Setup time: ~2 hours
- Cost: Pay-as-you-go (minimal)

#### Implementation Approach
1. Set up email service (Resend recommended)
2. Create Supabase Edge Function to check alerts periodically
3. Run via cron job (every 5-15 minutes)
4. Design clean email template
5. Send email when price crosses threshold
6. Mark alert as triggered in database

#### Benefits
- ✅ Free tier available
- ✅ Works when app is closed
- ✅ Can include charts and details
- ✅ No recurring costs (free tier)
- ✅ Better for non-urgent alerts
- ✅ Email digest option (daily summary)

### SMS Notifications (Optional Premium Feature)

**Difficulty:** Medium (4-6 hours)

#### Service Options

**Twilio (Most Popular)**
- Cost: ~$0.0075 per SMS in US (~$7.50 per 1,000 texts)
- $15 trial credit to start
- Very reliable
- Setup time: ~1 hour
- Cost: Pay-per-message

**AWS SNS**
- Cost: $0.00645 per SMS in US
- Slightly cheaper than Twilio
- Requires AWS setup
- Setup time: ~2 hours
- Cost: Pay-per-message

#### Implementation Considerations
- Need to collect and verify phone numbers
- Costs scale with usage
- May need opt-in/opt-out flow (compliance)
- Rate limits to manage
- Could be premium feature (charge users)

#### Benefits
- ✅ Instant notifications
- ✅ Best for time-sensitive alerts
- ✅ High visibility (SMS open rates ~98%)
- ⚠️ Costs money per message
- ⚠️ Requires phone number collection

### Recommended Approach

**Phase 1: Email Notifications**
1. Start with Resend (free, easy)
2. Implement basic alert emails
3. Test with real price movements
4. Add daily digest feature (optional)

**Phase 2: SMS (if needed)**
1. Only for high-priority alerts
2. Make it optional/premium feature
3. Implement after email proves valuable
4. Consider charging for SMS alerts

### Architecture

```
Supabase Edge Function (cron: every 5 min)
  ↓
Check active alerts
  ↓
Fetch current prices (Finnhub/CoinGecko)
  ↓
Compare against thresholds
  ↓
If triggered → Send notification (email/SMS)
  ↓
Mark alert as triggered
  ↓
Update database
```

### Notes
- 2025-01-17: Discussed email and SMS options, decided to track for future
- Current in-app alerts work for active users
- Email makes most sense as first step (free, easy)
- SMS could be premium feature later
- Consider user preferences for notification types

---

## Market Scanner with Predictive Trading Actions

**🚀 HIGH PRIORITY - MAJOR MONETIZATION OPPORTUNITY 🚀**

**Status:** Future consideration - TOP PRIORITY
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL - High value feature with real marketability
**Estimated effort:** 10-20 hours MVP, 20-28 hours complete
**Detailed Spec:** See `MARKET_SCANNER_SPEC.md` for full implementation details

> **User feedback:** "This is definitely a feature that has real power and marketability. Could be something big!"

**Revenue Potential:** $6K-$122K/month depending on user adoption (see detailed spec)

### Concept

Scan 500-2000 stocks automatically to find trading opportunities based on technical analysis. Provide **actionable recommendations** with specific entry prices, targets, stop losses, and risk/reward ratios.

### The Challenge: Data Volume

**Problem:** Current free tier limits make scanning impractical
- FMP: 250 calls/day → Can scan 250 stocks/day (or ~2 days for 500 stocks)
- Need 90 days OHLC data per stock
- 500-2000 stocks = massive API usage

### Data Source Options

#### Option 1: Free Yahoo Finance (Recommended) ⭐

**Difficulty:** Medium (10-14 hours)

**Implementation:**
- Use `node-yahoo-finance2` library (unofficial but works)
- Fetch EOD data for S&P 500 (500 stocks)
- Run Supabase Edge Function nightly via cron
- Cache results for 24 hours
- Completely free, unlimited usage

**Pros:**
- ✅ Free forever
- ✅ Can scan 500+ stocks daily
- ✅ Reuses existing analysis code
- ✅ EOD data sufficient for swing trading
- ✅ No ongoing costs

**Cons:**
- ⚠️ EOD data only (no intraday)
- ⚠️ Unofficial API (could break)
- ⚠️ Need background job scheduler

**Cost:** $0/month

#### Option 2: Progressive Scanning (FMP)

**Difficulty:** Easy (4-6 hours)

**Implementation:**
- Scan 250 stocks/day with FMP free tier
- Rotate through 500-stock universe over 2 days
- Cache and display recent results

**Pros:**
- ✅ Uses existing provider
- ✅ Free

**Cons:**
- ⚠️ Takes 20 days for full scan
- ⚠️ Stale data for most stocks
- ⚠️ Limited usefulness

**Cost:** $0/month

#### Option 3: Paid Data Provider

**Services:**
- **Polygon.io** ($199/mo) - Unlimited historical, WebSocket streaming
- **IEX Cloud** ($9-$79/mo) - 500K-5M API calls/month
- **EODHistoricalData** ($79.99/mo) - Unlimited API calls

**Pros:**
- ✅ Fresh data daily
- ✅ Professional quality
- ✅ Reliable
- ✅ Intraday options available

**Cons:**
- ⚠️ Monthly subscription cost

**Cost:** $9-$199/month

### Predicted Trading Actions

**Core Value:** Transform pattern detection into actionable trades

#### Action Types

**1. Entry Strategies**

Generate specific recommendations based on setup:

```
Near Support + Bullish Pattern:
→ "BUY near support at $172.50"
→ "Entry zone: $171-$174"
→ "Target 1: $178.50 (mid-channel)"
→ "Target 2: $185 (resistance)"
→ "Stop loss: $169 (below support)"
→ "Risk/Reward: 1:4.3 ⭐⭐"

Near Resistance + Bearish Pattern:
→ "SELL/SHORT near resistance at $185"
→ "Entry zone: $183-$186"
→ "Target: $172 (support)"
→ "Stop loss: $188 (above resistance)"
→ "Risk/Reward: 1:4.1 ⭐⭐"

Breakout Above Resistance:
→ "BUY BREAKOUT at market $187.50"
→ "Entry zone: $186-$190"
→ "Target: $198 (measured move)"
→ "Stop loss: $183 (below breakout)"
→ "Risk/Reward: 1:2.8 ⭐"

Inside Channel:
→ "WAIT for better setup"
→ "Monitor for pullback to $172 (support)"
→ "Current price not at key level"
```

**2. Exit/Take-Profit Targets**

Multiple exit levels based on channel structure:
- **Target 1:** Mid-channel (conservative)
- **Target 2:** Opposite channel boundary (aggressive)
- **Trailing stop:** For breakouts

**3. Risk Management**

Automatic calculation of:
- **Stop loss placement** (below support/above resistance)
- **Position size suggestions** (based on % risk)
- **Dollar risk per share**
- **Max portfolio exposure**

#### Action Generation Logic

```typescript
interface TradingAction {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'SHORT' | 'BUY_BREAKOUT' | 'WAIT';
  entry: {
    type: 'market' | 'limit';
    price: number;
    range: { low: number; high: number };
  } | null;
  target: {
    primary: number;
    secondary: number | null;
  } | null;
  stopLoss: number | null;
  riskReward: number | null;
  confidence: 'LOW' | 'MODERATE' | 'HIGH';
  reasoning: string[];
  cautions: string[];
}

// Example logic
if (near_support && bullish_pattern && bullish_bias) {
  action = 'BUY';
  entry = support * 1.01;
  target1 = mid_channel;
  target2 = resistance * 0.98;
  stopLoss = support * 0.97;
  confidence = calculateConfidence(pattern_strength, touches, volume);
}
```

#### Confidence Scoring System

**Factors:**
- Channel strength (support/resistance touches)
- Pattern confirmation
- Signal alignment (bias + pattern + channel)
- Volume confirmation
- Channel width (tight = more reliable)
- Number of cautions

**Scoring:**
- **HIGH** (8+ points): Multiple confirmations, clean setup
- **MODERATE** (5-7 points): Good setup, minor concerns
- **LOW** (<5 points): Weak setup, conflicting signals

#### Scanner Filters

**Setup Filters:**
- Actionable setups only (BUY/SELL/SHORT, not WAIT)
- Buy setups only
- Sell/short setups only
- Breakout setups only

**Quality Filters:**
- Risk/reward ≥ 2:1
- Risk/reward ≥ 3:1
- High confidence only
- Moderate+ confidence

**Pattern Filters:**
- Specific patterns (hammer, engulfing, doji, etc.)
- Reversal patterns only
- Indecision patterns

**Channel Filters:**
- Near support only
- Near resistance only
- Tight channels (<5% width)
- Wide channels (>10% width)

**Price Action:**
- Breaking out
- Bouncing off support
- Large moves today (>3%, >5%)

### Scanner UI Design

```
╔═══════════════════════════════════════════════════════════╗
║ Market Scanner - 47 Trading Opportunities                 ║
╚═══════════════════════════════════════════════════════════╝

[Filters ▼] [Actionable ✓] [R/R > 2:1 ✓] [High Confidence]

┌─────────────────────────────────────────────────────────┐
│ AAPL  $175.23  +2.3%  [BUY SETUP] 🟢                    │
├─────────────────────────────────────────────────────────┤
│ Channel: Near support ($172-$185)                       │
│ Pattern: Hammer (bullish reversal)                      │
│ Signal: BULLISH                                         │
│                                                         │
│ 📊 RECOMMENDED ACTION:                                  │
│ ├─ Action: BUY at $173.50 (limit order)               │
│ ├─ Entry Zone: $171.50 - $174.50                      │
│ ├─ Target 1: $178.50 (mid) [+2.9%]                    │
│ ├─ Target 2: $184.50 (resistance) [+6.3%]             │
│ ├─ Stop Loss: $169.00 (below support) [-2.6%]         │
│ └─ Risk/Reward: 1:2.4 ⭐                               │
│                                                         │
│ ✓ Price bouncing off support                           │
│ ✓ Bullish hammer pattern confirmed                     │
│ ✓ 4 previous support touches (strong)                  │
│ ⚠ Monitor volume for confirmation                      │
│                                                         │
│ Confidence: MODERATE | Scanned: 2h ago                 │
│                                                         │
│ [Add to Watchlist]  [View Chart]  [Set Alert]          │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
CREATE TABLE market_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  scanned_at TIMESTAMP NOT NULL,

  -- Price data
  price DECIMAL NOT NULL,
  change_percent DECIMAL,
  volume BIGINT,

  -- Technical analysis
  has_channel BOOLEAN,
  channel_status TEXT,
  support DECIMAL,
  resistance DECIMAL,
  mid_channel DECIMAL,
  channel_width_pct DECIMAL,
  support_touches INT,
  resistance_touches INT,

  pattern TEXT,
  bias TEXT,
  notes TEXT[],
  cautions TEXT[],

  -- Trading action
  recommended_action TEXT, -- BUY, SELL, SHORT, BUY_BREAKOUT, WAIT
  entry_price DECIMAL,
  entry_range_low DECIMAL,
  entry_range_high DECIMAL,
  entry_type TEXT, -- market, limit

  target_price_1 DECIMAL,
  target_price_2 DECIMAL,
  stop_loss DECIMAL,

  risk_reward_ratio DECIMAL,
  confidence TEXT, -- LOW, MODERATE, HIGH
  reasoning TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX idx_scanned_at ON market_opportunities(scanned_at DESC);
CREATE INDEX idx_recommended_action ON market_opportunities(recommended_action);
CREATE INDEX idx_confidence ON market_opportunities(confidence);
CREATE INDEX idx_risk_reward ON market_opportunities(risk_reward_ratio DESC);
CREATE INDEX idx_pattern ON market_opportunities(pattern);
CREATE INDEX idx_bias ON market_opportunities(bias);
```

### Implementation Architecture

```
┌─────────────────────────────────────────┐
│ Supabase Edge Function (Nightly Cron)  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Fetch S&P 500 symbols                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ For each symbol:                        │
│ 1. Fetch OHLC from Yahoo Finance        │
│ 2. Run detectChannel()                  │
│ 3. Run detectPatterns()                 │
│ 4. Run computeCombinedSignal()          │
│ 5. Generate trading action              │
│ 6. Calculate confidence score           │
│ 7. Store in market_opportunities        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Scanner UI Page (/scanner)              │
│ - Filter by action, confidence, R/R     │
│ - Sort by various criteria              │
│ - Quick actions: add to watchlist, etc. │
└─────────────────────────────────────────┘
```

### Important Legal Considerations

**REQUIRED DISCLAIMERS:**

Must include on every page showing trading recommendations:

```
⚠️ IMPORTANT DISCLAIMER:
These are algorithmic suggestions based on technical analysis patterns.
This is NOT financial advice. NOT a recommendation to buy or sell.
Do your own research and consult a financial advisor.
Past patterns do not guarantee future results.
Trading involves substantial risk of loss.
Only trade with money you can afford to lose.
We are not responsible for any trading losses.
```

**Additional protections:**
- Display prominently on scanner page
- Include in emails/notifications
- Add to terms of service
- Consider liability insurance if monetizing

### Enhanced Features (Phase 2)

**1. Backtesting Results**
- Show historical performance of similar setups
- Win rate statistics for pattern types
- Average R/R achieved

**2. Real-time Alerts**
- Email when new high-confidence setup found
- Push notifications for breakouts
- Daily digest of top opportunities

**3. Portfolio Integration**
- Track which scanner picks you traded
- Performance tracking
- P&L attribution

**4. Customization**
- User-defined scan criteria
- Custom stock universes (not just S&P 500)
- Adjustable risk parameters

**5. Export Features**
- CSV export of opportunities
- Integration with trading platforms
- Watchlist auto-population

### Effort Breakdown

**Phase 1: Basic Scanner (10-14 hours)**
- Yahoo Finance integration: 2-3 hours
- Supabase Edge Function: 2-3 hours
- Action generation logic: 3-4 hours
- Database schema: 1 hour
- Scanner UI page: 3-4 hours

**Phase 2: Actions & Filters (6-8 hours)**
- Confidence scoring: 2 hours
- Advanced filters: 2 hours
- Risk/reward calculations: 1 hour
- UI enhancements: 2-3 hours

**Phase 3: Polish (4-6 hours)**
- Disclaimers and legal text: 1 hour
- Testing and refinement: 2-3 hours
- Documentation: 1-2 hours

**Total: 20-28 hours for complete feature**

### Recommended Approach

**Start with:**
1. ✅ Yahoo Finance + S&P 500 universe
2. ✅ Basic BUY/SELL/WAIT recommendations
3. ✅ Entry, target, stop calculations
4. ✅ Risk/reward ratios
5. ✅ Simple filters (actionable, R/R > 2:1)

**Add later:**
- Confidence scoring refinement
- Backtesting stats
- Email alerts for new opportunities
- Custom universes (crypto, small caps)
- Advanced filters

### Success Metrics

**Value to users:**
- Find trading opportunities without manual screening
- Specific entry/exit prices (actionable)
- Risk management built-in
- Save hours of analysis time

**Expected usage:**
- Check scanner each morning
- Filter for high-confidence setups
- Add interesting setups to watchlist
- Set price alerts for entry zones

### Notes
- 2025-01-17: Discussed market scanner with predictive actions, decided to track for future
- Reuses existing technical analysis code (channel, pattern, signal detection)
- Yahoo Finance approach is completely free and scalable
- Could become premium feature or monetization opportunity
- Legal disclaimers are critical
- Start simple, add features based on user feedback
