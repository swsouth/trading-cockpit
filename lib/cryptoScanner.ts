/**
 * Crypto Intraday Scanner (Library Version)
 *
 * Scans cryptocurrencies for intraday trade opportunities using 15-min bars
 * Exported function for use in API routes
 *
 * DATA SOURCE: CoinAPI (PRIMARY - ACTIVE with $30 credits)
 * Uses date-bounded queries for 10 credit cap optimization
 * Cost: ~20 credits per crypto (15m + 1H data) = 200 credits per scan
 *
 * HIGH-FREQUENCY STRATEGY:
 * - 10 elite cryptos (highest volume + volatility)
 * - 15-minute scan frequency (96 scans/day)
 * - Daily cost: 96 × 200 = 19,200 credits (~$6.40/day at $1 = 3,000 credits)
 * - Optimized for catching momentum shifts and directional moves
 */

import { batchGetCryptoMultiTimeframe, getNext15MinBarClose } from '@/lib/cryptoData/coinApiAdapter';
import { Candle } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

// Top 10 crypto for high-frequency day trading (elite volume + volatility)
// Optimized for 15-minute scans (96/day × 10 coins × 20 credits = 19,200 credits/day)
const CRYPTO_UNIVERSE = [
  'BTC/USD',   // #1 - King of crypto, highest liquidity
  'ETH/USD',   // #2 - Second largest, high volume
  'SOL/USD',   // #3 - High volatility, fast moves
  'BNB/USD',   // #4 - Exchange token, solid liquidity
  'XRP/USD',   // #5 - High volume, institutional interest
  'ADA/USD',   // #6 - Consistent volume, good for patterns
  'AVAX/USD',  // #7 - Fast blockchain, volatile
  'DOGE/USD',  // #8 - Meme king, extreme volatility
  'MATIC/USD', // #9 - Layer 2, good volume
  'LINK/USD',  // #10 - Oracle leader, consistent patterns
];

interface CryptoAnalysisResult {
  symbol: string;
  success: boolean;
  recommendation?: any; // Database recommendation object
  error?: string;
}

/**
 * Analyze single crypto with MULTI-TIMEFRAME analysis (15-min + 1H bars)
 */
async function analyzeCrypto(
  symbol: string,
  candles15m: Candle[],
  candles1h: Candle[]
): Promise<CryptoAnalysisResult> {
  try {
    if (!candles15m || candles15m.length < 20) {
      return {
        symbol,
        success: false,
        error: 'Insufficient 15-min bars (need at least 20)',
      };
    }

    if (!candles1h || candles1h.length < 20) {
      return {
        symbol,
        success: false,
        error: 'Insufficient 1H bars (need at least 20 for trend analysis)',
      };
    }

    console.log(`📊 Analyzing ${symbol} (${candles15m.length} 15-min bars, ${candles1h.length} 1H bars - MTF)...`);

    const latestPrice = candles15m[candles15m.length - 1].close;

    // Use Phase 2 Analysis Engine with multi-timeframe support
    const { AnalysisEngine } = await import('@/lib/engine');

    // Initialize engine with crypto intraday configuration
    const engine = new AnalysisEngine({
      assetType: 'crypto',
      timeframe: 'intraday',
    });

    // Run analysis with BOTH timeframes (MTF-enabled)
    const signal = await engine.analyzeAsset({
      symbol: symbol.split('/')[0], // BTC/USD → BTC
      candles: candles15m,           // Trading timeframe (entry timing)
      weeklyCandles: candles1h,      // Higher timeframe (trend direction)
      currentPrice: latestPrice,
    });

    // No signal = no actionable setup
    if (!signal) {
      return { symbol, success: false, error: 'No actionable intraday setup' };
    }

    // Build recommendation for database (intraday_opportunities table)
    const recommendation = {
      symbol: symbol.split('/')[0], // BTC/USD → BTC
      scan_date: new Date().toISOString(),
      recommendation_type: signal.recommendation || 'none',
      entry_price: signal.entry,
      target_price: signal.target,
      stop_loss: signal.stopLoss,
      risk_reward_ratio: signal.riskReward,
      opportunity_score: Math.round(signal.score), // Round to integer for database
      confidence_level: signal.confidence,
      setup_type: `${signal.recommendation}_${signal.confidence}`,
      pattern_detected: signal.mainPattern || 'none',
      channel_status: signal.metadata.channelStatus || null,
      trend: signal.regime === 'trending_bullish' ? 'up' : signal.regime === 'trending_bearish' ? 'down' : 'sideways',
      current_price: latestPrice,
      rationale: signal.rationale,
      timeframe: '15min',
      valid_until: getNext15MinBarClose(),
    };

    console.log(`✅ ${symbol}: ${signal.recommendation}_${signal.confidence} (score: ${signal.score})`);
    return { symbol, success: true, recommendation };

  } catch (error) {
    console.error(`❌ Error analyzing ${symbol}:`, error);
    return {
      symbol,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main crypto scanner function - called by API route
 * Returns the count of opportunities found
 *
 * @param userId - User ID from authenticated session (required for database foreign key)
 */
export async function runCryptoScan(userId: string): Promise<number> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  CRYPTO INTRADAY SCANNER (HIGH-FREQUENCY)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const scanTime = new Date().toISOString();
  console.log(`Scan Time: ${scanTime}`);
  console.log(`Strategy: High-frequency (15-min scans, 10 elite cryptos)`);
  console.log(`Universe: ${CRYPTO_UNIVERSE.length} crypto pairs (optimized for momentum)\n`);

  // Collect successful recommendations
  const recommendations: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  // ═══════════════════════════════════════════════════════════════════
  // FETCH MULTI-TIMEFRAME DATA (15m + 1H for MTF analysis)
  // ═══════════════════════════════════════════════════════════════════
  console.log(`\n🔄 Fetching MULTI-TIMEFRAME data for ${CRYPTO_UNIVERSE.length} cryptos (15m + 1H)...`);
  console.log(`   📊 This enables trend alignment detection for higher win rates`);
  const mtfDataMap = await batchGetCryptoMultiTimeframe(CRYPTO_UNIVERSE);
  console.log(`✅ Fetched MTF data for ${mtfDataMap.size}/${CRYPTO_UNIVERSE.length} cryptos\n`);

  // ═══════════════════════════════════════════════════════════════════
  // ANALYZE ALL CRYPTOS WITH MTF (no more API calls, just computation)
  // ═══════════════════════════════════════════════════════════════════
  for (const symbol of CRYPTO_UNIVERSE) {
    const mtfData = mtfDataMap.get(symbol);

    if (!mtfData) {
      errorCount++;
      console.log(`⚠️  ${symbol}: No MTF data available`);
      continue;
    }

    try {
      const result = await analyzeCrypto(symbol, mtfData.candles15m, mtfData.candles1h);

      if (result.success && result.recommendation) {
        recommendations.push(result.recommendation);
        successCount++;
      } else {
        errorCount++;
        console.log(`⚠️  ${result.symbol}: ${result.error}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ ${symbol}: Analysis failed:`, error);
    }
  }

  console.log(`\n📊 Analysis complete: ${successCount} opportunities, ${errorCount} skipped`);

  if (recommendations.length === 0) {
    console.log('\n❌ No valid crypto opportunities found this scan\n');
    return 0;
  }

  // Sort by score (highest first)
  recommendations.sort((a, b) => b.opportunity_score - a.opportunity_score);

  console.log(`\n✅ Found ${recommendations.length} intraday crypto opportunities:\n`);
  recommendations.forEach(rec => {
    console.log(`  ${rec.symbol}: ${rec.setup_type} (${rec.opportunity_score}/100) - Valid until ${new Date(rec.valid_until!).toLocaleTimeString()}`);
  });

  // Save to database (intraday_opportunities table - CRYPTO ONLY, Day Trader page)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use the authenticated user's ID for database foreign key constraint
    console.log(`\n💾 Saving crypto opportunities for user ${userId}...`);

    // Delete ALL existing crypto opportunities for this user to avoid conflicts
    // This prevents 409 Conflict errors from unique constraints
    console.log(`\n🧹 Deleting all existing crypto opportunities for user...`);

    // Add timeout protection for cleanup (5 seconds)
    const cleanupPromise = supabase
      .from('intraday_opportunities')
      .delete()
      .eq('user_id', userId)
      .eq('asset_type', 'crypto');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cleanup timeout after 5s')), 5000)
    );

    try {
      const { error: deleteError, count } = await Promise.race([cleanupPromise, timeoutPromise]) as any;

      if (deleteError) {
        console.warn('⚠️  Warning: Failed to cleanup existing crypto opportunities:', deleteError);
        console.warn('   Proceeding with insert anyway (may cause 409 Conflict)...');
      } else {
        console.log(`✅ Cleanup complete (deleted ${count || 0} existing records)`);
      }
    } catch (cleanupError) {
      console.warn('⚠️  Warning: Cleanup operation failed or timed out:', cleanupError);
      console.warn('   Proceeding with insert anyway (may cause 409 Conflict)...');
    }

    // Map recommendations to intraday_opportunities format (CRYPTO for Day Trader page)
    console.log(`\n📦 Preparing ${recommendations.length} opportunities for database...`);
    const opportunities = recommendations.map(rec => ({
      user_id: userId,
      symbol: rec.symbol,
      timeframe: rec.timeframe,
      scan_timestamp: rec.scan_date,
      recommendation_type: rec.recommendation_type,
      entry_price: rec.entry_price,
      target_price: rec.target_price,
      stop_loss: rec.stop_loss,
      opportunity_score: rec.opportunity_score,
      confidence_level: rec.confidence_level,
      rationale: rec.rationale,
      current_price: rec.current_price,
      channel_status: rec.channel_status,
      pattern_detected: rec.pattern_detected,
      rsi: null,
      expires_at: rec.valid_until,
      status: 'active',
      asset_type: 'crypto',
    }));

    // Log sample opportunity for debugging
    console.log(`   Sample opportunity:`, {
      symbol: opportunities[0].symbol,
      score: opportunities[0].opportunity_score,
      expires_at: opportunities[0].expires_at,
    });

    // Insert new opportunities with timeout protection (10 seconds)
    console.log(`\n📝 Inserting ${opportunities.length} crypto opportunities...`);
    console.log(`   Insert started at: ${new Date().toISOString()}`);

    const insertPromise = supabase
      .from('intraday_opportunities')
      .insert(opportunities);

    const insertTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Insert timeout after 10s')), 10000)
    );

    const { error: insertError, status, statusText } = await Promise.race([insertPromise, insertTimeoutPromise]) as any;

    console.log(`   Insert completed at: ${new Date().toISOString()}`);
    console.log(`   Response status: ${status} ${statusText}`);

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.error('   Error code:', insertError.code);
      console.error('   Error message:', insertError.message);
      console.error('   Error details:', insertError.details);
      throw insertError;
    }

    console.log(`\n💾 Saved ${opportunities.length} crypto opportunities to database`);

  } catch (error) {
    console.error('\n❌ Error saving to database:', error);
    console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  INTRADAY SCAN COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');

  return recommendations.length;
}
