# Phase 2: Populate Scan Universe

This guide will help you populate your `scan_universe` table with ~120 top liquid stocks for daily scanning.

---

## Step 1: Get Your Supabase Service Role Key

The populate script needs elevated permissions (bypasses RLS) to insert into `scan_universe`.

### How to get it:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** (gear icon on left sidebar)
4. Click **API** tab
5. Scroll down to **Project API keys**
6. Find the **service_role** key (keep this secret!)
7. Click the eye icon to reveal it, then copy

---

## Step 2: Add Service Role Key to .env.local

1. Open (or create) `.env.local` in your project root
2. Add this line:

```env
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

Your `.env.local` should look something like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...   # <-- ADD THIS
```

**⚠️ IMPORTANT**: Never commit `.env.local` to git. The service role key has full database access.

---

## Step 3: Install ts-node (if not already installed)

The populate script uses TypeScript. Install ts-node globally:

```bash
npm install -g ts-node
```

Or use npx (no installation needed):

```bash
# npx will download and run ts-node automatically
```

---

## Step 4: Run the Populate Script

From your project directory:

```bash
cd C:\Users\Aubrey\onedrive\documents\Bolt.New\personal-trading-cockpit\project

npm run populate-universe
```

You should see output like:

```
═══════════════════════════════════════════════════
  POPULATE SCAN UNIVERSE
═══════════════════════════════════════════════════

🚀 Starting scan universe population...

📊 Total stocks to insert: 120

📦 Processing batch 1/2...
✅ Processed 100 stocks
📦 Processing batch 2/2...
✅ Processed 20 stocks

🎉 Population complete!

📈 Summary:
  Total attempted: 120
  Successful: 120
  Errors: 0

✅ Active stocks in scan_universe: 120

📊 Breakdown by sector:
  Technology: 55
  Financial: 18
  Consumer Cyclical: 15
  Healthcare: 12
  ...

📊 Breakdown by source:
  sp500: 95
  high_volume: 20
  nasdaq: 5

✅ Scan universe is ready for daily scanning!
```

---

## Step 5: Verify in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. Select `scan_universe` table
3. You should see ~120 stocks

Sample rows:
| symbol | company_name | sector | data_source | is_active |
|--------|--------------|--------|-------------|-----------|
| AAPL | Apple Inc. | Technology | sp500 | true |
| MSFT | Microsoft Corporation | Technology | sp500 | true |
| TSLA | Tesla Inc. | Consumer Cyclical | sp500 | true |

---

## What's Included?

The initial universe includes:

- **S&P 500 Top Stocks** (~95 stocks)
  - Mega-cap tech (AAPL, MSFT, GOOGL, NVDA, META, etc.)
  - Financial leaders (JPM, BAC, V, MA, etc.)
  - Healthcare giants (UNH, JNJ, LLY, etc.)
  - Consumer staples (WMT, HD, COST, etc.)
  - Energy, Industrials, Materials, Utilities

- **High-Volume Growth Stocks** (~20 stocks)
  - Popular trading stocks (PLTR, SOFI, RIVN, etc.)
  - Meme stocks (GME, AMC)
  - Crypto-related (COIN, MARA, RIOT)
  - Hot tech (UBER, SNAP, RBLX, etc.)

- **Semiconductors & AI** (~5 stocks)
  - TSM, ASML, ARM, etc.

---

## Troubleshooting

### Error: "Missing Supabase credentials"

**Solution**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`

### Error: "RLS policy violation"

**Solution**: You're using the anon key instead of service role key. Double-check `.env.local`

### Error: "ts-node: command not found"

**Solution**: The script command uses `npx ts-node` which will download it automatically. Just run:
```bash
npm run populate-universe
```

### Stocks already exist (running script again)

**No problem!** The script uses `upsert` which updates existing records. Running it multiple times is safe.

---

## Expanding the Universe (Optional)

Want to add more stocks? Edit `scripts/stockUniverse.ts`:

```typescript
export const STOCK_UNIVERSE: StockUniverseEntry[] = [
  // ... existing stocks ...

  // Add your custom stocks here:
  { symbol: 'HOOD', company_name: 'Robinhood Markets Inc.', sector: 'Financial', data_source: 'custom' },
  { symbol: 'DKNG', company_name: 'DraftKings Inc.', sector: 'Consumer Cyclical', data_source: 'custom' },
  // ... add up to 500-1000 total
];
```

Then re-run:
```bash
npm run populate-universe
```

---

## Next Steps

Once your scan universe is populated, you're ready for **Phase 3: Build Enhanced Scoring Algorithm**!

The scan universe is now ready. The daily scanner will use this list to scan all ~120 stocks and generate trade recommendations.

---

## Files Created

- ✅ `scripts/stockUniverse.ts` - Stock data (120 stocks)
- ✅ `scripts/populateScanUniverse.ts` - Population script
- ✅ `.env.local.example` - Environment variable template
- ✅ `package.json` - Added `populate-universe` script

---

**Questions?** Check the main `DAILY_SCANNER_IMPLEMENTATION.md` for the overall plan.
