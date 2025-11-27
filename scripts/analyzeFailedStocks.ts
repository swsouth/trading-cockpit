/**
 * Analyze Failed Stocks
 *
 * Diagnose why 245/249 stocks failed to generate recommendations
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { analyzeBatch } from './scanner/stockAnalyzer';

async function analyzeFailedStocks() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  FAILED STOCKS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test a sample of failed stocks from different sectors
  const testSymbols = [
    'AAPL',  // Technology (this one worked - score 47)
    'MSFT',  // Technology (failed)
    'GOOGL', // Technology (failed)
    'JPM',   // Financial (failed)
    'V',     // Financial (failed)
    'JNJ',   // Healthcare (failed)
    'PG',    // Consumer Defensive (failed)
    'XOM',   // Energy (failed)
  ];

  console.log(`Testing ${testSymbols.length} stocks across different sectors...\n`);

  const results = await analyzeBatch(testSymbols, 365);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  DETAILED RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const result of results) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 ${result.symbol}`);
    console.log(`${'='.repeat(60)}`);

    if (!result.success) {
      console.log(`❌ FAILED: ${result.error}`);
      continue;
    }

    // Data quality
    console.log(`\n📈 Data Quality:`);
    console.log(`   Candles: ${result.candles?.length || 0}`);
    console.log(`   Data Source: ${result.success ? 'Available' : 'Missing'}`);

    // Channel detection
    if (result.channel) {
      console.log(`\n🔍 Channel Detection:`);
      console.log(`   Has Channel: ${result.channel.hasChannel ? '✅ YES' : '❌ NO'}`);
      console.log(`   Support Touches: ${result.channel.supportTouches}`);
      console.log(`   Resistance Touches: ${result.channel.resistanceTouches}`);
      console.log(`   Status: ${result.channel.status}`);
      console.log(`   Support: $${result.channel.support.toFixed(2)}`);
      console.log(`   Resistance: $${result.channel.resistance.toFixed(2)}`);
      console.log(`   Width: ${result.channel.widthPct.toFixed(2)}%`);
    } else {
      console.log(`\n❌ No channel data`);
    }

    // Pattern detection
    if (result.pattern) {
      console.log(`\n🕯️ Pattern Detection:`);
      console.log(`   Pattern: ${result.pattern.mainPattern}`);
    } else {
      console.log(`\n❌ No pattern data`);
    }

    // Trade recommendation
    if (result.recommendation) {
      console.log(`\n💡 Recommendation:`);
      console.log(`   Type: ${result.recommendation.recommendationType.toUpperCase()}`);
      console.log(`   Entry: $${result.recommendation.entryPrice.toFixed(2)}`);
      console.log(`   Target: $${result.recommendation.targetPrice.toFixed(2)}`);
      console.log(`   Stop: $${result.recommendation.stopLoss.toFixed(2)}`);
      console.log(`   R:R: ${result.recommendation.riskRewardRatio.toFixed(2)}:1`);
    } else {
      console.log(`\n❌ No recommendation generated`);
    }

    // Opportunity score
    if (result.score) {
      console.log(`\n⭐ Opportunity Score:`);
      console.log(`   Total: ${result.score.totalScore}/100`);
      console.log(`   Confidence: ${result.score.confidenceLevel.toUpperCase()}`);
      console.log(`\n   Score Breakdown:`);
      console.log(`   - Trend Strength: ${result.score.trendStrength.toFixed(1)}/30`);
      console.log(`   - Pattern Quality: ${result.score.patternQuality.toFixed(1)}/25`);
      console.log(`   - Volume: ${result.score.volumeConfirmation.toFixed(1)}/20`);
      console.log(`   - Risk/Reward: ${result.score.riskReward.toFixed(1)}/15`);
      console.log(`   - RSI: ${result.score.rsiMomentum.toFixed(1)}/10`);

      // Why didn't it pass threshold?
      if (result.score.totalScore < 30) {
        console.log(`\n❌ FAILED: Score ${result.score.totalScore} is below minimum threshold of 30`);
      } else if (result.score.totalScore < 50) {
        console.log(`\n⚠️  LOW CONFIDENCE: Score ${result.score.totalScore} (would show with red border)`);
      } else if (result.score.totalScore < 60) {
        console.log(`\n⚠️  MEDIUM CONFIDENCE: Score ${result.score.totalScore}`);
      } else {
        console.log(`\n✅ GOOD CONFIDENCE: Score ${result.score.totalScore}`);
      }
    } else {
      console.log(`\n❌ No opportunity score calculated`);
      console.log(`   Likely reason: No valid channel or setup detected`);
    }
  }

  // Summary
  console.log(`\n\n═══════════════════════════════════════════════════════════`);
  console.log(`  SUMMARY`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  const successCount = results.filter(r => r.success).length;
  const hasChannelCount = results.filter(r => r.channel?.hasChannel).length;
  const hasRecommendationCount = results.filter(r => r.recommendation).length;
  const hasScoreCount = results.filter(r => r.score).length;
  const passesThresholdCount = results.filter(r => r.score && r.score.totalScore >= 30).length;

  console.log(`Total analyzed: ${results.length}`);
  console.log(`Successful analysis: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`);
  console.log(`Has valid channel: ${hasChannelCount}/${results.length} (${(hasChannelCount/results.length*100).toFixed(1)}%)`);
  console.log(`Generated recommendation: ${hasRecommendationCount}/${results.length} (${(hasRecommendationCount/results.length*100).toFixed(1)}%)`);
  console.log(`Has opportunity score: ${hasScoreCount}/${results.length} (${(hasScoreCount/results.length*100).toFixed(1)}%)`);
  console.log(`Passes threshold (30+): ${passesThresholdCount}/${results.length} (${(passesThresholdCount/results.length*100).toFixed(1)}%)\n`);

  // Root cause analysis
  console.log(`Root Cause Analysis:`);

  const noChannelCount = results.filter(r => r.success && !r.channel?.hasChannel).length;
  const noRecommendationButHasChannel = results.filter(r => r.channel?.hasChannel && !r.recommendation).length;
  const lowScoreCount = results.filter(r => r.score && r.score.totalScore < 30).length;

  if (noChannelCount > 0) {
    console.log(`  - ${noChannelCount} stocks failed channel detection (need 2+ support + 2+ resistance touches)`);
  }
  if (noRecommendationButHasChannel > 0) {
    console.log(`  - ${noRecommendationButHasChannel} stocks had channels but failed to generate recommendations`);
  }
  if (lowScoreCount > 0) {
    console.log(`  - ${lowScoreCount} stocks scored below threshold (< 30)`);
  }

  console.log('\n✅ Analysis complete!\n');
}

// Run the analysis
if (require.main === module) {
  analyzeFailedStocks()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { analyzeFailedStocks };
