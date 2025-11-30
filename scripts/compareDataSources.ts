/**
 * Compare Yahoo Finance vs Twelve Data accuracy
 * Validates that Yahoo Finance data is within ±1% of Twelve Data
 */

import 'dotenv/config';
import { getYahooHistoricalData } from '../lib/marketData/yahooFinanceAdapter';
import { Candle } from '../lib/types';

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

async function fetchTwelveDataCandles(symbol: string, days: number = 10): Promise<Candle[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('TWELVE_DATA_API_KEY not configured');
  }

  const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${days}&adjust=none&apikey=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'error') {
    throw new Error(`Twelve Data error: ${data.message}`);
  }

  // Transform to Candle format and reverse (Twelve Data returns newest first)
  const candles: Candle[] = data.values
    .map((bar: any) => ({
      timestamp: bar.datetime,
      open: parseFloat(bar.open),
      high: parseFloat(bar.high),
      low: parseFloat(bar.low),
      close: parseFloat(bar.close),
      volume: parseInt(bar.volume) || 0,
    }))
    .reverse();

  return candles;
}

async function compareDataSources(symbol: string) {
  console.log(`\n━━━ Comparing ${symbol} ━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Fetch from both sources
  const yahooData = await getYahooHistoricalData(symbol, 10);
  const twelveData = await fetchTwelveDataCandles(symbol, 10);

  console.log(`Yahoo Finance: ${yahooData.length} bars`);
  console.log(`Twelve Data:   ${twelveData.length} bars\n`);

  // Compare last 5 matching days
  const compareCount = Math.min(5, yahooData.length, twelveData.length);
  let withinTolerance = 0;

  console.log('=== Latest 5 Days Comparison ===\n');

  for (let i = 0; i < compareCount; i++) {
    const yahoo = yahooData[yahooData.length - 1 - i];
    const twelve = twelveData[twelveData.length - 1 - i];

    // Calculate differences
    const closeDiff = Math.abs(yahoo.close - twelve.close);
    const closeDiffPct = (closeDiff / twelve.close) * 100;

    const openDiff = Math.abs(yahoo.open - twelve.open);
    const openDiffPct = (openDiff / twelve.open) * 100;

    const highDiff = Math.abs(yahoo.high - twelve.high);
    const highDiffPct = (highDiff / twelve.high) * 100;

    const lowDiff = Math.abs(yahoo.low - twelve.low);
    const lowDiffPct = (lowDiff / twelve.low) * 100;

    const maxDiffPct = Math.max(closeDiffPct, openDiffPct, highDiffPct, lowDiffPct);
    const pass = maxDiffPct < 1.0;

    if (pass) withinTolerance++;

    console.log(`Date: ${yahoo.timestamp}`);
    console.log(`  O: $${yahoo.open.toFixed(2)} vs $${twelve.open.toFixed(2)} (${openDiffPct.toFixed(2)}%)`);
    console.log(`  H: $${yahoo.high.toFixed(2)} vs $${twelve.high.toFixed(2)} (${highDiffPct.toFixed(2)}%)`);
    console.log(`  L: $${yahoo.low.toFixed(2)} vs $${twelve.low.toFixed(2)} (${lowDiffPct.toFixed(2)}%)`);
    console.log(`  C: $${yahoo.close.toFixed(2)} vs $${twelve.close.toFixed(2)} (${closeDiffPct.toFixed(2)}%)`);
    console.log(`  ${pass ? '✅' : '❌'} Max diff: ${maxDiffPct.toFixed(2)}%\n`);
  }

  console.log(`\n📊 Accuracy: ${withinTolerance}/${compareCount} days within ±1% tolerance`);
  console.log(`${withinTolerance === compareCount ? '✅ PASS' : '❌ FAIL'}: Yahoo Finance data is ${withinTolerance === compareCount ? 'accurate' : 'NOT accurate'}\n`);
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Yahoo Finance vs Twelve Data Accuracy Test');
  console.log('═══════════════════════════════════════════════════════════');

  const symbols = ['AAPL', 'MSFT', 'NVDA'];

  for (const symbol of symbols) {
    try {
      await compareDataSources(symbol);
    } catch (error) {
      console.error(`❌ Error comparing ${symbol}:`, error);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Test Complete');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
