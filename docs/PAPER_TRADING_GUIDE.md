# Paper Trading Integration Guide

## Overview

The paper trading feature allows you to test your market scanner recommendations in a risk-free Alpaca paper trading account. This integration validates your trading strategy before deploying real capital.

## Features

✅ **One-Click Execution** - Trade directly from recommendation cards
✅ **Automatic Position Sizing** - Risk-based share calculation (1% account risk default)
✅ **Trade Validation** - Pre-flight checks before order placement
✅ **Real-Time Feedback** - Toast notifications with trade details
✅ **Risk Management** - Built-in stop loss and target price validation

## How It Works

### 1. Position Sizing Algorithm

The system automatically calculates the optimal number of shares based on:

```
Position Size = (Account Equity × Risk %) / (Entry Price - Stop Loss)
```

**Example:**
- Account Equity: $100,000
- Risk Per Trade: 1% ($1,000)
- Entry Price: $150.00
- Stop Loss: $145.00
- Risk Per Share: $5.00

**Calculation:**
```
Shares = $1,000 / $5.00 = 200 shares
Cost Basis = 200 × $150.00 = $30,000
```

### 2. Trade Validation

Before placing any order, the system validates:

- ✅ Entry price is between stop and target
- ✅ Stop loss is below entry for longs (above for shorts)
- ✅ Target is above entry for longs (below for shorts)
- ✅ Sufficient buying power (2x account equity for margin)
- ✅ Minimum 2:1 risk/reward ratio
- ✅ At least 1 share can be purchased

### 3. Order Execution Flow

```
User Clicks "Paper Trade"
  ↓
Calculate Position Size
  ↓
Validate Trade Parameters
  ↓
Display Trade Summary (console + toast)
  ↓
Log Alpaca Order Details
  ↓
Ready for MCP Execution
```

## Usage

### From Recommendations Page

1. **Navigate** to `/recommendations`
2. **Find** a high-confidence setup (score 75+)
3. **Click** "Paper Trade" button
4. **Review** trade details in console and toast notification
5. **Execute** via Alpaca MCP (see MCP Integration below)

### Trade Details Logged

When you click "Paper Trade", the following is logged to console:

```javascript
{
  symbol: "AAPL",
  side: "buy", // or "sell" for shorts
  quantity: 200,
  order_type: "limit",
  limit_price: 150.00,
  time_in_force: "day"
}
```

## MCP Integration

### Current Implementation (Phase 1)

The paper trading feature **prepares** orders but does not execute them automatically. This is by design for safety.

**Why?**
- Prevents accidental order placement
- Allows manual review before execution
- Requires explicit user confirmation via Claude Code

### Executing via Alpaca MCP

To actually place the order, you'll need to:

1. **Review the logged order details** in the console
2. **Confirm the trade** looks correct
3. **Ask Claude Code** to execute via MCP:

```
"Execute this paper trade for AAPL: buy 200 shares at limit $150.00"
```

Claude Code will then call:
```typescript
mcp__alpaca__place_stock_order({
  symbol: "AAPL",
  side: "buy",
  quantity: 200,
  order_type: "limit",
  limit_price: 150.00,
  time_in_force: "day"
})
```

### Future Enhancement (Phase 2)

**Planned:** Auto-execution with confirmation dialog

```typescript
// Future implementation
const result = await mcp__alpaca__place_stock_order({...});

if (result.success) {
  toast({
    title: "✅ Order Placed",
    description: `${result.order_id} - ${shares} shares of ${symbol}`
  });
}
```

## Risk Management Settings

### Default Settings

Located in `app/recommendations/page.tsx:42-45`

```typescript
const { executePaperTrade } = usePaperTrade({
  accountEquity: 100000,  // $100k paper account
  riskPercent: 1,         // Risk 1% per trade
});
```

### Adjusting Risk Parameters

**Conservative (0.5%)** - Smaller positions, less volatility
```typescript
riskPercent: 0.5
```

**Moderate (1%)** - Default balanced approach
```typescript
riskPercent: 1
```

**Aggressive (2%)** - Larger positions, higher risk
```typescript
riskPercent: 2
```

**Never exceed 2% risk per trade** - This is a hard rule in professional trading.

## Files & Architecture

### Core Files

| File | Purpose |
|------|---------|
| `lib/paperTrade.ts` | Position sizing & validation logic |
| `hooks/use-paper-trade.ts` | React hook for trade execution |
| `app/recommendations/page.tsx` | Integration with recommendations UI |
| `components/RecommendationCard.tsx` | "Paper Trade" button component |

### Key Functions

**`calculatePositionSize()`** - Risk-based share calculation
**`validateTrade()`** - Pre-flight trade validation
**`formatTradeSummary()`** - Human-readable trade summary
**`executePaperTrade()`** - Main execution handler (hook)

## Testing

### Test with Scanner Recommendations

1. **Generate test data:**
   ```bash
   npm run test-populate
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Navigate to:** `http://localhost:3000/recommendations`

4. **Click "Paper Trade"** on any recommendation

5. **Check console** for trade details:
   ```
   📊 Paper Trade Summary
   Symbol: AAPL
   Shares: 200
   Entry: $150.00
   Stop: $145.00
   Target: $160.00
   Cost Basis: $30,000.00
   Dollar Risk: $1,000.00 (1% of account)
   Potential Gain: $2,000.00
   Risk/Reward: 2.00:1
   ```

### Manual Test Cases

**Test 1: High Score Long**
- Symbol: AAPL
- Type: Long
- Entry: $150, Stop: $145, Target: $160
- Expected: ~200 shares, $30k cost basis

**Test 2: Short Setup**
- Symbol: TSLA
- Type: Short
- Entry: $200, Stop: $210, Target: $180
- Expected: ~100 shares, $20k cost basis

**Test 3: High Risk (Score < 50)**
- Any recommendation with score < 50
- Expected: Trade validates but shows risk warning

**Test 4: Invalid Parameters**
- Manually create trade with stop > entry for long
- Expected: Validation error toast

## Monitoring & Analytics

### Console Logs

All paper trades are logged with:
- ✅ Trade summary (formatted)
- ✅ Order details (JSON)
- ✅ Position size calculation
- ✅ Risk/reward metrics

### Future Dashboard (Planned)

- Total paper trades executed
- Win rate vs scanner predictions
- Average hold time vs expected timeframe
- P/L tracking by setup type
- Confidence level performance correlation

## Troubleshooting

### "Trade Validation Failed"

**Cause:** Invalid price relationships
**Fix:** Check that:
- Stop is below entry for longs
- Target is above entry for longs
- Opposite for shorts

### "Insufficient Buying Power"

**Cause:** Position size exceeds account equity × 2
**Fix:** Reduce risk % or check account equity setting

### "Position size calculation failed"

**Cause:** Entry and stop prices are identical
**Fix:** Ensure scanner provides valid stop loss levels

### Toast Not Appearing

**Cause:** Toaster not mounted
**Fix:** Verify `<Toaster />` is in `app/layout.tsx:25`

## Best Practices

### 1. Start Conservative
- Begin with 0.5% risk per trade
- Test 10-20 trades before increasing
- Track results in spreadsheet

### 2. Follow Scanner Confidence
- **High (75+):** Full position size
- **Medium (60-74):** 50% position size
- **Low (<60):** Skip or micro position

### 3. Use Limit Orders
- Default is limit orders at scanner entry price
- Protects against slippage
- May require manual adjustment if price moved

### 4. Monitor Execution
- Check Alpaca dashboard after each trade
- Verify fills at expected prices
- Track open positions

### 5. Review Daily
- Compare actual fills to scanner predictions
- Identify patterns in successful setups
- Adjust filters and scoring weights

## Next Steps

1. ✅ **Implemented:** Paper trade button + validation
2. 🔄 **In Progress:** MCP auto-execution
3. 📋 **Planned:** Performance dashboard
4. 📋 **Planned:** Auto-execute high confidence (75+) trades
5. 📋 **Planned:** Position management UI (close, adjust stop)

## Resources

- **Alpaca MCP Docs:** `docs/ALPACA_MCP_SETUP.md`
- **Position Sizing:** `lib/paperTrade.ts`
- **Risk Management:** `lib/scoring/README.md`
- **Scanner Spec:** `MARKET_SCANNER_SPEC.md`

---

**Remember:** Paper trading is for validation only. Never risk real capital without thorough backtesting and paper trading verification. The goal is to prove your strategy works before going live.
