/**
 * Test Paper Trading Logic
 * Validates position sizing and trade validation
 */

import { calculatePositionSize, validateTrade, formatTradeSummary } from '../lib/paperTrade';

console.log('═══════════════════════════════════════════════════════════');
console.log('  PAPER TRADE LOGIC TEST');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Standard long trade
console.log('📊 Test 1: Standard Long Trade (AAPL)');
const test1 = validateTrade({
  symbol: 'AAPL',
  recommendationType: 'long',
  entryPrice: 150.00,
  stopPrice: 145.00,
  targetPrice: 160.00,
  accountEquity: 100000,
  riskPercent: 1,
});

if (test1.valid && test1.shares && test1.costBasis && test1.dollarRisk) {
  console.log('✅ Validation: PASSED');
  console.log(formatTradeSummary({
    symbol: 'AAPL',
    shares: test1.shares,
    entryPrice: 150.00,
    stopPrice: 145.00,
    targetPrice: 160.00,
    costBasis: test1.costBasis,
    dollarRisk: test1.dollarRisk,
    riskPercent: 1,
  }));
} else {
  console.log('❌ Validation: FAILED -', test1.error);
}

console.log('\n───────────────────────────────────────────────────────────\n');

// Test 2: Short trade
console.log('📊 Test 2: Short Trade (TSLA)');
const test2 = validateTrade({
  symbol: 'TSLA',
  recommendationType: 'short',
  entryPrice: 200.00,
  stopPrice: 210.00,
  targetPrice: 180.00,
  accountEquity: 100000,
  riskPercent: 1,
});

if (test2.valid && test2.shares && test2.costBasis && test2.dollarRisk) {
  console.log('✅ Validation: PASSED');
  console.log(formatTradeSummary({
    symbol: 'TSLA',
    shares: test2.shares,
    entryPrice: 200.00,
    stopPrice: 210.00,
    targetPrice: 180.00,
    costBasis: test2.costBasis,
    dollarRisk: test2.dollarRisk,
    riskPercent: 1,
  }));
} else {
  console.log('❌ Validation: FAILED -', test2.error);
}

console.log('\n───────────────────────────────────────────────────────────\n');

// Test 3: Invalid trade (stop above entry for long)
console.log('📊 Test 3: Invalid Long Trade (Stop > Entry)');
const test3 = validateTrade({
  symbol: 'MSFT',
  recommendationType: 'long',
  entryPrice: 300.00,
  stopPrice: 310.00, // INVALID: Stop above entry for long
  targetPrice: 320.00,
  accountEquity: 100000,
  riskPercent: 1,
});

if (test3.valid) {
  console.log('❌ Should have failed but passed!');
} else {
  console.log('✅ Validation correctly failed:', test3.error);
}

console.log('\n───────────────────────────────────────────────────────────\n');

// Test 4: Conservative risk (0.5%)
console.log('📊 Test 4: Conservative Risk (0.5%)');
const test4 = validateTrade({
  symbol: 'GOOGL',
  recommendationType: 'long',
  entryPrice: 140.00,
  stopPrice: 135.00,
  targetPrice: 155.00,
  accountEquity: 100000,
  riskPercent: 0.5, // Conservative
});

if (test4.valid && test4.shares && test4.costBasis && test4.dollarRisk) {
  console.log('✅ Validation: PASSED');
  console.log(`   Shares: ${test4.shares} (50% of 1% risk position)`);
  console.log(`   Cost Basis: $${test4.costBasis.toFixed(2)}`);
  console.log(`   Dollar Risk: $${test4.dollarRisk.toFixed(2)} (0.5% of account)`);
} else {
  console.log('❌ Validation: FAILED -', test4.error);
}

console.log('\n───────────────────────────────────────────────────────────\n');

// Test 5: Aggressive risk (2%)
console.log('📊 Test 5: Aggressive Risk (2%)');
const test5 = validateTrade({
  symbol: 'NVDA',
  recommendationType: 'long',
  entryPrice: 500.00,
  stopPrice: 490.00,
  targetPrice: 530.00,
  accountEquity: 100000,
  riskPercent: 2, // Aggressive
});

if (test5.valid && test5.shares && test5.costBasis && test5.dollarRisk) {
  console.log('✅ Validation: PASSED');
  console.log(`   Shares: ${test5.shares} (2x normal position)`);
  console.log(`   Cost Basis: $${test5.costBasis.toFixed(2)}`);
  console.log(`   Dollar Risk: $${test5.dollarRisk.toFixed(2)} (2% of account)`);
} else {
  console.log('❌ Validation: FAILED -', test5.error);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  ✅ ALL TESTS COMPLETE');
console.log('═══════════════════════════════════════════════════════════\n');
