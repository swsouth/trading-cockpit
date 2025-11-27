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

    // Run channel detection (same logic as daily, just different timeframe)
    const channelResult = detectChannel(candles, Math.min(40, candles.length));

    // Detect patterns (reuse existing logic)
    const { detectPatterns } = await import('@/lib/analysis');
    const patternResult = detectPatterns(candles);

    console.log(`   Channel: ${channelResult.hasChannel ? 'YES' : 'NO'}, Pattern: ${patternResult.mainPattern}`);

    // Generate trade recommendation
    const recommendation = generateTradeRecommendation({
      symbol,
      candles,
      channel: channelResult,
      pattern: patternResult,
      currentPrice,
    });

    if (!recommendation) {
      return null; // No valid setup
    }

    // Type guard: Only 'long' or 'short' setups are actionable
    if (recommendation.setup.type === 'none') {
      return null;
    }

    // Calculate opportunity score with intraday-specific volume normalization
    const score = calculateIntradayOpportunityScore(
      candles,
      channelResult,
      patternResult,
      recommendation.entry,
      recommendation.target,
      recommendation.stopLoss
    );

    // Show ALL opportunities - let user filter by score in UI
    // (minScore check removed to match daily scanner behavior)

    // Calculate expiration time (30 min from now)
    const expiresAt = new Date(Date.now() + config.expirationMinutes * 60 * 1000);

    // Build rationale
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

  // Score breakdown
  parts.push(`Score: ${score.totalScore}/100 (Trend: ${score.components.trend}, Pattern: ${score.components.pattern}, Volume: ${score.components.volume})`);

  return parts.join(' | ');
}

/**
 * Store opportunities in database
 */
async function storeIntradayOpportunities(
  opportunities: IntradayOpportunity[]
): Promise<number> {
  if (opportunities.length === 0) {
    return 0;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // First, mark all existing opportunities as expired (cleanup)
  await supabase
    .from('intraday_opportunities')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'active');

  // Get first user from database (for single-user MVP)
  // TODO: When multi-user, scan should create opportunities for all users
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id;

  if (!userId) {
    console.error('No user found in database - cannot store opportunities');
    return 0;
  }

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
  }));

  const { data, error } = await supabase
    .from('intraday_opportunities')
    .insert(records)
    .select();

  if (error) {
    console.error('Error storing intraday opportunities:', error);
    throw error;
  }

  return data?.length || 0;
}

/**
 * Main intraday scanner function
 */
export async function runIntradayMarketScan(
  config: IntradayScanConfig = DEFAULT_CONFIG
): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  INTRADAY MARKET SCANNER (DAY TRADING)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const startTime = new Date();
  console.log(`Scan Time: ${startTime.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET\n`);

  // Check market status
  const marketStatus = getMarketStatus();
  console.log(`Market Status: ${marketStatus.status.toUpperCase()}`);
  console.log(`${marketStatus.message}\n`);

  if (!marketStatus.isOpen) {
    console.log('⚠️  Market is closed. Skipping intraday scan.\n');
    return;
  }

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
