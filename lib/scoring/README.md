# Enhanced Scoring Algorithm

**Status:** ✅ Complete (Phase 3 of DAILY_SCANNER_IMPLEMENTATION)

## Overview

The scoring system evaluates trade opportunities on a 0-100 scale based on five weighted components:

1. **Trend Strength** (30 points) - Channel clarity, slope, and price position
2. **Pattern Quality** (25 points) - Type and reliability of candlestick patterns
3. **Volume Confirmation** (20 points) - Volume relative to historical average
4. **Risk/Reward Ratio** (15 points) - Quality of entry/target/stop setup
5. **Momentum/RSI** (10 points) - RSI positioning for optimal entries

Total scores map to confidence levels:
- **High**: 75-100 points
- **Medium**: 60-74 points
- **Low**: 0-59 points

## Usage

```typescript
import { calculateOpportunityScore } from '@/lib/scoring';

const score = calculateOpportunityScore({
  candles,       // Array of OHLCV candles
  channel,       // Channel detection result
  pattern,       // Pattern detection result
  volume,        // Volume analysis
  entryPrice,    // Proposed entry price
  targetPrice,   // Target price
  stopLoss,      // Stop loss price
});

console.log(score.totalScore);        // 76
console.log(score.confidenceLevel);   // 'high'
console.log(score.components);        // Individual component scores
console.log(score.breakdown);         // Human-readable breakdown
```

### Simplified Usage

If you don't have pre-calculated volume analysis:

```typescript
import { calculateOpportunityScoreSimple } from '@/lib/scoring';

const score = calculateOpportunityScoreSimple(
  candles,
  channel,
  pattern,
  entryPrice,
  targetPrice,
  stopLoss
);
```

## Component Scoring Details

### 1. Trend Strength (0-30 points)

**Channel Clarity (0-10 points)**
- Tight channel (<5% width): 10 pts
- Good channel (5-10%): 7 pts
- Acceptable (10-15%): 4 pts
- Wide channel (>15%): 2 pts

**Trend Slope (0-15 points)**
- Strong trend (>2%/day): 15 pts
- Moderate (1-2%/day): 10 pts
- Weak (0.5-1%/day): 5 pts
- Sideways (<0.5%/day): 2 pts

**Price Position (0-5 points)**
- Near support in uptrend: 5 pts
- Near resistance in downtrend: 5 pts
- Mid-channel: 2 pts
- Wrong side: 0 pts

### 2. Pattern Quality (0-25 points)

Pattern reliability scores:
- Bullish Engulfing: 25 pts
- Bearish Engulfing: 24 pts
- Hammer: 22 pts
- Shooting Star: 21 pts
- Piercing Line: 20 pts
- Dark Cloud Cover: 19 pts
- Doji: 12 pts
- No Pattern: 8 pts

### 3. Volume Confirmation (0-20 points)

Based on recent vs. historical volume:
- Exceptional (2x+): 20 pts
- High (1.5-2x): 17 pts
- Above average (1.2-1.5x): 13 pts
- Average (1.0-1.2x): 10 pts
- Below average (0.8-1.0x): 7 pts
- Low (<0.8x): 3 pts

### 4. Risk/Reward Ratio (0-15 points)

- Exceptional (3.5:1+): 15 pts
- Excellent (3.0-3.5:1): 14 pts
- Very Good (2.5-3.0:1): 12 pts
- Good (2.0-2.5:1): 10 pts
- Acceptable (1.5-2.0:1): 7 pts
- Marginal (1.0-1.5:1): 4 pts
- Poor (<1.0:1): 1 pt

### 5. Momentum/RSI (0-10 points)

**For Long Setups:**
- RSI 30-40 (oversold turning): 10 pts
- RSI 40-50 (neutral weak): 8 pts
- RSI 50-60 (neutral bullish): 6 pts
- RSI 60-70 (overbought warning): 4 pts
- RSI >70 (risky): 2 pts

**For Short Setups:**
- RSI 60-70 (overbought turning): 10 pts
- RSI 50-60 (neutral strong): 8 pts
- RSI 40-50 (neutral bearish): 6 pts
- RSI 30-40 (oversold warning): 4 pts
- RSI <30 (risky): 2 pts

## File Structure

```
lib/scoring/
├── index.ts           # Main orchestrator and exports
├── types.ts           # Type definitions
├── indicators.ts      # Technical indicator calculations (RSI, ATR, etc.)
├── components.ts      # Individual scoring functions
└── README.md          # This file
```

## Testing

Run the demonstration to see the scoring in action:

```bash
npm run test-scoring    # (if added to package.json)
# or
npx tsx scripts/demoScoring.ts
```

Example output:
```
Example 1: HIGH-QUALITY TRADE SETUP
Score: 76/100 (HIGH)
  trendStrength     : 9/30
  patternQuality    : 25/25 - Strong bullish reversal
  volumeScore       : 17/20 - High volume confirmation
  riskRewardScore   : 15/15 - Excellent (4.3:1)
  momentumScore     : 10/10 - Ideal momentum
```

## Integration with Scanner

This scoring module is designed to be used in Phase 5 (Daily Market Scanner):

```typescript
import { calculateOpportunityScoreSimple } from '@/lib/scoring';

async function analyzeSingleStock(symbol: string) {
  const candles = await getCandles(symbol, '1D', 60);
  const channel = detectChannel(candles);
  const pattern = detectPatterns(candles);

  // Calculate entry/target/stop (from Phase 4)
  const { entry, target, stopLoss } = generateTradeRecommendation(
    symbol,
    candles,
    channel,
    pattern
  );

  // Score the opportunity
  const score = calculateOpportunityScoreSimple(
    candles,
    channel,
    pattern,
    entry,
    target,
    stopLoss
  );

  // Only proceed if score is acceptable (>= 60)
  if (score.totalScore >= 60) {
    // Save to trade_recommendations table
  }
}
```

## Next Steps

- [ ] Phase 4: Build entry/exit/stop calculator
- [ ] Phase 5: Build daily market scanner script
- [ ] Phase 6: Build recommendations UI
- [ ] Phase 7: Set up cron automation

## Notes

- The scoring system is intentionally conservative - only high-quality setups score 75+
- Trend strength scoring may be lower for synthetic data without proper channel formation
- In production, real market data will produce more consistent trend scores
- RSI values are calculated from actual price action, ensuring realistic momentum scores
