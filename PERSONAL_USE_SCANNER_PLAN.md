# Personal Use Trading Scanner - MVP Plan

**Philosophy:** Build for yourself first, validate with your own capital, scale when proven.

**Date:** November 22, 2025

---

## Overview

**Stage 1: Personal Use (Weeks 1-8)**
- You are the only user
- Test with amounts you can afford to lose
- Focus on learning what works
- Build outcome tracking from day 1
- Iterate rapidly based on real trading results

**Stage 2: Validation (Weeks 9-16)**
- 60+ days of tracked outcomes
- Documented win rate, avg R:R, lessons learned
- Refinements based on what actually worked
- Decision point: Does this work well enough to share?

**Stage 3: Scalable Product (Weeks 17+)**
- Legal review and proper disclaimers
- Multi-user architecture
- Public performance tracking
- Monetization strategy

**Current Focus: Stage 1 - Build Your Personal Trading Assistant**

---

## Stage 1: Personal Use MVP (2-3 Weeks)

### Core Principles

1. **Build what YOU need to make better trading decisions**
2. **Track outcomes religiously** (this is your validation dataset)
3. **Architect for scale** (but don't over-engineer)
4. **Iterate fast** (you can change it daily if needed)
5. **No legal concerns yet** (you're not advising others)

---

## Week 1: Foundation + Basic Scanner

### Day 1-2: Database Schema

**Focus:** Set up tables that support personal use NOW and multi-user LATER

```sql
-- Personal use: All records belong to you
-- Future scale: Add user_id column, RLS policies

-- Screening Results (what the scanner finds)
CREATE TABLE screening_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Future-proof: user_id for multi-user
  user_id UUID, -- NULL for now, add later

  scan_date DATE NOT NULL,
  symbol VARCHAR(10) NOT NULL,

  -- Trade Details
  direction VARCHAR(10) NOT NULL, -- 'long' or 'short'
  setup_type VARCHAR(50) NOT NULL,
  timeframe VARCHAR(20) NOT NULL, -- 'swing' for now

  -- Levels
  entry_price DECIMAL(10,2) NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  stop_loss DECIMAL(10,2) NOT NULL,

  -- Risk/Reward
  risk_dollars DECIMAL(10,2),
  reward_dollars DECIMAL(10,2),
  risk_reward_ratio DECIMAL(5,2),

  -- Scoring
  score INTEGER NOT NULL,
  confidence_level VARCHAR(20),

  -- Technical Context
  current_price DECIMAL(10,2),
  channel_status VARCHAR(50),
  pattern VARCHAR(50),
  rsi DECIMAL(5,2),
  trend VARCHAR(20),

  -- Market Context
  spy_trend VARCHAR(10), -- 'bull', 'bear', 'neutral'
  vix_level DECIMAL(5,2),

  -- Notes (YOUR notes about why you like/don't like this)
  personal_notes TEXT,

  -- Your Decision
  action_taken VARCHAR(20), -- 'entered', 'passed', 'watching'

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_symbol_scan_date UNIQUE(symbol, scan_date)
);

CREATE INDEX idx_screening_scan_date ON screening_results(scan_date DESC);
CREATE INDEX idx_screening_score ON screening_results(score DESC);
CREATE INDEX idx_screening_action ON screening_results(action_taken);

-- Your Actual Trades (what you actually did)
CREATE TABLE my_trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  screening_result_id UUID REFERENCES screening_results(id), -- Link to what scanner suggested

  symbol VARCHAR(10) NOT NULL,
  direction VARCHAR(10) NOT NULL,

  -- What you actually did (might differ from scanner)
  actual_entry DECIMAL(10,2) NOT NULL,
  actual_target DECIMAL(10,2),
  actual_stop DECIMAL(10,2) NOT NULL,
  position_size INTEGER, -- Number of shares

  -- Entry
  entry_date DATE NOT NULL,
  entry_price DECIMAL(10,2) NOT NULL,
  entry_notes TEXT,

  -- Exit (NULL while position is open)
  exit_date DATE,
  exit_price DECIMAL(10,2),
  exit_reason VARCHAR(50), -- 'hit_target', 'hit_stop', 'manual_exit', 'time_stop'
  exit_notes TEXT,

  -- Performance
  gross_pnl DECIMAL(10,2),
  r_multiple DECIMAL(5,2), -- How many R did you make/lose?
  hold_days INTEGER,

  -- Lessons Learned
  what_worked TEXT,
  what_didnt_work TEXT,
  key_lesson TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_my_trades_status ON my_trades(status);
CREATE INDEX idx_my_trades_entry_date ON my_trades(entry_date DESC);
CREATE INDEX idx_my_trades_symbol ON my_trades(symbol);

-- Scanner Performance Tracking
-- (Track what the scanner suggested vs what happened)
CREATE TABLE scanner_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  screening_result_id UUID REFERENCES screening_results(id),
  symbol VARCHAR(10) NOT NULL,
  scan_date DATE NOT NULL,

  -- Scanner's suggestion
  suggested_entry DECIMAL(10,2),
  suggested_target DECIMAL(10,2),
  suggested_stop DECIMAL(10,2),
  score INTEGER,
  confidence_level VARCHAR(20),

  -- What actually happened (tracked daily)
  highest_price_reached DECIMAL(10,2),
  lowest_price_reached DECIMAL(10,2),
  days_to_target INTEGER,
  days_to_stop INTEGER,

  -- Outcome
  outcome VARCHAR(20), -- 'hit_target', 'hit_stop', 'expired', 'in_progress'
  outcome_date DATE,

  -- If this setup worked, how many R?
  theoretical_r_multiple DECIMAL(5,2),

  -- Notes
  why_it_worked TEXT,
  why_it_failed TEXT,

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scanner_perf_outcome ON scanner_performance(outcome);
CREATE INDEX idx_scanner_perf_date ON scanner_performance(scan_date DESC);
```

**Why This Schema:**
- `screening_results` = What the scanner finds daily
- `my_trades` = What YOU actually trade (might not be from scanner)
- `scanner_performance` = Track if scanner suggestions would have worked (whether you traded them or not)

This gives you THREE data streams:
1. Scanner suggestions
2. Your actual trading
3. Scanner validation (did it work?)

---

### Day 3-4: Market Scanner Core

**Start Simple: 100-200 Most Liquid Stocks**

```typescript
// lib/personalScanner.ts

import { supabase } from '@/lib/supabaseClient';
import { getCandles } from '@/lib/marketData';
import { detectChannels } from '@/lib/analysis';
import { analyzeMarketRegime } from '@/lib/marketRegime';

// Your personal stock universe (start small)
const MY_UNIVERSE = [
  // Mega caps
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',

  // High volume tech
  'AMD', 'AVGO', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'INTC',

  // Finance
  'JPM', 'BAC', 'WFC', 'GS', 'MS',

  // Popular meme/momentum
  'GME', 'AMC', 'PLTR', 'SOFI', 'RIVN',

  // SPY, QQQ for market context
  'SPY', 'QQQ', 'IWM',

  // Add your favorites here
  // ... expand to 100-200 as you see fit
];

interface PersonalScanResult {
  symbol: string;
  score: number;
  confidence: string;
  entry: number;
  target: number;
  stop: number;
  riskReward: number;
  setup: string;
  notes: string;
  technicals: {
    currentPrice: number;
    rsi: number;
    trend: string;
    channelStatus: string;
    pattern: string | null;
  };
  marketContext: {
    spyTrend: string;
    vix: number;
  };
}

export async function runPersonalScan(): Promise<PersonalScanResult[]> {
  console.log('🔍 Running personal market scan...');

  // Step 1: Check market regime
  const marketRegime = await analyzeMarketRegime();
  console.log(`📊 Market Regime: ${marketRegime.trend}, VIX: ${marketRegime.vix}`);

  // Step 2: Scan universe
  const results: PersonalScanResult[] = [];

  for (const symbol of MY_UNIVERSE) {
    try {
      const result = await analyzeSymbol(symbol, marketRegime);
      if (result && result.score >= 60) { // Only show decent setups
        results.push(result);
      }
    } catch (error) {
      console.error(`Error scanning ${symbol}:`, error);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 200)); // 200ms between requests
  }

  // Step 3: Sort by score
  results.sort((a, b) => b.score - a.score);

  console.log(`✅ Found ${results.length} opportunities`);

  return results;
}

async function analyzeSymbol(
  symbol: string,
  marketRegime: any
): Promise<PersonalScanResult | null> {

  // Get 60 days of daily data
  const candles = await getCandles(symbol, '1D', 60);

  if (!candles || candles.length < 30) {
    return null;
  }

  // Run your existing analysis
  const channel = detectChannels(candles);
  const rsi = calculateRSI(candles);
  const trend = determineTrend(candles);

  // Calculate entry/exit/stop
  const trade = calculateTradeSetup(candles, channel, trend);

  if (!trade) {
    return null; // No valid setup
  }

  // Score it
  let score = 0;

  // Market regime alignment (20 pts)
  if (marketRegime.trend === 'bull' && trade.direction === 'long') {
    score += 20;
  } else if (marketRegime.trend === 'bear' && trade.direction === 'short') {
    score += 20;
  } else {
    score += 5; // Fighting the trend
  }

  // Trend strength (20 pts)
  if (channel.hasChannel) {
    score += 15;
    if (channel.slope > 0.01) score += 5; // Strong trend
  } else {
    score += 5;
  }

  // Pattern (20 pts)
  const pattern = detectBasicPattern(candles, channel);
  if (pattern) {
    score += 15;
  }

  // Risk/Reward (20 pts)
  if (trade.riskReward >= 3) score += 20;
  else if (trade.riskReward >= 2.5) score += 15;
  else if (trade.riskReward >= 2) score += 10;
  else score += 5;

  // RSI (10 pts)
  if (trade.direction === 'long' && rsi > 30 && rsi < 50) score += 10;
  else if (trade.direction === 'short' && rsi > 50 && rsi < 70) score += 10;
  else score += 5;

  // Volume (10 pts)
  const volumeScore = analyzeVolume(candles);
  score += volumeScore;

  // Confidence
  let confidence = 'low';
  if (score >= 80) confidence = 'high';
  else if (score >= 65) confidence = 'medium';

  // Generate notes (YOUR notes, not generic)
  const notes = generatePersonalNotes(symbol, trade, channel, pattern, marketRegime);

  return {
    symbol,
    score,
    confidence,
    entry: trade.entry,
    target: trade.target,
    stop: trade.stop,
    riskReward: trade.riskReward,
    setup: trade.setup,
    notes,
    technicals: {
      currentPrice: candles[candles.length - 1].close,
      rsi,
      trend,
      channelStatus: channel.hasChannel ? 'in_channel' : 'no_channel',
      pattern: pattern || null,
    },
    marketContext: {
      spyTrend: marketRegime.trend,
      vix: marketRegime.vix,
    }
  };
}

function generatePersonalNotes(
  symbol: string,
  trade: any,
  channel: any,
  pattern: string | null,
  marketRegime: any
): string {
  let notes = '';

  // Market context
  if (marketRegime.trend === 'bear' && trade.direction === 'long') {
    notes += '⚠️ WARNING: Long setup in bear market. Be extra cautious. ';
  }

  if (marketRegime.vix > 25) {
    notes += '⚠️ VIX elevated - widen stops for volatility. ';
  }

  // Setup specifics
  if (channel.hasChannel) {
    const channelPosition = (trade.entry - channel.support) / (channel.resistance - channel.support);
    if (channelPosition < 0.3) {
      notes += '✅ Entry near channel support (good R:R). ';
    } else if (channelPosition > 0.7) {
      notes += '⚠️ Entry near channel resistance (consider waiting). ';
    }
  }

  if (pattern) {
    notes += `📐 Pattern detected: ${pattern}. `;
  }

  // Your personal reminders
  notes += `\n\n💡 CHECKLIST:\n`;
  notes += `- [ ] Check news/earnings calendar\n`;
  notes += `- [ ] Verify volume is above average\n`;
  notes += `- [ ] Set stop loss BELOW scanner suggestion (gaps)\n`;
  notes += `- [ ] Consider 1/2 position if score < 75\n`;
  notes += `- [ ] Add to watchlist if waiting for entry\n`;

  return notes;
}
```

---

### Day 5: Manual Run Script

**Before automating, run it manually each day**

```typescript
// scripts/runDailyScan.ts

import { runPersonalScan } from '@/lib/personalScanner';
import { supabase } from '@/lib/supabaseClient';

async function main() {
  const scanDate = new Date().toISOString().split('T')[0];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📅 DAILY SCAN - ${scanDate}`);
  console.log(${'='.repeat(60)}\n`);

  const results = await runPersonalScan();

  if (results.length === 0) {
    console.log('No opportunities found today. Market might be choppy or ranging.');
    return;
  }

  // Display top 10 in console
  console.log(`\n🏆 TOP 10 OPPORTUNITIES:\n`);

  results.slice(0, 10).forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.symbol} - ${result.setup} (Score: ${result.score}/${result.confidence})`);
    console.log(`   Entry: $${result.entry} | Target: $${result.target} | Stop: $${result.stop}`);
    console.log(`   R:R: 1:${result.riskReward.toFixed(1)} | RSI: ${result.technicals.rsi.toFixed(0)}`);
    console.log(`   ${result.notes.split('\n')[0]}`); // First line of notes
  });

  // Store in database
  console.log(`\n💾 Storing results in database...`);

  const recordsToStore = results.map(r => ({
    scan_date: scanDate,
    symbol: r.symbol,
    direction: r.setup.toLowerCase().includes('long') ? 'long' : 'short',
    setup_type: r.setup,
    timeframe: 'swing',
    entry_price: r.entry,
    target_price: r.target,
    stop_loss: r.stop,
    risk_reward_ratio: r.riskReward,
    score: r.score,
    confidence_level: r.confidence,
    current_price: r.technicals.currentPrice,
    channel_status: r.technicals.channelStatus,
    pattern: r.technicals.pattern,
    rsi: r.technicals.rsi,
    trend: r.technicals.trend,
    spy_trend: r.marketContext.spyTrend,
    vix_level: r.marketContext.vix,
    personal_notes: r.notes,
  }));

  const { error } = await supabase
    .from('screening_results')
    .insert(recordsToStore);

  if (error) {
    console.error('Error storing results:', error);
  } else {
    console.log(`✅ Stored ${recordsToStore.length} results`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📝 Next Steps:');
  console.log('1. Review opportunities at /personal-scanner');
  console.log('2. Mark which ones you want to trade (action_taken = "entered")');
  console.log('3. Add your own notes about why you like/don't like each');
  console.log('4. Track outcomes in my_trades table');
  console.log(${'='.repeat(60)}\n`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Scan failed:', error);
    process.exit(1);
  });
```

**Run it:**
```bash
npm run scan

# Or make it a daily habit:
# Every weekday at 5 PM after market close
npm run scan
```

---

### Day 6-7: Personal Dashboard UI

```tsx
// app/personal-scanner/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function PersonalScannerPage() {
  const [results, setResults] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  useEffect(() => {
    loadScanResults(selectedDate);
  }, [selectedDate]);

  async function loadScanResults(date: string) {
    const { data, error } = await supabase
      .from('screening_results')
      .select('*')
      .eq('scan_date', date)
      .order('score', { ascending: false });

    if (error) console.error(error);
    else setResults(data || []);
  }

  async function updateNotes(id: string, notes: string) {
    await supabase
      .from('screening_results')
      .update({ personal_notes: notes })
      .eq('id', id);
  }

  async function markAction(id: string, action: string) {
    await supabase
      .from('screening_results')
      .update({ action_taken: action })
      .eq('id', id);

    // Reload
    loadScanResults(selectedDate);
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Personal Scanner</h1>
        <p className="text-slate-600 mb-6">
          Daily opportunities for {selectedDate}
        </p>

        {/* Date Selector */}
        <div className="mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.map((result) => (
            <PersonalScanCard
              key={result.id}
              result={result}
              onUpdateNotes={(notes) => updateNotes(result.id, notes)}
              onMarkAction={(action) => markAction(result.id, action)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonalScanCard({ result, onUpdateNotes, onMarkAction }) {
  const [notes, setNotes] = useState(result.personal_notes || '');
  const [isEditing, setIsEditing] = useState(false);

  const isLong = result.direction === 'long';
  const potential = ((result.target_price - result.entry_price) / result.entry_price) * 100;

  return (
    <Card className={`
      ${result.action_taken === 'entered' ? 'border-2 border-emerald-500' : ''}
      ${result.action_taken === 'passed' ? 'opacity-50' : ''}
    `}>
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{result.symbol}</h2>

            <Badge className={isLong ? 'bg-emerald-600' : 'bg-red-600'}>
              {isLong ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {result.direction.toUpperCase()}
            </Badge>

            <Badge variant="outline">
              Score: {result.score}
            </Badge>

            <Badge variant="outline" className={
              result.confidence_level === 'high' ? 'border-emerald-500 text-emerald-700' :
              result.confidence_level === 'medium' ? 'border-blue-500 text-blue-700' :
              'border-slate-500 text-slate-700'
            }>
              {result.confidence_level}
            </Badge>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-500">Current</div>
            <div className="text-xl font-semibold">${result.current_price.toFixed(2)}</div>
          </div>
        </div>

        {/* Trade Levels */}
        <div className="grid grid-cols-4 gap-4 mb-4 bg-slate-50 p-4 rounded">
          <div>
            <div className="text-xs text-slate-500">Entry</div>
            <div className="text-lg font-semibold">${result.entry_price.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-emerald-600">Target</div>
            <div className="text-lg font-semibold text-emerald-600">
              ${result.target_price.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-600">+{potential.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-red-600">Stop</div>
            <div className="text-lg font-semibold text-red-600">
              ${result.stop_loss.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">R:R</div>
            <div className="text-lg font-semibold text-blue-600">
              1:{result.risk_reward_ratio.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Market Context */}
        {result.spy_trend === 'bear' && isLong && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Warning: Long setup in bear market ({result.spy_trend})
              </span>
            </div>
          </div>
        )}

        {/* Scanner Notes */}
        <div className="mb-4 text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded">
          {result.personal_notes}
        </div>

        {/* Your Notes */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">My Notes:</label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </div>

          {isEditing ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                onUpdateNotes(notes);
                setIsEditing(false);
              }}
              placeholder="Add your thoughts about this setup..."
              rows={4}
            />
          ) : (
            <div className="text-sm text-slate-600 italic">
              {notes || 'No personal notes yet...'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onMarkAction('entered')}
            className={result.action_taken === 'entered' ? 'bg-emerald-600' : ''}
          >
            ✅ Entered
          </Button>
          <Button
            variant="outline"
            onClick={() => onMarkAction('watching')}
            className={result.action_taken === 'watching' ? 'border-blue-500' : ''}
          >
            👁️ Watching
          </Button>
          <Button
            variant="outline"
            onClick={() => onMarkAction('passed')}
            className={result.action_taken === 'passed' ? 'border-red-500' : ''}
          >
            ❌ Passed
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
```

---

## Week 2: Outcome Tracking + Trade Journal

### Trade Entry Form

```tsx
// app/my-trades/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function NewTradePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    symbol: '',
    direction: 'long',
    entry_price: '',
    stop_loss: '',
    target_price: '',
    position_size: '',
    entry_notes: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const { error } = await supabase
      .from('my_trades')
      .insert({
        symbol: formData.symbol.toUpperCase(),
        direction: formData.direction,
        actual_entry: parseFloat(formData.entry_price),
        actual_stop: parseFloat(formData.stop_loss),
        actual_target: parseFloat(formData.target_price),
        position_size: parseInt(formData.position_size),
        entry_date: new Date().toISOString().split('T')[0],
        entry_price: parseFloat(formData.entry_price),
        entry_notes: formData.entry_notes,
        status: 'open',
      });

    if (error) {
      alert('Error creating trade: ' + error.message);
    } else {
      router.push('/my-trades');
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Log New Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <Input
                value={formData.symbol}
                onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                placeholder="AAPL"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Direction</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({...formData, direction: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Entry Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.entry_price}
                  onChange={(e) => setFormData({...formData, entry_price: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Position Size (shares)</label>
                <Input
                  type="number"
                  value={formData.position_size}
                  onChange={(e) => setFormData({...formData, position_size: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stop Loss</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stop_loss}
                  onChange={(e) => setFormData({...formData, stop_loss: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.target_price}
                  onChange={(e) => setFormData({...formData, target_price: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Entry Notes</label>
              <Textarea
                value={formData.entry_notes}
                onChange={(e) => setFormData({...formData, entry_notes: e.target.value})}
                placeholder="Why am I taking this trade? What's my thesis?"
                rows={4}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded">
              <h4 className="font-medium mb-2">Trade Summary</h4>
              <div className="text-sm space-y-1">
                <p>Risk per share: ${(parseFloat(formData.entry_price) - parseFloat(formData.stop_loss)).toFixed(2)}</p>
                <p>Total risk: ${((parseFloat(formData.entry_price) - parseFloat(formData.stop_loss)) * parseInt(formData.position_size || '0')).toFixed(2)}</p>
                {formData.target_price && (
                  <>
                    <p>Reward per share: ${(parseFloat(formData.target_price) - parseFloat(formData.entry_price)).toFixed(2)}</p>
                    <p>R:R Ratio: 1:{((parseFloat(formData.target_price) - parseFloat(formData.entry_price)) / (parseFloat(formData.entry_price) - parseFloat(formData.stop_loss))).toFixed(2)}</p>
                  </>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full">
              Log Trade
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Trade Journal / Portfolio View

```tsx
// app/my-trades/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyTradesPage() {
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'closed'

  useEffect(() => {
    loadTrades();
  }, [filter]);

  async function loadTrades() {
    let query = supabase
      .from('my_trades')
      .select('*')
      .order('entry_date', { ascending: false });

    if (filter === 'open') query = query.eq('status', 'open');
    if (filter === 'closed') query = query.eq('status', 'closed');

    const { data } = await query;
    setTrades(data || []);
  }

  const stats = calculateStats(trades);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Trades</h1>
            <p className="text-slate-600">Your trading journal & performance tracker</p>
          </div>
          <Link href="/my-trades/new">
            <Button>+ Log New Trade</Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-500">Total Trades</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-500">Win Rate</div>
              <div className="text-2xl font-bold text-emerald-600">
                {stats.winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">
                {stats.wins}W / {stats.losses}L
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-500">Avg R-Multiple</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.avgR.toFixed(2)}R
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-500">Total P&L</div>
              <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${stats.totalPnL.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'open' ? 'default' : 'outline'}
            onClick={() => setFilter('open')}
          >
            Open
          </Button>
          <Button
            variant={filter === 'closed' ? 'default' : 'outline'}
            onClick={() => setFilter('closed')}
          >
            Closed
          </Button>
        </div>

        {/* Trade List */}
        <div className="space-y-3">
          {trades.map(trade => (
            <TradeCard key={trade.id} trade={trade} onUpdate={loadTrades} />
          ))}
        </div>
      </div>
    </div>
  );
}

function calculateStats(trades) {
  const closed = trades.filter(t => t.status === 'closed');
  const wins = closed.filter(t => t.gross_pnl > 0).length;
  const losses = closed.filter(t => t.gross_pnl <= 0).length;
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const avgR = closed.length > 0
    ? closed.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / closed.length
    : 0;
  const totalPnL = closed.reduce((sum, t) => sum + (t.gross_pnl || 0), 0);

  return {
    total: trades.length,
    wins,
    losses,
    winRate,
    avgR,
    totalPnL
  };
}

function TradeCard({ trade, onUpdate }) {
  // Implementation similar to screening results card
  // Show entry, current price, P&L, exit button, notes, etc.
  // ...
}
```

---

## Week 3: Refinement + Habits

### Daily Routine

**Every Weekday:**

1. **4:15 PM** - Run scanner
   ```bash
   npm run scan
   ```

2. **4:30 PM** - Review opportunities
   - Open `/personal-scanner`
   - Read top 10 setups
   - Add your notes
   - Mark action (entered/watching/passed)

3. **5:00 PM** - Update open trades
   - Check if any hit target or stop
   - Update notes on what you're seeing
   - Adjust stops if needed

4. **Weekly Review (Friday 5 PM)**
   - Review all closed trades from the week
   - Calculate win rate, avg R
   - Note what worked / didn't work
   - Adjust scanner if needed

---

## Stage 2: Validation (Weeks 9-16)

After 60 days of personal use, you'll have:

- 60+ scanner runs (60 days × 10 top opportunities = 600 data points)
- Your actual trades (maybe 20-40 trades if you're active)
- Scanner performance data (did the setups work even if you didn't trade them?)

### Analysis Questions:

1. **Did the scanner find good setups?**
   - What % of High Confidence setups worked?
   - What % of Medium Confidence setups worked?
   - What was avg R-multiple for scanner suggestions?

2. **What did YOU actually trade?**
   - Win rate on your trades?
   - Did you follow scanner or trade other setups?
   - When did you deviate and why?

3. **What worked / didn't work?**
   - Which patterns had best win rate?
   - Did market regime filter help?
   - What scoring factors mattered most?

4. **Decision Point:**
   - If win rate > 55% and avg R > 1.5: **Worth sharing**
   - If win rate < 50% or avg R < 1.2: **Keep refining**

---

## Stage 3: Scale (Weeks 17+)

Only proceed if Stage 2 validates success.

### Prepare for Multi-User:

1. **Legal Review** ($3K-5K)
   - Disclaimers
   - Terms of service
   - "Screening results" not "recommendations"

2. **Add user_id to all tables**
   - Row Level Security policies
   - User authentication checks

3. **Public Performance Tracking**
   - Display YOUR results: "I've been using this for 90 days: 58% win rate, 1.8 avg R"
   - Transparency builds trust

4. **Pricing Strategy**
   - Free: Basic watchlist + manual screening
   - Pro ($29/mo): Daily scanner results
   - Premium ($99/mo): Advanced features (future)

---

## Key Principles for Success

### 1. Track EVERYTHING

Every scan, every trade, every outcome. This is your validation dataset.

### 2. Be Brutally Honest

If a setup fails, note WHY. If you deviate from scanner, note WHY. This feedback loop is how you improve.

### 3. Start Small

Don't risk $10K on a trade because scanner says "High Confidence." Start with $500-1000 positions until you trust it.

### 4. Iterate Rapidly

You're the only user - change the scoring weights daily if you want. Experiment. Learn. Improve.

### 5. Build for Scale

Even though you're the only user, structure the data so adding users later is easy. Use `user_id` fields (set to NULL for now), build clean APIs, separate concerns.

---

## What Success Looks Like (90 Days)

**Good Outcome:**
- 60+ scanner runs completed
- 25-40 trades taken (mix of scanner + your own ideas)
- 55%+ win rate on scanner-suggested trades
- Clear understanding of what works / doesn't work
- Confidence to share with others

**Great Outcome:**
- 60%+ win rate
- 1.8+ avg R-multiple
- Consistent edge across different market conditions
- Documented refinements and learnings
- Ready to onboard beta users

**Poor Outcome:**
- <45% win rate
- Losing money consistently
- No clear edge
- **Decision:** Pivot to other features (TradingView, economic calendar, rule-based screener)

---

## Next Steps

1. ✅ **Start today:** Set up database schema
2. ✅ **Tomorrow:** Build basic scanner (100 stocks)
3. ✅ **Day 3:** Run first manual scan, review results
4. ✅ **Day 4-5:** Build personal dashboard UI
5. ✅ **Day 6-7:** Add trade logging + journal
6. ✅ **Week 2:** Daily routine - scan, review, trade, track
7. ✅ **Weeks 3-8:** Iterate based on results
8. ✅ **Week 9:** First validation analysis
9. ✅ **Week 17:** Decision to scale or pivot

---

**Remember:** You're building your personal trading edge first. If it works for you, it'll work for others. If it doesn't work for you, no amount of marketing will save it.

**Start small. Track obsessively. Iterate quickly. Scale when validated.**

Good luck! 🚀
