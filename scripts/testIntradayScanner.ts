/**
 * Test Intraday Scanner
 *
 * Quick test script to verify Alpaca integration and intraday analysis
 * Tests with just 3 stocks to avoid API limits
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getIntradayCandles, getMarketStatus, isMarketOpen } from '@/lib/intradayMarketData';
import { detectChannel } from '@/lib/analysis';
import { generateTradeRecommendation } from '@/lib/tradeCalculator';
import { calculateOpportunityScore } from '@/lib/scoring';

const TEST_SYMBOLS = ['AAPL', 'MSFT', 'TSLA'];

async function testIntradayScanner() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  INTRADAY SCANNER TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check API keys
  console.log('1. Checking Alpaca API keys...');
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.error('❌ Alpaca API keys not found in .env.local');
    console.log('\nPlease add to .env.local:');
    console.log('ALPACA_API_KEY=your_key_here');
    console.log('ALPACA_SECRET_KEY=your_secret_here');
    console.log('ALPACA_BASE_URL=https://paper-api.alpaca.markets\n');
    process.exit(1);
  }

  console.log('✅ API keys configured\n');

  // Check market status
  console.log('2. Checking market status...');
  const marketStatus = getMarketStatus();
  console.log(`   Status: ${marketStatus.status.toUpperCase()}`);
  console.log(`   ${marketStatus.message}`);
  console.log(`   Is Open: ${marketStatus.isOpen ? '✅ YES' : '❌ NO'}\n`);

  // Test data fetching
  console.log('3. Testing intraday data fetch...\n');

  for (const symbol of TEST_SYMBOLS) {
    try {
      console.log(`📊 ${symbol}:`);

      // Fetch 5-min bars
      const candles = await getIntradayCandles(symbol, '5Min', 60);
      console.log(`   ✅ Fetched ${candles.length} bars (5-min interval)`);

      if (candles.length > 0) {
        const latest = candles[candles.length - 1];
        console.log(`   Latest: $${latest.close.toFixed(2)} @ ${latest.timestamp}`);
      }

      // Run analysis
      const channelResult = detectChannel(candles, Math.min(40, candles.length));
      console.log(`   Channel: ${channelResult.hasChannel ? 'YES' : 'NO'}`);

      if (channelResult.hasChannel) {
        console.log(`   Support: $${channelResult.support.toFixed(2)}, Resistance: $${channelResult.resistance.toFixed(2)}`);
      }

      // Detect patterns
      const { detectPatterns } = await import('@/lib/analysis');
      const patternResult = detectPatterns(candles);

      // Generate recommendation
      const recommendation = generateTradeRecommendation({
        symbol,
        candles,
        channel: channelResult,
        pattern: patternResult,
      });

      if (recommendation) {
        const score = calculateOpportunityScore(candles, channelResult, recommendation);
        console.log(`   ✅ SETUP FOUND: ${recommendation.type.toUpperCase()} @ $${recommendation.entry.toFixed(2)}`);
        console.log(`   Score: ${score.totalScore}/100 (${score.confidenceLevel})`);
      } else {
        console.log(`   ℹ️  No setup detected`);
      }

      console.log('');

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Next steps:');
  console.log('1. Run full scanner: npm run scan-intraday');
  console.log('2. Apply database migration: Run the SQL in supabase/migrations/20251126000000_create_intraday_opportunities.sql');
  console.log('3. View UI: http://localhost:3000/day-trader\n');
}

// Run test
testIntradayScanner()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
