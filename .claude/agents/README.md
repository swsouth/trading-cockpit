# Sub-Agent Usage Protocol

This document defines when to invoke specialized sub-agents vs. handling tasks directly, to optimize for both quality and efficiency (token usage, latency).

## Core Principle: Use Agents Sparingly

**Default behavior**: Handle most tasks directly without spawning agents.

**Invoke agents only when**:
1. Task requires deep domain expertise beyond general knowledge
2. Task is complex enough to justify the overhead (multi-step analysis, comprehensive review)
3. Output requires formal structure/deliverables (reports, specifications, checklists)
4. Risk of error is high without specialized knowledge

---

## Agent Invocation Decision Tree

### 🔵 Market Data & Integrity Agent

**INVOKE when:**
- ✅ Investigating data anomalies affecting multiple symbols or time periods
- ✅ Designing data pipeline for new vendor/exchange integration
- ✅ Suspected corporate action errors (splits, dividends) requiring forensic analysis
- ✅ Creating formal data quality framework or SLA monitoring system
- ✅ Data version divergence causing backtest discrepancies (needs diff analysis)
- ✅ Building reproducible data snapshots for audit/compliance

**HANDLE DIRECTLY when:**
- ❌ Simple data fetch or single symbol validation ("Is AAPL data current?")
- ❌ Basic OHLCV data structure questions
- ❌ Single missing bar or small gap (straightforward query issue)
- ❌ General questions about data vendors ("Does Alpaca have crypto data?")
- ❌ Reading/explaining existing data quality reports

**Examples:**
- ❌ Direct: "What's the latest AAPL close price?" → Simple query, no agent needed
- ✅ Agent: "Validate all S&P 500 data for the last 2 years; identify splits, gaps, and anomalies; provide health report" → Complex, multi-symbol, formal deliverable
- ❌ Direct: "How do I handle stock splits in my code?" → General guidance, no agent
- ✅ Agent: "Build split adjustment pipeline for our historical database with versioning and rollback" → System design, needs formal spec

---

### 🟢 Strategy & Signal Engineering Agent

**INVOKE when:**
- ✅ Converting trading concept into formal, production-ready signal specification
- ✅ Designing multi-factor signal with regime filters, pre-trade checks, and position sizing
- ✅ Building comprehensive unit test suite for signal logic
- ✅ Creating signal suppression rules with edge case handling
- ✅ Translating research findings into deployable code with full documentation
- ✅ Designing position sizing formulas with caps and volatility adjustments

**HANDLE DIRECTLY when:**
- ❌ Conceptual discussion of indicators ("How does RSI work?")
- ❌ Simple signal logic questions ("Should I use 20 or 50 period SMA?")
- ❌ Basic parameter recommendations for common indicators
- ❌ Explaining existing signal specs or code
- ❌ Quick pre-trade check suggestions (can provide directly)

**Examples:**
- ❌ Direct: "What's a good stop-loss for swing trading?" → General guidance
- ✅ Agent: "Create a complete signal spec for volatility breakout strategy with Bollinger Bands, volume filters, ATR-based stops, and regime detection" → Full specification needed
- ❌ Direct: "Should I add ADX to my trend-following signal?" → Straightforward recommendation
- ✅ Agent: "Design regime classification system using ADX, volatility, and trend structure; integrate with existing signal pipeline" → Complex system design

---

### 🟣 Research & Backtesting Scientist Agent

**INVOKE when:**
- ✅ Formal strategy validation with OOS testing, walk-forward analysis, and go/no-go decision
- ✅ Comprehensive overfitting analysis with parameter sensitivity testing
- ✅ Designing research protocol for new hypothesis with sample splits and bias checks
- ✅ Full distributional risk analysis (drawdowns, tail risk, regime stress tests)
- ✅ Investigating significant backtest performance divergence (requires forensic analysis)
- ✅ Creating formal evidence brief for strategy deployment decision

**HANDLE DIRECTLY when:**
- ❌ Interpreting single performance metric ("Is Sharpe 1.5 good?")
- ❌ Basic backtest results explanation
- ❌ Simple bias questions ("What is look-ahead bias?")
- ❌ Rough directional guidance on strategy viability
- ❌ Reading/summarizing existing backtest reports

**Examples:**
- ❌ Direct: "My strategy has 60% win rate. Is that good?" → Simple interpretation
- ✅ Agent: "Validate my EMA crossover strategy: run OOS tests, check for overfitting, model transaction costs, analyze drawdowns, provide go/no-go recommendation" → Comprehensive validation
- ❌ Direct: "What's the difference between in-sample and out-of-sample testing?" → Educational explanation
- ✅ Agent: "Design 10-year walk-forward test framework with rolling windows for my mean-reversion strategy; include Monte Carlo simulation" → Complex protocol design

---

### 🔴 Trading Specialist SME Agent

**INVOKE when:**
- ✅ Generating trade recommendations with full setup (entry, stop, target, sizing, caveats)
- ✅ Comprehensive feature review (viability, feasibility, functionality, value) with RICE scoring
- ✅ Deep technical analysis across multiple timeframes with regime assessment
- ✅ Reviewing backtest for robustness, bias risks, and deployment readiness
- ✅ Complex risk management scenario analysis (correlation, concentration, stress tests)
- ✅ Translating advanced TA concepts into actionable user guidance

**HANDLE DIRECTLY when:**
- ❌ Simple indicator explanations or calculations
- ❌ Basic trading terminology definitions
- ❌ General market commentary without specific trade setup
- ❌ Straightforward feature questions ("Should we add price alerts?")
- ❌ Basic risk management principles (position sizing formulas, stop-loss concepts)

**Examples:**
- ❌ Direct: "What's a good risk percentage per trade?" → Standard guidance (1-2%)
- ✅ Agent: "Analyze TSLA for swing trade opportunities; provide full setup with confidence rating, regime assessment, and position sizing for $50K account" → Complete trade analysis
- ❌ Direct: "Should we add a volatility filter?" → General recommendation
- ✅ Agent: "Review our new multi-indicator screener feature for viability, feasibility, functionality, and value; provide RICE score and deployment recommendations" → Formal feature review

---

## Efficiency Guidelines

### 1. Batch Related Tasks

Instead of invoking agents multiple times for related tasks, batch them:

**❌ Inefficient:**
```
User: "Validate AAPL data"
[Agent invoked]
User: "Now validate TSLA data"
[Agent invoked again]
User: "And GOOGL"
[Agent invoked third time]
```

**✅ Efficient:**
```
User: "Validate AAPL, TSLA, and GOOGL data for the last 90 days"
[Single agent invocation handles all three]
```

### 2. Use Direct Answers for Quick Questions

Most questions can be answered directly without agents:
- Indicator calculations
- Basic strategy concepts
- Feature suggestions
- Simple debugging help
- General trading education

### 3. Escalate to Agents for Deliverables

Invoke agents when you need formal outputs:
- Specification documents
- Health/validation reports
- Go/No-Go decision memos
- Test frameworks
- Risk analysis reports

### 4. Consider Complexity Threshold

**Simple (handle directly)**: Single-step task, < 5 minute response, no formal structure needed

**Complex (invoke agent)**: Multi-step analysis, > 10 minute response, formal deliverable with sections/checklists

---

## Token & Latency Estimates

### Agent Size (approximate tokens)
- Market Data & Integrity: ~11,000 tokens
- Strategy & Signal Engineering: ~13,000 tokens
- Research & Backtesting Scientist: ~16,000 tokens
- Trading Specialist SME: ~9,000 tokens

### Cost Consideration
- Agent invocation adds 9K-16K tokens to context (input cost)
- Agent responses can be 1K-5K tokens (output cost)
- **Total overhead per agent**: ~10K-20K tokens

**Rule of thumb**: Only invoke agent if the value of specialized analysis exceeds the cost of ~$0.30-$0.60 per invocation (at current API rates).

### Latency Impact
- Agent spawning adds ~10-30 seconds to response time
- Use agents when thoroughness matters more than speed
- For time-sensitive questions, handle directly

---

## Quick Reference Chart

| Task Type | Complexity | Agent Needed? | Example |
|-----------|------------|---------------|---------|
| Data validation (single symbol) | Low | ❌ No | "Is AAPL data current?" |
| Data pipeline design | High | ✅ Yes | "Design Coinbase WebSocket ingestion pipeline" |
| Signal concept discussion | Low | ❌ No | "Should I use MACD?" |
| Signal spec creation | High | ✅ Yes | "Create formal spec for breakout signal with all filters" |
| Backtest result interpretation | Low | ❌ No | "Is 1.5 Sharpe good?" |
| Full strategy validation | High | ✅ Yes | "Run OOS tests, check overfitting, provide go/no-go" |
| Simple trade idea | Low | ❌ No | "What's your view on BTC?" |
| Complete trade setup | High | ✅ Yes | "Generate swing trade setup for AAPL with full risk management" |

---

## When in Doubt: Ask First

If uncertain whether to invoke an agent:

**User asks**: "Can you help me with my moving average strategy?"

**Assistant responds**: "I can help with that! To give you the most efficient answer:
- If you need general guidance on parameters or logic, I can answer directly (faster)
- If you want a complete signal specification with tests and documentation, I'll use the strategy-signal-engineering agent (more thorough but slower)

Which would be most helpful?"

This lets the user decide based on their urgency and needs.

---

## Summary: The 3 Questions Test

Before invoking an agent, ask:

1. **Is this complex enough to require deep domain expertise?**
   - No → Handle directly
   - Yes → Continue

2. **Does this need a formal deliverable (report, spec, checklist)?**
   - No → Handle directly (unless very complex)
   - Yes → Continue

3. **Is the value of specialized analysis worth ~30 seconds latency and ~$0.50 cost?**
   - No → Handle directly
   - Yes → Invoke agent

**If all 3 are "Yes" → Invoke agent. Otherwise → Handle directly.**

---

## Maintenance

Review this protocol quarterly:
- Monitor agent invocation patterns
- Identify unnecessary invocations (could have been handled directly)
- Update examples based on common use cases
- Adjust complexity thresholds as agents evolve
