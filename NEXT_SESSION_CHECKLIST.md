# Next Session Checklist - Earnings Sentiment Analyzer

**Session Goal:** Build and test MVP of earnings analyzer with single stock (AAPL Q4 2024)
**Estimated Time:** 60-90 minutes
**Prerequisites:** MCP servers tested ✅, documentation complete ✅

---

## Pre-Session Setup (5 minutes)

### 1. Review Documentation
- [ ] Read `docs/EARNINGS_SENTIMENT_ANALYZER.md` (skim for architecture)
- [ ] Review `docs/MCP_TEST_RESULTS.md` (verify test results)
- [ ] Check `.claude/session-log.md` (confirm current status)

### 2. Verify Environment
- [ ] MCP servers still connected (run `/mcp` command in Claude Code)
- [ ] Supabase dashboard accessible
- [ ] `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`

---

## Phase 1: Database Setup (10 minutes)

### Task 1.1: Create Migration File
```bash
# Create new file
code supabase/migrations/20251124000000_create_earnings_insights.sql
```

**Copy schema from:** `docs/EARNINGS_SENTIMENT_ANALYZER.md` (section: "Database Schema")

**Key sections to include:**
- `CREATE TABLE earnings_insights` with all columns
- Indexes on `symbol`, `earnings_date`, `sentiment_score`
- RLS policies (read for authenticated, write for service_role)
- Unique constraint on `(symbol, earnings_date)`

### Task 1.2: Apply Migration
1. Open Supabase Dashboard → SQL Editor
2. Paste migration SQL
3. Click "Run"
4. Verify table created: Check "Table Editor" → `earnings_insights`

### Task 1.3: Verify Schema
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'earnings_insights';

-- Expected: 15+ columns including symbol, sentiment_score, key_themes, etc.
```

**Checklist:**
- [ ] Table `earnings_insights` exists
- [ ] All columns present (symbol, sentiment_score, confidence, key_themes, etc.)
- [ ] RLS policies active (authenticated users can read)

---

## Phase 2: Test Script (15 minutes)

### Task 2.1: Create Test File
```bash
# Create new file
code scripts/test-earnings.ts
```

**Template:**
```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Temporary: Import MCP tools directly (or mock)
// Later: Move to lib/earningsAnalysis.ts

async function testEarningsAnalysis() {
  console.log('🔍 Testing Earnings Analyzer...\n');

  // Step 1: Search with Exa
  console.log('Step 1: Searching for AAPL Q4 2024 earnings...');
  // TODO: Call mcp__exa__web_search_exa

  // Step 2: Scrape with Firecrawl
  console.log('Step 2: Scraping top source...');
  // TODO: Call mcp__firecrawl__firecrawl_scrape

  // Step 3: Analyze sentiment (mock for now)
  console.log('Step 3: Analyzing sentiment...');
  const mockSentiment = {
    sentiment_score: 82,
    sentiment_label: 'bullish',
    confidence: 90,
    key_themes: [
      'Services revenue growth accelerating (+12% YoY)',
      'iPhone 16 demand stable despite competition',
      'AI integration strategy praised by analysts'
    ]
  };

  // Step 4: Display results
  console.log('\n✅ Analysis Complete:');
  console.log(JSON.stringify(mockSentiment, null, 2));
}

testEarningsAnalysis().catch(console.error);
```

### Task 2.2: Add NPM Script
Edit `package.json`:
```json
{
  "scripts": {
    "test-earnings": "npx tsx scripts/test-earnings.ts"
  }
}
```

### Task 2.3: Run Test
```bash
npm run test-earnings
```

**Expected output:**
```
🔍 Testing Earnings Analyzer...

Step 1: Searching for AAPL Q4 2024 earnings...
Found 3 sources

Step 2: Scraping top source...
Scraped 5,000 words

Step 3: Analyzing sentiment...

✅ Analysis Complete:
{
  "sentiment_score": 82,
  "sentiment_label": "bullish",
  "confidence": 90,
  "key_themes": [...]
}
```

**Checklist:**
- [ ] Script runs without errors
- [ ] Exa returns 3+ sources
- [ ] Firecrawl extracts content (>1000 words)
- [ ] Mock sentiment displays correctly

---

## Phase 3: Core Library (20 minutes)

### Task 3.1: Create Types
Edit `lib/types.ts`:
```typescript
export interface EarningsInsight {
  symbol: string;
  earnings_date: string;
  quarter?: string;
  sentiment_score: number;
  sentiment_label: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  key_themes: string[];
  guidance_surprise?: 'beat' | 'meet' | 'miss' | 'no_guidance';
  revenue_surprise_pct?: number;
  eps_surprise_pct?: number;
  sources: EarningsSource[];
}

export interface EarningsSource {
  type: 'transcript' | 'analyst_report' | 'news';
  url: string;
  credibility: 'high' | 'medium' | 'low';
  title: string;
  date: string;
}
```

### Task 3.2: Create Core Functions
Create `lib/earningsAnalysis.ts`:

```typescript
import type { EarningsInsight, EarningsSource } from './types';

/**
 * Search for earnings-related content using Exa AI search
 */
export async function searchEarningsContent(
  symbol: string,
  quarter: string
): Promise<EarningsSource[]> {
  // TODO: Implement Exa search
  // Query: `${symbol} earnings call ${quarter} transcript analysis`
  // Return: Array of sources with credibility scores
  throw new Error('Not implemented');
}

/**
 * Scrape content from a URL using Firecrawl
 */
export async function scrapeEarningsContent(
  url: string
): Promise<string> {
  // TODO: Implement Firecrawl scrape
  // Return: Markdown content
  throw new Error('Not implemented');
}

/**
 * Analyze sentiment from scraped content
 */
export async function analyzeSentiment(
  content: string,
  sources: EarningsSource[]
): Promise<Partial<EarningsInsight>> {
  // TODO: Implement LLM-based sentiment analysis
  // For now, return mock data
  return {
    sentiment_score: 82,
    sentiment_label: 'bullish',
    confidence: 90,
    key_themes: [
      'Services growth accelerating',
      'iPhone demand stable',
      'AI strategy praised'
    ],
    guidance_surprise: 'beat'
  };
}

/**
 * Store earnings insight in database
 */
export async function storeEarningsInsight(
  insight: EarningsInsight
): Promise<void> {
  // TODO: Implement Supabase insert
  // Use service role key
  // Handle upsert on conflict (symbol, earnings_date)
  throw new Error('Not implemented');
}

/**
 * Main function: Analyze earnings for a symbol
 */
export async function analyzeEarnings(
  symbol: string,
  quarter: string
): Promise<EarningsInsight> {
  console.log(`Analyzing ${symbol} ${quarter} earnings...`);

  // 1. Search for sources
  const sources = await searchEarningsContent(symbol, quarter);
  console.log(`Found ${sources.length} sources`);

  // 2. Scrape top source
  const topSource = sources[0];
  const content = await scrapeEarningsContent(topSource.url);
  console.log(`Scraped ${content.length} characters`);

  // 3. Analyze sentiment
  const analysis = await analyzeSentiment(content, sources);

  // 4. Build full insight
  const insight: EarningsInsight = {
    symbol,
    earnings_date: new Date().toISOString().split('T')[0],
    quarter,
    ...analysis,
    sources
  } as EarningsInsight;

  // 5. Store in database
  await storeEarningsInsight(insight);

  return insight;
}
```

### Task 3.3: Update Test Script
Edit `scripts/test-earnings.ts` to use new library:
```typescript
import { analyzeEarnings } from '../lib/earningsAnalysis';

async function testEarningsAnalysis() {
  const insight = await analyzeEarnings('AAPL', 'Q4 2024');
  console.log('✅ Analysis Complete:', insight);
}
```

**Checklist:**
- [ ] `lib/types.ts` updated with earnings types
- [ ] `lib/earningsAnalysis.ts` created with function stubs
- [ ] Test script imports new library
- [ ] No TypeScript errors (`npm run typecheck`)

---

## Phase 4: Implement Search & Scrape (15 minutes)

### Task 4.1: Implement Exa Search
Edit `lib/earningsAnalysis.ts`:

```typescript
export async function searchEarningsContent(
  symbol: string,
  quarter: string
): Promise<EarningsSource[]> {
  const query = `${symbol} earnings call ${quarter} transcript analysis`;

  // TODO: Call MCP server (how to call from Node.js?)
  // For MVP, return hardcoded AAPL results from test

  return [
    {
      type: 'transcript',
      url: 'https://www.fool.com/earnings/call-transcripts/2024/10/31/apple-aapl-q4-2024-earnings-call-transcript/',
      credibility: 'high',
      title: 'Apple Q4 2024 Earnings Call Transcript',
      date: '2024-10-31'
    }
  ];
}
```

**Note:** MCP tools may not be callable from Node.js scripts directly. Options:
1. **Option A:** Hardcode test results for MVP
2. **Option B:** Create API endpoint that Claude Code can call
3. **Option C:** Use HTTP requests to MCP proxy (if available)

**Decision:** Start with Option A (hardcoded), move to Option B later.

### Task 4.2: Implement Firecrawl Scrape
Same approach - hardcode for MVP, then build API endpoint.

```typescript
export async function scrapeEarningsContent(url: string): Promise<string> {
  // TODO: Call Firecrawl MCP
  // For MVP, return mock transcript
  return `
    # Apple Q4 2024 Earnings Call

    **Tim Cook:** We're pleased to report record revenue...

    **Key Metrics:**
    - Revenue: $94.93B (beat estimates)
    - EPS: $1.64 (beat by $0.04)
    - Services: +12% YoY

    **Guidance:**
    - Q1 2025 revenue to grow low single digits
  `;
}
```

**Checklist:**
- [ ] Functions return realistic mock data
- [ ] Test script runs end-to-end
- [ ] Console output shows search → scrape → analyze flow

---

## Phase 5: Sentiment Analysis (10 minutes)

### Task 5.1: Implement Basic Sentiment Scoring
Edit `lib/earningsAnalysis.ts`:

```typescript
export async function analyzeSentiment(
  content: string,
  sources: EarningsSource[]
): Promise<Partial<EarningsInsight>> {
  // Simple keyword-based scoring (MVP)
  const bullishKeywords = ['beat', 'growth', 'strong', 'record', 'accelerating'];
  const bearishKeywords = ['miss', 'decline', 'weak', 'disappointing', 'cautious'];

  const lowerContent = content.toLowerCase();
  const bullishCount = bullishKeywords.filter(k => lowerContent.includes(k)).length;
  const bearishCount = bearishKeywords.filter(k => lowerContent.includes(k)).length;

  const netScore = bullishCount - bearishCount;
  const sentiment_score = Math.max(0, Math.min(100, 50 + (netScore * 10)));

  let sentiment_label: 'bullish' | 'neutral' | 'bearish';
  if (sentiment_score >= 60) sentiment_label = 'bullish';
  else if (sentiment_score >= 40) sentiment_label = 'neutral';
  else sentiment_label = 'bearish';

  return {
    sentiment_score,
    sentiment_label,
    confidence: 75, // Fixed for MVP
    key_themes: [
      'Services revenue growth accelerating',
      'iPhone demand stable',
      'AI strategy praised'
    ],
    guidance_surprise: netScore > 0 ? 'beat' : 'meet'
  };
}
```

**Note:** This is a simple keyword-based approach. Later, integrate with LLM for better accuracy.

**Checklist:**
- [ ] Function calculates sentiment score (0-100)
- [ ] Returns bullish/neutral/bearish label
- [ ] Mock key themes populated
- [ ] Test shows expected sentiment for AAPL (bullish)

---

## Phase 6: Database Integration (10 minutes)

### Task 6.1: Implement Store Function
Edit `lib/earningsAnalysis.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function storeEarningsInsight(
  insight: EarningsInsight
): Promise<void> {
  const { error } = await supabase
    .from('earnings_insights')
    .upsert({
      symbol: insight.symbol,
      earnings_date: insight.earnings_date,
      quarter: insight.quarter,
      sentiment_score: insight.sentiment_score,
      sentiment_label: insight.sentiment_label,
      confidence: insight.confidence,
      key_themes: insight.key_themes,
      guidance_surprise: insight.guidance_surprise,
      revenue_surprise_pct: insight.revenue_surprise_pct,
      eps_surprise_pct: insight.eps_surprise_pct,
      sources: JSON.stringify(insight.sources),
      analyzed_by: 'earnings_analyzer_v1'
    }, {
      onConflict: 'symbol,earnings_date'
    });

  if (error) {
    console.error('Failed to store earnings insight:', error);
    throw error;
  }

  console.log(`✅ Stored earnings insight for ${insight.symbol}`);
}
```

### Task 6.2: Test Database Write
```bash
npm run test-earnings
```

**Verify:**
1. Script completes without errors
2. Check Supabase Table Editor → `earnings_insights`
3. See new row for AAPL with sentiment data

**Checklist:**
- [ ] Data stored in database
- [ ] No duplicate rows (upsert working)
- [ ] JSON columns properly formatted
- [ ] Timestamps auto-populated

---

## Phase 7: Validation & Cleanup (10 minutes)

### Task 7.1: Manual Verification
1. **Check database:**
   ```sql
   SELECT symbol, sentiment_score, sentiment_label, confidence, key_themes
   FROM earnings_insights
   WHERE symbol = 'AAPL';
   ```

2. **Expected result:**
   - Symbol: AAPL
   - Sentiment Score: 70-90 (bullish range)
   - Sentiment Label: bullish
   - Confidence: 75-95
   - Key Themes: 3-5 items

### Task 7.2: Test Edge Cases
Run test with different scenarios:

```typescript
// Test 1: Bullish earnings (AAPL)
await analyzeEarnings('AAPL', 'Q4 2024');

// Test 2: Neutral earnings (mock)
// Modify scrapeEarningsContent to return mixed sentiment

// Test 3: Bearish earnings (mock)
// Modify scrapeEarningsContent to return negative sentiment
```

**Checklist:**
- [ ] Bullish case works (score 60-100)
- [ ] Neutral case works (score 40-60)
- [ ] Bearish case works (score 0-40)
- [ ] No crashes on missing data

### Task 7.3: Update Documentation
Edit `CLAUDE.md`:

```markdown
### Earnings Analyzer (Beta)
```bash
npm run test-earnings        # Analyze single stock (AAPL Q4 2024)
npm run analyze-earnings     # Coming soon: analyze multiple stocks
```

**Database:** `earnings_insights` table stores sentiment analysis results
**MCP Servers:** Firecrawl (scraping) + Exa (search)
**Status:** MVP complete, UI integration pending
```

**Checklist:**
- [ ] `CLAUDE.md` updated with earnings commands
- [ ] `README.md` mentions new feature (optional)
- [ ] Session log updated with completion status

---

## Post-Session Checklist

### Success Criteria
- [ ] Database table created and verified
- [ ] Test script runs end-to-end
- [ ] AAPL Q4 2024 analysis stored in database
- [ ] Sentiment score is reasonable (70-90 for bullish case)
- [ ] No TypeScript errors
- [ ] Documentation updated

### If Time Remaining
- [ ] Build simple UI component (`components/EarningsInsightCard.tsx`)
- [ ] Display on `/recommendations` page (mock data)
- [ ] Test with multiple stocks (add to test script)

### If Blocked
**Common issues:**
1. **MCP tools not callable from Node.js**
   - Solution: Use hardcoded data for MVP, build API endpoint later

2. **Sentiment analysis too simple**
   - Solution: Accept simple keyword-based scoring for MVP, improve with LLM later

3. **Database insert fails**
   - Solution: Check service role key in `.env.local`, verify RLS policies

### Next Session Goals
1. **Integrate with daily scanner** - Add earnings analysis to `scripts/dailyMarketScan.ts`
2. **Build UI components** - Display earnings cards on recommendations page
3. **Improve sentiment analysis** - Integrate with OpenAI/Anthropic API
4. **Add earnings calendar** - Auto-fetch upcoming earnings dates

---

## Quick Reference Commands

```bash
# Review docs
cat docs/EARNINGS_SENTIMENT_ANALYZER.md

# Create migration
code supabase/migrations/20251124000000_create_earnings_insights.sql

# Create test script
code scripts/test-earnings.ts

# Run test
npm run test-earnings

# Type check
npm run typecheck

# Check database
# (Open Supabase Dashboard → Table Editor → earnings_insights)
```

---

**END OF CHECKLIST**

**Estimated Total Time:** 60-90 minutes
**Key Milestone:** MVP working with single stock (AAPL Q4 2024)
**Next Milestone:** UI integration + multi-stock analysis
