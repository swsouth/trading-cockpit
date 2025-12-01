/**
 * Stock Analyzer
 *
 * Analyzes a single stock and generates a trade recommendation with score
 *
 * UPDATED: Now uses the unified AnalysisEngine for consistent analysis across all scanners
 */

import { getDailyOHLC } from '../../lib/marketData';
import { AnalysisEngine, signalToAnalysisResult } from '../../lib/engine';
import { vetRecommendation } from '../../lib/vetting';
import { StockAnalysisResult } from './types';

/**
 * Analyze a single stock and generate recommendation using the Analysis Engine
 */
export async function analyzeSingleStock(
  symbol: string,
  lookbackDays: number = 60
): Promise<StockAnalysisResult> {
  try {
    // 1. Fetch candle data - always use API for market scanner (to store fresh data)
    const candles = await getDailyOHLC(symbol, 'api');

    if (!candles || candles.length < 20) {
      return {
        symbol,
        success: false,
        error: 'Insufficient data (need at least 20 candles)',
      };
    }

    // Use most recent candles
    const recentCandles = candles.slice(-lookbackDays);
    const currentPrice = recentCandles[recentCandles.length - 1].close;

    // 2. Initialize Analysis Engine (stock, daily timeframe)
    const engine = new AnalysisEngine({
      assetType: 'stock',
      timeframe: 'daily',
    });

    // 3. Run analysis through the engine
    const signal = await engine.analyzeAsset({
      symbol,
      candles: recentCandles,
      currentPrice,
    });

    // 4. Convert Signal to StockAnalysisResult (adapter for legacy format)
    const result = signalToAnalysisResult(symbol, signal, recentCandles);

    // If no signal, return early
    if (!result.recommendation) {
      return result;
    }

    // 5. Enhanced vetting (20-point checklist)
    // This adds fundamental analysis, earnings proximity, analyst ratings, etc.
    let vettingResult = null;
    try {
      vettingResult = await vetRecommendation(result.recommendation, recentCandles);
      console.log(`   ${symbol}: Vetting score ${vettingResult.overallScore}/100 (${vettingResult.passed ? 'PASS' : 'FAIL'})`);
    } catch (error) {
      console.warn(`   ${symbol}: Vetting failed, skipping`, error);
    }

    return {
      ...result,
      vetting: vettingResult,
    };
  } catch (error) {
    return {
      symbol,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* ============================================================================
 * OLD IMPLEMENTATION (DEPRECATED - Remove after Phase 1 validation)
 * ============================================================================
 *
 * The code below uses the scattered analysis functions (detectChannel,
 * detectPatterns, generateTradeRecommendation, calculateOpportunityScore).
 *
 * It has been replaced by the unified AnalysisEngine which provides:
 * - Consistent analysis across all scanners (stocks, crypto, intraday)
 * - Configuration-driven behavior (easy to tune for different assets)
 * - Standardized Signal output type
 * - Easier testing and maintenance
 *
 * Keep this commented code for 1 week to validate the engine produces
 * equivalent results. After validation, delete this section.
 *
 * ============================================================================

import { detectChannel } from '../../lib/analysis';
import { detectPatterns } from '../../lib/analysis';
import { generateTradeRecommendation } from '../../lib/tradeCalculator';
import { calculateOpportunityScore, analyzeVolume } from '../../lib/scoring';
import { detectAbsorption } from '../../lib/orderflow';

export async function analyzeSingleStock_OLD(
  symbol: string,
  lookbackDays: number = 60
): Promise<StockAnalysisResult> {
  try {
    const candles = await getDailyOHLC(symbol, 'api');
    if (!candles || candles.length < 20) {
      return { symbol, success: false, error: 'Insufficient data' };
    }

    const recentCandles = candles.slice(-lookbackDays);
    const channel = detectChannel(recentCandles);
    const pattern = detectPatterns(recentCandles);
    const volume = analyzeVolume(recentCandles);
    const absorption = detectAbsorption(recentCandles, volume);

    const recommendation = generateTradeRecommendation({
      symbol,
      candles: recentCandles,
      channel,
      pattern,
      volume,
      absorption,
    });

    if (!recommendation) {
      return { symbol, success: true, error: 'No actionable setup' };
    }

    const score = calculateOpportunityScore({
      candles: recentCandles,
      channel,
      pattern,
      volume,
      entryPrice: recommendation.entry,
      targetPrice: recommendation.target,
      stopLoss: recommendation.stopLoss,
    });

    let vettingResult = null;
    try {
      vettingResult = await vetRecommendation(recommendation, recentCandles);
    } catch (error) {
      console.warn(`   ${symbol}: Vetting failed`, error);
    }

    return {
      symbol,
      success: true,
      recommendation,
      score,
      vetting: vettingResult,
      candles: recentCandles,
    };
  } catch (error) {
    return {
      symbol,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

 * ============================================================================
 * END OLD IMPLEMENTATION
 * ============================================================================
 */

/**
 * Analyze multiple stocks in parallel
 */
export async function analyzeBatch(
  symbols: string[],
  lookbackDays: number = 60
): Promise<StockAnalysisResult[]> {
  const promises = symbols.map(symbol =>
    analyzeSingleStock(symbol, lookbackDays)
  );

  return Promise.allSettled(promises).then(results =>
    results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          symbol: symbols[index],
          success: false,
          error: result.reason?.message || 'Analysis failed',
        };
      }
    })
  );
}
