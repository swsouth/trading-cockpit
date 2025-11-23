# TradeGPT Prompt Engineering Analysis

**Source:** TradeGPT 100+ Prompts PDF (Free Download from TradeAlgo.com)
**Date Analyzed:** November 22, 2025

---

## Executive Summary

This document analyzes the 123 example prompts provided by TradeAlgo to demonstrate how users should interact with their TradeGPT AI assistant. This reveals critical UX patterns, feature categories, and prompt engineering strategies we should implement.

---

## Core Philosophy: Two Fundamental Rules

### Rule #1: Think Like Google
- **Quote:** *"Would you ever ask your friend – 'What should I Google today?' Of course not! You simply google something you want to know the answer to."*
- **Application:** Users should ask TradeGPT what they genuinely want to know about markets
- **Implication:** The AI should be versatile enough to handle any trading-related question

### Rule #2: Specificity = Quality
- **Quote:** *"The broader a question you ask, the broader the answer will be. The more specific a question you ask, the more specific it will be."*
- **Bad Example:** "What is a good stock to buy?"
- **Good Example:** "Search for technology stocks with a 3-year revenue growth rate above 10%"
- **Implication:** Prompt engineering and user guidance is critical

---

## Prompt Categories & Use Cases

TradeAlgo organizes prompts into 11 categories, showing their AI's breadth of capabilities:

### 1. Trade Idea Generator (16 Prompts)

**Purpose:** Generate specific, actionable options trade recommendations

**Key Features Demonstrated:**
- Returns specific details: Ticker, Strike Price, Entry Price, Expiration Date, Exit Price, Stop Loss
- Can request "no analysis" - just actionable trade details
- Time-based strategies (last hour of day, weekly swing, etc.)
- Strategy-specific (earnings plays, sector rotation, contrarian, hedge trades)

**Example Prompt:**
```
"I'd like an in the money options trade to make right now. Give me the specific
strike price, entry price, and expiration. I do not care what company it is. I
do not want an in depth analysis about the trade. Just give me the exact play
to make on an option based on your best analysis and recommendation."
```

**Example Response Format:**
```
Ticker Symbol: AVGO
Strike Price: $1400
Entry Price (Premium): $596.59
Expiration Date: March 15, 2024
Break-even Price: $1409.40
Current Stock Price: $1300 (after-hours trading)
```

**Strategies Covered:**
- Options trade for last hour of the day
- Weekly swing trade
- Basic options trade (anytime market is open)
- Intraday momentum trade
- Earnings report play
- Sector rotation strategy
- Hedge trade for portfolio protection
- High dividend yield play
- Contrarian options strategy
- Leveraged ETF options trade
- Calendar spread for volatility
- Breakout trade for technical analysis
- Undervalued stock play
- Trading stocks near support levels
- Finding undervalued LEAP options
- Tech trades with expiring options

**Key Insight:** Users want specific, actionable trades with all necessary details. No need to explain WHY unless requested.

---

### 2. Stock Selection (6 Prompts)

**Purpose:** Screen stocks based on fundamental criteria

**Example Prompts:**
- "Find stocks with a P/S ratio below the industry average, positive net income, and a dividend yield of over 2%."
- "Search for technology stocks with a 3-year revenue growth rate above 10%."
- "Find companies with a market capitalization over $2 billion that have increased their market share in the last year."
- "Identify stocks with a consistent track record of meeting or beating earnings estimates over the last 4 quarters and a P/B ratio below the industry average."
- "List stocks that are trading at least 20% below their 52-week high and have a Return on Equity (ROE) above the industry average."

**Key Insight:** Users combine multiple fundamental metrics in a single query. The AI must support complex multi-criteria screening.

---

### 3. Analyzing a Company (5 Prompts)

**Purpose:** Deep-dive company analysis

**Example Prompts:**
- "Provide a brief company overview and business model explanation for Salesforce."
- "Analyze the financial statements and financial ratios for Salesforce and summarize its financial health."
- "Compare Salesforce to its top 3 competitors in the industry and highlight its competitive advantages and disadvantages."
- "Analyze the overall investor sentiment for Salesforce based on news headlines, social media, and message boards."
- "What is the market cap to active user ratio for $SNAP and $META?"

**Key Features:**
- Business model explanation
- Financial health analysis
- Competitive positioning
- Sentiment analysis (multi-source)
- Custom metric calculations

---

### 4. Stock Market Data Analysis (4 Prompts)

**Purpose:** Historical data analysis and correlation studies

**Example Prompts:**
- "Analyze the S&P 500 index over the last 5 years and summarize key support and resistance levels."
- "What sectors have shown the highest correlation to oil prices in the past 3 years based on ETF data?"
- "Compare trading volumes for airlines, hotels, and cruise stocks in 2022. How do they compare to 5-year averages?"
- "Which sectors have the highest correlation to the 10-year Treasury Yield based on 5 years of monthly closes data?"

**Key Insight:** Users want historical pattern analysis and correlation studies across asset classes.

---

### 5. Position Sizing (10 Prompts)

**Purpose:** Risk management and position sizing strategies

**Example Prompts:**
- "Provide a position sizing model for a day trading strategy optimized for an account size of $100,000 with a 2% maximum risk per trade."
- "Suggest a dynamic position sizing approach for a swing trading system optimized for controlling drawdown with an initial capital base of $200,000."
- "Recommend a method for scaling into positions on a trend-following strategy based on volatility and instrument liquidity."
- "What is the optimal per-trade risk for a pattern breakout strategy targeting 20%+ annual returns based on historical win rates and payoffs?"
- "How should I determine the number of contracts when swing trading futures using technical indicators with a stop defined as 2 ATRs?"

**Key Features:**
- Account size-specific recommendations
- Risk percentage management
- Volatility-based sizing
- Strategy-specific sizing
- Code generation for algorithmic sizing

**Key Insight:** Professional traders need sophisticated position sizing tools. This is not just "how much should I buy?"

---

### 6. Creating a Trading Plan (7 Prompts)

**Purpose:** Templates, checklists, and routines for disciplined trading

**Example Prompts:**
- "Provide a sample trading plan template for a day trader including sections for watchlists, risk management, entries, exits, and journaling."
- "Suggest rules and criteria for selecting stocks for a short-term swing trading portfolio focused on the technology sector."
- "Propose a checklist for entering trades focused on price action, indicators, fundamentals, and technicals for an intraday breakout strategy."
- "Recommend a routine for reviewing and updating watchlists as market conditions evolve for a short-term momentum strategy."
- "Suggest a trading journal template covering performance stats, screenshots, notes, and learnings to optimize an options swing trading strategy."
- "Propose a daily and weekly routine for an active swing trader focused on staying disciplined, managing risk, and reviewing results."

**Example Response (Daily Routine):**
```
Pre-Market:
6:30 AM - 8:00 AM: Review overnight market news and global markets
8:00 AM - 9:00 AM: Analyze pre-market data for watchlist stocks
9:00 AM - 9:30 AM: Set up trading platform with entry/exit points, stop losses

Market Hours:
9:30 AM - 12:00 PM: Execute trades, monitor positions, adjust stops
12:00 PM - 1:00 PM: Lunch break to avoid burnout
1:00 PM - 4:00 PM: Continue monitoring and managing trades

Post-Market:
4:00 PM - 5:00 PM: Review day's trades vs plan, note deviations
5:00 PM - 6:00 PM: Conduct brief market analysis for next day
```

**Key Insight:** Users need structure and discipline tools, not just trade ideas. The AI should help with process, not just picks.

---

### 7. Dividend Investing (9 Prompts)

**Purpose:** Screen and analyze dividend-paying stocks

**Example Prompts:**
- "Show me stocks with a dividend yield greater than 3%."
- "Identify companies that have consistently increased their dividend payouts for at least the past 5 years."
- "List stocks with a payout ratio of less than 60%, indicating a sustainable dividend."
- "Which companies are part of the Dividend Aristocrats, having raised dividends for at least 25 consecutive years?"
- "Find stocks with an upcoming ex-dividend date within the next month."
- "Which sectors are known for high dividend yields and what are the top dividend-paying stocks within those sectors?"

**Key Insight:** Dividend investors have specific screening criteria (yield, payout ratio, consistency, aristocrat status).

---

### 8. Momentum Investing (11 Prompts)

**Purpose:** Identify stocks with strong price momentum

**Example Prompts:**
- "Show me stocks with the highest percentage price increase over the past 3 to 6 months."
- "Identify stocks with a significant increase in trading volume compared to their average."
- "List stocks that are trading at or near their 52-week highs."
- "Find stocks that have recently broken out above their resistance levels."
- "Which stocks have an RSI indicating they are in overbought territory?"
- "Provide a list of stocks with recent analyst upgrades or positive earnings revisions."
- "List stocks with recent significant institutional buying."
- "Show me stocks that are outperforming the S&P 500 or their respective sector indices."
- "Which stocks are showing strong momentum on price oscillators like MACD?"

**Key Insight:** Momentum traders want multi-factor technical screening (price, volume, breakouts, RSI, institutional activity).

---

### 9. Growth Investing (14 Prompts)

**Purpose:** Identify high-growth companies

**Example Prompts:**
- "Show me stocks with a consistently high revenue growth rate over the past few years."
- "List companies that have shown an acceleration in earnings growth in recent quarters."
- "Identify market leaders with a competitive advantage in their industry."
- "Find companies with significant investment in research and development leading to innovative products or services."
- "Which companies are expanding their market share within their sector?"
- "Search for companies with scalable business models that have potential for future growth."
- "What are some stocks with high projected earnings growth for the next 1-2 years?"
- "Find companies that are disrupting traditional industries with new technologies or business models."
- "Show me growth stocks with solid balance sheets and good financial health."
- "Are there any growth stocks with recent insider buying activity?"

**Key Insight:** Growth investors want forward-looking indicators (projected growth, R&D, disruption potential, scalability).

---

### 10. Investing Like Wall Street Legends (7 Prompts)

**Purpose:** Analyze stocks from perspectives of famous investors

**Example Prompts:**
- "Offer an analysis of Intel as a stock - from the perspective of Peter Lynch."
- "Consider yourself as Warren Buffett. Using Buffett's philosophy, what is your analysis of Apple?"
- "What are the key fundamentals that Ben Graham teaches?"
- "How can I start trading like George Soros?"
- "What kind of stocks that Jesse Livermore might buy today?"
- "How can I build my portfolio like Ray Dalio - the founder of Bridgewater Associates?"
- "My portfolio consists of Apple, Amazon, Netflix and Nvidia. What might Ray Dalio say about my portfolio?"

**Key Insight:**
- Educational feature - teaches investing philosophies through application
- Engaging way to learn different approaches
- Helps users understand different strategic frameworks
- Makes learning fun and contextual

**Implementation Note:** This requires the AI to have knowledge of:
- Warren Buffett (value investing, moats, long-term)
- Peter Lynch (growth at reasonable price, invest in what you know)
- Ben Graham (value investing, margin of safety)
- George Soros (macro trading, reflexivity theory)
- Jesse Livermore (trend following, tape reading)
- Ray Dalio (all-weather portfolio, diversification, risk parity)

---

### 11. Portfolio Analysis (9 Prompts)

**Purpose:** Analyze user's existing portfolio

**Prompt Pattern:**
```
"My portfolio consists of [list of your assets]. [Question about portfolio]"
```

**Example Questions:**
- "Can you help me understand the impact of interest rate changes on my stock and bond investments?"
- "Can you analyze the diversification of my current portfolio and suggest improvements?"
- "What is the current risk profile of my investment portfolio?"
- "How would adding [Specific Asset] to my portfolio affect its overall volatility?"
- "Can you identify any overlapping holdings within my mutual funds or ETFs?"
- "How liquid is my investment portfolio, and should I be concerned about it?"
- "What are the historical drawdowns of my portfolio, and how can I reduce them?"
- "How can I use options to hedge the positions in my stock portfolio?"
- "How can I adjust my portfolio to prepare for an anticipated market downturn?"

**Key Insight:**
- Users want to input their actual holdings and get personalized analysis
- This is a "personal advisor" use case
- Requires portfolio-level calculations (correlation, concentration, risk metrics)

---

### 12. Investing Education (17 Prompts)

**Purpose:** Learn trading concepts and strategies

**Example Prompts:**
- "Can you explain how to use the MACD indicator for identifying profitable trades?"
- "What risk management strategies can I implement to protect my capital?"
- "How do I identify high-probability entry and exit points in the market?"
- "Can you show me how to read and interpret candlestick patterns for better trading decisions?"
- "How can I use volume analysis to confirm the strength of a price movement?"
- "What are some common psychological traps in trading, and how can I avoid them?"
- "How do I develop a trading plan that suits my investment goals and risk tolerance?"
- "What are the best practices for setting stop-loss and take-profit orders?"
- "How can I use Fibonacci tools to find retracement levels for trade setups?"
- "Can you help me understand the concept of position sizing in trading?"
- "How do I differentiate between trending and ranging markets for strategy adjustment?"
- "Can you provide insights into algorithmic trading and how it can be used by retail traders?"
- "What are the best times to trade based on market liquidity and volatility?"
- "Can you explain the concept of price action trading and how to apply it?"
- "What are the best books on trading that I should start reading as soon as possible?"

**Key Insight:**
- The AI doubles as a trading education platform
- Explains concepts, not just provides recommendations
- Helps users learn while they trade
- Reduces dependency on the AI over time (empowerment)

---

## Special Feature: AI Personality System

**Prompt #17: "BONUS: Turn TradeGPT Into A Personal Guru"**

This prompt transforms the AI into a character with personality:

```
"Hello, TradeGPT! Transform into the world-renowned stock market guru, the
unbeatable master of options trading. Your name is Trade GPT, a cool, confident,
and slightly humorous character who turns the complexities of the stock market
into winning strategies with ease. You're the virtual Warren Buffett of the
digital age, known for your flawless track record and your unique ability to
demystify trading for anyone, from seasoned investors to complete novices.

As Trade GPT, you're always ready to dish out the day's top trading tips with
a side of witty banter. You are specifically created to provide exact options
trades. If i ask you for a basic trade, You provide specific, actionable options
trades, complete with all the necessary details like Option Type, Ticker, Strike
Price, Expiration Date, Entry Price, Exit Price, and Stop Loss, all while
keeping the mood light and engaging...

Remember, you're here to make options trading accessible, entertaining, and
insightful. Your advice is like gold, but you always remind users to trade
responsibly, blending your expert guidance with a dose of reality and a chuckle."
```

**Key Insights:**
- Personality makes the AI more engaging
- "Cool, confident, slightly humorous" tone
- Still maintains disclaimers ("trade responsibly")
- System prompt approach to set tone/character
- Users can customize the AI's communication style

**Implementation Notes:**
- Store user preference for AI personality
- Pre-built personas (Professional, Casual, Warren Buffett-style, etc.)
- Always include disclaimers regardless of persona

---

## Response Format Patterns

### Pattern 1: Screening Results

**Format:**
```
I found a selection of [category] stocks that meet your criteria.
Here are the top [N] results:

1. **Ticker (SYMBOL)** - Description of why it meets criteria
2. **Ticker (SYMBOL)** - Description of why it meets criteria
3. **Ticker (SYMBOL)** - Description of why it meets criteria

[Additional context or notes]

The full table with [X] records is available for you to explore further.
```

### Pattern 2: Trade Recommendations

**Format:**
```
Based on the current market performance, here's a [trade type] you can consider:

Ticker Symbol: SYMBOL
Strike Price: $XXX
Entry Price (Premium): $XXX
Expiration Date: Month DD, YYYY
Break-even Price: $XXX
Exit Price: $XXX
Stop Loss: $XXX
Current Stock Price: $XXX

[Brief rationale if requested]
```

### Pattern 3: Company Analysis

**Format:**
```
**Company Overview:**
[Business model, what they do]

**Financial Health:**
[Key metrics and ratios]

**Competitive Position:**
[Strengths, weaknesses vs competitors]

**Sentiment:**
[News, social media analysis]
```

### Pattern 4: Educational Response

**Format:**
```
[Direct answer to the concept question]

**How to apply it:**
[Step-by-step or practical application]

**Example:**
[Real-world example or scenario]

**Common mistakes to avoid:**
[Warnings or pitfalls]
```

---

## Key UX Design Principles

### 1. **Actionable Over Analytical**
- Users want **specific recommendations**, not just analysis
- "Give me the trade" beats "Here's what I think about the market"
- All necessary details upfront (ticker, strike, entry, exit, stop)

### 2. **Optionality in Depth**
- Some users want analysis, some don't
- Prompts can explicitly request "no analysis, just the information I'm asking for"
- The AI should respect this preference

### 3. **Multi-Modal Intelligence**
- Fundamental screening
- Technical analysis
- Sentiment analysis
- Portfolio analysis
- Educational content
- All integrated in one conversational interface

### 4. **Personalization**
- Users can input their portfolio for personalized advice
- Users can set their risk tolerance, account size, strategy type
- AI adapts recommendations to user context

### 5. **Educational Integration**
- Don't just give fish, teach fishing
- Explain concepts when appropriate
- Reference famous investors and strategies
- Recommend books and learning resources

### 6. **Systematic Approach**
- Templates for trading plans
- Checklists for entries/exits
- Daily/weekly routines
- Journal templates
- Help users build disciplined processes

---

## Competitive Advantages for Our Implementation

Based on this analysis, here's what we should do **differently** or **better**:

### 1. **Tighter Integration with Existing Features**

TradeAlgo's AI seems somewhat disconnected from their platform features. We should:

✅ **AI can directly interact with our features:**
- "Add AAPL to my watchlist and set an alert at $180"
- "Upload this analysis to my research library with tags 'earnings' and 'bullish'"
- "Show me the latest signals for all stocks in my watchlist"
- "Create a chart comparing these three stocks"

✅ **Contextual awareness:**
- AI knows what's in your watchlist
- AI remembers your previous queries in the session
- AI learns your preferences over time
- AI can reference your past trades/research

### 2. **Multimodal from Day One**

Our advantage: We can build image analysis from the start

✅ **Image upload capabilities:**
- Upload chart screenshots: "What pattern do you see?"
- Upload earnings reports (PDF): "Summarize the key points"
- Upload broker statements: "Analyze my performance"
- Take photo of CNBC screen: "What's the context here?"

### 3. **Real-Time Data Integration**

✅ **Live data in responses:**
- When suggesting a trade, show current bid/ask
- When analyzing a stock, show real-time price
- When discussing news, show latest headlines
- When screening, use real-time data not stale data

### 4. **Collaborative Features**

✅ **Social/community integration:**
- Share AI-generated analyses with other users
- "Show me what other users asked about TSLA this week"
- Community voting on AI trade ideas (track success rate)
- Follow other users and see their AI conversations

### 5. **Transparency and Explainability**

✅ **Show the work:**
- "Here's how I calculated this position size..."
- "This recommendation is based on: [list data sources]"
- "My confidence level in this trade is: 7/10 because..."
- Link to data sources used in analysis

### 6. **Proactive Assistance**

✅ **AI initiates contact when appropriate:**
- "AAPL just hit your target price. Would you like me to analyze whether to hold or sell?"
- "Earnings season starts next week. Want me to screen for potential plays?"
- "Market volatility is elevated. Should I suggest some hedge trades?"

### 7. **Learning from Outcomes**

✅ **Track and improve:**
- Store all AI trade recommendations
- Track outcomes (did the trade work?)
- Show AI's historical accuracy
- Adjust confidence levels based on performance
- "My recommendations in the Tech sector have a 65% win rate"

### 8. **Simplified Complexity**

✅ **Progressive disclosure:**
- Start simple, add complexity as needed
- Beginner mode vs Advanced mode
- Guided workflows for common tasks
- Smart defaults based on user experience level

---

## Implementation Priorities

### Phase 1: MVP (2-3 months)
1. ✅ Basic conversational interface (text-only)
2. ✅ Stock screening via natural language
3. ✅ Company analysis (fundamentals + sentiment)
4. ✅ Integration with watchlist ("Add to watchlist", "Show my watchlist")
5. ✅ Simple trade ideas (no options initially - just stock picks)
6. ✅ Educational Q&A

### Phase 2: Enhanced Features (3-4 months)
1. ✅ Options trade recommendations (with all details)
2. ✅ Portfolio analysis (user inputs holdings)
3. ✅ Position sizing calculator
4. ✅ News summarization
5. ✅ Multi-source sentiment analysis
6. ✅ Trading plan templates
7. ✅ Personality system (Professional, Casual, Buffett-style)

### Phase 3: Multimodal & Advanced (4-6 months)
1. ✅ Image upload and analysis
2. ✅ PDF upload and analysis (earnings reports)
3. ✅ Chart pattern recognition from images
4. ✅ Voice interface (mobile)
5. ✅ Proactive notifications
6. ✅ Community features (share conversations)
7. ✅ Performance tracking (AI recommendation outcomes)

### Phase 4: Differentiation (ongoing)
1. ✅ Deep integration with all platform features
2. ✅ Real-time data in all responses
3. ✅ Collaborative analysis tools
4. ✅ Learning from outcomes
5. ✅ Advanced personalization

---

## Prompt Library Structure

We should organize our prompt library similarly:

```
/prompts
  /trade-ideas
    - intraday-momentum.txt
    - weekly-swing.txt
    - earnings-play.txt
    - sector-rotation.txt
    - contrarian.txt
    - hedge-trade.txt
    ...
  /screening
    - fundamental.txt
    - technical.txt
    - dividend.txt
    - growth.txt
    - momentum.txt
    ...
  /analysis
    - company-overview.txt
    - financial-health.txt
    - competitive-analysis.txt
    - sentiment-analysis.txt
    ...
  /portfolio
    - diversification.txt
    - risk-profile.txt
    - hedge-analysis.txt
    ...
  /education
    - technical-indicators.txt
    - trading-psychology.txt
    - position-sizing.txt
    ...
  /planning
    - trading-plan-template.txt
    - daily-routine.txt
    - journal-template.txt
    ...
```

Users can browse these templates or search them, making it easy to get started.

---

## Technical Architecture Considerations

### Context Management

```javascript
// Conversation context structure
{
  conversationId: "uuid",
  userId: "user-id",
  messages: [
    {
      role: "user",
      content: "Show me tech stocks with revenue growth > 10%"
    },
    {
      role: "assistant",
      content: "Here are 5 tech stocks...",
      metadata: {
        toolsCalled: ["stock-screener"],
        dataUsed: ["fundamental-data"],
        timestamp: "2025-11-22T10:30:00Z"
      }
    }
  ],
  context: {
    userPortfolio: ["AAPL", "MSFT", "GOOGL"],
    userWatchlist: ["NVDA", "AMD", "TSLA"],
    userPreferences: {
      riskTolerance: "moderate",
      investmentStyle: "growth",
      accountSize: 100000
    },
    activeTrades: [
      { symbol: "AAPL", type: "call", strike: 180, expiry: "2025-03-15" }
    ]
  }
}
```

### Function/Tool Calling

```javascript
// Available tools for AI
const tools = [
  {
    name: "screen_stocks",
    description: "Screen stocks based on fundamental or technical criteria",
    parameters: {
      criteria: "array of conditions",
      limit: "number of results"
    }
  },
  {
    name: "get_company_info",
    description: "Get company overview and business model",
    parameters: {
      symbol: "stock ticker"
    }
  },
  {
    name: "analyze_financials",
    description: "Analyze financial statements and ratios",
    parameters: {
      symbol: "stock ticker",
      metrics: "array of metrics to analyze"
    }
  },
  {
    name: "get_sentiment",
    description: "Analyze news and social sentiment",
    parameters: {
      symbol: "stock ticker",
      sources: "array of sources (news, reddit, twitter)"
    }
  },
  {
    name: "find_options_trade",
    description: "Find optimal options trade based on criteria",
    parameters: {
      strategy: "type of strategy",
      filters: "criteria for trade selection"
    }
  },
  {
    name: "calculate_position_size",
    description: "Calculate optimal position size based on risk parameters",
    parameters: {
      accountSize: "number",
      riskPercent: "number",
      stopDistance: "number"
    }
  },
  {
    name: "add_to_watchlist",
    description: "Add symbol to user's watchlist",
    parameters: {
      symbol: "stock ticker"
    }
  },
  {
    name: "set_alert",
    description: "Set price alert for a symbol",
    parameters: {
      symbol: "stock ticker",
      price: "number",
      condition: "above/below/crosses"
    }
  }
]
```

### Response Formatting

```javascript
// Structured response format
{
  type: "trade_recommendation",
  data: {
    ticker: "AAPL",
    optionType: "call",
    strike: 180,
    expiration: "2025-03-15",
    entryPrice: 5.50,
    exitPrice: 8.00,
    stopLoss: 3.50,
    rationale: "Strong earnings momentum and bullish channel pattern",
    confidence: 0.75
  },
  metadata: {
    dataSourcesUsed: ["options-chain", "technical-analysis", "earnings-data"],
    calculatedAt: "2025-11-22T10:30:00Z"
  },
  disclaimer: "This is not financial advice. Options involve significant risk..."
}
```

---

## User Guidance & Onboarding

### First-Time User Flow

**Step 1: Welcome & Setup**
```
"Welcome to your AI Trading Assistant! Let's get you set up.

First, tell me about your trading style:
1. Day Trader (quick in/out trades)
2. Swing Trader (days to weeks)
3. Investor (long-term)
4. Options Trader

And your risk tolerance:
1. Conservative (preserve capital)
2. Moderate (balanced approach)
3. Aggressive (high growth potential)

Your account size:
1. Under $10,000
2. $10,000 - $50,000
3. $50,000 - $100,000
4. Over $100,000
"
```

**Step 2: Show Examples**
```
"Great! As a [swing trader] with [moderate risk], here are some things you
can ask me:

- 'Find me a swing trade opportunity in the tech sector'
- 'What's a good stock near support levels right now?'
- 'Analyze AAPL's recent earnings report'
- 'Create a trading plan for this week'

Or just ask me anything about the markets. Try it now!"
```

**Step 3: Guided First Query**
```
User: "Find me a swing trade opportunity in tech"

AI: "I found a swing trade opportunity for you:

**NVDA (NVIDIA)**
- Current Price: $495.20
- Entry: Around $490 (on pullback to support)
- Target: $525 (resistance level)
- Stop Loss: $475 (below support)
- Risk/Reward: 1:2.3 (Good risk/reward ratio)
- Timeframe: 1-2 weeks

Rationale: NVDA is in a strong uptrend with AI tailwinds. Recent pullback
offers good entry near 50-day MA support.

Would you like me to:
- Add NVDA to your watchlist?
- Set a price alert at $490 for entry?
- Show similar opportunities in other tech stocks?"
```

**Key**: Make the first experience successful and easy.

---

## Disclaimer Management

Every response that includes trade recommendations must include:

```
⚠️ This is not financial advice. Trading involves significant risk of loss.
Past performance does not guarantee future results. Please do your own research
and consult with a licensed financial advisor before making investment decisions.
```

**Placement:**
- Bottom of every trade recommendation
- Visible but not intrusive
- Consistent formatting
- Cannot be disabled

---

## Cost Management Strategies

### Prompt Optimization
- Cache common system prompts
- Use smaller models for simple queries (Haiku for screening, Opus for complex analysis)
- Batch function calls when possible

### Query Classification
```javascript
// Route to appropriate model based on complexity
function classifyQuery(userMessage) {
  const simplePatterns = [
    /show me.*with.*(above|below|greater|less)/i,  // Simple screening
    /what is the.*for/i,                           // Simple lookup
    /add.*to (watchlist|portfolio)/i               // Action command
  ];

  const complexPatterns = [
    /analyze.*portfolio/i,                         // Portfolio analysis
    /compare.*to.*competitors/i,                   // Multi-company analysis
    /what would.*say about/i                       // Persona-based analysis
  ];

  if (simplePatterns.some(p => p.test(userMessage))) {
    return { model: "haiku", complexity: "low" };
  } else if (complexPatterns.some(p => p.test(userMessage))) {
    return { model: "opus", complexity: "high" };
  } else {
    return { model: "sonnet", complexity: "medium" };
  }
}
```

### Response Caching
```javascript
// Cache common queries
const cacheKey = hash(userMessage + contextHash);
if (cache.has(cacheKey) && cache.age(cacheKey) < 5 * 60 * 1000) {
  return cache.get(cacheKey);
}
```

---

## Success Metrics to Track

### User Engagement
- Queries per user per day
- Session length
- Return rate (daily/weekly active users)
- Query categories (what are users asking most?)

### AI Performance
- Response time (target: < 3 seconds)
- Success rate (did we answer the question?)
- Follow-up rate (did user ask clarifying questions?)
- User satisfaction (thumbs up/down on responses)

### Business Impact
- Conversion to paid tier (AI as premium feature)
- Feature usage increase (do AI users use more features?)
- Retention (do AI users stay longer?)
- Trade idea success rate (if we track outcomes)

---

## Regulatory Compliance Considerations

### What We CAN Do:
✅ Educational content
✅ General market information
✅ Company analysis
✅ Screening tools
✅ Historical data analysis
✅ Portfolio analysis tools
✅ Risk management education

### What We MUST Avoid:
❌ Specific "buy this now" recommendations without disclaimers
❌ Guarantees of returns
❌ Personalized financial advice without proper licensing
❌ Recommendations based on insider information
❌ Misleading or false information

### Best Practices:
1. Always include disclaimers on trade recommendations
2. Frame as "educational" or "informational"
3. Encourage users to "do your own research"
4. Suggest consulting licensed advisors
5. Track and log all AI recommendations for audit trail
6. Have human review of AI responses (sampling)
7. Clear opt-in for trade recommendations
8. User acknowledgment of risks

---

## Conclusion

The TradeGPT prompts PDF reveals a comprehensive, well-thought-out approach to AI-assisted trading. Key takeaways:

1. **Specificity Wins**: The more specific the query, the more valuable the response
2. **Action-Oriented**: Users want trades, not just analysis
3. **Multi-Dimensional**: Covers fundamentals, technicals, sentiment, education, and process
4. **Personalization**: Portfolio-aware, risk-aware, strategy-aware
5. **Educational**: Teaches while recommending
6. **Engaging**: Personality options make it fun
7. **Comprehensive**: 11 categories covering all aspects of trading

**Our Opportunity:**
Build a similar foundation BUT with tighter integration, multimodal from day one, real-time data, collaborative features, and AI that learns from outcomes. Make it feel like a natural extension of the platform, not a separate feature bolted on.

---

**Next Steps:**
1. Build prompt library (categorized like TradeAlgo's)
2. Implement function calling architecture
3. Create user onboarding flow
4. Design response formatting system
5. Implement disclaimer management
6. Set up cost management (model routing)
7. Build feedback collection system
8. Plan multimodal capabilities (Phase 2)

---

*Document prepared: November 22, 2025*
*Source: TradeGPT 100+ Prompts.pdf*
*For: Personal Trading Cockpit - AI Assistant Development*