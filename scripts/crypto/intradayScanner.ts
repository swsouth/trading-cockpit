/**
 * Crypto Intraday Scanner (15-minute bars)
 *
 * Optimized for day trading: 2-4 hour holds, limit order execution
 * Scans top crypto every 15-30 minutes for fresh opportunities
 *
 * IMPORTANT: Run this scanner every 15-30 minutes via GitHub Actions
 * Each opportunity is valid for ~15 minutes (until next bar closes)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root (required for CoinAPI key)
config({ path: resolve(__dirname, '../../.env.local') });

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// DATA SOURCE: CoinAPI (PRIMARY - ACTIVE)
// ═══════════════════════════════════════════════════════════════════
// Premium crypto market data with optimized credit usage:
// - Date-bounded queries: 10 credit cap (even for large datasets!)
// - Direct WebSocket feeds from exchanges
// - Cost: ~20 credits per crypto (15m + 1H data) = 300 credits per full scan
// - Sequential processing with 1s delays (no rate limits!)
// ═══════════════════════════════════════════════════════════════════
import { batchGetCryptoMultiTimeframe, getNext15MinBarClose } from '../../lib/cryptoData/coinApiAdapter';

import * as analysis from '../../lib/analysis';
import * as scoring from '../../lib/scoring';
import * as tradeCalculator from '../../lib/tradeCalculator';
import type { Candle } from '../../lib/types';

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
 *
 * MTF Strategy for Crypto Intraday:
 * - 1H bars: Identify trend direction (bullish/bearish/sideways)
 * - 15-min bars: Detect entry patterns and precise timing
 * - Aligned trends get +15% score boost
 * - Divergent trends get -15% score penalty
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

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: Multi-Timeframe Analysis (15m + 1H)
    // ═══════════════════════════════════════════════════════════════════
    const { AnalysisEngine } = await import('../../lib/engine');

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

    // Build recommendation for database (crypto_intraday_recommendations table)
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

    // ═══════════════════════════════════════════════════════════════════
    // OLD IMPLEMENTATION (preserved for validation)
    // ═══════════════════════════════════════════════════════════════════
    /*
    const channelResult = analysis.detectChannel(candles);
    const patternResult = analysis.detectPatterns(candles.slice(-5));
    const tradeSetup = tradeCalculator.generateTradeRecommendation({
      symbol: symbol.split('/')[0],
      candles,
      channel: channelResult,
      pattern: patternResult,
      currentPrice: latestPrice,
    });

    if (!tradeSetup) {
      return { symbol, success: false, error: 'No actionable intraday setup' };
    }

    const scoreResult = scoring.calculateIntradayOpportunityScore(
      candles,
      channelResult,
      patternResult,
      tradeSetup.entry,
      tradeSetup.target,
      tradeSetup.stopLoss
    );

    if (scoreResult.totalScore < 50) {
      return {
        symbol,
        success: false,
        error: `Score too low (${scoreResult.totalScore}/100)`,
      };
    }

    const recommendation = {
      symbol: symbol.split('/')[0],
      scan_date: new Date().toISOString(),
      recommendation_type: tradeSetup.setup.type,
      entry_price: tradeSetup.entry,
      target_price: tradeSetup.target,
      stop_loss: tradeSetup.stopLoss,
      risk_reward_ratio: tradeSetup.riskRewardRatio,
      opportunity_score: scoreResult.totalScore,
      confidence_level: scoreResult.totalScore >= 75 ? 'high' : scoreResult.totalScore >= 60 ? 'medium' : 'low',
      setup_type: `${tradeSetup.setup.type}_${tradeSetup.setup.confidence}`,
      pattern_detected: patternResult.pattern || 'none',
      channel_status: channelResult.status,
      trend: channelResult.trend,
      current_price: latestPrice,
      rationale: tradeSetup.rationale,
      timeframe: '15min',
      valid_until: getNext15MinBarClose(),
      vetting_score: null,
      vetting_passed: null,
      vetting_summary: null,
      vetting_red_flags: null,
      vetting_green_flags: null,
      vetting_checks: null,
    };

    console.log(`✅ ${symbol}: ${tradeSetup.setup.type}_${tradeSetup.setup.confidence} (score: ${scoreResult.totalScore})`);
    return { symbol, success: true, recommendation };
    */

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
 * Run intraday crypto scanner
 */
export async function runIntradayCryptoScan() {
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
    return;
  }

  // Sort by score (highest first)
  recommendations.sort((a, b) => b.opportunity_score - a.opportunity_score);

  console.log(`\n✅ Found ${recommendations.length} intraday crypto opportunities:\n`);
  recommendations.forEach(rec => {
    console.log(`  ${rec.symbol}: ${rec.setup_type} (${rec.opportunity_score}/100) - Valid until ${new Date(rec.valid_until!).toLocaleTimeString()}`);
  });

  // Save to database (trade_recommendations table - same as stock scanner)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete old crypto opportunities (older than 4 hours)
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    const { error: deleteError } = await supabase
      .from('trade_recommendations')
      .delete()
      .ilike('symbol', '%') // All crypto symbols (BTC, ETH, etc. - no slashes)
      .eq('timeframe', '15min')
      .lt('created_at', fourHoursAgo.toISOString());

    if (deleteError) {
      console.warn('⚠️  Warning: Failed to cleanup old crypto opportunities:', deleteError);
    }

    // Map recommendations to trade_recommendations format
    const opportunities = recommendations.map(rec => ({
      symbol: rec.symbol,
      scan_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      recommendation_type: rec.recommendation_type,
      setup_type: `Crypto ${rec.recommendation_type} - ${rec.timeframe}`,
      timeframe: rec.timeframe,
      entry_price: rec.entry_price,
      target_price: rec.target_price,
      stop_loss: rec.stop_loss,
      risk_amount: rec.entry_price - rec.stop_loss,
      reward_amount: rec.target_price - rec.entry_price,
      risk_reward_ratio: rec.risk_reward_ratio,
      opportunity_score: rec.opportunity_score,
      confidence_level: rec.confidence_level,
      current_price: rec.current_price,
      channel_status: rec.channel_status,
      pattern_detected: rec.pattern_detected,
      rsi: null,
      trend: rec.trend,
      rationale: rec.rationale,
      technical_summary: `Crypto intraday ${rec.recommendation_type} setup`,
      is_active: true,
      outcome: null,
      expires_at: rec.valid_until, // Expires in ~15 minutes
    }));

    // Insert new opportunities
    const { error: insertError } = await supabase
      .from('trade_recommendations')
      .insert(opportunities);

    if (insertError) {
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
}

// Run if called directly
if (require.main === module) {
  runIntradayCryptoScan()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Scanner failed:', error);
      process.exit(1);
    });
}
