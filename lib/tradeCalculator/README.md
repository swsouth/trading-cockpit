# Trade Calculator (Entry/Exit/Stop)

**Status:** ✅ Complete (Phase 4 of DAILY_SCANNER_IMPLEMENTATION)

## Overview

The Trade Calculator generates complete trade recommendations with precise entry, target, and stop loss prices based on technical analysis. It intelligently determines whether a stock presents a long, short, or no actionable setup, then calculates optimal price levels using channel boundaries and ATR (Average True Range).

## Features

- **Setup Detection** - Automatically identifies long/short opportunities
- **Smart Entry Calculation** - Uses support/resistance and pattern confirmation
- **ATR-Based Stops** - Dynamic stop losses accounting for volatility
- **Channel-Based Targets** - Natural profit targets at resistance/support
- **Risk/Reward Validation** - Ensures minimum 2:1 R:R ratio
- **Human-Readable Rationale** - Explains the trade thesis

## Usage

### Basic Usage

```typescript
import { generateTradeRecommendation } from '@/lib/tradeCalculator';

const recommendation = generateTradeRecommendation({
  symbol: 'AAPL',
  candles,       // OHLCV data (40+ candles for ATR)
  channel,       // Channel detection result
  pattern,       // Pattern detection result
  currentPrice,  // Optional: defaults to last candle close
});

if (recommendation) {
  console.log(`${recommendation.setup.setupName}`);
  console.log(`Entry: $${recommendation.entry}`);
  console.log(`Target: $${recommendation.target}`);
  console.log(`Stop: $${recommendation.stopLoss}`);
  console.log(`R:R: 1:${recommendation.riskRewardRatio.toFixed(2)}`);
  console.log(recommendation.rationale);
}
```

### Example Output

```
Setup: Long - Support Bounce (high confidence)
Entry: $96.00 - Near support - favorable entry
Target: $107.80 - Channel resistance target
Stop: $94.01 - 2.5x ATR below entry
R:R: 1:5.92

Rationale: **AAPL** presents a long opportunity. Price is trading
near channel support, offering an attractive entry point for a
bounce play. A bullish engulfing pattern provides additional
confirmation of bullish bias. Entry at $96.00 (current: $96.00):
Near support - favorable entry. Target at $107.80 (+12.3%):
Channel resistance provides natural profit target. Stop loss at
$94.01 (-2.1%): ATR-based stop accounts for normal volatility.
Risk/reward ratio of 1:5.9 offers favorable risk-adjusted returns.
```

## Setup Types

### Long Setups

1. **Long - Support Bounce** (High Confidence)
   - Price near support with bullish pattern
   - Entry: At/near support
   - Stop: Below support or 2.5x ATR
   - Target: Channel resistance

2. **Long - Breakout** (Medium Confidence)
   - Price broke above resistance
   - Entry: Pullback to broken resistance
   - Stop: Below breakout level
   - Target: Measured move or R:R

3. **Long - Channel Support** (Medium Confidence)
   - Near support without pattern
   - Entry: Near support
   - Stop: Below support
   - Target: Channel resistance

### Short Setups

1. **Short - Resistance Rejection** (High Confidence)
   - Price near resistance with bearish pattern
   - Entry: At/near resistance
   - Stop: Above resistance or 2.5x ATR
   - Target: Channel support

2. **Short - Breakdown** (Medium Confidence)
   - Price broke below support
   - Entry: Bounce to broken support
   - Stop: Above breakdown level
   - Target: Measured move or R:R

3. **Short - Channel Resistance** (Medium Confidence)
   - Near resistance without pattern
   - Entry: Near resistance
   - Stop: Above resistance
   - Target: Channel support

## Price Calculation Logic

### Entry Price

**Long Setups:**
- If within 2% of support: Enter at current price
- If breakout: Wait for pullback to broken resistance
- Otherwise: Limit order 1% above support

**Short Setups:**
- If within 2% of resistance: Enter at current price
- If breakdown: Wait for bounce to broken support
- Otherwise: Limit order 1% below resistance

### Stop Loss

**Priority Order:**
1. **Channel-based** - If tighter than ATR and <8% risk
2. **ATR-based** - 2.5x ATR from entry (accounts for volatility)
3. **Maximum risk** - Capped at 10% from entry

**Long Stops:**
- Channel: 2% below support
- ATR: Entry - (2.5 × ATR)

**Short Stops:**
- Channel: 2% above resistance
- ATR: Entry + (2.5 × ATR)

### Target Price

**Priority Order:**
1. **Channel-based** - If R:R >= 2:1
2. **Risk/Reward-based** - 2:1 minimum

**Long Targets:**
- Channel: 2% below resistance (for safety)
- R:R: Entry + (Risk × 2.0)

**Short Targets:**
- Channel: 2% above support (for safety)
- R:R: Entry - (Risk × 2.0)

## Validation

All price levels are validated before returning:

**Long Validation:**
- Target > Entry
- Stop < Entry
- Risk <= 15% of entry
- Reward >= Risk (minimum 1:1 R:R)

**Short Validation:**
- Target < Entry
- Stop > Entry
- Risk <= 15% of entry
- Reward >= Risk (minimum 1:1 R:R)

Invalid setups return `null`.

## File Structure

```
lib/tradeCalculator/
├── index.ts              # Main orchestrator
├── types.ts              # Type definitions
├── setupDetection.ts     # Long/short/none detection
├── priceCalculations.ts  # Entry/stop/target logic
├── rationale.ts          # Human-readable explanations
└── README.md             # This file
```

## Integration with Scoring

Combine with the scoring system for complete evaluation:

```typescript
import { generateTradeRecommendation } from '@/lib/tradeCalculator';
import { calculateOpportunityScore } from '@/lib/scoring';

const recommendation = generateTradeRecommendation({
  symbol,
  candles,
  channel,
  pattern,
});

if (recommendation) {
  const score = calculateOpportunityScore({
    candles,
    channel,
    pattern,
    volume: analyzeVolume(candles),
    entryPrice: recommendation.entry,
    targetPrice: recommendation.target,
    stopLoss: recommendation.stopLoss,
  });

  if (score.totalScore >= 60) {
    // Save to trade_recommendations table
  }
}
```

## Testing

Run the demonstration:

```bash
npx tsx scripts/demoTradeCalculator.ts
```

## Next Steps

- [ ] Phase 5: Build daily market scanner script
- [ ] Phase 6: Build recommendations UI
- [ ] Phase 7: Set up cron automation

## Notes

- ATR calculation requires 14+ candles minimum (40+ recommended)
- Risk/reward ratios typically range from 2:1 to 6:1
- High confidence setups have both channel position AND pattern
- Medium confidence setups have channel OR pattern
- Low confidence setups are filtered out (not actionable)
