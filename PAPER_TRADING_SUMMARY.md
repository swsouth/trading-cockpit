# Paper Trading Integration - Summary

## ✅ What's Been Implemented

### 1. Core Position Sizing (`lib/paperTrade.ts`)
- **Risk-based calculation:** Shares = (Account × Risk%) / (Entry - Stop)
- **Trade validation:** Price relationships, buying power, R:R ratio
- **Summary formatting:** Human-readable trade details

### 2. React Hook (`hooks/use-paper-trade.ts`)
- **Auto position sizing** based on account equity and risk %
- **Trade validation** before execution
- **Toast notifications** for success/failure feedback
- **Error handling** with user-friendly messages

### 3. UI Integration
- **"Paper Trade" button** on each recommendation card
- **One-click execution** from `/recommendations` page
- **Visual feedback** during trade processing
- **Responsive design** works on mobile and desktop

### 4. Testing Infrastructure
- **Unit tests:** `npm run test-paper-trade` - Validates logic
- **Test data:** `npm run test-populate` - Generates 8 recommendations
- **Type safety:** All TypeScript, passes `npm run typecheck`

## 📊 How It Works

### User Flow
```
1. User visits /recommendations
2. Finds high-confidence setup (score 75+)
3. Clicks "Paper Trade" button
4. System calculates position size (1% account risk)
5. Validates trade parameters
6. Shows toast notification with trade details
7. Logs order details to console
8. Ready for MCP execution via Claude Code
```

### Position Sizing Example
```
Account Equity: $100,000
Risk Per Trade: 1% ($1,000)
Entry Price: $150.00
Stop Loss: $145.00
Risk Per Share: $5.00

→ Shares = $1,000 / $5.00 = 200 shares
→ Cost Basis = 200 × $150 = $30,000
→ Dollar Risk = 200 × $5 = $1,000 (1% of account)
```

## 🎯 Current State (Phase 1)

**Status:** ✅ Fully Functional (Preparation Phase)

The system:
- ✅ Calculates optimal position sizes
- ✅ Validates all trade parameters
- ✅ Shows trade summary to user
- ✅ Logs Alpaca order details to console
- ⏳ Requires manual MCP execution (by design)

**Why Manual?**
- Safety first - prevents accidental orders
- Allows review before execution
- User maintains full control
- Easy to audit and debug

## 🚀 How to Execute Paper Trades

### Step 1: Prepare the Trade
```bash
npm run dev
# Navigate to http://localhost:3000/recommendations
# Click "Paper Trade" on any recommendation
```

### Step 2: Review Console Output
```javascript
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

📤 Alpaca Order Details:
{
  symbol: "AAPL",
  side: "buy",
  quantity: 200,
  order_type: "limit",
  limit_price: 150.00,
  time_in_force: "day"
}
```

### Step 3: Execute via Alpaca MCP
Ask Claude Code:
```
"Execute this paper trade for AAPL: buy 200 shares at limit $150.00"
```

Claude Code will call:
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

## 📁 Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `lib/paperTrade.ts` | Position sizing & validation | 150 |
| `hooks/use-paper-trade.ts` | React hook for trade execution | 100 |
| `app/api/paper-trade/route.ts` | API endpoint (placeholder) | 30 |
| `scripts/testPaperTrade.ts` | Unit tests | 180 |
| `docs/PAPER_TRADING_GUIDE.md` | Complete documentation | 400+ |

## 🧪 Testing Commands

```bash
# Test position sizing logic
npm run test-paper-trade

# Generate test recommendations
npm run test-populate

# Type check
npm run typecheck

# Start dev server
npm run dev
```

## 🎓 Configuration

### Default Risk Settings
Located in `app/recommendations/page.tsx:42`

```typescript
const { executePaperTrade } = usePaperTrade({
  accountEquity: 100000,  // $100k paper account
  riskPercent: 1,         // Risk 1% per trade
});
```

### Adjust Risk Level
- **Conservative:** `riskPercent: 0.5` (smaller positions)
- **Moderate:** `riskPercent: 1` (default)
- **Aggressive:** `riskPercent: 2` (larger positions)

**Never exceed 2% risk per trade!**

## 📈 Next Steps (Phase 2)

1. **Auto-Execution**
   - Add confirmation dialog
   - Direct MCP integration from client
   - Order status tracking

2. **Position Management**
   - View open positions on dashboard
   - Close position button
   - Adjust stop/target levels

3. **Performance Tracking**
   - Track all paper trades
   - Win rate vs scanner predictions
   - P/L by setup type
   - Compare actual vs expected timeframes

4. **Risk Dashboard**
   - Total capital at risk
   - Position concentration
   - Sector exposure
   - Available buying power

## 💡 Key Features

✅ **Risk Management**
- Automatic position sizing
- 1% account risk default
- Validates stop loss placement
- Ensures minimum 2:1 R:R

✅ **User Safety**
- Pre-flight validation
- Clear error messages
- Manual execution approval
- Audit trail in console

✅ **Professional Grade**
- TypeScript type safety
- Comprehensive testing
- Error handling
- Clean architecture

## 📚 Documentation

- **Full Guide:** `docs/PAPER_TRADING_GUIDE.md`
- **Alpaca MCP:** `docs/ALPACA_MCP_SETUP.md`
- **Scanner Spec:** `MARKET_SCANNER_SPEC.md`
- **Session Log:** `.claude/session-log.md`

## 🎯 Value Delivered

This integration allows you to:

1. **Validate your scanner** - Test recommendations in real market conditions
2. **Build confidence** - Paper trade before risking real capital
3. **Refine strategy** - Track what works, adjust scoring weights
4. **Maintain discipline** - Automated position sizing prevents emotional decisions
5. **Learn patterns** - See which setups actually perform vs predictions

## ⚠️ Important Notes

- **Paper trading only** - No real money at risk
- **Manual execution** - Review before placing orders
- **MCP required** - Needs Alpaca MCP server connected
- **Educational purpose** - Not financial advice

---

**Status:** ✅ Ready for Production Paper Trading

**Next Action:** Start dev server and test with live recommendations!
