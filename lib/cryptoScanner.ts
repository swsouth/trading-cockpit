/**
 * Crypto Intraday Scanner (Library Version)
 *
 * Scans cryptocurrencies for intraday trade opportunities using 5-min bars
 * Exported function for use in API routes and CLI scripts
 */

import { batchGetCryptoIntradayCandles, getCryptoMarketStatus } from '@/lib/twelveDataCrypto';
import { detectChannel } from '@/lib/analysis';
import { calculateIntradayOpportunityScore } from '@/lib/scoring';
import { generateTradeRecommendation } from '@/lib/tradeCalculator';
import { Candle } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

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
  minScore: 50,                // Minimum score of 50 (medium quality setups)
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
 * Analyze a single crypto for intraday opportunities (using pre-fetched candles)
 */
async function analyzeCrypto(
  symbol: string,
  candles: Candle[],
  config: CryptoScanConfig
): Promise<CryptoOpportunity | null> {
  try {
    if (!candles || candles.length < 20) {
      console.log(`   ⚠️  ${symbol}: Insufficient data (${candles?.length || 0} bars)`);
      return null;
    }

    console.log(`   ✓ ${symbol}: Analyzing ${candles.length} bars`);

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
 * Clean up expired crypto opportunities (standalone function)
 */
async function cleanupExpiredOpportunities(): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('   ⚠️  Supabase config missing - skipping cleanup');
    return 0;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date().toISOString();

  // Count expired opportunities first
  const { count: beforeCount } = await supabase
    .from('intraday_opportunities')
    .select('*', { count: 'exact', head: true })
    .lt('expires_at', now)
    .eq('status', 'active')
    .eq('asset_type', 'crypto');

  // Update them to expired
  const { error } = await supabase
    .from('intraday_opportunities')
    .update({ status: 'expired' })
    .lt('expires_at', now)
    .eq('status', 'active')
    .eq('asset_type', 'crypto');

  if (error) {
    console.error('   ⚠️  Error cleaning up expired opportunities:', error);
    return 0;
  }

  return beforeCount || 0;
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
  const now = new Date().toISOString();

  // Count expired opportunities first
  const { count: expiredCount } = await supabase
    .from('intraday_opportunities')
    .select('*', { count: 'exact', head: true })
    .lt('expires_at', now)
    .eq('status', 'active')
    .eq('asset_type', 'crypto');

  // Update them to expired
  const { error: expireError } = await supabase
    .from('intraday_opportunities')
    .update({ status: 'expired' })
    .lt('expires_at', now)
    .eq('status', 'active')
    .eq('asset_type', 'crypto');

  if (expireError) {
    console.error('   ⚠️  Error marking expired opportunities:', expireError);
  } else {
    console.log(`   ✅ Marked ${expiredCount || 0} expired crypto opportunities`);
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
 * Main crypto scanner function
 * Returns the count of opportunities found
 */
export async function runCryptoScan(): Promise<number> {
  console.log('🔍 CRYPTO INTRADAY SCANNER');
  console.log('═'.repeat(50));
  console.log(`Started: ${new Date().toLocaleString()}`);
  console.log(`Timeframe: ${DEFAULT_CONFIG.timeframe}`);
  console.log(`Lookback: ${DEFAULT_CONFIG.lookbackBars} bars`);
  console.log('');

  // Check market status (always open for crypto)
  const marketStatus = getCryptoMarketStatus();
  console.log(`📈 Market Status: ${marketStatus.status.toUpperCase()}`);
  console.log(`   ${marketStatus.message}`);
  console.log('');

  // Import tiered universe
  const {
    getAllCryptoSymbols,
    getSymbolsByTier,
    getTierForSymbol,
    getScanInterval,
  } = await import('@/scripts/cryptoUniverseTiered');

  // Determine which coins to scan based on current minute (tiered approach)
  // UPDATED: Allow one scan per period (e.g., can scan at :53 if haven't scanned for :50 period)
  const now = new Date();
  const currentMinute = now.getMinutes();

  console.log(`⏰ Current minute: ${currentMinute}`);
  console.log('   Determining which tiers are eligible for scanning...\n');

  // Helper function to check if we can scan a tier
  // Returns true if we're in the tier's period AND haven't scanned this period yet
  async function canScanTier(tier: number, intervalMinutes: number): Promise<boolean> {
    // Calculate which period we're in (e.g., for 5-min intervals: 0-4, 5-9, 10-14, etc.)
    const currentPeriod = Math.floor(currentMinute / intervalMinutes);

    // Get last scan time from database for this tier
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(`   ⚠️  Tier ${tier}: Supabase config missing - allowing scan`);
      return true; // Default to allowing scan if no DB access
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we've scanned this tier in the current period
    const periodStartTime = new Date(now);
    periodStartTime.setMinutes(currentPeriod * intervalMinutes, 0, 0);

    const { data, error } = await supabase
      .from('crypto_scan_history')
      .select('scan_timestamp, tier')
      .eq('tier', tier)
      .gte('scan_timestamp', periodStartTime.toISOString())
      .order('scan_timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.warn(`   ⚠️  Tier ${tier}: Error checking scan history - allowing scan`, error.message);
      return true; // Default to allowing scan on error
    }

    const hasScannedThisPeriod = data && data.length > 0;

    if (hasScannedThisPeriod) {
      const lastScan = new Date(data[0].scan_timestamp);
      const minutesAgo = Math.floor((now.getTime() - lastScan.getTime()) / 60000);
      console.log(`   ⏸️  Tier ${tier}: Already scanned this period (${minutesAgo}m ago) - skipping`);
      return false;
    }

    console.log(`   ✅ Tier ${tier}: Eligible for scan (period ${currentPeriod})`);
    return true;
  }

  // Record scan in history for this tier
  async function recordScan(tier: number): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('crypto_scan_history').insert({
      tier,
      scan_timestamp: now.toISOString(),
    });
  }

  // Check each tier asynchronously
  const [canTier1, canTier2, canTier3, canTier4] = await Promise.all([
    canScanTier(1, 5),   // Tier 1: every 5 minutes
    canScanTier(2, 10),  // Tier 2: every 10 minutes
    canScanTier(3, 15),  // Tier 3: every 15 minutes
    canScanTier(4, 30),  // Tier 4: every 30 minutes
  ]);

  const tier1Coins = canTier1 ? getSymbolsByTier(1) : [];
  const tier2Coins = canTier2 ? getSymbolsByTier(2) : [];
  const tier3Coins = canTier3 ? getSymbolsByTier(3) : [];
  const tier4Coins = canTier4 ? getSymbolsByTier(4) : [];

  const cryptoSymbols = [...tier1Coins, ...tier2Coins, ...tier3Coins, ...tier4Coins];

  if (tier1Coins.length > 0) {
    console.log(`   ✓ Tier 1: ${tier1Coins.length} coins (every 5 min)`);
    await recordScan(1);
  }
  if (tier2Coins.length > 0) {
    console.log(`   ✓ Tier 2: ${tier2Coins.length} coins (every 10 min)`);
    await recordScan(2);
  }
  if (tier3Coins.length > 0) {
    console.log(`   ✓ Tier 3: ${tier3Coins.length} coins (every 15 min)`);
    await recordScan(3);
  }
  if (tier4Coins.length > 0) {
    console.log(`   ✓ Tier 4: ${tier4Coins.length} coins (every 30 min)`);
    await recordScan(4);
  }

  if (cryptoSymbols.length === 0) {
    console.log('⚠️  No tiers eligible for scanning at this time');
    console.log('   (All tiers already scanned in their current period)');
    return 0;
  }

  console.log(`\n🎯 Scanning ${cryptoSymbols.length} cryptocurrencies...`);
  console.log('');

  // ═══════════════════════════════════════════════════════════════════
  // FETCH ALL CANDLE DATA FIRST (with rate limiting built-in)
  // ═══════════════════════════════════════════════════════════════════
  console.log(`\n🔄 Fetching ${DEFAULT_CONFIG.timeframe} candles for ${cryptoSymbols.length} cryptos (rate-limited)...`);
  const candleDataMap = await batchGetCryptoIntradayCandles(
    cryptoSymbols,
    DEFAULT_CONFIG.timeframe,
    DEFAULT_CONFIG.lookbackBars
  );
  console.log(`✅ Fetched candles for ${candleDataMap.size}/${cryptoSymbols.length} cryptos\n`);

  // ═══════════════════════════════════════════════════════════════════
  // ANALYZE ALL CRYPTOS (no API calls, just computation)
  // ═══════════════════════════════════════════════════════════════════
  const opportunities: CryptoOpportunity[] = [];

  for (const symbol of cryptoSymbols) {
    const tier = getTierForSymbol(symbol);
    const candles = candleDataMap.get(symbol);

    if (!candles) {
      console.log(`⚠️  ${symbol} (Tier ${tier}): No candle data available`);
      console.log('');
      continue;
    }

    console.log(`Analyzing ${symbol} (Tier ${tier})...`);

    const opportunity = await analyzeCrypto(symbol, candles, DEFAULT_CONFIG);

    if (opportunity) {
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

  if (opportunities.length > 0) {
    console.log('');
    console.log('Opportunities:');
    opportunities.forEach(opp => {
      console.log(`  ${opp.symbol}: ${opp.recommendation_type.toUpperCase()} @ $${opp.entry_price.toFixed(2)} (score: ${opp.opportunity_score})`);
    });

    // Store in database
    await storeOpportunities(opportunities);
  }

  // Always clean up expired opportunities (even when no new ones found)
  console.log('');
  console.log('🧹 Cleaning up expired opportunities...');
  const expiredCount = await cleanupExpiredOpportunities();
  console.log(`   ✅ Marked ${expiredCount} expired opportunities`);

  console.log('');
  console.log(`✅ Scan completed: ${new Date().toLocaleString()}`);
  console.log('');

  return opportunities.length;
}
