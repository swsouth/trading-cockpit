/**
 * Chart Pattern Test
 *
 * Tests the new chart pattern detection functionality
 * Uses live market data to find stocks with chart patterns
 */

import 'dotenv/config';
import { analyzeSingleStock } from './scanner/stockAnalyzer';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  CHART PATTERN DETECTION TEST');
console.log('═══════════════════════════════════════════════════════════\n');

// Test with stocks that historically show these patterns
const testSymbols = [
  'NVDA',  // Often shows bull flags after strong moves
  'TSLA',  // Volatile - good for triangles and flags
  'GOOGL', // Large cap - shows clean double bottoms/tops
  'MSFT',  // Steady - good for cup and handle
  'AMD',   // Semiconductor - shows ascending triangles
  'META',  // Tech - various continuation patterns
  'AAPL',  // Classic patterns, high volume
  'AMZN',  // Large moves, clean patterns
];

async function testChartPatterns() {
  console.log(`Testing ${testSymbols.length} stocks for chart patterns...\n`);
  console.log('Chart patterns include:');
  console.log('  - Double Bottom / Double Top (78% / 76% win rate)');
  console.log('  - Bull Flag / Bear Flag (68% / 67% win rate)');
  console.log('  - Ascending / Descending / Symmetrical Triangle (72% / 69% / 54%)');
  console.log('  - Head & Shoulders / Inverse H&S (73% / 71%)');
  console.log('  - Cup and Handle (75% win rate)\n');

  let chartPatternsFound = 0;
  let candlestickPatternsFound = 0;

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

    // Check if this is a chart pattern (vs candlestick pattern)
    const chartPatternTypes = [
      'double_bottom',
      'double_top',
      'bull_flag',
      'bear_flag',
      'ascending_triangle',
      'descending_triangle',
      'symmetrical_triangle',
      'head_and_shoulders',
      'inverse_head_and_shoulders',
      'cup_and_handle',
    ];

    const isChartPattern = recommendation.setup.setupName?.toLowerCase().includes('flag') ||
      recommendation.setup.setupName?.toLowerCase().includes('triangle') ||
      recommendation.setup.setupName?.toLowerCase().includes('double') ||
      recommendation.setup.setupName?.toLowerCase().includes('shoulder') ||
      recommendation.setup.setupName?.toLowerCase().includes('cup');

    if (isChartPattern) {
      chartPatternsFound++;
      console.log(`\n🎯 CHART PATTERN DETECTED!`);
    } else {
      candlestickPatternsFound++;
      console.log(`\n✅ Pattern Found`);
    }

    console.log(`\nSetup: ${recommendation.setup.setupName} (${recommendation.setup.confidence} confidence)`);
    console.log(`Score: ${score.totalScore}/100 (${score.confidenceLevel.toUpperCase()})`);

    console.log(`\nPrice Levels:`);
    console.log(`  Current: $${recommendation.currentPrice.toFixed(2)}`);
    console.log(`  Entry:   $${recommendation.entry.toFixed(2)}`);
    console.log(`  Target:  $${recommendation.target.toFixed(2)} (+${recommendation.rewardPercent.toFixed(1)}%)`);
    console.log(`  Stop:    $${recommendation.stopLoss.toFixed(2)} (-${recommendation.riskPercent.toFixed(1)}%)`);
    console.log(`  R:R:     1:${recommendation.riskRewardRatio.toFixed(2)}`);

    if (score.breakdown) {
      console.log(`\nScoring Breakdown:`);
      console.log(`  Trend:           ${score.breakdown.trend}/30`);
      console.log(`  Pattern:         ${score.breakdown.pattern}/25`);
      console.log(`  Volume:          ${score.breakdown.volume}/20`);
      console.log(`  Risk/Reward:     ${score.breakdown.riskReward}/15`);
      console.log(`  Momentum:        ${score.breakdown.momentum}/10`);
    }

    console.log(`\nRationale:`);
    console.log(`  ${recommendation.rationale}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Stocks Tested:              ${testSymbols.length}`);
  console.log(`Chart Patterns Found:       ${chartPatternsFound} 🎯`);
  console.log(`Candlestick Patterns Found: ${candlestickPatternsFound}`);
  console.log(`Total Opportunities:        ${chartPatternsFound + candlestickPatternsFound}\n`);

  if (chartPatternsFound > 0) {
    console.log('✅ Chart pattern detection is WORKING!');
    console.log('   Multi-bar patterns (flags, triangles, double tops/bottoms) detected successfully.\n');
  } else {
    console.log('ℹ️  No chart patterns found in this test.');
    console.log('   This is normal - chart patterns require specific price structures');
    console.log('   and may not be present in all stocks at all times.\n');
    console.log('   Candlestick patterns are more common (single/double candle formations).\n');
  }
}

testChartPatterns()
  .then(() => {
    console.log('✅ Chart pattern test completed!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
