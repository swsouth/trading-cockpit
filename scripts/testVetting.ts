/**
 * Test Vetting System
 *
 * Quick test of the enhanced vetting system with a sample stock
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getFundamentals, getEarningsCalendar, getAnalystRatings } from '../lib/vetting/yahooFinance';
import { vetRecommendation } from '../lib/vetting';
import { TradeRecommendation } from '../lib/types';

async function testVetting() {
  console.log('\n🔍 Testing Enhanced Vetting System\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testSymbol = 'AAPL';

  // 1. Test Yahoo Finance integration
  console.log(`📊 Testing Yahoo Finance API for ${testSymbol}...\n`);

  try {
    const fundamentals = await getFundamentals(testSymbol);
    console.log('✅ Fundamentals:');
    console.log(`   Market Cap: $${(fundamentals.marketCap / 1_000_000_000).toFixed(1)}B`);
    console.log(`   P/E Ratio: ${fundamentals.peRatio?.toFixed(2) || 'N/A'}`);
    console.log(`   Debt/Equity: ${fundamentals.debtToEquity?.toFixed(2) || 'N/A'}`);
    console.log(`   Avg Volume: ${(fundamentals.averageVolume / 1_000_000).toFixed(1)}M`);
    console.log(`   Sector: ${fundamentals.sector}`);
    console.log(`   Industry: ${fundamentals.industry}\n`);
  } catch (error) {
    console.error('❌ Fundamentals failed:', error);
  }

  try {
    const earnings = await getEarningsCalendar(testSymbol);
    if (earnings) {
      console.log('✅ Earnings Calendar:');
      console.log(`   Next Earnings: ${new Date(earnings.earningsDate).toLocaleDateString()}`);
      console.log(`   Days Until: ${earnings.daysUntilEarnings}`);
      console.log(`   Estimated EPS: ${earnings.estimatedEPS || 'N/A'}\n`);
    } else {
      console.log('ℹ️  No upcoming earnings data available\n');
    }
  } catch (error) {
    console.error('❌ Earnings calendar failed:', error);
  }

  try {
    const rating = await getAnalystRatings(testSymbol);
    if (rating) {
      console.log('✅ Analyst Ratings:');
      console.log(`   Rating: ${rating.rating.replace('_', ' ').toUpperCase()}`);
      console.log(`   Number of Analysts: ${rating.numberOfAnalysts}`);
      console.log(`   Target Price: $${rating.targetPrice?.toFixed(2) || 'N/A'}\n`);
    } else {
      console.log('ℹ️  No analyst ratings available\n');
    }
  } catch (error) {
    console.error('❌ Analyst ratings failed:', error);
  }

  // 2. Test full vetting with mock recommendation
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔍 Testing Full Vetting Checklist...\n');

  const mockRecommendation: TradeRecommendation = {
    symbol: testSymbol,
    scan_date: new Date().toISOString().split('T')[0],
    recommendation_type: 'long',
    entry_price: 180.0,
    target_price: 195.0,
    stop_loss: 172.0,
    opportunity_score: 75,
    confidence_level: 'high',
    rationale: 'bullish_engulfing',
    setup_type: 'Channel Bounce',
    timeframe: '3-5 days',
    risk_amount: 8.0,
    reward_amount: 15.0,
    risk_reward_ratio: 1.88,
    current_price: 180.0,
    channelSupport: 172.0,
    channelResistance: 195.0,
    pattern: 'bullish_engulfing',
    setup: {
      setupName: 'Channel Bounce',
      type: 'long',
      confidence: 'high',
      entryTrigger: 'At support with bullish pattern',
      invalidation: 'Break below 172.0',
    },
  };

  try {
    const vetting = await vetRecommendation(mockRecommendation);

    console.log('\n📊 VETTING RESULTS\n');
    console.log(`Overall Score: ${vetting.overallScore}/100`);
    console.log(`Status: ${vetting.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`\nSummary: ${vetting.summary}\n`);

    if (vetting.greenFlags.length > 0) {
      console.log('✅ Green Flags:');
      vetting.greenFlags.forEach(flag => console.log(`   • ${flag}`));
      console.log('');
    }

    if (vetting.redFlags.length > 0) {
      console.log('🚩 Red Flags:');
      vetting.redFlags.forEach(flag => console.log(`   • ${flag}`));
      console.log('');
    }

    console.log('📋 Detailed Breakdown:\n');

    console.log('TECHNICAL ANALYSIS (40 points):');
    console.log(`   Channel Quality: ${vetting.checks.technical.channelQuality.score}/${vetting.checks.technical.channelQuality.maxScore} - ${vetting.checks.technical.channelQuality.details}`);
    console.log(`   Pattern Reliability: ${vetting.checks.technical.patternReliability.score}/${vetting.checks.technical.patternReliability.maxScore} - ${vetting.checks.technical.patternReliability.details}`);
    console.log(`   Volume Confirmation: ${vetting.checks.technical.volumeConfirmation.score}/${vetting.checks.technical.volumeConfirmation.maxScore} - ${vetting.checks.technical.volumeConfirmation.details}`);
    console.log(`   Risk/Reward Ratio: ${vetting.checks.technical.riskRewardRatio.score}/${vetting.checks.technical.riskRewardRatio.maxScore} - ${vetting.checks.technical.riskRewardRatio.details}\n`);

    console.log('FUNDAMENTAL ANALYSIS (30 points):');
    console.log(`   Earnings Proximity: ${vetting.checks.fundamental.earningsProximity.score}/${vetting.checks.fundamental.earningsProximity.maxScore} - ${vetting.checks.fundamental.earningsProximity.details}`);
    console.log(`   Market Cap: ${vetting.checks.fundamental.marketCap.score}/${vetting.checks.fundamental.marketCap.maxScore} - ${vetting.checks.fundamental.marketCap.details}`);
    console.log(`   Average Volume: ${vetting.checks.fundamental.averageVolume.score}/${vetting.checks.fundamental.averageVolume.maxScore} - ${vetting.checks.fundamental.averageVolume.details}`);
    console.log(`   P/E Ratio: ${vetting.checks.fundamental.priceEarningsRatio.score}/${vetting.checks.fundamental.priceEarningsRatio.maxScore} - ${vetting.checks.fundamental.priceEarningsRatio.details}`);
    console.log(`   Debt/Equity: ${vetting.checks.fundamental.debtToEquity.score}/${vetting.checks.fundamental.debtToEquity.maxScore} - ${vetting.checks.fundamental.debtToEquity.details}\n`);

    console.log('SENTIMENT ANALYSIS (20 points):');
    console.log(`   News Sentiment: ${vetting.checks.sentiment.newsSentiment.score}/${vetting.checks.sentiment.newsSentiment.maxScore} - ${vetting.checks.sentiment.newsSentiment.details}`);
    console.log(`   Social Sentiment: ${vetting.checks.sentiment.socialSentiment.score}/${vetting.checks.sentiment.socialSentiment.maxScore} - ${vetting.checks.sentiment.socialSentiment.details}`);
    console.log(`   Analyst Rating: ${vetting.checks.sentiment.analystRating.score}/${vetting.checks.sentiment.analystRating.maxScore} - ${vetting.checks.sentiment.analystRating.details}\n`);

    console.log('TIMING & LIQUIDITY (10 points):');
    console.log(`   Market Hours: ${vetting.checks.timing.marketHours.score}/${vetting.checks.timing.marketHours.maxScore} - ${vetting.checks.timing.marketHours.details}`);
    console.log(`   Spread Quality: ${vetting.checks.timing.spreadQuality.score}/${vetting.checks.timing.spreadQuality.maxScore} - ${vetting.checks.timing.spreadQuality.details}\n`);

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Vetting system test complete!\n');

  } catch (error) {
    console.error('❌ Vetting test failed:', error);
  }
}

// Run test
testVetting()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
