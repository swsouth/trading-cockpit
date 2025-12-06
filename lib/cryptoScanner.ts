/**
 * Crypto Intraday Scanner (Library Version)
 *
 * Scans cryptocurrencies for intraday trade opportunities using 15-min bars
 * Exported function for use in API routes
 *
 * DATA SOURCE: CoinAPI (PRIMARY - ACTIVE with $30 credits)
 * Uses date-bounded queries for 10 credit cap optimization
 * Cost: ~20 credits per crypto (15m + 1H data) = 300 credits per scan
 */

import { batchGetCryptoMultiTimeframe, getNext15MinBarClose } from '@/lib/cryptoData/coinApiAdapter';
import { Candle } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

// Top crypto for day trading (high volume, good liquidity)
const CRYPTO_UNIVERSE = [
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
  'BNB/USD',
  'XRP/USD',
  'ADA/USD',
  'AVAX/USD',
  'DOGE/USD',
  'DOT/USD',
  'MATIC/USD',
  'LINK/USD',
  'UNI/USD',
  'ATOM/USD',
  'LTC/USD',
  'NEAR/USD',
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
 */
export async function runCryptoScan(): Promise<number> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  CRYPTO INTRADAY SCANNER (15-MIN BARS)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const scanTime = new Date().toISOString();
  console.log(`Scan Time: ${scanTime}`);
  console.log(`Universe: ${CRYPTO_UNIVERSE.length} crypto pairs\n`);

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

    // Use a system user ID for crypto scanner (all users see these opportunities)
    // This is a shared scanning service - not user-specific
    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'; // Placeholder system user
    console.log('\n💾 Saving opportunities as system-generated (shared across all users)...');

    // Delete old crypto opportunities (older than 4 hours)
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    console.log(`\n🧹 Deleting crypto opportunities older than 4 hours...`);
    const { error: deleteError } = await supabase
      .from('intraday_opportunities')
      .delete()
      .eq('asset_type', 'crypto')
      .lt('created_at', fourHoursAgo.toISOString());

    if (deleteError) {
      console.warn('⚠️  Warning: Failed to cleanup old crypto opportunities:', deleteError);
    } else {
      console.log('✅ Cleanup complete');
    }

    // Map recommendations to intraday_opportunities format (CRYPTO for Day Trader page)
    const opportunities = recommendations.map(rec => ({
      user_id: SYSTEM_USER_ID,
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

    // Insert new opportunities
    console.log(`\n📝 Inserting ${opportunities.length} crypto opportunities...`);
    const { error: insertError } = await supabase
      .from('intraday_opportunities')
      .insert(opportunities);

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      throw insertError;
    }

    console.log(`\n💾 Saved ${opportunities.length} crypto opportunities to database`);

  } catch (error) {
    console.error('\n❌ Error saving to database:', error);
    throw error;
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  INTRADAY SCAN COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');

  return recommendations.length;
}
