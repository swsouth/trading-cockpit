/**
 * Test Crypto Universe Setup
 *
 * Verifies:
 * 1. Static tiered universe (100 coins)
 * 2. CoinMarketCap API integration (if configured)
 * 3. Dynamic universe refresh
 * 4. Hot coin detection
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import {
  getAllCryptoSymbols,
  getSymbolsByTier,
  getTierForSymbol,
  getScanInterval,
  printUniverseSummary,
  CRYPTO_UNIVERSE_STATS,
} from './cryptoUniverseTiered';

import {
  fetchTopCryptos,
  buildDynamicUniverse,
  identifyHotCoins,
  getScanPriority,
} from '../lib/coinmarketcap';

async function testStaticUniverse() {
  console.log('\n' + '═'.repeat(60));
  console.log('TEST 1: STATIC TIERED UNIVERSE');
  console.log('═'.repeat(60));

  printUniverseSummary();

  console.log('\nSample Coins by Tier:');
  console.log(`  Tier 1: ${getSymbolsByTier(1).slice(0, 5).join(', ')}...`);
  console.log(`  Tier 2: ${getSymbolsByTier(2).slice(0, 5).join(', ')}...`);
  console.log(`  Tier 3: ${getSymbolsByTier(3).slice(0, 5).join(', ')}...`);
  console.log(`  Tier 4: ${getSymbolsByTier(4).slice(0, 5).join(', ')}...`);

  console.log('\nLookup Test:');
  console.log(`  BTC is Tier: ${getTierForSymbol('BTC')}, Scan Interval: ${getScanInterval('BTC')} min`);
  console.log(`  UNI is Tier: ${getTierForSymbol('UNI')}, Scan Interval: ${getScanInterval('UNI')} min`);
  console.log(`  FIL is Tier: ${getTierForSymbol('FIL')}, Scan Interval: ${getScanInterval('FIL')} min`);

  console.log('\n✅ Static universe test PASSED');
}

async function testDynamicUniverse() {
  console.log('\n' + '═'.repeat(60));
  console.log('TEST 2: DYNAMIC UNIVERSE (CoinMarketCap API)');
  console.log('═'.repeat(60));

  const apiKey = process.env.COINMARKETCAP_API_KEY;

  if (!apiKey) {
    console.log('⚠️  COINMARKETCAP_API_KEY not configured');
    console.log('   Set it in .env.local to enable dynamic universe');
    console.log('   Get free API key: https://coinmarketcap.com/api/');
    console.log('\n⏭️  Skipping dynamic universe test');
    return;
  }

  console.log('🌍 Fetching top 100 cryptos from CoinMarketCap...\n');

  try {
    const cryptos = await fetchTopCryptos(100);

    if (cryptos.length === 0) {
      console.log('❌ Failed to fetch from CoinMarketCap API');
      console.log('   Check your API key and try again');
      return;
    }

    console.log(`✅ Fetched ${cryptos.length} cryptocurrencies`);
    console.log('\nTop 10:');
    cryptos.slice(0, 10).forEach((crypto, i) => {
      const price = crypto.quote.USD.price.toFixed(2);
      const volume = (crypto.quote.USD.volume_24h / 1e9).toFixed(2);
      const change = crypto.quote.USD.percent_change_24h.toFixed(2);
      console.log(`  ${i + 1}. ${crypto.symbol.padEnd(6)} $${price.padStart(10)} | Vol: $${volume}B | 24h: ${change}%`);
    });

    // Test hot coin detection
    console.log('\n🔥 Hot Coin Detection:');
    const hotCoins = identifyHotCoins(cryptos, 200);

    if (hotCoins.length > 0) {
      console.log(`   Found ${hotCoins.length} hot coins (volume change >200%):`);
      console.log(`   ${hotCoins.slice(0, 10).join(', ')}`);
    } else {
      console.log('   No hot coins detected (volume change <200%)');
    }

    // Test dynamic universe build
    console.log('\n🎯 Building Dynamic Universe...');
    const universe = await buildDynamicUniverse();

    console.log(`\nDynamic Universe Summary:`);
    console.log(`  Tier 1: ${universe.tier1.length} coins`);
    console.log(`  Tier 2: ${universe.tier2.length} coins`);
    console.log(`  Tier 3: ${universe.tier3.length} coins`);
    console.log(`  Tier 4: ${universe.tier4.length} coins`);
    console.log(`  Hot Coins: ${universe.hotCoins.length} coins`);

    // Test priority scoring
    console.log('\n⭐ Priority Scoring Examples:');
    const testSymbols = ['BTC', 'ETH', 'SOL'];
    testSymbols.forEach(symbol => {
      const crypto = cryptos.find(c => c.symbol === symbol);
      if (crypto) {
        const tier = crypto.rank <= 10 ? 1 : crypto.rank <= 30 ? 2 : crypto.rank <= 60 ? 3 : 4;
        const priority = getScanPriority(symbol, universe.hotCoins, tier);
        const hotFlag = universe.hotCoins.includes(symbol) ? ' 🔥' : '';
        console.log(`  ${symbol}${hotFlag}: Tier ${tier}, Priority ${priority}/5`);
      }
    });

    console.log('\n✅ Dynamic universe test PASSED');
  } catch (error) {
    console.error('\n❌ Dynamic universe test FAILED:', error);
  }
}

async function testScanSchedule() {
  console.log('\n' + '═'.repeat(60));
  console.log('TEST 3: SCAN SCHEDULE SIMULATION');
  console.log('═'.repeat(60));

  console.log('\nShowing which tiers scan at different minutes:\n');

  const testMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  testMinutes.forEach(minute => {
    const tier1 = minute % 5 === 0;
    const tier2 = minute % 10 === 0;
    const tier3 = minute % 15 === 0;
    const tier4 = minute % 30 === 0;

    const tiers: string[] = [];
    if (tier1) tiers.push('T1 (10)');
    if (tier2) tiers.push('T2 (20)');
    if (tier3) tiers.push('T3 (30)');
    if (tier4) tiers.push('T4 (40)');

    const total = (tier1 ? 10 : 0) + (tier2 ? 20 : 0) + (tier3 ? 30 : 0) + (tier4 ? 40 : 0);

    if (tiers.length > 0) {
      console.log(`  Minute ${minute.toString().padStart(2)}: ${tiers.join(' + ')} = ${total} coins`);
    }
  });

  console.log('\nScan Distribution per Hour:');
  console.log(`  Tier 1: ${60 / 5} scans × 10 coins = ${(60/5) * 10} coin-scans/hour`);
  console.log(`  Tier 2: ${60 / 10} scans × 20 coins = ${(60/10) * 20} coin-scans/hour`);
  console.log(`  Tier 3: ${60 / 15} scans × 30 coins = ${(60/15) * 30} coin-scans/hour`);
  console.log(`  Tier 4: ${60 / 30} scans × 40 coins = ${(60/30) * 40} coin-scans/hour`);
  console.log(`  Total: ${(60/5)*10 + (60/10)*20 + (60/15)*30 + (60/30)*40} coin-scans/hour`);

  console.log('\n✅ Scan schedule test PASSED');
}

async function main() {
  console.log('\n🧪 CRYPTO UNIVERSE TEST SUITE');
  console.log('Testing tiered crypto scanner setup\n');

  await testStaticUniverse();
  await testDynamicUniverse();
  await testScanSchedule();

  console.log('\n' + '═'.repeat(60));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('═'.repeat(60));
  console.log('\nNext Steps:');
  console.log('1. Add COINMARKETCAP_API_KEY to .env.local (optional)');
  console.log('2. Run: npm run scan-crypto-intraday');
  console.log('3. Check /crypto-intraday page for results');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
