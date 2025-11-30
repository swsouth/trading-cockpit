/**
 * Crypto Intraday Scanner (15-minute bars)
 *
 * Optimized for day trading: 2-4 hour holds, limit order execution
 * Scans top crypto every 15-30 minutes for fresh opportunities
 *
 * IMPORTANT: Run this scanner every 15-30 minutes via GitHub Actions
 * Each opportunity is valid for ~15 minutes (until next bar closes)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getCrypto15MinCandles, getNext15MinBarClose } from '../../lib/cryptoData/twelveDataAdapter';
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
 * Analyze single crypto with 15-min bars
 */
async function analyzeCrypto(symbol: string): Promise<CryptoAnalysisResult> {
  try {
    // Fetch last 24 hours of 15-min candles (96 bars)
    const candles = await getCrypto15MinCandles(symbol, 24);

    if (!candles || candles.length < 20) {
      return {
        symbol,
        success: false,
        error: 'Insufficient 15-min bars (need at least 20)',
      };
    }

    console.log(`📊 Analyzing ${symbol} (${candles.length} 15-min bars)...`);

    // 1. Detect channels (support/resistance)
    const channelResult = analysis.detectChannel(candles);

    // 2. Detect candlestick patterns (last 5 bars for intraday)
    const patternResult = analysis.detectPatterns(candles.slice(-5));

    // 3. Calculate trade setup (entry/target/stop)
    const latestPrice = candles[candles.length - 1].close;
    const tradeSetup = tradeCalculator.generateTradeRecommendation({
      symbol: symbol.split('/')[0], // BTC/USD → BTC
      candles,
      channel: channelResult,
      pattern: patternResult,
      currentPrice: latestPrice,
    });

    // Skip if no actionable setup
    if (!tradeSetup) {
      return { symbol, success: false, error: 'No actionable intraday setup' };
    }

    // 4. Calculate opportunity score (intraday version with volume analysis)
    const scoreResult = scoring.calculateIntradayOpportunityScore(
      candles,
      channelResult,
      patternResult,
      tradeSetup.entry,
      tradeSetup.target,
      tradeSetup.stopLoss
    );

    // Filter: Only score >= 50 for day trading (medium+ confidence)
    if (scoreResult.totalScore < 50) {
      return {
        symbol,
        success: false,
        error: `Score too low (${scoreResult.totalScore}/100)`,
      };
    }

    // 5. Build recommendation for database
    const recommendation = {
      symbol: symbol.split('/')[0], // BTC/USD → BTC
      scan_date: new Date().toISOString(),
      recommendation_type: tradeSetup.setup.type, // 'long' or 'short'
      entry_price: tradeSetup.entry,
      target_price: tradeSetup.target,
      stop_loss: tradeSetup.stopLoss,
      risk_reward_ratio: tradeSetup.riskRewardRatio,
      opportunity_score: scoreResult.totalScore,
      confidence_level: scoreResult.totalScore >= 75 ? 'high' : scoreResult.totalScore >= 60 ? 'medium' : 'low',
      setup_type: `${tradeSetup.setup.type}_${tradeSetup.setup.confidence}`, // e.g., "long_high"
      pattern_detected: patternResult.pattern || 'none',
      channel_status: channelResult.status,
      trend: channelResult.trend,
      current_price: latestPrice,
      rationale: tradeSetup.rationale,
      timeframe: '15min', // IMPORTANT: Intraday timeframe
      valid_until: getNext15MinBarClose(), // Expires when next bar closes
      vetting_score: null, // Crypto doesn't use vetting (no earnings, analysts, etc.)
      vetting_passed: null,
      vetting_summary: null,
      vetting_red_flags: null,
      vetting_green_flags: null,
      vetting_checks: null,
    };

    console.log(`✅ ${symbol}: ${tradeSetup.setup.type}_${tradeSetup.setup.confidence} (score: ${scoreResult.totalScore})`);
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

  // Process in batches to respect Twelve Data rate limit (8 calls/min)
  const BATCH_SIZE = 8;
  const BATCH_DELAY_MS = 60000; // 60 seconds between batches

  for (let i = 0; i < CRYPTO_UNIVERSE.length; i += BATCH_SIZE) {
    const batch = CRYPTO_UNIVERSE.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(CRYPTO_UNIVERSE.length / BATCH_SIZE);

    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} cryptos)...`);

    // Process current batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(symbol => analyzeCrypto(symbol))
    );

    // Collect results from this batch
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const analysis = result.value;
        if (analysis.success && analysis.recommendation) {
          recommendations.push(analysis.recommendation);
          successCount++;
        } else {
          errorCount++;
          console.log(`⚠️  ${analysis.symbol}: ${analysis.error}`);
        }
      } else {
        errorCount++;
        console.error(`❌ ${batch[idx]}: Promise rejected:`, result.reason);
      }
    });

    // Wait before next batch (unless this is the last batch)
    if (i + BATCH_SIZE < CRYPTO_UNIVERSE.length) {
      console.log(`⏳ Waiting 60 seconds before next batch to respect rate limits...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
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

  // Save to database (crypto_intraday_recommendations table)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete old intraday recommendations (older than 4 hours)
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    const { error: deleteError } = await supabase
      .from('crypto_intraday_recommendations')
      .delete()
      .lt('scan_date', fourHoursAgo.toISOString());

    if (deleteError) {
      console.warn('⚠️  Warning: Failed to cleanup old recommendations:', deleteError);
    }

    // Insert new recommendations
    const { error: insertError } = await supabase
      .from('crypto_intraday_recommendations')
      .insert(recommendations);

    if (insertError) {
      throw insertError;
    }

    console.log(`\n💾 Saved ${recommendations.length} recommendations to database`);

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
