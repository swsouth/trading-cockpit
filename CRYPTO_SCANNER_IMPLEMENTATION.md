# Crypto Scanner Implementation Plan

## Overview

Add cryptocurrency scanning to the daily market scanner, scanning both stocks and crypto in a single unified workflow.

**Goal:** Daily recommendations for top 20-30 crypto + 250 stocks = ~280 total assets scanned

---

## Phase 1: Database Schema Updates ✅

### Migration: Add asset_type to scan_universe

**File:** `supabase/migrations/[timestamp]_add_asset_type_to_scan_universe.sql`

```sql
-- Add asset_type column to distinguish stocks from crypto
ALTER TABLE scan_universe
  ADD COLUMN asset_type VARCHAR(20) DEFAULT 'stock' NOT NULL;

-- Add constraint
ALTER TABLE scan_universe
  ADD CONSTRAINT chk_asset_type CHECK (asset_type IN ('stock', 'crypto'));

-- Update existing records to be stocks
UPDATE scan_universe SET asset_type = 'stock' WHERE asset_type IS NULL;

-- Create index for filtering
CREATE INDEX idx_scan_universe_asset_type ON scan_universe(asset_type);

COMMENT ON COLUMN scan_universe.asset_type IS 'Type of asset: stock or crypto';
```

**Why:** Allows scanning both stocks and crypto in the same table/workflow

---

## Phase 2: FreeCryptoAPI Integration 🔄

### Step 1: Sign Up for API Key

**Action Required (User):**
1. Visit: https://freecryptoapi.com/panel
2. Sign up for free account
3. Get API key (100,000 calls/month)
4. Add to `.env.local`: `FREECRYPTO_API_KEY=your_key_here`
5. Add to Netlify environment variables

### Step 2: Create FreeCryptoAPI Module

**File:** `lib/freeCryptoApi.ts`

```typescript
import { Candle, Quote } from './types';

const FREECRYPTO_API_KEY = process.env.FREECRYPTO_API_KEY;
const FREECRYPTO_BASE_URL = 'https://api.freecryptoapi.com'; // Verify actual URL

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' ||
                     process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'false';

// Cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes (crypto moves fast)

export async function getFreeCryptoQuote(symbol: string): Promise<Quote> {
  if (!FREECRYPTO_API_KEY) {
    if (isProduction) {
      throw new Error('FreeCryptoAPI key not configured');
    }
    // Fallback to CoinGecko in development
    return getCryptoQuote(symbol);
  }

  // Implementation using /getData endpoint
  // Returns: price, 24h change, volume, etc.
}

export async function getFreeCryptoOHLC(symbol: string, days: number = 60): Promise<Candle[]> {
  if (!FREECRYPTO_API_KEY) {
    if (isProduction) {
      throw new Error('FreeCryptoAPI key not configured');
    }
    // Fallback to CoinGecko in development
    return getCryptoOHLC(symbol);
  }

  // Implementation using /getOHLC endpoint
  // Returns: Historical candles
}

export async function getFreeCryptoTechnicalAnalysis(symbol: string) {
  // Use /getTechnicalAnalysis endpoint
  // Returns: RSI, MACD, etc. (built-in!)
  // This saves us from calculating ourselves
}

export async function getFreeCryptoBreakouts(symbols: string[]) {
  // Use /getBreakouts endpoint
  // Returns: Crypto showing breakout patterns
  // Perfect for scanner pre-filtering!
}
```

**Advantage:** FreeCryptoAPI calculates RSI/MACD for us, saves computation

---

## Phase 3: Crypto Universe Definition 📋

### Update stockUniverse.ts → scanUniverse.ts

**File:** `scripts/scanUniverse.ts` (rename from stockUniverse.ts)

```typescript
export interface ScanUniverseEntry {
  symbol: string;
  company_name: string; // Or crypto name
  sector: string; // Or crypto category
  data_source: string;
  asset_type: 'stock' | 'crypto';
}

// Top 20-30 Cryptocurrencies by Market Cap & Liquidity
export const CRYPTO_UNIVERSE: ScanUniverseEntry[] = [
  // Top 10 by Market Cap
  { symbol: 'BTC', company_name: 'Bitcoin', sector: 'Layer 1', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'ETH', company_name: 'Ethereum', sector: 'Layer 1', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'BNB', company_name: 'Binance Coin', sector: 'Exchange', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'SOL', company_name: 'Solana', sector: 'Layer 1', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'XRP', company_name: 'Ripple', sector: 'Payment', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'ADA', company_name: 'Cardano', sector: 'Layer 1', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'AVAX', company_name: 'Avalanche', sector: 'Layer 1', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'DOGE', company_name: 'Dogecoin', sector: 'Meme', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'DOT', company_name: 'Polkadot', sector: 'Interop', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'MATIC', company_name: 'Polygon', sector: 'Layer 2', data_source: 'freecrypto', asset_type: 'crypto' },

  // DeFi & Popular
  { symbol: 'LINK', company_name: 'Chainlink', sector: 'Oracle', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'UNI', company_name: 'Uniswap', sector: 'DEX', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'ATOM', company_name: 'Cosmos', sector: 'Interop', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'LTC', company_name: 'Litecoin', sector: 'Payment', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'BCH', company_name: 'Bitcoin Cash', sector: 'Payment', data_source: 'freecrypto', asset_type: 'crypto' },

  // Emerging
  { symbol: 'NEAR', company_name: 'NEAR Protocol', sector: 'Layer 1', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'APT', company_name: 'Aptos', sector: 'Layer 1', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'ARB', company_name: 'Arbitrum', sector: 'Layer 2', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'OP', company_name: 'Optimism', sector: 'Layer 2', data_source: 'freecrypto', asset_type: 'crypto' },
  { symbol: 'SHIB', company_name: 'Shiba Inu', sector: 'Meme', data_source: 'freecrypto', asset_type: 'crypto' },
];

// Combined universe
export const SCAN_UNIVERSE = [...STOCK_UNIVERSE, ...CRYPTO_UNIVERSE];
// Total: 250 stocks + 20 crypto = 270 assets
```

**Why:** Start with top 20 liquid cryptos, can expand later

---

## Phase 4: Scanner Updates 🔧

### Update dailyMarketScan.ts

**Key Changes:**

```typescript
import { getFreeCryptoQuote, getFreeCryptoOHLC } from '@/lib/freeCryptoApi';
import { getQuote, getDailyOHLC } from '@/lib/marketData';

async function scanAsset(asset: ScanUniverseEntry) {
  // Route to correct API based on asset_type
  const quote = asset.asset_type === 'crypto'
    ? await getFreeCryptoQuote(asset.symbol)
    : await getQuote(asset.symbol);

  const candles = asset.asset_type === 'crypto'
    ? await getFreeCryptoOHLC(asset.symbol)
    : await getDailyOHLC(asset.symbol);

  // Rest of analysis is the same (channels, patterns, scoring)
  // Technical analysis works identically for stocks and crypto
}

// Batch processing with rate limiting
async function scanUniverseInBatches(universe: ScanUniverseEntry[]) {
  // Group by asset type for optimal batching
  const stocks = universe.filter(a => a.asset_type === 'stock');
  const cryptos = universe.filter(a => a.asset_type === 'crypto');

  // Scan stocks (FMP API)
  const stockResults = await scanBatch(stocks, 25, 2000); // 25 stocks, 2s delay

  // Scan crypto (FreeCrypto API)
  const cryptoResults = await scanBatch(cryptos, 20, 1000); // 20 crypto, 1s delay

  return [...stockResults, ...cryptoResults];
}
```

**Why:** Same analysis engine, different data sources

---

## Phase 5: UI Updates 🎨

### Display Both Asset Types

**Files to Update:**
- `app/recommendations/page.tsx` - Filter by asset type
- `components/RecommendationCard.tsx` - Show asset type badge
- `app/scanner/page.tsx` - Separate tabs for stocks vs crypto

**New Features:**
- Filter: "All" | "Stocks" | "Crypto"
- Asset type badge on each card
- Separate stats for stocks vs crypto

**Example:**
```tsx
<div className="flex gap-2">
  <Badge variant={recommendation.asset_type === 'crypto' ? 'default' : 'secondary'}>
    {recommendation.asset_type.toUpperCase()}
  </Badge>
  {/* Existing badges */}
</div>
```

---

## API Usage Estimation

### Stock Scanning (FMP)
- 250 stocks × 1 call = 250 calls/day
- Monthly: ~7,500 calls
- Free tier: 250 calls/day ✅ (just fits!)

### Crypto Scanning (FreeCryptoAPI)
- 20 cryptos × 1 call (OHLC) = 20 calls/day
- 20 cryptos × 1 call (quote) = 20 calls/day
- Total: 40 calls/day
- Monthly: ~1,200 calls
- Free tier: 100,000 calls/month ✅ (plenty of room!)

**Total API Budget:**
- FMP: 7,500/7,500 (100% used)
- FreeCrypto: 1,200/100,000 (1.2% used)

**Recommendation:**
- Reduce stocks to 230 to leave 20-call buffer for FMP
- OR upgrade FMP to Starter ($14.99/mo)

---

## Implementation Timeline

### Phase 1: Database (30 min)
- [ ] Create migration for asset_type column
- [ ] Apply migration to Supabase
- [ ] Verify schema changes

### Phase 2: API Integration (2 hours)
- [ ] User signs up for FreeCryptoAPI
- [ ] Create lib/freeCryptoApi.ts
- [ ] Test endpoints with sample crypto
- [ ] Verify quote and OHLC data quality

### Phase 3: Universe Definition (30 min)
- [ ] Rename stockUniverse.ts → scanUniverse.ts
- [ ] Add CRYPTO_UNIVERSE array
- [ ] Update population script
- [ ] Populate database with crypto

### Phase 4: Scanner Updates (1 hour)
- [ ] Update dailyMarketScan.ts routing logic
- [ ] Add crypto batch processing
- [ ] Test full scan with mixed assets
- [ ] Verify recommendations generated correctly

### Phase 5: UI Updates (1 hour)
- [ ] Add asset type filters
- [ ] Update recommendation cards
- [ ] Add crypto badges/icons
- [ ] Test responsive design

### Phase 6: Testing & Validation (1 hour)
- [ ] Run test scan with 5 stocks + 5 crypto
- [ ] Verify data accuracy
- [ ] Check scoring consistency
- [ ] Validate UI displays correctly

**Total Estimated Time:** 6 hours

---

## Testing Strategy

### 1. API Testing
```bash
# Test FreeCryptoAPI endpoints
npx tsx scripts/testFreeCryptoApi.ts

# Expected: Real crypto quotes and OHLC data
```

### 2. Scanner Testing
```bash
# Test with small universe (5 stocks + 5 crypto)
npx tsx scripts/testMixedScanner.ts

# Expected:
# - BTC recommendations if setup exists
# - ETH recommendations if setup exists
# - Stock recommendations as before
```

### 3. Full Scan Testing
```bash
# Production scan (230 stocks + 20 crypto)
npm run scan-market

# Expected:
# - ~30 total recommendations
# - Mix of stocks and crypto
# - Valid scores for both asset types
```

---

## Production Checklist

Before enabling crypto scanning in production:

### API Keys
- [ ] `FREECRYPTO_API_KEY` in `.env.local`
- [ ] `FREECRYPTO_API_KEY` in Netlify env vars
- [ ] Test API key validity

### Database
- [ ] Migration applied to production Supabase
- [ ] Crypto assets populated in scan_universe
- [ ] RLS policies verified

### Code
- [ ] lib/freeCryptoApi.ts deployed
- [ ] dailyMarketScan.ts updated
- [ ] UI components updated
- [ ] Error handling tested

### Monitoring
- [ ] Track API usage (FreeCrypto dashboard)
- [ ] Monitor scan performance
- [ ] Verify crypto recommendations quality
- [ ] Check for rate limit issues

---

## Future Enhancements

### Short Term
- [ ] Crypto-specific scoring adjustments (volatility weighting)
- [ ] Fear & Greed Index integration (/getFearGreed)
- [ ] Built-in RSI/MACD from FreeCryptoAPI

### Medium Term
- [ ] Crypto breakout pre-filtering (/getBreakouts)
- [ ] Separate crypto scanner page
- [ ] Crypto market sentiment analysis

### Long Term
- [ ] Real-time crypto price alerts
- [ ] Multi-exchange arbitrage detection
- [ ] DeFi protocol monitoring

---

## Risk Mitigation

### API Rate Limits
**Risk:** Hitting FreeCryptoAPI limit (100k/month)
**Mitigation:**
- Current usage: 1.2% (very low)
- Monitor via API dashboard
- Can scale to 200+ cryptos before concern

### Data Quality
**Risk:** Crypto data less reliable than stocks
**Mitigation:**
- Test thoroughly before production
- Compare against CoinGecko
- Add data validation checks

### Scanner Performance
**Risk:** Scanning 270 assets takes too long
**Mitigation:**
- Batch processing with delays
- Parallel API calls where safe
- Currently ~30 seconds for 128 stocks
- Est. ~45 seconds for 270 total (acceptable)

---

## Decision Points

### 1. How many cryptos to scan?
**Options:**
- Conservative: 10-15 (top market cap only)
- Balanced: 20-30 (recommended)
- Aggressive: 50+ (may hit limits)

**Recommendation:** Start with 20, expand based on results

### 2. Reduce stock universe for FMP limits?
**Options:**
- A: Keep 250 stocks, risk hitting daily limit
- B: Reduce to 230 stocks, leave buffer
- C: Upgrade FMP to Starter ($14.99/mo)

**Recommendation:** Option B initially, upgrade if needed

### 3. When to deploy?
**Options:**
- A: Deploy immediately after testing
- B: Wait for 1 week of stock-only validation
- C: Deploy to dev branch first

**Recommendation:** Option C (dev branch testing), then Option A

---

## Success Metrics

After 1 week of crypto scanning:

**Data Quality:**
- [ ] 95%+ uptime for crypto API calls
- [ ] Crypto recommendations have similar quality to stocks
- [ ] No major data discrepancies

**Performance:**
- [ ] Full scan completes in <60 seconds
- [ ] No rate limit errors
- [ ] Database operations smooth

**User Value:**
- [ ] Crypto recommendations actionable
- [ ] Scoring reflects crypto volatility appropriately
- [ ] UI clearly distinguishes stocks vs crypto

---

Last Updated: 2025-11-23
Status: Implementation Plan - Ready to Execute
Next Step: User signs up for FreeCryptoAPI key
