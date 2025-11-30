/**
 * Yahoo Finance Adapter for Stock Market Data
 *
 * FREE, unlimited API for daily stock scanner
 * Replaces Twelve Data to free up quota for crypto intraday scanning
 *
 * Coverage: US stocks, ETFs
 * Update frequency: 15-20 min delay (acceptable for daily swing trading)
 * Cost: $0/month (vs Twelve Data free tier 800 calls/day limit)
 *
 * SERVER-SIDE ONLY: This module uses Node.js APIs and cannot run in browser
 */

import { Candle } from '@/lib/types';

// Dynamic import for server-side only
let YahooFinance: any;
let yahooFinance: any;

if (typeof window === 'undefined') {
  YahooFinance = require('yahoo-finance2').default;
  // Create Yahoo Finance instance with suppressed notices
  yahooFinance = new YahooFinance({
    suppressNotices: ['ripHistorical', 'yahooSurvey'], // Suppress deprecation notices
  });
}

/**
 * Get historical OHLCV data for a stock symbol
 *
 * @param symbol - Stock ticker (e.g., 'AAPL', 'MSFT')
 * @param days - Number of days of historical data (default: 365)
 * @returns Array of daily candles (OHLCV)
 */
export async function getYahooHistoricalData(
  symbol: string,
  days: number = 365
): Promise<Candle[]> {
  try {
    console.log(`📊 Fetching ${days} days of data for ${symbol} from Yahoo Finance...`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch historical data
    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d', // Daily bars
    });

    if (!result || result.length === 0) {
      throw new Error(`No data returned for ${symbol}`);
    }

    // Convert Yahoo Finance format to our Candle format
    const candles: Candle[] = result.map((bar: any) => ({
      timestamp: bar.date.toISOString().split('T')[0], // YYYY-MM-DD
      open: parseFloat(bar.open.toFixed(2)),
      high: parseFloat(bar.high.toFixed(2)),
      low: parseFloat(bar.low.toFixed(2)),
      close: parseFloat(bar.close.toFixed(2)),
      volume: bar.volume || 0,
    }));

    console.log(`✅ Yahoo Finance: Retrieved ${candles.length} bars for ${symbol}`);
    return candles;

  } catch (error) {
    console.error(`❌ Yahoo Finance error for ${symbol}:`, error);
    throw new Error(`Failed to fetch Yahoo Finance data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current quote for a stock symbol
 *
 * @param symbol - Stock ticker
 * @returns Current price and basic quote data
 */
export async function getYahooQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}> {
  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote || !quote.regularMarketPrice) {
      throw new Error(`No quote data for ${symbol}`);
    }

    return {
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap,
    };

  } catch (error) {
    console.error(`❌ Yahoo Finance quote error for ${symbol}:`, error);
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }
}

/**
 * Batch fetch historical data for multiple symbols
 * More efficient than individual calls
 *
 * @param symbols - Array of stock tickers
 * @param days - Days of historical data
 * @returns Map of symbol → candles
 */
export async function batchGetYahooData(
  symbols: string[],
  days: number = 365
): Promise<Map<string, Candle[]>> {
  const results = new Map<string, Candle[]>();

  console.log(`📊 Batch fetching ${symbols.length} stocks from Yahoo Finance...`);

  // Process in parallel (Yahoo Finance has no rate limits)
  const promises = symbols.map(async (symbol) => {
    try {
      const candles = await getYahooHistoricalData(symbol, days);
      results.set(symbol, candles);
    } catch (error) {
      console.warn(`⚠️ Skipping ${symbol} - Yahoo Finance fetch failed:`, error);
      // Don't add to results if fetch fails
    }
  });

  await Promise.all(promises);

  console.log(`✅ Yahoo Finance batch: ${results.size}/${symbols.length} successful`);
  return results;
}

/**
 * Validate Yahoo Finance data quality
 * Compare against expected data characteristics
 *
 * @param candles - Historical candles
 * @returns Validation result with warnings
 */
export function validateYahooData(candles: Candle[]): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check minimum data points
  if (candles.length < 30) {
    warnings.push(`Insufficient data: ${candles.length} bars (expected 30+)`);
  }

  // Check for missing/invalid prices
  const invalidBars = candles.filter(c =>
    c.open <= 0 || c.high <= 0 || c.low <= 0 || c.close <= 0
  );
  if (invalidBars.length > 0) {
    warnings.push(`${invalidBars.length} bars with invalid prices (≤0)`);
  }

  // Check for gaps (missing trading days)
  const gaps: string[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prevDate = new Date(candles[i - 1].timestamp);
    const currDate = new Date(candles[i].timestamp);
    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    // Allow weekends (2-3 days) but flag larger gaps
    if (daysDiff > 5) {
      gaps.push(`${candles[i - 1].timestamp} → ${candles[i].timestamp} (${daysDiff} days)`);
    }
  }
  if (gaps.length > 2) {
    warnings.push(`${gaps.length} large data gaps detected`);
  }

  // Check for extreme volatility (potential bad data)
  const extremeBars = candles.filter(c => {
    const range = ((c.high - c.low) / c.close) * 100;
    return range > 50; // >50% daily range is suspicious
  });
  if (extremeBars.length > 0) {
    warnings.push(`${extremeBars.length} bars with extreme volatility (>50% range)`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
