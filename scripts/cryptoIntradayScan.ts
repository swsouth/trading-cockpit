/**
 * Crypto Intraday Scanner
 *
 * Scans cryptocurrencies for intraday trade opportunities using 5-min bars
 * Runs every 5 minutes, 24/7 (crypto markets never close)
 *
 * POC: BTC only (288 scans/day = 288 API calls/day from Twelve Data quota)
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

    if (!channel.hasChannel) {
      console.log(`   ⚠️  ${symbol}: No channel detected`);
      return null;
    }

    console.log(`   ✓ ${symbol}: Channel detected (${channel.status})`);

    // Generate trade recommendation
    const recommendation = generateTradeRecommendation(candles, channel);

    if (!recommendation) {
      console.log(`   ⚠️  ${symbol}: No actionable setup`);
      return null;
    }

    // Calculate opportunity score (intraday version)
    const scoring = calculateIntradayOpportunityScore(
      candles,
      channel,
      recommendation.pattern,
      recommendation.entry,
      recommendation.target,
      recommendation.stop
    );

    // Current price (last close)
    const currentPrice = candles[candles.length - 1].close;

    // Expiration time (current time + expiration minutes)
    const expiresAt = new Date(Date.now() + config.expirationMinutes * 60 * 1000).toISOString();

    const opportunity: CryptoOpportunity = {
      symbol,
      timeframe: config.timeframe,
      recommendation_type: recommendation.type,
      entry_price: recommendation.entry,
      target_price: recommendation.target,
      stop_loss: recommendation.stop,
      opportunity_score: scoring.totalScore,
      confidence_level: scoring.confidenceLevel,
      rationale: recommendation.rationale,
      current_price: currentPrice,
      expires_at: expiresAt,
      scan_timestamp: new Date().toISOString(),
      asset_type: 'crypto',

      // Technical details
      channel_status: channel.status,
      pattern_detected: recommendation.pattern.mainPattern,
      rsi: recommendation.rsi || null,
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get authenticated user (for user_id)
  // For automated scanner, we'll use a system user or skip user_id requirement
  // For now, we'll insert without user_id and let RLS handle it
  // TODO: Consider adding a system user or modifying RLS for scanner-generated opportunities

  console.log(`\n📊 Storing ${opportunities.length} crypto opportunities...`);

  for (const opp of opportunities) {
    try {
      const { error } = await supabase
        .from('intraday_opportunities')
        .insert({
          // No user_id for system-generated opportunities
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
        });

      if (error) {
        console.error(`   ❌ Failed to store ${opp.symbol}:`, error.message);
      } else {
        console.log(`   ✓ Stored ${opp.symbol}`);
      }
    } catch (err) {
      console.error(`   ❌ Error storing ${opp.symbol}:`, err);
    }
  }
}

/**
 * Main crypto scanner function
 */
async function runCryptoScan(): Promise<void> {
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

  // POC: Scan BTC only
  const CRYPTO_SYMBOLS = ['BTC'];

  console.log(`🎯 Scanning ${CRYPTO_SYMBOLS.length} cryptocurrency...`);
  console.log('');

  const opportunities: CryptoOpportunity[] = [];

  for (const symbol of CRYPTO_SYMBOLS) {
    console.log(`Analyzing ${symbol}...`);

    const opportunity = await analyzeCrypto(symbol, DEFAULT_CONFIG);

    if (opportunity) {
      opportunities.push(opportunity);
    }

    console.log('');
  }

  // Summary
  console.log('═'.repeat(50));
  console.log('📊 SCAN SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Total scanned: ${CRYPTO_SYMBOLS.length}`);
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

  console.log('');
  console.log(`✅ Scan completed: ${new Date().toLocaleString()}`);
  console.log('');
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
