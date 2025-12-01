/**
 * Scanner Test Runner
 *
 * Tests the scanner with a small subset of stocks
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { analyzeSingleStock } from './scanner/stockAnalyzer';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  SCANNER TEST - Sample Stocks');
console.log('═══════════════════════════════════════════════════════════\n');

// Test with a few well-known stocks
const testSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];

async function runTest() {
  console.log(`Testing scanner with ${testSymbols.length} stocks...\n`);

  for (const symbol of testSymbols) {
    console.log(`\n━━━ ${symbol} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const result = await analyzeSingleStock(symbol, 60);

    if (!result.success) {
      console.log(`❌ Analysis failed: ${result.error}\n`);
      continue;
    }

    if (!result.recommendation || !result.score) {
      console.log(`ℹ️  No actionable setup found\n`);
      continue;
    }

    const { recommendation, score } = result;

    console.log(`\n✅ Opportunity Found!`);
    console.log(`\nSetup: ${recommendation.setup.setupName} (${recommendation.setup.confidence} confidence)`);
    console.log(`Score: ${score.totalScore}/100 (${score.confidenceLevel.toUpperCase()})`);

    console.log(`\nPrice Levels:`);
    console.log(`  Current: $${recommendation.currentPrice.toFixed(2)}`);
    console.log(`  Entry:   $${recommendation.entry.toFixed(2)}`);
    console.log(`  Target:  $${recommendation.target.toFixed(2)} (+${recommendation.rewardPercent.toFixed(1)}%)`);
    console.log(`  Stop:    $${recommendation.stopLoss.toFixed(2)} (-${recommendation.riskPercent.toFixed(1)}%)`);
    console.log(`  R:R:     1:${recommendation.riskRewardRatio.toFixed(2)}`);

    console.log(`\nScoring Breakdown:`);
    // Handle both legacy and new score formats
    if (score.breakdown) {
      console.log(`  Trend:           ${score.breakdown.trend}/30`);
      console.log(`  Pattern:         ${score.breakdown.pattern}/25`);
      console.log(`  Volume:          ${score.breakdown.volume}/20`);
      console.log(`  Risk/Reward:     ${score.breakdown.riskReward}/15`);
      console.log(`  Momentum:        ${score.breakdown.momentum}/10`);
    } else {
      console.log(`  (Score component breakdown not available)`);
    }

    console.log(`\nRationale:`);
    console.log(`  ${recommendation.rationale}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
}

runTest()
  .then(() => {
    console.log('✅ Scanner test completed successfully!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
