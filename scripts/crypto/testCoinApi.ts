/**
 * Test CoinAPI Adapter
 * Quick validation of CoinAPI integration before full scan
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(__dirname, '../../.env.local') });

import { getCrypto15MinCandles, getCrypto1HCandles } from '../../lib/cryptoData/coinApiAdapter';

async function testCoinApi() {
  console.log('🧪 Testing CoinAPI adapter...\n');

  try {
    // Test 1: Fetch 15-min bars for BTC
    console.log('Test 1: Fetching 24h of 15-min BTC/USD data...');
    const btc15m = await getCrypto15MinCandles('BTC/USD', 24);
    console.log(`✅ Success: ${btc15m.length} bars retrieved`);
    console.log(`   Latest: $${btc15m[btc15m.length - 1].close.toFixed(2)} at ${btc15m[btc15m.length - 1].timestamp}\n`);

    // Test 2: Fetch 1H bars for ETH
    console.log('Test 2: Fetching 1 week of 1H ETH/USD data...');
    const eth1h = await getCrypto1HCandles('ETH/USD', 168);
    console.log(`✅ Success: ${eth1h.length} bars retrieved`);
    console.log(`   Latest: $${eth1h[eth1h.length - 1].close.toFixed(2)} at ${eth1h[eth1h.length - 1].timestamp}\n`);

    console.log('🎉 CoinAPI adapter working correctly!');
    console.log('💰 Credit usage: ~20 credits (10 per call, date-bounded cap)\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCoinApi();
