/**
 * Intraday Market Scanner (Day Trading)
 *
 * Scans high-volume stocks for intraday trade opportunities using 5-min bars
 * Separate from daily scanner - runs every 5 min during market hours
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getIntradayCandles, isMarketOpen, getMarketStatus } from '@/lib/intradayMarketData';
import { detectChannel } from '@/lib/analysis';
import { calculateIntradayOpportunityScore } from '@/lib/scoring';
import { generateTradeRecommendation } from '@/lib/tradeCalculator';
import { Candle } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

/**
 * Get active intraday stocks from database
 * Replaces hardcoded INTRADAY_SYMBOLS array
 */
async function getActiveIntradaySymbols(): Promise<string[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('intraday_scanner_config')
    .select('symbol')
    .eq('is_active', true)
    .order('symbol');

  if (error) {
    console.error('Error fetching intraday symbols:', error);
    throw new Error(`Failed to fetch intraday stock universe: ${error.message}`);
  }

  return data?.map(row => row.symbol) || [];
}

/**
 * Intraday scanner configuration
 */
interface IntradayScanConfig {
  timeframe: '1Min' | '5Min' | '15Min';
  lookbackBars: number;        // Number of bars to analyze
  expirationMinutes: number;   // How long setup stays valid
  minScore: number;            // Minimum score to save
}

const DEFAULT_CONFIG: IntradayScanConfig = {
  timeframe: '5Min',           // 5-minute bars
  lookbackBars: 60,            // 60 bars = 5 hours of data
  expirationMinutes: 30,       // Setups expire in 30 min
  minScore: 0,                 // Show ALL opportunities - let user decide (matches daily scanner)
};

/**
 * Intraday opportunity result
 */
interface IntradayOpportunity {
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

  // Additional intraday context
  channel_status: string | null;
  pattern_detected: string | null;
  rsi: number | null;

  // Tier classification (NEW - Phase 8)
  setup_tier?: 'SCALP' | 'STANDARD' | 'MOMENTUM';
  expected_hold_minutes?: number;
  tier_score?: number;
  tier_rationale?: string;
}

/**
 * Analyze a single stock for intraday opportunities
 */
async function analyzeIntradayStock(
  symbol: string,
  config: IntradayScanConfig
): Promise<IntradayOpportunity | null> {
  try {
    // Fetch intraday candles
    const candles = await getIntradayCandles(symbol, config.timeframe, config.lookbackBars);

    if (!candles || candles.length < 20) {
      console.log(`   ⚠️  ${symbol}: Insufficient data (${candles?.length || 0} bars)`);
      return null;
    }

    const currentPrice = candles[candles.length - 1].close;

    // ═══════════════════════════════════════════════════════════════════
    // NEW IMPLEMENTATION: Use AnalysisEngine (Phase 1 Engine Integration)
    // ═══════════════════════════════════════════════════════════════════
    const { AnalysisEngine } = await import('@/lib/engine');

    // Initialize engine with intraday stock configuration
    const engine = new AnalysisEngine({
      assetType: 'stock',
      timeframe: 'intraday',
    });

    // Run analysis through unified 8-stage pipeline
    const signal = await engine.analyzeAsset({
      symbol,
      candles,
      currentPrice,
    });

    // No signal = no actionable setup
    if (!signal) {
      return null;
    }

    // Calculate expiration time (30 min from now)
    const expiresAt = new Date(Date.now() + config.expirationMinutes * 60 * 1000);

    // Convert Signal to IntradayOpportunity format
    // Skip if no recommendation (Signal.recommendation is 'long' | 'short' | null)
    if (!signal.recommendation) {
      return null;
    }

    return {
      symbol,
      timeframe: config.timeframe,
      recommendation_type: signal.recommendation,
      entry_price: signal.entry,
      target_price: signal.target,
      stop_loss: signal.stopLoss,
      opportunity_score: signal.score,
      confidence_level: signal.confidence,
      rationale: signal.rationale,
      current_price: currentPrice,
      expires_at: expiresAt.toISOString(),
      scan_timestamp: new Date().toISOString(),
      channel_status: signal.metadata.channelStatus || null,
      pattern_detected: signal.mainPattern || null,
      rsi: null, // RSI not currently exposed in Signal metadata
      // Phase 8: Tier classification
      setup_tier: signal.metadata.setupTier,
      expected_hold_minutes: signal.metadata.expectedHoldMinutes,
      tier_score: signal.metadata.tierScore,
      tier_rationale: signal.metadata.tierRationale,
    };

    // ═══════════════════════════════════════════════════════════════════
    // OLD IMPLEMENTATION (preserved for validation)
    // ═══════════════════════════════════════════════════════════════════
    /*
    const channelResult = detectChannel(candles, Math.min(40, candles.length));
    const { detectPatterns } = await import('@/lib/analysis');
    const patternResult = detectPatterns(candles);
    const { analyzeVolume } = await import('@/lib/scoring');
    const { detectAbsorption } = await import('@/lib/orderflow');
    const volume = analyzeVolume(candles);
    const absorption = detectAbsorption(candles, volume);

    const recommendation = generateTradeRecommendation({
      symbol,
      candles,
      channel: channelResult,
      pattern: patternResult,
      currentPrice,
      volume,
      absorption,
    });

    if (!recommendation || recommendation.setup.type === 'none') {
      return null;
    }

    const score = calculateIntradayOpportunityScore(
      candles,
      channelResult,
      patternResult,
      recommendation.entry,
      recommendation.target,
      recommendation.stopLoss
    );

    const expiresAt = new Date(Date.now() + config.expirationMinutes * 60 * 1000);
    const rationale = buildIntradayRationale(recommendation, channelResult, score);

    return {
      symbol,
      timeframe: config.timeframe,
      recommendation_type: recommendation.setup.type,
      entry_price: recommendation.entry,
      target_price: recommendation.target,
      stop_loss: recommendation.stopLoss,
      opportunity_score: score.totalScore,
      confidence_level: score.confidenceLevel,
      rationale,
      current_price: currentPrice,
      expires_at: expiresAt.toISOString(),
      scan_timestamp: new Date().toISOString(),
      channel_status: channelResult.status || null,
      pattern_detected: patternResult.mainPattern || null,
      rsi: score.components.momentumScore || null,
    };
    */

  } catch (error) {
    console.error(`   ❌ ${symbol}: Error analyzing -`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Build human-readable rationale for intraday setup
 */
function buildIntradayRationale(
  recommendation: any,
  channelResult: any,
  score: any
): string {
  const parts: string[] = [];

  // Setup type
  parts.push(recommendation.setup.setupName);

  // Channel info
  if (channelResult.hasChannel) {
    parts.push(`Channel: $${channelResult.support.toFixed(2)} - $${channelResult.resistance.toFixed(2)}`);
  }

  // Pattern
  if (recommendation.setup.pattern && recommendation.setup.pattern !== 'none') {
    parts.push(`Pattern: ${recommendation.setup.pattern}`);
  }

  // Score breakdown - use correct component property names
  const components = score.components;
  parts.push(`Score: ${score.totalScore}/100 (Trend: ${components.trendStrength || 0}, Pattern: ${components.patternQuality || 0}, Volume: ${components.volumeScore || 0})`);

  return parts.join(' | ');
}

/**
 * Store opportunities in database
 */
async function storeIntradayOpportunities(
  opportunities: IntradayOpportunity[]
): Promise<number> {
  console.log(`\n💾 storeIntradayOpportunities() called with ${opportunities.length} opportunities`);

  if (opportunities.length === 0) {
    console.log('   ⚠️  No opportunities to store (empty array)');
    return 0;
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

  // First, mark all existing opportunities as expired (cleanup)
  console.log('   🧹 Marking expired opportunities...');
  const { error: expireError } = await supabase
    .from('intraday_opportunities')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'active');

  if (expireError) {
    console.error('   ⚠️  Error marking expired opportunities:', expireError);
  } else {
    console.log('   ✅ Expired opportunities marked');
  }

  // Get first user from database (for single-user MVP)
  // TODO: When multi-user, scan should create opportunities for all users
  console.log('   👤 Fetching user ID...');
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('   ❌ Error fetching users:', userError);
    return 0;
  }

  const userId = users?.users?.[0]?.id;

  if (!userId) {
    console.error('   ❌ No user found in database - cannot store opportunities');
    console.error(`      Users data:`, users);
    return 0;
  }

  console.log(`   ✅ User ID: ${userId}`);

  // Insert new opportunities
  const records = opportunities.map(opp => ({
    user_id: userId,
    symbol: opp.symbol,
    timeframe: opp.timeframe,
    recommendation_type: opp.recommendation_type,
    entry_price: opp.entry_price,
    target_price: opp.target_price,
    stop_loss: opp.stop_loss,
    opportunity_score: opp.opportunity_score,
    confidence_level: opp.confidence_level,
    rationale: opp.rationale,
    current_price: opp.current_price,
    expires_at: opp.expires_at,
    scan_timestamp: opp.scan_timestamp,
    channel_status: opp.channel_status,
    pattern_detected: opp.pattern_detected,
    rsi: opp.rsi,
    status: 'active',
    // Phase 8: Tier classification
    setup_tier: opp.setup_tier,
    expected_hold_minutes: opp.expected_hold_minutes,
    tier_score: opp.tier_score,
    tier_rationale: opp.tier_rationale,
  }));

  console.log(`   📝 Inserting ${records.length} records into database...`);
  console.log(`      Sample record:`, JSON.stringify(records[0], null, 2));

  const { data, error } = await supabase
    .from('intraday_opportunities')
    .insert(records)
    .select();

  if (error) {
    console.error('   ❌ Error storing intraday opportunities:', error);
    console.error('      Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log(`   ✅ Successfully inserted ${data?.length || 0} opportunities`);
  if (data && data.length > 0) {
    console.log(`      First inserted record ID: ${data[0].id}`);
  }

  return data?.length || 0;
}

/**
 * Main intraday scanner function
 * Returns the count of opportunities found
 */
export async function runIntradayMarketScan(
  config: IntradayScanConfig = DEFAULT_CONFIG
): Promise<number> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  INTRADAY MARKET SCANNER (DAY TRADING)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const startTime = new Date();
  console.log(`Scan Time: ${startTime.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET\n`);

  // Check market status
  const marketStatus = getMarketStatus();
  console.log(`Market Status: ${marketStatus.status.toUpperCase()}`);
  console.log(`${marketStatus.message}\n`);

  // TEMPORARILY DISABLED: Allow scanning when market closed for testing
  // TODO: Re-enable before production
  // if (!marketStatus.isOpen) {
  //   console.log('⚠️  Market is closed. Skipping intraday scan.\n');
  //   return;
  // }

  console.log('⏰ Running scanner even though market is closed (testing mode)\n');

  // Get active symbols from database
  console.log('📊 Fetching active intraday stocks...');
  const symbols = await getActiveIntradaySymbols();
  console.log(`   Found ${symbols.length} active stocks\n`);

  console.log(`Scanning ${symbols.length} high-volume stocks...`);
  console.log(`Timeframe: ${config.timeframe} bars (${config.lookbackBars} bars = ${(config.lookbackBars * 5) / 60} hours)`);
  console.log(`Min Score: ${config.minScore}`);
  console.log(`Expiration: ${config.expirationMinutes} minutes\n`);

  const opportunities: IntradayOpportunity[] = [];
  let successful = 0;
  let failed = 0;

  // Analyze each stock
  for (const symbol of symbols) {
    console.log(`📊 ${symbol}...`);

    const opportunity = await analyzeIntradayStock(symbol, config);

    if (opportunity) {
      opportunities.push(opportunity);
      successful++;
      console.log(`   ✅ Setup found: ${opportunity.recommendation_type.toUpperCase()} @ $${opportunity.entry_price.toFixed(2)} | Score: ${opportunity.opportunity_score}/100`);
    } else {
      successful++; // Still counts as successful scan, just no setup
    }

    // Small delay to avoid hammering API (Alpaca allows 200 req/min)
    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5s delay
  }

  console.log(`\n✅ Scanning complete!\n`);

  // Sort by score (highest first)
  opportunities.sort((a, b) => b.opportunity_score - a.opportunity_score);

  // Display results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  INTRADAY OPPORTUNITIES');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (opportunities.length > 0) {
    console.log(`Found ${opportunities.length} active setups:\n`);

    opportunities.forEach((opp, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${opp.symbol.padEnd(6)} - ${opp.recommendation_type.toUpperCase()} @ $${opp.entry_price.toFixed(2)}`);
      console.log(`    Score: ${opp.opportunity_score}/100 (${opp.confidence_level})`);
      console.log(`    Target: $${opp.target_price.toFixed(2)} | Stop: $${opp.stop_loss.toFixed(2)}`);
      console.log(`    Expires: ${new Date(opp.expires_at).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} ET`);
      console.log(`    ${opp.rationale}\n`);
    });

    // Store in database
    console.log('💾 Storing opportunities...');
    const saved = await storeIntradayOpportunities(opportunities);
    console.log(`   ✅ Saved ${saved} opportunities\n`);
  } else {
    console.log('ℹ️  No opportunities found (all setups below minimum score)\n');
  }

  // Stats
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SCAN SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Stocks Scanned:      ${symbols.length}`);
  console.log(`Successful:          ${successful}`);
  console.log(`Opportunities:       ${opportunities.length}`);
  console.log(`Duration:            ${(duration / 1000).toFixed(1)}s`);
  console.log(`Next Scan:           In 5 minutes\n`);

  console.log('✅ Intraday scan complete!\n');

  return opportunities.length;
}

// Run the scanner if executed directly
if (require.main === module) {
  runIntradayMarketScan()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
