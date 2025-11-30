# Alpaca MCP Quick Start Guide

**Status:** ✅ Ready to activate
**Time to Test:** 5 minutes after restart
**Priority:** HIGH - Enables validation loop

---

## What You Need to Do Now

### 1. Restart Claude Code (REQUIRED) ⚡

**Why:** MCP servers load at startup. The Alpaca server was just added and needs activation.

**How:**
1. **Save any open work**
2. **Close this Claude Code session completely**
3. **Reopen Claude Code** in this project directory
4. **Wait for startup to complete** (watch for "Ready" message)

**Expected:** No errors during startup. If Alpaca MCP loads correctly, you'll see it in available MCP servers.

---

### 2. Test Alpaca MCP Connection (5 min)

After restart, **prompt Claude Code** with exactly this:

```
Use the Alpaca MCP server to:

1. Get my account information (paper trading account)
2. Show current positions
3. Get today's 5-minute bars for AAPL
4. Show portfolio history for the last 7 days

Please format the results clearly so I can verify the MCP is working.
```

**Expected Results:**

✅ **Account Info:**
- Account number (paper)
- Buying power: ~$100,000
- Equity: ~$100,000
- Status: ACTIVE

✅ **Positions:**
- Likely empty (no trades placed yet)
- Or shows any existing paper trades

✅ **AAPL Bars:**
- Array of 5-minute OHLCV candles
- From today's market session
- Proper timestamps and price data

✅ **Portfolio History:**
- Equity values over last 7 days
- Likely flat at $100,000 if no trades

---

### 3. Test Paper Trade Placement (Optional)

If initial test passes, try placing a test trade:

```
Use Alpaca MCP to place a small paper trade:
- Symbol: AAPL
- Side: Buy
- Quantity: 1 share
- Order type: Market
- Time in force: Day

Then show me the order confirmation and current positions.
```

**Expected:**
- Order placed successfully
- Order ID returned
- Position shows 1 share of AAPL
- Buying power reduced by ~AAPL price

**To Close Test Position:**
```
Use Alpaca MCP to close the AAPL position.
```

---

## What This Unlocks

### Immediate Use Cases

**1. Paper Trading Validation Loop** ⭐⭐⭐⭐⭐
- Auto-validate every recommendation
- Track actual win rate vs predicted
- Prove your scanner works with real data
- Build user trust with verified results

**2. Better Intraday Data**
- 5-minute bars for day trading scanner
- Cleaner code (MCP vs direct API calls)
- Unified interface for stocks + crypto

**3. Options Scanner (Future)**
- Full options chain access
- Greeks (delta, gamma, theta, vega)
- Covered calls, protective puts

---

## Next Implementation Steps

Once MCP is verified working:

### Week 1: Database Setup
```sql
-- Create recommendation_feedback table
-- See: docs/ALPACA_MCP_SETUP.md for schema
```

### Week 2: Build Validator
```typescript
// lib/paperTradingValidator.ts
// Auto-place paper trades for top 10 recommendations
// Monitor and close at target/stop
```

### Week 3: Automation
```bash
# Add to package.json:
"validate-recommendations": "npx tsx scripts/placePaperTrades.ts"

# Add to GitHub Actions:
# Run after daily scanner completes
```

### Week 4: Analytics Dashboard
```
/validation page showing:
- Win rate by setup type
- Average R:R achieved
- Best performing patterns
- Equity curve from paper account
```

**Total Effort:** 6-8 hours over 3-4 sessions
**ROI:** Proves scanner works, massive trust builder

---

## Troubleshooting

### MCP Won't Load
**Error:** "Alpaca MCP server failed to start"

**Check:**
1. Python installed? (`python --version`)
2. `uv` installed? (`pip install uv`)
3. Environment variables set in `.env.local`?
4. Network connectivity?

**Fix:**
```bash
# Test credentials manually
curl -H "APCA-API-KEY-ID: YOUR_KEY" \
     -H "APCA-API-SECRET-KEY: YOUR_SECRET" \
     https://paper-api.alpaca.markets/v2/account
```

### MCP Loaded But Can't Connect
**Error:** "Unauthorized" or "Account not found"

**Check:**
1. Using paper URL with paper keys? (not production)
2. API keys valid on alpaca.markets dashboard?
3. Account activated?

---

## Documentation Reference

**Full Setup Guide:**
`docs/ALPACA_MCP_SETUP.md` (43 endpoints documented)

**Test Script:**
`scripts/testAlpacaMcp.ts` (environment verification)

**Alpaca Docs:**
https://docs.alpaca.markets/docs/alpaca-mcp-server

---

## What Success Looks Like

After successful test:

✅ Account info retrieved from paper account
✅ Positions list works (even if empty)
✅ Market data fetches successfully
✅ Portfolio history shows equity curve
✅ Ready to implement validation loop

**Next Session Priority:** Build paper trading validator

---

**TIME TO RESTART CLAUDE CODE NOW** 🚀

After restart, run the test prompts above and verify all MCP tools work correctly.
