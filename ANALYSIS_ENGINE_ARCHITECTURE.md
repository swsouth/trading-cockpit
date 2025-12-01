# Analysis Engine Architecture Plan
## Central Brain for Market Analysis & Signal Generation

**Created:** December 1, 2025
**Purpose:** Unified analysis engine to power all scanners, recommendations, and displays
**Goal:** Single source of truth for market analysis logic that applies globally

---

## 🎯 Executive Summary

### Current State (Problems)
1. **Analysis logic is scattered** across multiple files:
   - `lib/analysis.ts` - Channel & pattern detection
   - `lib/scoring/` - Opportunity scoring (3 files)
   - `lib/tradeCalculator/` - Trade setup generation (4 files)
   - `scripts/scanner/` - Scanner-specific logic (4 files)
   - `lib/cryptoScanner.ts` - Crypto-specific scanner

2. **Inconsistent application**:
   - Daily scanner uses one path
   - Intraday scanner uses another path
   - Crypto scanner has its own logic
   - UI displays may calculate scores differently

3. **Hard to maintain**:
   - Changes require updates in multiple places
   - Risk of logic drift between scanners
   - No single place to add new patterns or improvements

### Proposed Solution: Analysis Engine
A **centralized, modular analysis engine** that:
- ✅ **Single source of truth** for all analysis logic
- ✅ **Scanner-agnostic** - works for stocks/crypto, daily/intraday
- ✅ **Pluggable** - easy to add patterns, filters, improvements
- ✅ **Testable** - unit tests ensure consistency
- ✅ **Versioned** - track improvements over time

---

## 🏗️ Architecture Design

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SCANNERS LAYER                        │
│  (Entry Points - Call Engine, Store Results)           │
├─────────────────────────────────────────────────────────┤
│  dailyMarketScan.ts  │  intradayMarketScan.ts          │
│  cryptoScanner.ts    │  Manual UI Triggers             │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ Calls
                 ▼
┌─────────────────────────────────────────────────────────┐
│              ANALYSIS ENGINE (Central Brain)             │
│                  lib/engine/                            │
├─────────────────────────────────────────────────────────┤
│  AnalysisEngine.ts     - Main orchestrator             │
│  ├─ analyzeAsset()     - Single entry point            │
│  ├─ appliesPipeline()  - Runs all stages              │
│  └─ generateSignal()   - Returns complete signal       │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ Uses
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  ANALYSIS MODULES                        │
│              (Specialized Components)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 DATA LAYER                                          │
│  ├─ lib/engine/data/                                    │
│  │   ├─ CandleProcessor.ts     - Normalize OHLCV       │
│  │   ├─ IndicatorCalculator.ts - EMA, RSI, ATR, etc.  │
│  │   └─ VolumeAnalyzer.ts      - Volume patterns       │
│                                                          │
│  🔍 PATTERN DETECTION                                   │
│  ├─ lib/engine/patterns/                                │
│  │   ├─ PatternDetector.ts     - Main detector         │
│  │   ├─ CandlestickPatterns.ts - 7→25+ patterns        │
│  │   ├─ ChartPatterns.ts       - Double top/bottom, etc│
│  │   ├─ TrendPatterns.ts       - Channels, flags, etc. │
│  │   └─ PatternRegistry.ts     - Pattern catalog       │
│                                                          │
│  🧪 REGIME & CONTEXT                                    │
│  ├─ lib/engine/context/                                 │
│  │   ├─ RegimeDetector.ts      - Bull/Bear/Range       │
│  │   ├─ TrendAnalyzer.ts       - Multi-timeframe       │
│  │   └─ MarketConditions.ts    - Volatility, liquidity │
│                                                          │
│  🚦 FILTERING & VALIDATION                              │
│  ├─ lib/engine/filters/                                 │
│  │   ├─ PreTradeFilters.ts     - Quality gates         │
│  │   ├─ RiskValidator.ts       - Max risk, R:R checks  │
│  │   └─ LiquidityFilter.ts     - ADV, spread checks    │
│                                                          │
│  📈 TRADE LOGIC                                         │
│  ├─ lib/engine/trade/                                   │
│  │   ├─ EntryCalculator.ts     - Pattern-specific entry│
│  │   ├─ StopLossCalculator.ts  - Pattern-specific stops│
│  │   ├─ TargetCalculator.ts    - Pattern-specific target│
│  │   └─ PositionSizer.ts       - Risk-based sizing     │
│                                                          │
│  🎯 SCORING & RATING                                    │
│  ├─ lib/engine/scoring/                                 │
│  │   ├─ OpportunityScorer.ts   - EOC-calibrated scores │
│  │   ├─ ComponentScores.ts     - Trend, pattern, vol   │
│  │   └─ ConfidenceCalculator.ts- High/Med/Low rating   │
│                                                          │
│  ⚙️ CONFIGURATION                                       │
│  ├─ lib/engine/config/                                  │
│  │   ├─ StockConfig.ts         - Stock parameters      │
│  │   ├─ CryptoConfig.ts        - Crypto parameters     │
│  │   ├─ DailyConfig.ts         - Daily scan settings   │
│  │   └─ IntradayConfig.ts      - Intraday settings     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Core Principles

### 1. **Single Entry Point**
```typescript
// All scanners call the same function
import { AnalysisEngine } from '@/lib/engine';

const engine = new AnalysisEngine({
  assetType: 'stock' | 'crypto',
  timeframe: 'daily' | 'intraday',
});

const signal = await engine.analyzeAsset({
  symbol: 'AAPL',
  candles: ohlcvData,
  currentPrice: 150.00,
});

// Returns standardized Signal object
// Used by: daily scanner, intraday scanner, crypto scanner, UI
```

### 2. **Configuration-Driven**
```typescript
// Stock vs Crypto differences handled via config
const stockConfig: AnalysisConfig = {
  channelTolerance: 5%,
  maxStopLoss: 15%,
  minRiskReward: 2.0,
  volumeThreshold: 1.5,
};

const cryptoConfig: AnalysisConfig = {
  channelTolerance: 8%,
  maxStopLoss: 20%,
  minRiskReward: 2.0,
  volumeThreshold: 2.0,
};
```

### 3. **Modular & Testable**
```typescript
// Each module is independently testable
describe('PatternDetector', () => {
  it('detects double bottom with 78% accuracy', () => {
    const detector = new PatternDetector();
    const result = detector.detect('double_bottom', candles);
    expect(result.confidence).toBeGreaterThan(0.75);
  });
});
```

### 4. **Pluggable Patterns**
```typescript
// Easy to add new patterns
class DoubleBottomDetector implements PatternDetector {
  detect(candles: Candle[]): PatternResult {
    // Detection logic
  }

  getTradeSetup(pattern: Pattern): TradeSetup {
    // Entry, stop, target rules
  }

  getMetadata(): PatternMetadata {
    return {
      name: 'Double Bottom',
      winRate: 0.78,
      avgRR: 3.5,
      bulkowa: 'EOC-1 pg 42',
    };
  }
}

// Register pattern
PatternRegistry.register('double_bottom', new DoubleBottomDetector());
```

### 5. **Deterministic**
```typescript
// Same inputs ALWAYS produce same outputs
const EPSILON = 0.0001; // Floating point tolerance

function comparePrice(a: number, b: number): ComparisonResult {
  if (Math.abs(a - b) < EPSILON) return 'equal';
  return a > b ? 'above' : 'below';
}
```

---

## 🔄 Data Flow

### Step-by-Step Pipeline

```typescript
// 1. Scanner fetches data
const candles = await fetchCandles('AAPL', '60d');

// 2. Initialize engine with config
const engine = new AnalysisEngine({
  assetType: 'stock',
  timeframe: 'daily',
  config: stockConfig,
});

// 3. Engine runs pipeline
const signal = await engine.analyzeAsset({
  symbol: 'AAPL',
  candles,
  currentPrice: 150.00,
});

// Pipeline stages (internal):
// ├─ Stage 1: Normalize & validate data
// ├─ Stage 2: Calculate indicators (EMA, RSI, ATR, volume)
// ├─ Stage 3: Detect market regime (bull/bear/range)
// ├─ Stage 4: Detect patterns (channels, candlesticks, chart patterns)
// ├─ Stage 5: Apply pre-trade filters (liquidity, risk, volatility)
// ├─ Stage 6: Generate trade setup (entry, stop, target)
// ├─ Stage 7: Calculate opportunity score (0-100)
// ├─ Stage 8: Assign confidence level (high/medium/low)
// └─ Stage 9: Generate rationale text

// 4. Return standardized signal
return {
  symbol: 'AAPL',
  recommendation: 'long' | 'short' | null,
  entry: 149.50,
  stopLoss: 145.00,
  target: 158.00,
  score: 78,
  confidence: 'high',
  rationale: 'Double bottom pattern at support...',
  patterns: ['double_bottom', 'bullish_engulfing'],
  regime: 'trending_bullish',
  riskReward: 2.8,
  metadata: {
    channelStatus: 'near_support',
    volumeConfirmation: true,
    weeklyTrend: 'up',
  },
};

// 5. Scanner stores result
await storeRecommendation(signal);
```

---

## 📦 Module Breakdown

### Core Engine (`lib/engine/AnalysisEngine.ts`)

```typescript
export class AnalysisEngine {
  private config: AnalysisConfig;
  private patternDetector: PatternDetector;
  private regimeDetector: RegimeDetector;
  private scorer: OpportunityScorer;

  constructor(options: EngineOptions) {
    this.config = this.loadConfig(options);
    this.patternDetector = new PatternDetector(this.config);
    this.regimeDetector = new RegimeDetector();
    this.scorer = new OpportunityScorer(this.config);
  }

  async analyzeAsset(input: AnalysisInput): Promise<Signal | null> {
    // Stage 1: Data validation
    const normalized = this.normalizeData(input);
    if (!normalized) return null;

    // Stage 2: Indicators
    const indicators = this.calculateIndicators(normalized.candles);

    // Stage 3: Market regime
    const regime = this.regimeDetector.detect(normalized.candles, indicators);

    // Stage 4: Pattern detection
    const patterns = this.patternDetector.detectAll(normalized.candles);
    if (patterns.length === 0) return null;

    // Stage 5: Pre-trade filters
    const passesFilters = this.applyFilters(normalized, patterns);
    if (!passesFilters) return null;

    // Stage 6: Trade setup
    const tradeSetup = this.generateTradeSetup(normalized, patterns, regime);
    if (!tradeSetup) return null;

    // Stage 7-8: Scoring & confidence
    const score = this.scorer.calculate(
      normalized.candles,
      patterns,
      regime,
      tradeSetup
    );

    // Stage 9: Rationale
    const rationale = this.generateRationale(
      patterns,
      regime,
      tradeSetup,
      score
    );

    return {
      symbol: input.symbol,
      recommendation: tradeSetup.direction,
      entry: tradeSetup.entry,
      stopLoss: tradeSetup.stopLoss,
      target: tradeSetup.target,
      score: score.total,
      confidence: score.level,
      rationale,
      patterns: patterns.map(p => p.type),
      regime: regime.type,
      riskReward: tradeSetup.riskReward,
      metadata: {
        channelStatus: patterns.find(p => p.type === 'channel')?.status,
        volumeConfirmation: score.components.volumeScore > 15,
        weeklyTrend: regime.weeklyTrend,
      },
    };
  }
}
```

---

## 🎨 Pattern System Design

### Pattern Registry (Pluggable)

```typescript
// lib/engine/patterns/PatternRegistry.ts

interface PatternDetector {
  type: string;
  detect(candles: Candle[]): PatternResult | null;
  getTradeSetup(pattern: PatternResult): TradeSetup;
  getMetadata(): PatternMetadata;
}

interface PatternMetadata {
  name: string;
  winRate: number;
  avgRiskReward: number;
  reliability: 'very_high' | 'high' | 'medium' | 'low';
  eocReference?: string; // "EOC-1 pg 42"
}

class PatternRegistry {
  private static patterns = new Map<string, PatternDetector>();

  static register(type: string, detector: PatternDetector) {
    this.patterns.set(type, detector);
  }

  static get(type: string): PatternDetector | undefined {
    return this.patterns.get(type);
  }

  static getAll(): PatternDetector[] {
    return Array.from(this.patterns.values());
  }
}

// Usage: Add new pattern
PatternRegistry.register('double_bottom', new DoubleBottomDetector());
PatternRegistry.register('bull_flag', new BullFlagDetector());
PatternRegistry.register('head_shoulders', new HeadShouldersDetector());
```

### Example: Double Bottom Detector

```typescript
// lib/engine/patterns/DoubleBottomDetector.ts

export class DoubleBottomDetector implements PatternDetector {
  type = 'double_bottom';

  detect(candles: Candle[]): PatternResult | null {
    // Find two lows within 5-10% of each other
    const lows = this.findSignificantLows(candles);

    for (let i = 0; i < lows.length - 1; i++) {
      const first = lows[i];
      const second = lows[i + 1];

      // Check symmetry (bottoms within 3% of each other)
      const priceDiff = Math.abs(first.price - second.price) / first.price;
      if (priceDiff > 0.03) continue;

      // Check time separation (3-8 weeks apart)
      const daysDiff = (second.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 21 || daysDiff > 56) continue;

      // Find neckline (peak between bottoms)
      const neckline = this.findNeckline(candles, first.index, second.index);
      if (!neckline) continue;

      // Check volume confirmation (second bottom < first bottom)
      const volumeConfirmed = second.volume < first.volume;

      return {
        type: 'double_bottom',
        confidence: volumeConfirmed ? 0.85 : 0.70,
        data: {
          firstBottom: first,
          secondBottom: second,
          neckline: neckline.price,
          symmetry: 1 - priceDiff,
          volumeConfirmation: volumeConfirmed,
        },
      };
    }

    return null;
  }

  getTradeSetup(pattern: PatternResult): TradeSetup {
    const { firstBottom, secondBottom, neckline } = pattern.data;

    // Entry: Breakout above neckline + 1%
    const entry = neckline * 1.01;

    // Stop: 2% below second bottom
    const stopLoss = secondBottom.price * 0.98;

    // Target: Measure rule (neckline + depth)
    const depth = neckline - secondBottom.price;
    const target = neckline + depth;

    return {
      direction: 'long',
      entry,
      stopLoss,
      target,
      riskReward: (target - entry) / (entry - stopLoss),
    };
  }

  getMetadata(): PatternMetadata {
    return {
      name: 'Double Bottom',
      winRate: 0.78,
      avgRiskReward: 3.5,
      reliability: 'high',
      eocReference: 'EOC-1 pg 42-58',
    };
  }
}
```

---

## 🔧 Configuration System

### Asset-Specific Configs

```typescript
// lib/engine/config/StockConfig.ts
export const STOCK_CONFIG: AnalysisConfig = {
  // Channel detection
  channel: {
    minTouches: 2, // Min 2 support + 2 resistance
    maxOutOfBand: 0.05, // 5% tolerance
    minWidth: 0.02, // 2% minimum channel width
    maxWidth: 0.25, // 25% maximum channel width
  },

  // Risk management
  risk: {
    maxStopLoss: 0.15, // 15% max stop
    minRiskReward: 2.0, // Minimum 2:1 R:R
    maxRisk: 0.10, // Max 10% portfolio risk
  },

  // Filters
  filters: {
    minADV: 1_000_000, // $1M average daily volume
    maxSpread: 0.02, // 2% max bid-ask spread
    earningsBuffer: 3, // 3 days before/after earnings
  },

  // Scoring weights
  scoring: {
    trendWeight: 0.30, // 30 points
    patternWeight: 0.25, // 25 points
    volumeWeight: 0.20, // 20 points
    riskRewardWeight: 0.15, // 15 points
    momentumWeight: 0.10, // 10 points
  },
};

// lib/engine/config/CryptoConfig.ts
export const CRYPTO_CONFIG: AnalysisConfig = {
  channel: {
    minTouches: 2,
    maxOutOfBand: 0.08, // 8% tolerance (more volatile)
    minWidth: 0.03, // 3% minimum
    maxWidth: 0.40, // 40% maximum (wider swings)
  },

  risk: {
    maxStopLoss: 0.20, // 20% max stop (wider)
    minRiskReward: 2.0,
    maxRisk: 0.05, // Max 5% portfolio risk (more volatile)
  },

  filters: {
    minADV: 500_000, // $500k ADV
    maxSpread: 0.05, // 5% max spread
    earningsBuffer: 0, // N/A for crypto
  },

  scoring: {
    trendWeight: 0.25, // Less weight (crypto more choppy)
    patternWeight: 0.30, // More weight (patterns matter)
    volumeWeight: 0.25, // Higher weight (volume critical)
    riskRewardWeight: 0.10,
    momentumWeight: 0.10,
  },
};
```

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1-2) ✅ PRIORITY
**Goal:** Create engine skeleton, migrate existing patterns

**Tasks:**
1. Create engine directory structure
2. Build `AnalysisEngine.ts` main orchestrator
3. Extract pattern detection from `lib/analysis.ts` → `lib/engine/patterns/`
4. Extract scoring from `lib/scoring/` → `lib/engine/scoring/`
5. Create configuration system (`StockConfig`, `CryptoConfig`)
6. Update daily scanner to use engine
7. Add unit tests for determinism

**Deliverable:** Daily scanner using unified engine

### Phase 2: Pattern Expansion (Week 3-4)
**Goal:** Add Phase 1 EOC improvements

**Tasks:**
1. Implement `DoubleBottomDetector` and `DoubleTopDetector`
2. Implement `BullFlagDetector` and `BearFlagDetector`
3. Recalibrate pattern scores (EOC win rates)
4. Add regime detection
5. Add volume-at-breakout boost
6. Tighten channel validation
7. Add "No Trade" filter

**Deliverable:** +10-15% win rate improvement

### Phase 3: Intraday & Crypto (Week 5)
**Goal:** Migrate all scanners to engine

**Tasks:**
1. Update intraday scanner to use engine
2. Update crypto scanner to use engine
3. Test with `IntradayConfig` and `CryptoConfig`
4. Ensure UI displays work with new signal format

**Deliverable:** All scanners using unified engine

### Phase 4: Advanced Features (Week 6+)
**Goal:** Multi-timeframe, pre-trade filters

**Tasks:**
1. Multi-timeframe confirmation
2. Pre-trade filters (liquidity, earnings, etc.)
3. Triangle patterns
4. Head & Shoulders
5. Cup-with-Handle

**Deliverable:** 70-75% win rate

---

## 📊 Benefits Summary

### For Development
- ✅ **Single place to add improvements** - Change once, apply everywhere
- ✅ **Easier testing** - Unit test each module independently
- ✅ **Better maintainability** - Clear separation of concerns
- ✅ **Faster iteration** - Add patterns without touching scanners

### For Users
- ✅ **Consistent analysis** - Same logic across all pages
- ✅ **Higher accuracy** - EOC-calibrated patterns and scoring
- ✅ **Better confidence** - Pattern-specific trade setups
- ✅ **More opportunities** - 25+ patterns vs 7

### For System
- ✅ **Deterministic** - Same inputs = same outputs
- ✅ **Versioned** - Track improvements over time
- ✅ **Auditable** - Clear rationale for every signal
- ✅ **Scalable** - Add crypto, forex, options easily

---

## 🎯 Success Metrics

### Before (Current)
- 7 patterns detected
- ~60% win rate
- Inconsistent scoring across scanners
- Hard to add new patterns

### After Phase 1-2 (Week 4)
- 12 patterns detected (7 original + 5 EOC)
- ~70% win rate (+10%)
- Unified analysis engine
- Easy to add patterns

### After Phase 4 (Week 8+)
- 25+ patterns detected
- 70-75% win rate
- Multi-timeframe confirmation
- Pre-trade filters active

---

## 📝 Next Steps

1. **Review this plan** - Confirm architecture approach
2. **Phase 1 implementation** - Build engine skeleton
3. **Migrate daily scanner** - First scanner to use engine
4. **Test & validate** - Ensure consistency
5. **Iterate** - Add patterns incrementally

**Estimated Total Effort:** 8-12 weeks for full implementation
**Quick Win Path:** Phases 1-2 (4 weeks) for 10-15% improvement

---

## 🤔 Open Questions

1. **Versioning:** How to track analysis engine versions in database?
   - Proposal: Add `analysis_version` field to recommendations table

2. **Backtesting:** How to validate improvements?
   - Proposal: Store historical signals, compare win rates before/after

3. **A/B Testing:** Test new patterns before rolling out?
   - Proposal: `experimental_patterns` flag in config

4. **Performance:** Can we cache indicator calculations?
   - Proposal: Memoize expensive calculations (EMA, RSI) per scan

5. **Extensibility:** How to let users add custom patterns?
   - Future: Plugin system for custom pattern detectors

---

## 📚 References

- Comprehensive Improvement Report (this repo)
- EOC-1, EOC-2, EOC-3, EOC-4 (Bulkowski's Encyclopedia)
- Current `lib/analysis.ts` - Pattern detection logic
- Current `lib/scoring/` - Opportunity scoring
- Current `lib/tradeCalculator/` - Trade setup generation
