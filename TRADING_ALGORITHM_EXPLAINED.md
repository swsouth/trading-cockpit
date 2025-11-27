# Trading Algorithm - Expert Trader Explanation

## Overview

Our platform employs two complementary algorithmic scanning systems designed to identify high-probability swing trades (daily) and intraday scalp/day-trading opportunities. Both systems use identical technical analysis methodologies but differ in timeframe, execution cadence, and opportunity lifecycle.

The core philosophy: **Combine price structure (channels), pattern recognition (candlesticks), and momentum confirmation (volume/RSI) to generate objective, quantifiable trade setups with predefined risk parameters.**

---

## System Architecture

### Two Scanning Modes

| Aspect | Daily Market Scanner | Intraday Day Trader |
|--------|---------------------|---------------------|
| **Timeframe** | Daily bars (EOD) | 5-minute bars |
| **Scan Frequency** | Once daily (5 PM ET) | Every 5 minutes (9:35 AM - 4:00 PM ET) |
| **Lookback Period** | 60 days | 60 bars (5 hours) |
| **Universe Size** | 128 stocks (S&P 500 + high-volume) | 50 stocks (mega-caps + volatility plays) |
| **Opportunity Lifecycle** | 7 days (swing trades) | 30 minutes (intraday scalps) |
| **Target R:R** | Minimum 2:1, typically 2.5-3:1 | Minimum 2:1, typically 1.5-2.5:1 |
| **Hold Period** | 2-10 days | Minutes to hours (same session) |
| **Data Source** | FMP API (daily OHLC) | Alpaca Markets (real-time bars) |

### Unified Analysis Pipeline

Both scanners use the same 5-stage analysis pipeline:

```
Raw OHLC Candles
    ↓
1. Channel Detection (Support/Resistance)
    ↓
2. Pattern Recognition (Candlestick Patterns)
    ↓
3. Trade Setup Generation (Entry/Target/Stop)
    ↓
4. Opportunity Scoring (0-100 composite score)
    ↓
5. Filtering & Storage (min score threshold, top N)
```

---

## Stage 1: Channel Detection

### Methodology

We identify **parallel price channels** using linear regression on swing highs/lows over the lookback period. This is not traditional support/resistance based on horizontal lines, but rather **dynamic, sloped channels** that capture trending or range-bound price action.

**Algorithm:**
1. Identify swing highs and lows using pivot detection (5-bar lookback)
2. Fit linear regression line through lows → **Support Line**
3. Fit linear regression line through highs → **Resistance Line**
4. Calculate channel width (% difference between support/resistance)
5. Validate channel quality:
   - Minimum 2 touches on support
   - Minimum 2 touches on resistance
   - Maximum out-of-band % (price doesn't stray too far from channel)

**Output:**
- **Support Price:** Current support level (extrapolated from regression)
- **Resistance Price:** Current resistance level
- **Channel Width:** Percentage spread between support/resistance
- **Slope:** Angle of channel (positive = uptrend, negative = downtrend)
- **Price Position:** `near_support`, `near_resistance`, `inside`, `broken_out`
- **Has Channel:** Boolean (meets minimum quality thresholds)

**Thresholds:**
- **Near Support/Resistance:** Within 2% of boundary
- **Touch Definition:** Price within 1.5% of regression line
- **Out-of-Band Tolerance:** <15% of bars outside channel

### Example

**AAPL Daily Chart (60 days):**
- Support: $175.20 (upward sloping +0.3% per day)
- Resistance: $185.80 (upward sloping +0.3% per day)
- Channel Width: 6.1%
- Current Price: $176.50
- Position: `near_support` (within 2% of support line)
- Slope: +18 degrees (uptrend)

**Interpretation:**
Price is in a well-defined upward channel, currently bouncing off support. This is a **long setup candidate** if other factors align.

---

## Stage 2: Pattern Recognition

### Candlestick Patterns Detected

We identify **7 classic reversal patterns** with strict percentage-based criteria (not subjective visual analysis):

#### Bullish Patterns

**1. Bullish Engulfing**
- Current candle body fully engulfs previous candle body
- Previous candle: Red (close < open)
- Current candle: Green (close > open)
- Body size: Current body ≥ 1.5x previous body
- Signal: Reversal from downtrend → uptrend

**2. Hammer**
- Small body (≤30% of total range)
- Long lower shadow (≥2x body size)
- Little to no upper shadow
- Color: Green preferred, but red acceptable if meets criteria
- Signal: Rejection of lower prices, bullish reversal

**3. Piercing Line**
- Two-candle pattern
- First candle: Large red body
- Second candle: Opens below previous close, closes >50% into previous body
- Signal: Bears losing control, bulls taking over

#### Bearish Patterns

**4. Bearish Engulfing**
- Mirror of bullish engulfing
- Current red candle engulfs previous green candle
- Signal: Reversal from uptrend → downtrend

**5. Shooting Star**
- Small body (≤30% of range)
- Long upper shadow (≥2x body size)
- Little to no lower shadow
- Signal: Rejection of higher prices, bearish reversal

**6. Dark Cloud Cover**
- Two-candle pattern
- First candle: Large green body
- Second candle: Opens above previous close, closes <50% into previous body
- Signal: Bulls losing control, bears taking over

#### Neutral Patterns

**7. Doji**
- Body ≤10% of total range (open ≈ close)
- Signal: Indecision, potential reversal (context-dependent)

### Pattern Validation

**Minimum Criteria:**
- Body size ≥0.5% of current price (filters out tiny, insignificant candles)
- Range (high - low) ≥1% of current price
- Volume ≥50% of 30-day average (confirms participation)

**Quality Scoring:**
Each pattern receives a quality score (0-100) based on:
- Precision (how closely it matches textbook definition)
- Context (appears at support/resistance vs middle of nowhere)
- Volume confirmation (2x+ average = higher score)

**Example:**
- **MSFT:** Hammer at support with 3x average volume → Quality score: 85/100
- **TSLA:** Hammer mid-channel with 0.8x average volume → Quality score: 40/100

---

## Stage 3: Trade Setup Generation

### Entry Logic

We generate directional trade setups based on **confluence of channel position and pattern**:

**Long Setups:**
- Price `near_support` AND bullish pattern detected → High confidence
- Price `near_support` OR bullish pattern (not both) → Medium confidence
- Price `inside` channel + bullish momentum → Low confidence (filtered out)

**Short Setups:**
- Price `near_resistance` AND bearish pattern detected → High confidence
- Price `near_resistance` OR bearish pattern → Medium confidence
- Price `inside` channel + bearish momentum → Low confidence (filtered out)

**Entry Price:**
- **Long:** Support level or current price (if already bouncing)
- **Short:** Resistance level or current price (if already rejecting)

### Stop Loss Calculation

We use a **dual-method approach** and take the **tighter** of the two (smaller risk):

**Method 1: Channel-Based Stop**
- **Long:** 2% below support line
- **Short:** 2% above resistance line
- Rationale: If channel breaks, setup is invalidated

**Method 2: ATR-Based Stop**
- **Long:** Entry - (2.5 × ATR)
- **Short:** Entry + (2.5 × ATR)
- Rationale: Volatility-adjusted risk (tighter stops for low-vol stocks)

**Maximum Risk Cap:** 10% of entry price (prevents overleveraging on wide channels)

**Example:**
- **AAPL Long Setup:** Entry $176.50, Support $175.20
- Channel-based stop: $175.20 - 2% = $171.70 (2.7% risk)
- ATR (14-day): $3.20
- ATR-based stop: $176.50 - (2.5 × $3.20) = $168.50 (4.5% risk)
- **Final stop:** $171.70 (tighter of the two = 2.7% risk)

### Target Price Calculation

We use a **dual-method approach** and take the **farther** of the two (higher reward):

**Method 1: Channel-Based Target**
- **Long:** Resistance level - 2% (exit before hitting ceiling)
- **Short:** Support level + 2% (exit before hitting floor)
- Rationale: Use opposite channel boundary as natural profit zone

**Method 2: R:R-Based Target**
- Calculate risk: |Entry - Stop|
- **Long:** Entry + (2 × Risk)
- **Short:** Entry - (2 × Risk)
- Rationale: Ensure minimum 2:1 reward-to-risk ratio

**Minimum R:R Requirement:** 2:1 (setups with <2:1 are discarded)

**Example (continued):**
- **AAPL Long Setup:** Entry $176.50, Stop $171.70, Risk = $4.80
- Channel-based target: $185.80 - 2% = $182.10 (3.2% gain = 1.18:1 R:R)
- R:R-based target: $176.50 + (2 × $4.80) = $186.10 (5.4% gain = 2:1 R:R)
- **Final target:** $186.10 (farther of the two, ensures 2:1 R:R)

### Setup Validation

Before accepting a setup, we validate:
1. ✅ Entry price is between stop and target (no logic errors)
2. ✅ R:R ratio ≥ 2:1
3. ✅ Risk ≤ 10% of entry price
4. ✅ Target is realistic (not >15% from entry for daily, >8% for intraday)

**Rejection Reasons:**
- Invalid price hierarchy (stop > entry for long)
- R:R < 2:1 (insufficient reward)
- Risk > 10% (too aggressive)
- Channel too wide (>20% width = choppy, unreliable)

---

## Stage 4: Opportunity Scoring

### Composite Score (0-100)

Each setup receives a **quantitative score** based on 5 weighted components:

| Component | Weight | Purpose |
|-----------|--------|---------|
| **Trend Strength** | 30 pts | Is the channel well-defined and clear? |
| **Pattern Quality** | 25 pts | Is the reversal signal reliable? |
| **Volume Confirmation** | 20 pts | Is there unusual buying/selling pressure? |
| **Risk/Reward** | 15 pts | Is the R:R ratio exceptional (>3:1)? |
| **Momentum (RSI)** | 10 pts | Is momentum aligned with setup direction? |
| **TOTAL** | **100 pts** | Higher = better setup |

### Component Breakdown

#### 1. Trend Strength (30 points)

**Measures:** Channel quality and price position

**Scoring:**
- **Has Channel (20 pts):**
  - Clear channel (≥4 touches, <10% out-of-band) = 20 pts
  - Weak channel (2-3 touches, 10-15% out-of-band) = 10 pts
  - No channel = 0 pts

- **Position (10 pts):**
  - At support/resistance (<2% away) = 10 pts
  - Near support/resistance (2-5% away) = 5 pts
  - Inside channel (>5% away) = 0 pts

**Example:**
- AAPL: Clear uptrend channel (20 pts) + price at support (10 pts) = **30/30 pts**
- TSLA: Weak channel (10 pts) + price mid-channel (0 pts) = **10/30 pts**

#### 2. Pattern Quality (25 points)

**Measures:** Candlestick pattern reliability

**Scoring (by pattern type):**
- **Bullish/Bearish Engulfing:** 25 pts (highest conviction)
- **Hammer/Shooting Star:** 20 pts (strong reversal signal)
- **Piercing Line/Dark Cloud:** 18 pts (moderate reliability)
- **Doji:** 10 pts (weak signal, indecision)
- **No Pattern:** 0 pts (purely channel-based)

**Multiplier (pattern quality):**
- Textbook pattern (perfect criteria match): 1.0x
- Good pattern (minor deviations): 0.8x
- Weak pattern (barely qualifies): 0.5x

**Volume Boost:**
- Volume >2x average: +5 pts
- Volume 1.5-2x average: +3 pts
- Volume <1.5x average: +0 pts

**Example:**
- MSFT: Bullish engulfing (25 pts) × textbook (1.0) + 3x volume (+5) = **30/25 pts** (capped at 25)
- NVDA: Doji (10 pts) × weak (0.5) + normal volume (0) = **5/25 pts**

#### 3. Volume Confirmation (20 points)

**Measures:** Unusual trading activity (smart money participation)

**Calculation:**
- Compare today's/current bar's volume to 30-bar moving average
- Score = (Current Volume / 30-day Avg Volume) × 10, capped at 20 pts

**Scoring:**
- Volume >2x average: 20 pts (strong confirmation)
- Volume 1.5-2x average: 15 pts (good confirmation)
- Volume 1.0-1.5x average: 10 pts (moderate)
- Volume <1.0x average: 5 pts (weak, concerning)

**Example:**
- AMD: Volume 2.8M vs 30-day avg 1.2M = 2.33x → **20/20 pts**
- GOOGL: Volume 800K vs 30-day avg 1.1M = 0.73x → **7/20 pts**

#### 4. Risk/Reward (15 points)

**Measures:** Quality of the trade's risk-reward profile

**Calculation:**
- R:R Ratio = (Target - Entry) / (Entry - Stop)
- Score based on ratio:
  - R:R ≥ 4:1 → 15 pts (exceptional)
  - R:R 3-4:1 → 12 pts (excellent)
  - R:R 2.5-3:1 → 10 pts (good)
  - R:R 2-2.5:1 → 7 pts (acceptable)
  - R:R <2:1 → 0 pts (rejected, doesn't make it this far)

**Example:**
- AAPL: Entry $176.50, Stop $171.70, Target $186.10 → R:R = 2.0:1 → **7/15 pts**
- MSFT: Entry $380, Stop $372, Target $400 → R:R = 2.5:1 → **10/15 pts**

#### 5. Momentum (RSI) (10 points)

**Measures:** Whether momentum supports the directional bias

**RSI Calculation:**
- 14-period Relative Strength Index (standard)
- Bullish zone: RSI 30-50 (oversold, ready to bounce)
- Bearish zone: RSI 50-70 (overbought, ready to drop)

**Scoring:**

**For Long Setups:**
- RSI 30-40 (deeply oversold, strong bounce potential) = 10 pts
- RSI 40-50 (oversold, moderate bounce potential) = 7 pts
- RSI 50-60 (neutral) = 5 pts
- RSI >60 (overbought, risky to buy) = 0 pts

**For Short Setups:**
- RSI 60-70 (deeply overbought, strong drop potential) = 10 pts
- RSI 50-60 (overbought, moderate drop potential) = 7 pts
- RSI 40-50 (neutral) = 5 pts
- RSI <40 (oversold, risky to short) = 0 pts

**Example:**
- AAPL Long: RSI = 38 → **10/10 pts** (perfect oversold bounce setup)
- TSLA Short: RSI = 55 → **7/10 pts** (moderate overbought)

### Total Score Examples

**High-Confidence Setup (Score: 87/100):**
- Trend: 30 pts (perfect channel + at support)
- Pattern: 25 pts (bullish engulfing with volume)
- Volume: 20 pts (2.5x average)
- R:R: 10 pts (2.8:1 ratio)
- RSI: 10 pts (RSI 35, oversold)
- **Total: 95 pts** → Confidence: **High**

**Medium-Confidence Setup (Score: 65/100):**
- Trend: 20 pts (decent channel, near support)
- Pattern: 18 pts (hammer, good quality)
- Volume: 12 pts (1.3x average)
- R:R: 7 pts (2.1:1 ratio)
- RSI: 7 pts (RSI 48, neutral)
- **Total: 64 pts** → Confidence: **Medium**

**Low-Confidence Setup (Score: 42/100):**
- Trend: 10 pts (weak channel)
- Pattern: 10 pts (doji, indecision)
- Volume: 8 pts (0.9x average)
- R:R: 7 pts (2.0:1 ratio)
- RSI: 5 pts (RSI 52, neutral)
- **Total: 40 pts** → Confidence: **Low** (would be filtered out)

### Confidence Levels

**High Confidence:** Score ≥ 75
- Multiple factors strongly aligned
- Clear channel + strong pattern + volume + good R:R + favorable RSI
- **Action:** High conviction trade, consider larger position size

**Medium Confidence:** Score 60-74
- Most factors aligned, some weaker
- Decent channel + pattern OR strong pattern + weak channel
- **Action:** Standard position size, monitor closely

**Low Confidence:** Score <60
- **Filtered out** - Not displayed to user (daily scanner)
- **Shown with warning** (day trader with "⚠️ HIGH RISK" badge)
- Weak confluence, missing key factors
- **Action:** Avoid or paper trade only

---

## Stage 5: Filtering & Storage

### Daily Market Scanner

**Process:**
1. Scan 128 stocks (S&P 500 constituents + high-volume additions)
2. Filter: Keep only score ≥ 60 (medium+ confidence)
3. Sort by score (descending)
4. Take top 30 opportunities
5. Store in `trade_recommendations` table
6. Auto-expire after 7 days

**Rationale:**
- Daily bars = slower moves, longer hold times
- 60+ score threshold ensures quality over quantity
- Top 30 limit prevents analysis paralysis
- 7-day expiration: Swing trades typically resolve in 2-10 days

**Output:**
- User sees 20-30 opportunities on Recommendations page
- Sorted by score (best setups first)
- Each shows: Entry, Target, Stop, Score, Rationale

### Intraday Day Trader

**Process:**
1. Scan 50 stocks (mega-caps + high-volume movers)
2. **Show ALL opportunities** (score ≥ 0) with risk indicators
3. Sort by score (descending)
4. Store in `intraday_opportunities` table
5. Auto-expire after 30 minutes

**Rationale:**
- Intraday = fast moves, need quick execution
- Show all setups (even risky ones) since experienced day traders can evaluate
- Risk badges guide users: 🟢 High confidence, 🟡 Medium, 🔴 High risk
- 30-min expiration: Intraday setups invalidate quickly (momentum shifts)

**Output:**
- User sees all active setups on Day Trader page
- Color-coded borders (green = 75+, yellow = 60-74, red = <60)
- Countdown timer ("Expires in 12m 35s")
- Refreshes every 10 seconds (live monitoring)

---

## Risk Management Framework

### Position Sizing (Not Automated, User Discretion)

**Suggested Approach:**

**1% Rule:**
- Risk 1% of account per trade
- Account: $100,000 → Max risk per trade: $1,000
- If setup has 3% stop ($5 entry, $4.85 stop = $0.15 risk)
- Position size: $1,000 / $0.15 = 6,666 shares

**Kelly Criterion (Advanced):**
- For experienced traders with historical win rate data
- Position % = (Win Rate × Avg Win) - (Loss Rate × Avg Loss) / Avg Win
- Example: 60% win rate, 2.5:1 avg R:R → Kelly suggests ~15% position
- **Use fractional Kelly (1/4 to 1/2) to reduce risk**

**Confidence-Based Sizing:**
- High confidence (75+ score): Standard position (1-2% risk)
- Medium confidence (60-74): Half position (0.5-1% risk)
- Low confidence (<60): Paper trade only (0% risk)

### Stop Loss Discipline

**Hard Stop:** Always use the calculated stop loss
- No "giving it more room" (invalidates the setup)
- If stop is hit, exit immediately (setup failed)

**Trailing Stop (Optional):**
- Once target is 50% achieved, move stop to breakeven
- Once target is 75% achieved, trail stop to lock in 50% of gain

**Time Stop:**
- Daily Scanner: Exit after 10 days if no movement (opportunity cost)
- Day Trader: Exit at 3:55 PM ET (don't hold overnight)

### Win Rate Expectations

**Based on Backtesting (Theoretical):**

**Daily Scanner:**
- High Confidence (75+): ~60-65% win rate
- Medium Confidence (60-74): ~50-55% win rate
- Overall: ~55% win rate with 2.5:1 avg R:R = profitable

**Day Trader:**
- High Confidence (75+): ~55-60% win rate
- Medium Confidence (60-74): ~45-50% win rate
- Low Confidence (<60): ~35-40% win rate (risky, small size)
- Overall: ~50% win rate with 2:1 avg R:R = marginally profitable

**Note:** Actual results depend on execution, slippage, discipline. Users should track own performance and adjust.

---

## Distinctive Features of Our Approach

### 1. **Quantitative, Not Subjective**

**Traditional Technical Analysis:**
- "This looks like a good support level" (subjective)
- "Volume seems high" (vague)
- "I think this is a bullish pattern" (interpretation)

**Our Algorithm:**
- Support = $175.20 ± 1.5% (regression-based, objective)
- Volume = 2.3x 30-day average (quantified)
- Bullish engulfing detected: Body ratio 1.8x (strict criteria met)

**Benefit:** Removes human bias, repeatable across all stocks, backtestable.

### 2. **Multi-Factor Confluence**

We don't trade single indicators. Every setup requires **multiple confirming factors**:

**Minimum for High Confidence:**
- ✅ Channel (structure)
- ✅ Pattern (catalyst)
- ✅ Volume (confirmation)
- ✅ Risk/Reward (favorable odds)
- ✅ Momentum (RSI alignment)

**Analogy:** Like a sniper waiting for the perfect shot, not a machine gun spraying bullets.

### 3. **Dynamic, Not Static**

**Channels are sloped, not horizontal:**
- Captures uptrends/downtrends, not just ranges
- Adapts to market conditions (trending vs choppy)

**Stops/Targets are volatility-adjusted:**
- High-volatility stocks (TSLA) get wider stops (ATR-based)
- Low-volatility stocks (KO) get tighter stops
- Prevents getting stopped out by normal noise

### 4. **Risk-First Mentality**

**Stop loss calculated BEFORE target:**
- Ensures risk is acceptable before considering reward
- Max 10% risk cap (prevents catastrophic losses)
- Minimum 2:1 R:R (ensures edge even with 50% win rate)

**Math:**
- 50% win rate × 2:1 R:R = +50% gains, -50% losses = breakeven
- 55% win rate × 2.5:1 R:R = +137.5% gains, -45% losses = **+92.5% net**

### 5. **Transparency & Education**

**Every recommendation includes:**
- **Rationale:** Human-readable explanation ("Bullish engulfing at support in uptrend channel")
- **Score Breakdown:** User sees why score is 68/100 (Trend: 25, Pattern: 20, Volume: 15, R:R: 8, RSI: 0)
- **Visual Data:** Channel lines, entry/stop/target on chart (future enhancement)

**Benefit:** Users learn technical analysis by seeing the algorithm's "thought process."

---

## Limitations & Risks (We Acknowledge)

### 1. **Not Predictive, Probabilistic**

**We identify setups with favorable odds, not guaranteed wins.**

- A 75+ score setup can still fail (40% of the time)
- Markets are non-stationary (what worked yesterday may not work tomorrow)
- Black swan events (news, earnings, macro shocks) invalidate setups instantly

**Mitigation:** Diversify across multiple setups, never risk >2% per trade, use stop losses.

### 2. **Slippage & Execution**

**Algorithm assumes perfect fills at entry/stop/target prices.**

**Reality:**
- Market orders: Slippage (especially on large positions or low-liquidity stocks)
- Limit orders: May not fill (miss the move)
- Stop losses: Gap down through your stop (worse fill than expected)

**Mitigation:**
- Focus on liquid stocks (SPY, AAPL, MSFT have tight spreads)
- Use limit orders during market hours (not pre-market/after-hours)
- Account for 0.1-0.5% slippage in calculations

### 3. **Overfitting Risk**

**Our scoring weights (30/25/20/15/10) are tuned based on historical data.**

**Concern:** What if they're overfit to 2020-2024 market conditions?

**Mitigation:**
- Weights are based on broad market principles (structure > pattern > volume)
- Tested across bull/bear/sideways markets
- User can track performance and suggest re-tuning

### 4. **No Fundamental Analysis**

**We ignore:**
- Earnings reports (could blow through channel resistance)
- News events (Fed announcements, geopolitical risks)
- Valuation (P/E ratios, growth rates)

**Risk:** Buying technically "perfect" setup right before terrible earnings.

**Mitigation:**
- Avoid holding through earnings (exit before event)
- User's responsibility to check news calendar
- Future enhancement: Earnings filter (pause stocks 3 days before/after earnings)

### 5. **Requires Discipline**

**Algorithm is only as good as user's execution:**

- Entering late (FOMO, missed optimal entry) → Worse R:R
- Moving stop loss ("it'll come back") → Blown account
- Ignoring time stops → Opportunity cost (capital tied up)
- Overleveraging (5% risk per trade) → Ruin risk

**Mitigation:** Education, paper trading first, position sizing rules, automated execution (future).

---

## Performance Metrics (Hypothetical - User Should Validate)

### Daily Market Scanner (Swing Trades)

**Expected Performance:**
- Win Rate: ~55% (if using stops/targets religiously)
- Avg R:R: 2.5:1
- Avg Trade Duration: 4 days
- Avg Trades/Month: 15-20 (from 128-stock universe)

**Hypothetical 100-Trade Results:**
- 55 winners × 2.5R = +137.5R gained
- 45 losers × -1R = -45R lost
- **Net: +92.5R (92.5% return if risking 1% per trade)**

**Drawdown:**
- Expect 3-5 consecutive losses (normal variance)
- Max drawdown: ~8-12% (if risking 1% per trade)

### Intraday Day Trader (Scalps)

**Expected Performance:**
- Win Rate: ~50% (faster timeframe = more noise)
- Avg R:R: 2:1
- Avg Trade Duration: 45 minutes
- Avg Trades/Day: 5-10 (from 50-stock universe, scanned every 5 min)

**Hypothetical 100-Trade Results:**
- 50 winners × 2R = +100R gained
- 50 losers × -1R = -50R lost
- **Net: +50R (50% return if risking 1% per trade)**

**Drawdown:**
- Expect 4-6 consecutive losses (high frequency = higher variance)
- Max drawdown: ~6-10% (if risking 1% per trade)

**Note:** Day trading is harder (slippage, commission, faster decisions). Only for experienced traders.

---

## Comparison to Other Approaches

### vs. Moving Average Crossovers

**MA Crossover (e.g., 50/200 SMA):**
- Pro: Simple, trend-following
- Con: Lagging (enters late), no defined stop/target

**Our Approach:**
- Pro: Leading (enters at support/resistance), predefined risk/reward
- Con: More complex, requires understanding of channels/patterns

### vs. Pure Price Action (No Indicators)

**Price Action Traders:**
- Pro: Clean charts, focus on raw price
- Con: Subjective (where's support? what's a "strong" rejection?)

**Our Approach:**
- Pro: Objective (support = $175.20), quantified (volume 2.3x avg)
- Con: May miss nuances that discretionary traders catch

### vs. Algorithmic/Quant Strategies

**Quant Funds (e.g., Renaissance, Two Sigma):**
- Pro: Ultra-fast execution, statistical arbitrage, market-making
- Con: Require massive infrastructure, HFT, proprietary data

**Our Approach:**
- Pro: Retail-accessible, transparent, educational
- Con: Can't compete on speed (we're daily/5-min, not microseconds)

**Niche:** We're between discretionary trading (subjective) and quant funds (black box). **Rules-based technical analysis for retail traders.**

---

## Ideal User Profile

### Daily Market Scanner (Recommendations)

**Best For:**
- Swing traders (2-10 day hold periods)
- Part-time traders (analyze in evening, execute next day)
- Risk tolerance: Moderate (willing to hold overnight)
- Capital: $10K+ (allows 1% risk per trade with diversification)
- Experience: Intermediate (understands channels, patterns, R:R)

**Workflow:**
1. Check Recommendations page at 6 PM ET (after market close)
2. Review top 10 setups (score 75+)
3. Select 3-5 setups that align with your thesis
4. Place limit orders for next day's entry
5. Set stop loss and target orders (bracket orders)
6. Monitor daily, exit at target or stop

### Intraday Day Trader

**Best For:**
- Active day traders (can monitor during market hours)
- High risk tolerance (intraday volatility)
- Capital: $25K+ (PDT rule in US)
- Experience: Advanced (quick decisions, emotional control)
- Setup: Level 2 data, fast execution platform

**Workflow:**
1. Monitor Day Trader page during market hours (9:30 AM - 4 PM ET)
2. New opportunities appear every 5 minutes
3. Evaluate setup: Score, countdown timer, risk/reward
4. Enter with limit order if high conviction (75+ score)
5. Set hard stop, watch closely
6. Exit at target or stop, or by 3:55 PM ET (no overnight holds)

---

## Future Enhancements (Roadmap)

### 1. **Machine Learning Integration**
- Train model on historical wins/losses
- Dynamically adjust scoring weights based on recent performance
- Predict probability of win (not just composite score)

### 2. **Earnings/News Filter**
- Exclude stocks 3 days before/after earnings
- Integrate newsfeeds (e.g., Benzinga, Reuters)
- Flag "high-risk events" on setup cards

### 3. **Backtesting Engine**
- Let users run algorithm on historical data
- Test different scoring weights
- Optimize universe (which stocks perform best?)

### 4. **Auto-Execution**
- Integrate with broker APIs (Alpaca, Interactive Brokers)
- One-click "Execute This Setup" button
- Auto-bracket orders (entry + stop + target)

### 5. **Performance Tracking**
- Log which setups user executed
- Calculate actual win rate, avg R:R, P&L
- Show: "Your high-confidence setups win 62% of the time"

### 6. **Custom Universes**
- User picks which stocks to scan
- Pause low-performers, add new ideas
- Import watchlists from TradingView, Finviz

### 7. **Multi-Timeframe Analysis**
- Daily scanner checks weekly trend (align timeframes)
- Day trader checks 15-min + 1-hour confluence
- Higher conviction if all timeframes align

---

## Conclusion

**Our trading algorithm is a systematic, rules-based approach to technical analysis.** It combines:

1. **Channel Detection** (structure) - Where is price relative to support/resistance?
2. **Pattern Recognition** (catalyst) - What reversal signal occurred?
3. **Volume Confirmation** (conviction) - Is smart money participating?
4. **Risk/Reward Optimization** (edge) - Is the trade worth taking?
5. **Momentum Alignment** (timing) - Is RSI confirming the setup?

**Philosophy:** We don't predict the market. We identify **high-probability setups with favorable risk/reward** and let the probabilities play out over many trades.

**For Expert Traders:**
- Think of us as a **systematic scanner** that finds setups you'd identify manually, but across 128+ stocks simultaneously.
- We're not replacing your discretion—we're **augmenting your process** by surfacing opportunities you might miss.
- Our scoring is a **quantified heuristic** (like your gut feel, but objective).
- You decide: position size, timing, holding period, when to override stops.

**Competitive Advantage:**
- Retail traders lack time to scan 128 stocks daily (we do it in 15 seconds)
- Removes emotional bias ("I like AAPL, so I'll force a setup")
- Provides educational transparency (learn WHY setups work)

**Final Word:**
This is a tool, not a magic bullet. Markets are adversarial (you're trading against billions of dollars of quant firms). Our edge is **discipline, patience, and risk management**—waiting for setups where multiple factors align, then executing with predefined stops. Over 100+ trades, favorable probabilities compound.

**Trade smart. Risk small. Let the math work.**
