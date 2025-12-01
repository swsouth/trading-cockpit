/**
 * Crypto Intraday Scanner - ENHANCED with Dynamic Universe
 *
 * Features:
 * - 100 cryptos across 4 tiers (vs original 5 coins)
 * - Daily CMC universe refresh (identifies hot coins)
 * - Volume-based tier promotion (catches breakouts)
 * - Tiered scanning (5/10/15/30 min intervals)
 * - Hot coin priority boost
 *
 * API Usage:
 * - CoinMarketCap: 1 call/day (universe refresh)
 * - Twelve Data: ~8,000 calls/month (intraday scanning)
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getCryptoIntradayCandles, getCryptoMarketStatus } from '@/lib/twelveDataCrypto';
import { detectChannel } from '@/lib/analysis';
import { calculateIntradayOpportunityScore } from '@/lib/scoring';
import { generateTradeRecommendation } from '@/lib/tradeCalculator';
import { Candle } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';
import { buildDynamicUniverse, getScanPriority } from '@/lib/coinmarketcap';
import {
  getAllCryptoSymbols,
  getSymbolsByTier,
  getTierForSymbol,
  getScanInterval,
  printUniverseSummary,
  TIER_1_MAJORS,
  TIER_2_LARGE_CAPS,
  TIER_3_MID_CAPS,
  TIER_4_EMERGING,
} from './cryptoUniverseTiered';

/**
 * Crypto intraday scanner configuration
 */
interface CryptoScanConfig {
  timeframe: '1min' | '5min' | '15min';
  lookbackBars: number;        // Number of bars to analyze
  expirationMinutes: number;   // How long setup stays valid
  minScore: number;            // Minimum score to save
}

const DEFAULT_CONFIG: CryptoScanConfig = {
  timeframe: '5min',           // 5-minute bars
  lookbackBars: 60,            // 60 bars = 5 hours of data
  expirationMinutes: 30,       // Setups expire in 30 min
  minScore: 0,                 // Show ALL opportunities - let user decide
};

/**
 * Crypto opportunity result
 */
interface CryptoOpportunity {
  symbol: string;
  timeframe: string;
  recommendation_type: 'long' | 'short';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  opportunity_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  rationale: string;
  current_price: number;
  expires_at: string;
  scan_timestamp: string;
  asset_type: 'crypto';

  // Additional intraday context
  channel_status: string | null;
  pattern_detected: string | null;
  rsi: number | null;
}

/**
 * Analyze a single crypto for intraday opportunities
 */
async function analyzeCrypto(
  symbol: string,
  config: CryptoScanConfig
): Promise<CryptoOpportunity | null> {
  try {
    // Fetch intraday candles from Twelve Data
    const candles = await getCryptoIntradayCandles(symbol, config.timeframe, config.lookbackBars);

    if (!candles || candles.length < 20) {
      console.log(`   ⚠️  ${symbol}: Insufficient data (${candles?.length || 0} bars)`);
      return null;
    }

    console.log(`   ✓ ${symbol}: Fetched ${candles.length} bars`);

    // Detect channel
    const channel = detectChannel(candles);

    // Detect patterns
    const { detectPatterns } = await import('@/lib/analysis');
    const pattern = detectPatterns(candles);

    // Analyze volume and absorption (for high confidence determination)
    const { analyzeVolume } = await import('@/lib/scoring');
    const { detectAbsorption } = await import('@/lib/orderflow');
    const volume = analyzeVolume(candles);
    const absorption = detectAbsorption(candles, volume);

    console.log(`   ✓ ${symbol}: Channel: ${channel.hasChannel ? 'YES' : 'NO'}, Pattern: ${pattern.mainPattern}`);

    // Generate trade recommendation (correct signature with volume and absorption)
    const recommendation = generateTradeRecommendation({
      symbol,
      candles,
      channel,
      pattern,
      volume,
      absorption,
    });

    if (!recommendation) {
      console.log(`   ⚠️  ${symbol}: No actionable setup`);
      return null;
    }

    // Calculate opportunity score (intraday version)
    const scoring = calculateIntradayOpportunityScore(
      candles,
      channel,
      pattern,
      recommendation.entry,
      recommendation.target,
      recommendation.stopLoss
    );

    // Current price (last close)
    const currentPrice = candles[candles.length - 1].close;

    // Expiration time (current time + expiration minutes)
    const expiresAt = new Date(Date.now() + config.expirationMinutes * 60 * 1000).toISOString();

    const opportunity: CryptoOpportunity = {
      symbol,
      timeframe: config.timeframe,
      recommendation_type: recommendation.setup.type as 'long' | 'short',
      entry_price: recommendation.entry,
      target_price: recommendation.target,
      stop_loss: recommendation.stopLoss,
      opportunity_score: scoring.totalScore,
      confidence_level: scoring.confidenceLevel,
      rationale: recommendation.rationale,
      current_price: currentPrice,
      expires_at: expiresAt,
      scan_timestamp: new Date().toISOString(),
      asset_type: 'crypto',

      // Technical details
      channel_status: channel.status,
      pattern_detected: pattern.mainPattern,
      rsi: scoring.components.momentumScore || null,
    };

    console.log(`   ✅ ${symbol}: Found ${opportunity.recommendation_type.toUpperCase()} setup (score: ${scoring.totalScore})`);

    return opportunity;
  } catch (error) {
    console.error(`   ❌ ${symbol}: Error analyzing crypto:`, error);
    return null;
  }
}

/**
 * Store crypto opportunities in database
 */
async function storeOpportunities(opportunities: CryptoOpportunity[]): Promise<void> {
  console.log(`\n💾 storeOpportunities() called with ${opportunities.length} crypto opportunities`);

  if (opportunities.length === 0) {
    console.log('   ⚠️  No opportunities to store (empty array)');
    return;
  }

  // Log each opportunity before processing
  opportunities.forEach((opp, index) => {
    console.log(`   ${index + 1}. ${opp.symbol} ${opp.recommendation_type.toUpperCase()} @ $${opp.entry_price.toFixed(2)} (Score: ${opp.opportunity_score})`);
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('   ❌ Supabase configuration missing!');
    console.error(`      NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
    console.error(`      SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'SET' : 'MISSING'}`);
    throw new Error('Supabase configuration missing');
  }

  console.log('   ✅ Supabase credentials verified');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // First, mark all existing crypto opportunities as expired (cleanup)
  console.log('   🧹 Marking expired crypto opportunities...');
  const { error: expireError } = await supabase
    .from('intraday_opportunities')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'active')
    .eq('asset_type', 'crypto');

  if (expireError) {
    console.error('   ⚠️  Error marking expired opportunities:', expireError);
  } else {
    console.log('   ✅ Expired crypto opportunities marked');
  }

  // Get first user from database (for single-user MVP)
  // TODO: When multi-user, scan should create opportunities for all users
  console.log('   👤 Fetching user ID...');
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('   ❌ Error fetching users:', userError);
    return;
  }

  const userId = users?.users?.[0]?.id;

  if (!userId) {
    console.error('   ❌ No user found in database - cannot store opportunities');
    console.error(`      Users data:`, users);
    return;
  }

  console.log(`   ✅ User ID: ${userId}`);

  // Insert new crypto opportunities
  console.log(`   📝 Inserting ${opportunities.length} crypto records into database...`);

  let successCount = 0;
  let failCount = 0;

  for (const opp of opportunities) {
    try {
      const record = {
        user_id: userId,
        symbol: opp.symbol,
        timeframe: opp.timeframe,
        scan_timestamp: opp.scan_timestamp,
        recommendation_type: opp.recommendation_type,
        entry_price: opp.entry_price,
        target_price: opp.target_price,
        stop_loss: opp.stop_loss,
        opportunity_score: opp.opportunity_score,
        confidence_level: opp.confidence_level,
        rationale: opp.rationale,
        current_price: opp.current_price,
        expires_at: opp.expires_at,
        status: 'active',
        channel_status: opp.channel_status,
        pattern_detected: opp.pattern_detected,
        rsi: opp.rsi,
        asset_type: opp.asset_type,
      };

      const { data, error } = await supabase
        .from('intraday_opportunities')
        .insert(record)
        .select();

      if (error) {
        console.error(`   ❌ Failed to store ${opp.symbol}:`, error.message);
        console.error('      Error details:', JSON.stringify(error, null, 2));
        failCount++;
      } else {
        console.log(`   ✅ Stored ${opp.symbol} (ID: ${data[0]?.id})`);
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ Error storing ${opp.symbol}:`, err);
      failCount++;
    }
  }

  console.log(`\n   📊 Storage Summary: ${successCount} success, ${failCount} failed`);
}

/**
 * Determine which coins to scan based on time and tier
 */
function getCoinsToScan(tier: 1 | 2 | 3 | 4, currentMinute: number): string[] {
  const interval = {
    1: 5,   // Every 5 minutes
    2: 10,  // Every 10 minutes
    3: 15,  // Every 15 minutes
    4: 30,  // Every 30 minutes
  }[tier];

  // Only scan if current minute is divisible by interval
  if (currentMinute % interval === 0) {
    return getSymbolsByTier(tier);
  }

  return [];
}

/**
 * Main crypto scanner function
 * Returns the count of opportunities found
 */
export async function runCryptoScan(useDynamicUniverse: boolean = false): Promise<number> {
  console.log('🔍 CRYPTO INTRADAY SCANNER - ENHANCED');
  console.log('═'.repeat(50));
  console.log(`Started: ${new Date().toLocaleString()}`);
  console.log(`Timeframe: ${DEFAULT_CONFIG.timeframe}`);
  console.log(`Lookback: ${DEFAULT_CONFIG.lookbackBars} bars`);
  console.log(`Dynamic Universe: ${useDynamicUniverse ? 'ENABLED (CMC)' : 'STATIC (Tiered)'}`);
  console.log('');

  // Check market status (always open for crypto)
  const marketStatus = getCryptoMarketStatus();
  console.log(`📈 Market Status: ${marketStatus.status.toUpperCase()}`);
  console.log(`   ${marketStatus.message}`);
  console.log('');

  // Get universe (dynamic from CMC or static tiered)
  let cryptoSymbols: string[] = [];
  let hotCoins: string[] = [];

  if (useDynamicUniverse) {
    console.log('🌍 Fetching dynamic universe from CoinMarketCap...');
    const universe = await buildDynamicUniverse();
    hotCoins = universe.hotCoins;

    // Combine all tiers
    cryptoSymbols = [
      ...universe.tier1,
      ...universe.tier2,
      ...universe.tier3,
      ...universe.tier4,
    ];

    console.log(`   ✅ Loaded ${cryptoSymbols.length} coins from CMC`);
    if (hotCoins.length > 0) {
      console.log(`   🔥 Hot coins: ${hotCoins.slice(0, 5).join(', ')}...`);
    }
  } else {
    // Use static tiered universe
    printUniverseSummary();

    // Determine which tiers to scan based on current time
    const now = new Date();
    const currentMinute = now.getMinutes();

    console.log(`\n⏰ Current minute: ${currentMinute}`);
    console.log('   Determining which tiers to scan...\n');

    const tier1Coins = getCoinsToScan(1, currentMinute);
    const tier2Coins = getCoinsToScan(2, currentMinute);
    const tier3Coins = getCoinsToScan(3, currentMinute);
    const tier4Coins = getCoinsToScan(4, currentMinute);

    cryptoSymbols = [...tier1Coins, ...tier2Coins, ...tier3Coins, ...tier4Coins];

    if (tier1Coins.length > 0) console.log(`   ✓ Tier 1: ${tier1Coins.length} coins (every 5 min)`);
    if (tier2Coins.length > 0) console.log(`   ✓ Tier 2: ${tier2Coins.length} coins (every 10 min)`);
    if (tier3Coins.length > 0) console.log(`   ✓ Tier 3: ${tier3Coins.length} coins (every 15 min)`);
    if (tier4Coins.length > 0) console.log(`   ✓ Tier 4: ${tier4Coins.length} coins (every 30 min)`);
  }

  if (cryptoSymbols.length === 0) {
    console.log('⚠️  No coins scheduled for this minute - skipping scan');
    return 0;
  }

  console.log(`\n🎯 Scanning ${cryptoSymbols.length} cryptocurrencies...`);
  console.log('');

  const opportunities: CryptoOpportunity[] = [];

  for (const symbol of cryptoSymbols) {
    const tier = getTierForSymbol(symbol);
    const priority = getScanPriority(symbol, hotCoins, tier || 4);
    const hotFlag = hotCoins.includes(symbol) ? ' 🔥' : '';

    console.log(`Analyzing ${symbol}${hotFlag} (Tier ${tier}, Priority ${priority})...`);

    const opportunity = await analyzeCrypto(symbol, DEFAULT_CONFIG);

    if (opportunity) {
      // Add tier and priority metadata
      (opportunity as any).tier = tier;
      (opportunity as any).priority = priority;
      (opportunity as any).isHot = hotCoins.includes(symbol);

      opportunities.push(opportunity);
    }

    console.log('');
  }

  // Summary
  console.log('═'.repeat(50));
  console.log('📊 SCAN SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Total scanned: ${cryptoSymbols.length}`);
  console.log(`Opportunities found: ${opportunities.length}`);

  if (hotCoins.length > 0) {
    const hotOpportunities = opportunities.filter(opp => (opp as any).isHot);
    console.log(`Hot coin opportunities: ${hotOpportunities.length}`);
  }

  if (opportunities.length > 0) {
    console.log('');
    console.log('Opportunities:');
    opportunities.forEach(opp => {
      console.log(`  ${opp.symbol}: ${opp.recommendation_type.toUpperCase()} @ $${opp.entry_price.toFixed(2)} (score: ${opp.opportunity_score})`);
    });

    // Store in database
    await storeOpportunities(opportunities);
  }

  console.log('');
  console.log(`✅ Scan completed: ${new Date().toLocaleString()}`);
  console.log('');

  return opportunities.length;
}

// Run the scanner
runCryptoScan()
  .then(() => {
    console.log('Crypto scanner finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Crypto scanner failed:', error);
    process.exit(1);
  });
