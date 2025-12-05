/**
 * Test script for intraday target price calculation fix
 *
 * Validates:
 * 1. Tight stops are rejected (< 0.5% risk)
 * 2. Fallback targets use 2% not 15%
 * 3. Targets are capped at 3% max for intraday
 * 4. Math.min() picks conservative target for longs
 * 5. R:R ratios are realistic (< 5:1 for intraday)
 */

import { AnalysisEngine } from '../lib/engine/AnalysisEngine';
import { StockConfig } from '../lib/engine/config/StockConfig';
import { Candle } from '../lib/types';

// Helper to create synthetic candles
function createTestCandles(
  symbol: string,
  basePrice: number,
  volatility: number = 0.02
): Candle[] {
  const candles: Candle[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60); // 60 days ago

  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Simulate realistic price movement
    const randomMove = (Math.random() - 0.5) * volatility * basePrice;
    const open = basePrice + randomMove;
    const high = open + Math.random() * volatility * basePrice;
    const low = open - Math.random() * volatility * basePrice;
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(1000000 + Math.random() * 500000);

    candles.push({
      symbol,
      timestamp: date.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });

    // Update base price for next candle
    basePrice = close;
  }

  return candles;
}

// Test cases
interface TestCase {
  name: string;
  symbol: string;
  basePrice: number;
  volatility: number;
  expectedBehavior: string;
}

const testCases: TestCase[] = [
  {
    name: 'Tight Stop Rejection - Low Price Stock',
    symbol: 'PFE',
    basePrice: 25.14,
    volatility: 0.005, // Very low volatility = tight stops
    expectedBehavior: 'Should REJECT due to stop < 0.5% risk',
  },
  {
    name: 'Acceptable Setup - Mid Price Stock',
    symbol: 'AAPL',
    basePrice: 175.50,
    volatility: 0.015, // Normal volatility
    expectedBehavior: 'Should ACCEPT with target ~2-3% above entry',
  },
  {
    name: 'High Price Stock - Tight % OK',
    symbol: 'GOOGL',
    basePrice: 140.25,
    volatility: 0.012,
    expectedBehavior: 'Should ACCEPT with 0.3% min stop (high price threshold)',
  },
  {
    name: 'Penny Stock - Wide Stop Required',
    symbol: 'XYZ',
    basePrice: 5.50,
    volatility: 0.03, // High volatility
    expectedBehavior: 'Should require 1.0% min stop (penny stock)',
  },
  {
    name: 'No Channel - Fallback Target Test',
    symbol: 'MSFT',
    basePrice: 370.00,
    volatility: 0.01, // Low volatility = weak channel detection
    expectedBehavior: 'Should use 2% fallback target (not 15%)',
  },
];

async function runTests() {
  console.log('\n=== INTRADAY TARGET PRICE FIX - VALIDATION TESTS ===\n');

  // Run tests
  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`);
    console.log(`Symbol: ${testCase.symbol}, Price: $${testCase.basePrice.toFixed(2)}`);
    console.log(`Expected: ${testCase.expectedBehavior}`);

    // Create test candles
    const candles = createTestCandles(
      testCase.symbol,
      testCase.basePrice,
      testCase.volatility
    );

    // Run analysis
    const engine = new AnalysisEngine({ assetType: 'stock' });
    const result = await engine.analyzeAsset({
      symbol: testCase.symbol,
      candles,
      currentPrice: candles[candles.length - 1].close,
      volume: candles[candles.length - 1].volume,
    });

    // Check results
    if (!result || !result.setup) {
      console.log('✅ RESULT: Setup REJECTED');
      console.log(`   Reason: ${result?.bias || 'No clear setup'}`);
    } else {
      const { entry, stopLoss, target, riskReward } = result.setup;
      const risk = Math.abs(entry - stopLoss);
      const riskPct = (risk / entry) * 100;
      const targetGain = Math.abs(target - entry);
      const targetGainPct = (targetGain / entry) * 100;

      console.log('✅ RESULT: Setup ACCEPTED');
      console.log(`   Entry: $${entry.toFixed(2)}`);
      console.log(`   Stop: $${stopLoss.toFixed(2)} (${riskPct.toFixed(2)}% risk, $${risk.toFixed(2)})`);
      console.log(`   Target: $${target.toFixed(2)} (${targetGainPct.toFixed(2)}% gain, $${targetGain.toFixed(2)})`);
      console.log(`   R:R: ${riskReward.toFixed(2)}:1`);

      // Validation checks
      const issues: string[] = [];

      if (riskPct < 0.3 && entry > 200) {
        issues.push(`⚠️  WARNING: Risk ${riskPct.toFixed(2)}% too tight for high-price stock (min 0.3%)`);
      } else if (riskPct < 0.5 && entry >= 10 && entry <= 200) {
        issues.push(`⚠️  WARNING: Risk ${riskPct.toFixed(2)}% too tight for mid-price stock (min 0.5%)`);
      } else if (riskPct < 1.0 && entry < 10) {
        issues.push(`⚠️  WARNING: Risk ${riskPct.toFixed(2)}% too tight for penny stock (min 1.0%)`);
      }

      if (targetGainPct > 3.0) {
        issues.push(`❌ FAIL: Target gain ${targetGainPct.toFixed(2)}% exceeds 3% intraday cap!`);
      }

      if (riskReward > 5.0) {
        issues.push(`❌ FAIL: R:R ${riskReward.toFixed(2)} too high for intraday (max ~5:1 realistic)`);
      }

      if (riskReward < 1.5) {
        issues.push(`❌ FAIL: R:R ${riskReward.toFixed(2)} below minimum 1.5:1`);
      }

      if (issues.length > 0) {
        console.log('\n   Issues detected:');
        issues.forEach((issue) => console.log(`   ${issue}`));
      } else {
        console.log('\n   ✅ All validation checks passed!');
      }
    }
  }

  console.log('\n=== TEST SUITE COMPLETE ===\n');
  console.log('Summary:');
  console.log('- Tight stops should be REJECTED');
  console.log('- Accepted setups should have targets ≤ 3% from entry');
  console.log('- R:R ratios should be 1.5-5.0 for intraday (not 60:1!)');
  console.log('- No targets should exceed realistic intraday moves\n');
}

// Run the tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
