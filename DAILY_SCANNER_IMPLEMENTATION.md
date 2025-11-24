# Daily Market Scanner Implementation Plan

**Goal:** Scan the entire market daily and generate actionable trade recommendations based on technical analysis

**Date:** November 22, 2025

---

## Overview

Build an end-of-day market scanner that:
1. Scans 500-1,000 most liquid stocks daily
2. Runs existing technical analysis (channel detection, patterns, signals)
3. Scores and ranks opportunities
4. Generates specific trade recommendations (entry, exit, stop loss)
5. Displays top 20-30 recommendations on dashboard

**Timeline:** 2-3 weeks for MVP

---

## Phase 1: Database Schema (Day 1-2)

### New Table: `trade_recommendations`

```sql
-- Create trade_recommendations table
CREATE TABLE trade_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  scan_date DATE NOT NULL,

  -- Trade Details
  recommendation_type VARCHAR(20) NOT NULL, -- 'long' or 'short'
  setup_type VARCHAR(50) NOT NULL, -- 'channel_breakout', 'support_bounce', 'reversal', etc.
  timeframe VARCHAR(20) NOT NULL, -- 'day_trade', 'swing_trade', 'position_trade'

  -- Entry/Exit/Stop
  entry_price DECIMAL(10,2) NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  stop_loss DECIMAL(10,2) NOT NULL,

  -- Risk/Reward
  risk_amount DECIMAL(10,2) NOT NULL, -- $ amount at risk
  reward_amount DECIMAL(10,2) NOT NULL, -- $ potential profit
  risk_reward_ratio DECIMAL(5,2) NOT NULL, -- e.g., 3.0 for 1:3

  -- Scoring
  opportunity_score INTEGER NOT NULL, -- 0-100
  confidence_level VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'

  -- Technical Context
  current_price DECIMAL(10,2) NOT NULL,
  channel_status VARCHAR(50),
  pattern_detected VARCHAR(50),
  volume_status VARCHAR(50), -- 'high', 'average', 'low'
  rsi DECIMAL(5,2),
  trend VARCHAR(20), -- 'uptrend', 'downtrend', 'sideways'

  -- Fundamental Context (optional)
  market_cap BIGINT,
  sector VARCHAR(50),

  -- Rationale
  rationale TEXT NOT NULL, -- Why this is a good trade

  -- Tracking
  is_active BOOLEAN DEFAULT true,
  outcome VARCHAR(20), -- 'hit_target', 'hit_stop', 'expired', 'pending'
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- When this recommendation is no longer valid

  -- Indexes
  CONSTRAINT unique_symbol_scan_date UNIQUE(symbol, scan_date)
);

-- Indexes for performance
CREATE INDEX idx_trade_recs_scan_date ON trade_recommendations(scan_date DESC);
CREATE INDEX idx_trade_recs_score ON trade_recommendations(opportunity_score DESC);
CREATE INDEX idx_trade_recs_active ON trade_recommendations(is_active) WHERE is_active = true;
CREATE INDEX idx_trade_recs_symbol ON trade_recommendations(symbol);

-- Row Level Security (if using Supabase)
ALTER TABLE trade_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read recommendations (or restrict to authenticated users)
CREATE POLICY "Trade recommendations are viewable by authenticated users"
  ON trade_recommendations FOR SELECT
  TO authenticated
  USING (true);
```

### New Table: `scan_universe`

```sql
-- Table to store which stocks to scan
CREATE TABLE scan_universe (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  sector VARCHAR(50),
  market_cap BIGINT,
  avg_volume BIGINT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMP DEFAULT NOW(),
  last_scanned_at TIMESTAMP
);

CREATE INDEX idx_scan_universe_active ON scan_universe(is_active) WHERE is_active = true;
```

### Migration Script

```typescript
// scripts/migrations/001_create_trade_recommendations.ts
import { supabase } from '@/lib/supabaseClient';

export async function up() {
  const { error } = await supabase.rpc('execute_sql', {
    sql: `
      -- Add the SQL from above here
    `
  });

  if (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  console.log('Migration completed successfully');
}
```

---

## Phase 2: Stock Universe Setup (Day 2-3)

### Define Scanning Universe

We'll scan the **top 500-1000 most liquid US stocks** to ensure:
- Good volume (can actually trade these)
- Price discovery (accurate technical analysis)
- Reduced noise (avoid penny stocks)

### Universe Criteria:
- Market cap > $1 billion
- Average daily volume > 1 million shares
- Price > $5 (avoid penny stocks)
- Listed on major exchanges (NYSE, NASDAQ)
- Excludes: ETFs, ADRs (for now)

### Data Source Options:

**Option 1: Pre-built List (Easiest)**
```typescript
// lib/scanUniverse.ts

// S&P 500 + Russell 1000 top volume stocks
// Can get this from free sources like:
// - Wikipedia S&P 500 list
// - NASDAQ API
// - IEX Cloud

const SP500_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
  // ... 492 more symbols
];

const POPULAR_STOCKS = [
  'AMD', 'PLTR', 'SOFI', 'RIVN', 'LCID', // Popular growth stocks
  'GME', 'AMC', // Meme stocks (high volume)
  // ... add more
];

export const SCAN_UNIVERSE = [...SP500_SYMBOLS, ...POPULAR_STOCKS];
```

**Option 2: Dynamic List (Better)**
```typescript
// scripts/updateScanUniverse.ts
import { supabase } from '@/lib/supabaseClient';

async function updateScanUniverse() {
  // Get top stocks by volume/market cap from your data provider
  // Example using Finnhub or FMP

  const stocks = await fetchTopStocks({
    minMarketCap: 1_000_000_000, // $1B
    minVolume: 1_000_000,
    minPrice: 5,
    limit: 1000
  });

  // Upsert into scan_universe table
  const { error } = await supabase
    .from('scan_universe')
    .upsert(stocks.map(s => ({
      symbol: s.symbol,
      company_name: s.name,
      sector: s.sector,
      market_cap: s.marketCap,
      avg_volume: s.avgVolume
    })));

  if (error) throw error;

  console.log(`Updated scan universe with ${stocks.length} stocks`);
}

// Run this weekly to keep universe fresh
updateScanUniverse();
```

### Populate Initial Universe

```bash
# Create a CSV with top 500 stocks
# Then import into database

npm run import-universe -- ./data/sp500.csv
```

---

## Phase 3: Scoring Algorithm (Day 3-5)

### Trade Opportunity Scoring System

Score each stock 0-100 based on technical strength:

```typescript
// lib/scoring.ts

interface ScoringFactors {
  // Trend Strength (30 points max)
  trendStrength: number;      // 0-30 based on channel clarity, slope

  // Pattern Quality (25 points max)
  patternQuality: number;     // 0-25 based on pattern type and confidence

  // Volume Confirmation (20 points max)
  volumeScore: number;        // 0-20 based on volume vs average

  // Risk/Reward (15 points max)
  riskRewardScore: number;    // 0-15 based on R:R ratio (want >2:1)

  // Momentum (10 points max)
  momentumScore: number;      // 0-10 based on RSI, MACD
}

export function calculateOpportunityScore(
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternResult,
  volume: VolumeAnalysis
): number {
  let score = 0;

  // 1. Trend Strength (0-30 points)
  if (channel.hasChannel) {
    const channelWidth = (channel.resistance - channel.support) / channel.support;
    const slope = calculateChannelSlope(candles, channel);

    // Clear channel = more points
    if (channelWidth < 0.05) score += 10; // Tight channel
    else if (channelWidth < 0.10) score += 7;
    else score += 4;

    // Strong trend = more points
    if (Math.abs(slope) > 0.02) score += 15; // Strong trend
    else if (Math.abs(slope) > 0.01) score += 10;
    else score += 5;

    // Price position in channel
    const currentPrice = candles[candles.length - 1].close;
    const channelPosition = (currentPrice - channel.support) /
                           (channel.resistance - channel.support);

    // Near support in uptrend or near resistance in downtrend = good entry
    if ((slope > 0 && channelPosition < 0.3) ||
        (slope < 0 && channelPosition > 0.7)) {
      score += 5;
    }
  }

  // 2. Pattern Quality (0-25 points)
  if (pattern.detected) {
    const patternScores = {
      'ascending_channel': 25,
      'descending_channel': 20,
      'support_bounce': 22,
      'resistance_break': 23,
      'double_bottom': 24,
      'head_and_shoulders': 18,
      'flag': 20,
      'wedge': 19
    };

    score += patternScores[pattern.type] || 10;
  }

  // 3. Volume Confirmation (0-20 points)
  const recentVolume = volume.last5DaysAvg;
  const historicalVolume = volume.last30DaysAvg;

  if (recentVolume > historicalVolume * 1.5) score += 20; // High volume
  else if (recentVolume > historicalVolume * 1.2) score += 15;
  else if (recentVolume > historicalVolume) score += 10;
  else score += 5;

  // 4. Risk/Reward (0-15 points)
  const entry = calculateEntryPrice(candles, channel, pattern);
  const target = calculateTargetPrice(candles, channel, pattern);
  const stop = calculateStopLoss(candles, channel, pattern);

  const riskReward = (target - entry) / (entry - stop);

  if (riskReward >= 3) score += 15;
  else if (riskReward >= 2) score += 12;
  else if (riskReward >= 1.5) score += 8;
  else score += 3;

  // 5. Momentum (0-10 points)
  const rsi = calculateRSI(candles);

  // RSI in "sweet spot" for entries
  if ((rsi > 30 && rsi < 40) || (rsi > 60 && rsi < 70)) score += 10;
  else if ((rsi > 40 && rsi < 50) || (rsi > 50 && rsi < 60)) score += 7;
  else score += 4;

  return Math.min(score, 100); // Cap at 100
}
```

### Confidence Level Assignment

```typescript
export function calculateConfidence(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}
```

---

## Phase 4: Entry/Exit/Stop Calculator (Day 5-7)

### Smart Entry, Target, and Stop Calculations

```typescript
// lib/tradeCalculator.ts

export interface TradeRecommendation {
  entry: number;
  target: number;
  stopLoss: number;
  riskReward: number;
  setup: string;
  rationale: string;
}

export function generateTradeRecommendation(
  symbol: string,
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternResult
): TradeRecommendation | null {

  const currentPrice = candles[candles.length - 1].close;
  const atr = calculateATR(candles, 14); // 14-day ATR

  // Determine setup type and direction
  const setup = determineSetupType(candles, channel, pattern);

  if (setup.type === 'long') {
    return generateLongRecommendation(symbol, candles, channel, pattern, atr);
  } else if (setup.type === 'short') {
    return generateShortRecommendation(symbol, candles, channel, pattern, atr);
  }

  return null; // No clear setup
}

function generateLongRecommendation(
  symbol: string,
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternResult,
  atr: number
): TradeRecommendation {

  const currentPrice = candles[candles.length - 1].close;

  // Entry: Slightly above current price or at support
  let entry: number;

  if (channel.hasChannel) {
    // Enter near support in uptrending channel
    const supportDistance = Math.abs(currentPrice - channel.support);

    if (supportDistance / currentPrice < 0.02) {
      // We're near support, enter here
      entry = currentPrice;
    } else {
      // Wait for pullback to support
      entry = channel.support * 1.005; // 0.5% above support
    }
  } else {
    // No channel, use current price
    entry = currentPrice;
  }

  // Stop Loss: Below support or using ATR
  let stopLoss: number;

  if (channel.hasChannel) {
    stopLoss = channel.support * 0.98; // 2% below support
  } else {
    stopLoss = entry - (atr * 2); // 2x ATR below entry
  }

  // Target: Resistance or using risk/reward
  let target: number;

  if (channel.hasChannel) {
    target = channel.resistance * 0.98; // Slightly below resistance
  } else {
    // Use 2:1 or 3:1 risk/reward
    const risk = entry - stopLoss;
    target = entry + (risk * 2.5); // 2.5:1 R:R
  }

  // Calculate risk/reward
  const riskReward = (target - entry) / (entry - stopLoss);

  // Generate rationale
  const rationale = generateRationale({
    symbol,
    setup: 'long',
    channelStatus: channel.hasChannel ? 'in_channel' : 'no_channel',
    pattern: pattern.detected ? pattern.type : 'none',
    entryReason: channel.hasChannel ? 'near_support' : 'momentum',
    targetReason: channel.hasChannel ? 'channel_resistance' : 'risk_reward',
  });

  return {
    entry: Number(entry.toFixed(2)),
    target: Number(target.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    riskReward: Number(riskReward.toFixed(2)),
    setup: 'Long - Channel Support',
    rationale
  };
}

function generateShortRecommendation(
  symbol: string,
  candles: Candle[],
  channel: ChannelDetectionResult,
  pattern: PatternResult,
  atr: number
): TradeRecommendation {
  // Similar logic but inverted for short trades
  // Entry near resistance
  // Stop above resistance
  // Target at support

  const currentPrice = candles[candles.length - 1].close;

  let entry = channel.hasChannel ? channel.resistance * 0.995 : currentPrice;
  let stopLoss = channel.hasChannel ? channel.resistance * 1.02 : entry + (atr * 2);
  let target = channel.hasChannel ? channel.support * 1.02 : entry - (entry - stopLoss) * 2.5;

  const riskReward = (entry - target) / (stopLoss - entry);

  const rationale = generateRationale({
    symbol,
    setup: 'short',
    channelStatus: channel.hasChannel ? 'in_channel' : 'no_channel',
    pattern: pattern.detected ? pattern.type : 'none',
    entryReason: channel.hasChannel ? 'near_resistance' : 'momentum',
    targetReason: channel.hasChannel ? 'channel_support' : 'risk_reward',
  });

  return {
    entry: Number(entry.toFixed(2)),
    target: Number(target.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    riskReward: Number(riskReward.toFixed(2)),
    setup: 'Short - Channel Resistance',
    rationale
  };
}

function generateRationale(params: any): string {
  const { symbol, setup, channelStatus, pattern, entryReason, targetReason } = params;

  let rationale = `**${symbol}** shows a ${setup} opportunity. `;

  if (channelStatus === 'in_channel') {
    rationale += `Stock is trading within a defined channel. `;

    if (setup === 'long') {
      rationale += `Entry near support offers favorable risk/reward for upside to resistance. `;
    } else {
      rationale += `Entry near resistance offers favorable risk/reward for downside to support. `;
    }
  }

  if (pattern !== 'none') {
    rationale += `${pattern} pattern detected, adding conviction. `;
  }

  rationale += `Stop placement provides clear invalidation point.`;

  return rationale;
}
```

---

## Phase 5: Daily Market Scanner (Day 7-12)

### Main Scanner Script

```typescript
// scripts/dailyMarketScan.ts

import { supabase } from '@/lib/supabaseClient';
import { getCandles } from '@/lib/marketData';
import { detectChannels } from '@/lib/analysis';
import { calculateOpportunityScore, calculateConfidence } from '@/lib/scoring';
import { generateTradeRecommendation } from '@/lib/tradeCalculator';

interface ScanResult {
  symbol: string;
  recommendation: TradeRecommendation | null;
  score: number;
  confidence: string;
  technicals: any;
}

async function runDailyMarketScan() {
  console.log('Starting daily market scan...');
  const scanDate = new Date().toISOString().split('T')[0];

  // 1. Get stock universe
  const { data: universe, error: universeError } = await supabase
    .from('scan_universe')
    .select('symbol')
    .eq('is_active', true)
    .limit(500); // Start with 500 stocks

  if (universeError) throw universeError;

  console.log(`Scanning ${universe.length} stocks...`);

  // 2. Process in batches of 50
  const batchSize = 50;
  const batches = [];

  for (let i = 0; i < universe.length; i += batchSize) {
    batches.push(universe.slice(i, i + batchSize));
  }

  const allRecommendations: any[] = [];

  for (const [batchIndex, batch] of batches.entries()) {
    console.log(`Processing batch ${batchIndex + 1}/${batches.length}...`);

    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(stock => analyzeSingleStock(stock.symbol, scanDate))
    );

    // Filter successful results
    const successfulResults = batchResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<ScanResult>).value)
      .filter(result => result.recommendation !== null);

    allRecommendations.push(...successfulResults);

    // Rate limiting: wait 1 second between batches
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Found ${allRecommendations.length} trade opportunities`);

  // 3. Sort by score and take top 30
  const topRecommendations = allRecommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  console.log(`Storing top ${topRecommendations.length} recommendations...`);

  // 4. Store in database
  const recommendationsToStore = topRecommendations.map(rec => ({
    symbol: rec.symbol,
    scan_date: scanDate,
    recommendation_type: rec.recommendation.setup.toLowerCase().includes('long') ? 'long' : 'short',
    setup_type: rec.recommendation.setup,
    timeframe: 'swing_trade', // Can be dynamic based on analysis
    entry_price: rec.recommendation.entry,
    target_price: rec.recommendation.target,
    stop_loss: rec.recommendation.stopLoss,
    risk_amount: rec.recommendation.entry - rec.recommendation.stopLoss,
    reward_amount: rec.recommendation.target - rec.recommendation.entry,
    risk_reward_ratio: rec.recommendation.riskReward,
    opportunity_score: rec.score,
    confidence_level: rec.confidence,
    current_price: rec.technicals.currentPrice,
    channel_status: rec.technicals.channelStatus,
    pattern_detected: rec.technicals.pattern,
    volume_status: rec.technicals.volumeStatus,
    rsi: rec.technicals.rsi,
    trend: rec.technicals.trend,
    rationale: rec.recommendation.rationale,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  }));

  const { error: insertError } = await supabase
    .from('trade_recommendations')
    .insert(recommendationsToStore);

  if (insertError) {
    console.error('Error storing recommendations:', insertError);
    throw insertError;
  }

  console.log(`✅ Daily scan complete! ${topRecommendations.length} recommendations stored.`);

  // 5. Send summary notification (optional)
  await sendScanSummary(topRecommendations);
}

async function analyzeSingleStock(symbol: string, scanDate: string): Promise<ScanResult> {
  try {
    // Get 60 days of daily candles
    const candles = await getCandles(symbol, '1D', 60);

    if (!candles || candles.length < 20) {
      throw new Error(`Insufficient data for ${symbol}`);
    }

    // Run technical analysis
    const channel = detectChannels(candles);
    const pattern = detectPatterns(candles); // You'll need to implement this
    const volume = analyzeVolume(candles); // You'll need to implement this

    // Calculate score
    const score = calculateOpportunityScore(candles, channel, pattern, volume);
    const confidence = calculateConfidence(score);

    // Only proceed if score is decent (>= 60)
    if (score < 60) {
      return {
        symbol,
        recommendation: null,
        score,
        confidence,
        technicals: null
      };
    }

    // Generate trade recommendation
    const recommendation = generateTradeRecommendation(symbol, candles, channel, pattern);

    if (!recommendation) {
      return {
        symbol,
        recommendation: null,
        score,
        confidence,
        technicals: null
      };
    }

    // Calculate current technicals
    const currentPrice = candles[candles.length - 1].close;
    const rsi = calculateRSI(candles);
    const trend = determineTrend(candles);

    return {
      symbol,
      recommendation,
      score,
      confidence,
      technicals: {
        currentPrice,
        channelStatus: channel.hasChannel ? 'in_channel' : 'no_channel',
        pattern: pattern.detected ? pattern.type : null,
        volumeStatus: volume.status,
        rsi,
        trend
      }
    };

  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    throw error;
  }
}

async function sendScanSummary(recommendations: ScanResult[]) {
  // Could send email, push notification, etc.
  console.log('\n📊 SCAN SUMMARY:');
  console.log(`Total opportunities: ${recommendations.length}`);
  console.log(`High confidence: ${recommendations.filter(r => r.confidence === 'high').length}`);
  console.log(`Medium confidence: ${recommendations.filter(r => r.confidence === 'medium').length}`);
  console.log('\nTop 5 Recommendations:');

  recommendations.slice(0, 5).forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.symbol} - Score: ${rec.score} (${rec.confidence})`);
    console.log(`   ${rec.recommendation?.setup}`);
    console.log(`   Entry: $${rec.recommendation?.entry} | Target: $${rec.recommendation?.target} | Stop: $${rec.recommendation?.stopLoss}`);
  });
}

// Run the scan
runDailyMarketScan()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Scan failed:', error);
    process.exit(1);
  });
```

### Schedule with Cron

```typescript
// Use node-cron or deploy as serverless function

import cron from 'node-cron';

// Run every weekday at 5:00 PM ET (after market close)
cron.schedule('0 17 * * 1-5', async () => {
  console.log('Running scheduled market scan...');
  await runDailyMarketScan();
}, {
  timezone: "America/New_York"
});
```

**Or use Vercel Cron (serverless):**

```typescript
// pages/api/cron/daily-scan.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { runDailyMarketScan } from '@/scripts/dailyMarketScan';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is coming from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await runDailyMarketScan();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Scan failed:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
}
```

**Add to vercel.json:**

```json
{
  "crons": [{
    "path": "/api/cron/daily-scan",
    "schedule": "0 21 * * 1-5"
  }]
}
```

---

## Phase 6: UI Implementation (Day 12-15)

### New Page: Trade Recommendations

```tsx
// app/recommendations/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Shield, Calendar } from 'lucide-react';
import Link from 'next/link';

interface TradeRecommendation {
  id: string;
  symbol: string;
  scan_date: string;
  recommendation_type: 'long' | 'short';
  setup_type: string;
  timeframe: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_reward_ratio: number;
  opportunity_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  current_price: number;
  channel_status: string;
  pattern_detected: string | null;
  trend: string;
  rationale: string;
  created_at: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<TradeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');

  useEffect(() => {
    loadRecommendations();
  }, [filter]);

  async function loadRecommendations() {
    setLoading(true);

    let query = supabase
      .from('trade_recommendations')
      .select('*')
      .eq('is_active', true)
      .order('opportunity_score', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('confidence_level', filter);
    }

    const { data, error } = await query.limit(30);

    if (error) {
      console.error('Error loading recommendations:', error);
    } else {
      setRecommendations(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="p-8">Loading recommendations...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Daily Trade Recommendations
          </h1>
          <p className="text-slate-600">
            Algorithmically generated opportunities based on technical analysis
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            All ({recommendations.length})
          </Button>
          <Button
            variant={filter === 'high' ? 'default' : 'outline'}
            onClick={() => setFilter('high')}
            className={filter === 'high' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            High Confidence
          </Button>
          <Button
            variant={filter === 'medium' ? 'default' : 'outline'}
            onClick={() => setFilter('medium')}
            className={filter === 'medium' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Medium Confidence
          </Button>
        </div>

        {/* Recommendations Grid */}
        <div className="grid gap-4">
          {recommendations.map((rec) => (
            <TradeRecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>

        {recommendations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">
                No recommendations found. Check back after market close for fresh opportunities.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TradeRecommendationCard({ recommendation: rec }: { recommendation: TradeRecommendation }) {
  const isLong = rec.recommendation_type === 'long';
  const potential = ((rec.target_price - rec.entry_price) / rec.entry_price) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/ticker/${rec.symbol}`}
              className="text-2xl font-bold text-slate-900 hover:text-emerald-600"
            >
              {rec.symbol}
            </Link>

            <Badge className={isLong ? 'bg-emerald-600' : 'bg-red-600'}>
              {isLong ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {rec.recommendation_type.toUpperCase()}
            </Badge>

            <Badge
              variant="outline"
              className={
                rec.confidence_level === 'high'
                  ? 'border-emerald-500 text-emerald-700'
                  : rec.confidence_level === 'medium'
                  ? 'border-blue-500 text-blue-700'
                  : 'border-slate-500 text-slate-700'
              }
            >
              {rec.confidence_level} confidence
            </Badge>

            <span className="text-sm text-slate-500">
              Score: {rec.opportunity_score}/100
            </span>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-500">Current</div>
            <div className="text-xl font-semibold text-slate-900">
              ${rec.current_price.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Setup Type */}
        <div className="mb-4">
          <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
            {rec.setup_type}
          </span>
        </div>

        {/* Trade Details */}
        <div className="grid grid-cols-4 gap-4 mb-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <div className="text-xs text-slate-500 mb-1">Entry</div>
            <div className="text-lg font-semibold text-slate-900">
              ${rec.entry_price.toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Target
            </div>
            <div className="text-lg font-semibold text-emerald-600">
              ${rec.target_price.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-600">
              +{potential.toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Stop Loss
            </div>
            <div className="text-lg font-semibold text-red-600">
              ${rec.stop_loss.toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-1">Risk/Reward</div>
            <div className="text-lg font-semibold text-blue-600">
              1:{rec.risk_reward_ratio.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Rationale */}
        <div className="mb-4">
          <p className="text-sm text-slate-700">{rec.rationale}</p>
        </div>

        {/* Technical Details */}
        <div className="flex flex-wrap gap-2">
          {rec.channel_status && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {rec.channel_status.replace('_', ' ')}
            </span>
          )}
          {rec.pattern_detected && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {rec.pattern_detected.replace('_', ' ')}
            </span>
          )}
          {rec.trend && (
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
              {rec.trend}
            </span>
          )}
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(rec.scan_date).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Add to Navigation

```tsx
// Update your navigation to include link to /recommendations
<Link href="/recommendations">
  <Button variant="ghost">
    Trade Ideas
  </Button>
</Link>
```

---

## Phase 7: Testing & Refinement (Day 15-18)

### Testing Checklist

1. **Unit Tests**
   - ✅ Scoring algorithm produces reasonable scores
   - ✅ Entry/exit/stop calculations are logical
   - ✅ Risk/reward ratios are correct

2. **Integration Tests**
   - ✅ Scanner can process 500 stocks without errors
   - ✅ Database stores recommendations correctly
   - ✅ UI displays recommendations properly

3. **Manual Testing**
   - ✅ Review top 10 recommendations manually
   - ✅ Check if entry/exit/stop levels make sense
   - ✅ Verify rationales are accurate
   - ✅ Test with different market conditions

4. **Performance Testing**
   - ✅ Scanner completes in reasonable time (< 30 min)
   - ✅ API rate limits not exceeded
   - ✅ Database queries are fast

### Backtesting (Optional but Recommended)

```typescript
// scripts/backtest.ts

// Test the scanner on historical dates
// Did the recommendations from 30 days ago work?

async function backtestRecommendations(daysBack: number = 30) {
  const testDate = new Date();
  testDate.setDate(testDate.getDate() - daysBack);

  // Re-run scanner on historical data
  // Track which trades would have hit target vs stop
  // Calculate win rate and avg R:R
}
```

---

## Deployment Checklist

- [ ] Database migrations applied to production
- [ ] Stock universe populated
- [ ] Cron job configured (Vercel Cron or other)
- [ ] Environment variables set (API keys, cron secrets)
- [ ] UI deployed and accessible
- [ ] Error monitoring configured (Sentry, etc.)
- [ ] First manual scan run successfully
- [ ] Alert system tested

---

## Success Metrics

Track these to measure scanner effectiveness:

1. **Coverage**
   - How many stocks scanned daily
   - How many opportunities found
   - Distribution of confidence levels

2. **Quality**
   - Avg opportunity score
   - Avg risk/reward ratio
   - Diversity of setups (not all the same pattern)

3. **Outcomes (after 30+ days)**
   - Win rate (what % hit target before stop)
   - Avg return per trade
   - Max drawdown if following all recommendations

4. **User Engagement**
   - Page views on /recommendations
   - Click-through rate to ticker pages
   - Watchlist additions from recommendations

---

## Future Enhancements

Once MVP is working:

1. **Multi-timeframe Analysis**
   - Swing trades (current)
   - Day trades (5-min charts)
   - Position trades (weekly charts)

2. **Sector/Theme Grouping**
   - Group recommendations by sector
   - Highlight sector rotation plays
   - Thematic opportunities (AI, EVs, etc.)

3. **User Customization**
   - Filter by risk/reward threshold
   - Preferred sectors
   - Long-only or include shorts
   - Minimum liquidity requirements

4. **Options Strategies**
   - Not just stock entries
   - Calls/puts recommendations
   - Spreads for defined risk

5. **Alerts**
   - Email daily summary of top 5
   - Push notification when high-confidence trade found
   - Price alerts when entry levels hit

6. **Performance Tracking**
   - Virtual portfolio of all recommendations
   - Public performance dashboard
   - Learn from outcomes to improve algorithm

---

## Cost Estimate

**Data Costs:**
- 500 stocks × 60 days of daily data = minimal (most providers include this in free tier)
- Finnhub: Free tier supports 60 API calls/minute = enough for batched scanning

**Infrastructure:**
- Supabase: Free tier likely sufficient
- Vercel: Free tier supports cron jobs
- Total: **$0-50/month** depending on scale

**Development Time:**
- MVP: 2-3 weeks (1 developer)
- Enhancements: Ongoing

---

## Example Output

What users will see each morning:

```
📊 DAILY TRADE RECOMMENDATIONS - Nov 22, 2025

HIGH CONFIDENCE (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NVDA - Long - Channel Support Bounce
   Score: 87/100 | R:R 1:3.2
   Entry: $490 | Target: $525 | Stop: $475
   "NVDA in strong uptrend, pullback to 50-day MA support..."

2. AAPL - Long - Double Bottom Pattern
   Score: 82/100 | R:R 1:2.8
   Entry: $178 | Target: $188 | Stop: $174
   "Double bottom at $175 support, bullish reversal..."

3. TSLA - Short - Resistance Rejection
   Score: 79/100 | R:R 1:2.5
   Entry: $245 | Target: $230 | Stop: $252
   "Failed breakout above $250, bearish channel..."

MEDIUM CONFIDENCE (8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. AMD - Long - Ascending Channel
   Score: 72/100 | R:R 1:2.3
   ...

```

---

## Next Steps

1. ✅ Review this implementation plan
2. ✅ Create database tables (Phase 1)
3. ✅ Populate stock universe (Phase 2)
4. ✅ Build scoring algorithm (Phase 3)
5. ✅ Implement trade calculator (Phase 4)
6. ✅ Create scanner script (Phase 5)
7. ✅ Build UI (Phase 6)
8. ✅ Test & deploy (Phase 7)

---

*This gives you actionable trade recommendations WITHOUT needing to build a full AI assistant first. The scanner uses your existing technical analysis capabilities to find and rank opportunities automatically.*

*Once this is working well, you can layer on the AI assistant to explain the recommendations, answer questions, and provide more personalized guidance.*
