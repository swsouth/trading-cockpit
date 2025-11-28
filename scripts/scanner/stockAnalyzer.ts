/**
 * Stock Analyzer
 *
 * Analyzes a single stock and generates a trade recommendation with score
 */

import { getDailyOHLC } from '../../lib/marketData';
import { detectChannel } from '../../lib/analysis';
import { detectPatterns } from '../../lib/analysis';
import { generateTradeRecommendation } from '../../lib/tradeCalculator';
import { calculateOpportunityScore, analyzeVolume } from '../../lib/scoring';
import { detectAbsorption } from '../../lib/orderflow';
import { StockAnalysisResult } from './types';

/**
 * Analyze a single stock and generate recommendation
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

    // 2. Run technical analysis
    const channel = detectChannel(recentCandles);
    const pattern = detectPatterns(recentCandles);

    // 3. Calculate volume analysis and absorption detection
    const volume = analyzeVolume(recentCandles);
    const absorption = detectAbsorption(recentCandles, volume);

    // 4. Generate trade recommendation (with volume and absorption for high confidence)
    const recommendation = generateTradeRecommendation({
      symbol,
      candles: recentCandles,
      channel,
      pattern,
      volume,
      absorption,
    });

    // If no actionable setup, return early
    if (!recommendation) {
      return {
        symbol,
        success: true, // Success, but no opportunity
        error: 'No actionable setup',
      };
    }

    // 5. Score the opportunity
    const score = calculateOpportunityScore({
      candles: recentCandles,
      channel,
      pattern,
      volume,
      entryPrice: recommendation.entry,
      targetPrice: recommendation.target,
      stopLoss: recommendation.stopLoss,
    });

    return {
      symbol,
      success: true,
      recommendation,
      score,
      candles: recentCandles, // Include candles for price data storage
    };
  } catch (error) {
    return {
      symbol,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

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
