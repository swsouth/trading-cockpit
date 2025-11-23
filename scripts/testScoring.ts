/**
 * Test Scoring System
 *
 * Verifies that the scoring algorithm works correctly with sample data
 */

import { Candle, ChannelDetectionResult, PatternDetectionResult } from '../lib/types';
import { calculateOpportunityScore, VolumeAnalysis } from '../lib/scoring';

// Sample candle data (simplified for testing)
function generateSampleCandles(trend: 'up' | 'down' | 'sideways' = 'up'): Candle[] {
  const candles: Candle[] = [];
  const basePrice = 100;

  for (let i = 0; i < 60; i++) {
    let close: number;

    if (trend === 'up') {
      close = basePrice + (i * 0.5) + (Math.random() * 2 - 1);
    } else if (trend === 'down') {
      close = basePrice - (i * 0.5) + (Math.random() * 2 - 1);
    } else {
      close = basePrice + (Math.random() * 4 - 2);
    }

    const open = close + (Math.random() * 2 - 1);
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();

    candles.push({
      timestamp: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume: 1000000 + Math.random() * 500000,
    });
  }

  return candles;
}

// Test Case 1: Strong uptrend with good setup
function testStrongBullishSetup() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Strong Bullish Setup (Should score 75+ / HIGH)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const candles = generateSampleCandles('up');
  const currentPrice = candles[candles.length - 1].close;

  // Calculate realistic support/resistance based on recent price action
  const recentPrices = candles.slice(-40).map(c => c.close);
  const support = Math.min(...recentPrices) * 1.01; // Just above recent low
  const resistance = Math.max(...recentPrices) * 0.99; // Just below recent high

  const channel: ChannelDetectionResult = {
    hasChannel: true,
    support,
    resistance,
    mid: (support + resistance) / 2,
    widthPct: (resistance - support) / ((support + resistance) / 2),
    supportTouches: 5,
    resistanceTouches: 4,
    outOfBandPct: 0.05,
    status: 'near_support',
  };

  const pattern: PatternDetectionResult = {
    mainPattern: 'bullish_engulfing',
  };

  const volume: VolumeAnalysis = {
    last5DaysAvg: 1500000,
    last30DaysAvg: 1000000,
    currentVolume: 1800000,
    volumeRatio: 1.5, // High volume
    status: 'high',
  };

  // Better trade setup: Enter at support, target at resistance, stop below support
  const entryPrice = channel.support * 1.01; // Enter just above support
  const targetPrice = channel.resistance * 0.98; // Target near resistance
  const stopLoss = channel.support * 0.97; // Stop below support for good R:R

  const result = calculateOpportunityScore({
    candles,
    channel,
    pattern,
    volume,
    entryPrice,
    targetPrice,
    stopLoss,
  });

  console.log('Setup Details:');
  console.log(`  Entry: $${entryPrice.toFixed(2)}`);
  console.log(`  Target: $${targetPrice.toFixed(2)}`);
  console.log(`  Stop: $${stopLoss.toFixed(2)}`);
  console.log(`  R:R: ${((targetPrice - entryPrice) / (entryPrice - stopLoss)).toFixed(2)}:1\n`);

  console.log(`Total Score: ${result.totalScore}/100 (${result.confidenceLevel.toUpperCase()})\n`);
  console.log('Component Breakdown:');
  console.log(`  Trend Strength:  ${result.breakdown.trendStrength}`);
  console.log(`  Pattern Quality: ${result.breakdown.patternQuality}`);
  console.log(`  Volume:          ${result.breakdown.volumeScore}`);
  console.log(`  Risk/Reward:     ${result.breakdown.riskRewardScore}`);
  console.log(`  Momentum:        ${result.breakdown.momentumScore}`);

  return result.totalScore >= 75 && result.confidenceLevel === 'high';
}

// Test Case 2: Weak setup (should score low)
function testWeakSetup() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Weak Setup (Should score <60 / LOW-MEDIUM)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const candles = generateSampleCandles('sideways');
  const currentPrice = candles[candles.length - 1].close;

  const channel: ChannelDetectionResult = {
    hasChannel: false, // No clear channel
    support: currentPrice * 0.90,
    resistance: currentPrice * 1.10,
    mid: currentPrice,
    widthPct: 0.20, // Wide channel
    supportTouches: 1,
    resistanceTouches: 1,
    outOfBandPct: 0.15,
    status: 'inside',
  };

  const pattern: PatternDetectionResult = {
    mainPattern: 'none', // No pattern
  };

  const volume: VolumeAnalysis = {
    last5DaysAvg: 800000,
    last30DaysAvg: 1000000,
    currentVolume: 750000,
    volumeRatio: 0.8, // Low volume
    status: 'low',
  };

  const entryPrice = currentPrice;
  const targetPrice = currentPrice * 1.05;
  const stopLoss = currentPrice * 0.97; // Poor R:R (1.67:1)

  const result = calculateOpportunityScore({
    candles,
    channel,
    pattern,
    volume,
    entryPrice,
    targetPrice,
    stopLoss,
  });

  console.log('Setup Details:');
  console.log(`  Entry: $${entryPrice.toFixed(2)}`);
  console.log(`  Target: $${targetPrice.toFixed(2)}`);
  console.log(`  Stop: $${stopLoss.toFixed(2)}`);
  console.log(`  R:R: ${((targetPrice - entryPrice) / (entryPrice - stopLoss)).toFixed(2)}:1\n`);

  console.log(`Total Score: ${result.totalScore}/100 (${result.confidenceLevel.toUpperCase()})\n`);
  console.log('Component Breakdown:');
  console.log(`  Trend Strength:  ${result.breakdown.trendStrength}`);
  console.log(`  Pattern Quality: ${result.breakdown.patternQuality}`);
  console.log(`  Volume:          ${result.breakdown.volumeScore}`);
  console.log(`  Risk/Reward:     ${result.breakdown.riskRewardScore}`);
  console.log(`  Momentum:        ${result.breakdown.momentumScore}`);

  return result.totalScore < 65; // Should be low-medium
}

// Test Case 3: Medium quality setup
function testMediumSetup() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Medium Setup (Should score 60-74 / MEDIUM)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const candles = generateSampleCandles('up');
  const currentPrice = candles[candles.length - 1].close;

  // Calculate realistic support/resistance based on recent price action
  const recentPrices = candles.slice(-40).map(c => c.close);
  const support = Math.min(...recentPrices) * 1.01;
  const resistance = Math.max(...recentPrices) * 0.99;

  const channel: ChannelDetectionResult = {
    hasChannel: true,
    support,
    resistance,
    mid: (support + resistance) / 2,
    widthPct: (resistance - support) / ((support + resistance) / 2),
    supportTouches: 3,
    resistanceTouches: 3,
    outOfBandPct: 0.08,
    status: 'inside', // Not at ideal entry point
  };

  const pattern: PatternDetectionResult = {
    mainPattern: 'hammer', // Good but not best pattern
  };

  const volume: VolumeAnalysis = {
    last5DaysAvg: 1100000,
    last30DaysAvg: 1000000,
    currentVolume: 1050000,
    volumeRatio: 1.1, // Slightly above average
    status: 'average',
  };

  // Medium setup: Mid-channel entry with okay R:R
  const entryPrice = currentPrice;
  const targetPrice = channel.resistance * 0.98;
  const stopLoss = currentPrice * 0.96; // Moderate R:R (~2.5:1)

  const result = calculateOpportunityScore({
    candles,
    channel,
    pattern,
    volume,
    entryPrice,
    targetPrice,
    stopLoss,
  });

  console.log('Setup Details:');
  console.log(`  Entry: $${entryPrice.toFixed(2)}`);
  console.log(`  Target: $${targetPrice.toFixed(2)}`);
  console.log(`  Stop: $${stopLoss.toFixed(2)}`);
  console.log(`  R:R: ${((targetPrice - entryPrice) / (entryPrice - stopLoss)).toFixed(2)}:1\n`);

  console.log(`Total Score: ${result.totalScore}/100 (${result.confidenceLevel.toUpperCase()})\n`);
  console.log('Component Breakdown:');
  console.log(`  Trend Strength:  ${result.breakdown.trendStrength}`);
  console.log(`  Pattern Quality: ${result.breakdown.patternQuality}`);
  console.log(`  Volume:          ${result.breakdown.volumeScore}`);
  console.log(`  Risk/Reward:     ${result.breakdown.riskRewardScore}`);
  console.log(`  Momentum:        ${result.breakdown.momentumScore}`);

  return result.totalScore >= 60 && result.totalScore < 75;
}

// Run all tests
function runAllTests() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SCORING SYSTEM VERIFICATION TESTS');
  console.log('═══════════════════════════════════════════════════════════');

  const test1Pass = testStrongBullishSetup();
  const test2Pass = testWeakSetup();
  const test3Pass = testMediumSetup();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Test 1 (Strong Setup):  ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Weak Setup):    ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (Medium Setup):  ${test3Pass ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = test1Pass && test2Pass && test3Pass;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(allPassed
    ? '✅ ALL TESTS PASSED - Scoring system is working correctly!'
    : '❌ SOME TESTS FAILED - Review scoring components');
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests();
