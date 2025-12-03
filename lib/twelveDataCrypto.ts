/**
 * Twelve Data Crypto Integration
 *
 * Fetches intraday OHLC data for cryptocurrencies using Twelve Data API
 * Supports 1/5/15-min bars for crypto pairs (BTC/USD, ETH/USD, etc.)
 */

import { Candle } from './types';
import { trackApiCall, getRateLimitInfo, type RateLimitInfo } from './apiRateLimits';

// Twelve Data API Base URL
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

// Helper function to get API key at runtime
const getTwelveDataApiKey = () => process.env.TWELVE_DATA_API_KEY;

// In-memory cache with timestamps
const cryptoCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds for intraday (faster refresh)

// Twelve Data API limits (free tier)
const TWELVE_DATA_LIMITS = {
  perMinute: 8,
  perDay: 800,
};

// Twelve Data API usage stats (database-backed)
export interface TwelveDataUsageStats {
  requestsLimitPerMinute: number;    // 8 per minute on free tier
  requestsLimitPerDay: number;       // 800 per day on free tier
  requestsUsedThisMinute: number;    // How many calls in current minute
  requestsUsedToday: number;         // How many calls today
  lastUpdated: Date;                 // When stats were last updated
  percentUsedMinute: number;         // Percentage of minute quota used (0-100)
  percentUsedDay: number;            // Percentage of day quota used (0-100)
  resetTime: Date;                   // When minute limit resets
}

/**
 * Get current Twelve Data API usage statistics (database-backed)
 * Returns null if no API calls have been made yet
 */
export async function getTwelveDataUsageStats(): Promise<TwelveDataUsageStats | null> {
  try {
    const rateLimitInfo = await getRateLimitInfo('twelve-data', TWELVE_DATA_LIMITS);

    return {
      requestsLimitPerMinute: rateLimitInfo.limitPerMinute,
      requestsLimitPerDay: rateLimitInfo.limitPerDay,
      requestsUsedThisMinute: rateLimitInfo.usedThisMinute,
      requestsUsedToday: rateLimitInfo.usedToday,
      lastUpdated: new Date(),
      percentUsedMinute: rateLimitInfo.percentUsedMinute,
      percentUsedDay: rateLimitInfo.percentUsedDay,
      resetTime: rateLimitInfo.minuteResetTime,
    };
  } catch (error) {
    console.error('Error fetching Twelve Data usage stats:', error);
    return null;
  }
}

function getCached<T>(key: string): T | null {
  const cached = cryptoCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cryptoCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Map crypto symbols to Twelve Data format
 * Twelve Data uses "/" separator (e.g., "BTC/USD")
 */
function formatCryptoSymbol(symbol: string): string {
  // If already formatted (BTC/USD), return as-is
  if (symbol.includes('/')) {
    return symbol;
  }

  // Convert BTC -> BTC/USD, ETH -> ETH/USD, etc.
  const upperSymbol = symbol.toUpperCase();
  return `${upperSymbol}/USD`;
}

/**
 * Fetch intraday OHLC bars for crypto from Twelve Data
 *
 * @param symbol - Crypto symbol (BTC, ETH, SOL, etc.) or pair (BTC/USD)
 * @param timeframe - Bar interval: '1min', '5min', '15min', '30min', '1h'
 * @param outputsize - Number of bars to fetch (max 5000)
 * @returns Array of candle data in chronological order (oldest first)
 * @throws Error if API key not configured or request fails
 *
 * Twelve Data Crypto Documentation:
 * https://twelvedata.com/docs#time-series
 * https://twelvedata.com/cryptocurrency
 */
export async function getCryptoIntradayCandles(
  symbol: string,
  timeframe: '1min' | '5min' | '15min' | '30min' | '1h' = '5min',
  outputsize: number = 60
): Promise<Candle[]> {
  // Format symbol for Twelve Data (BTC -> BTC/USD)
  const formattedSymbol = formatCryptoSymbol(symbol);

  // Check cache first
  const cacheKey = `crypto_intraday_${formattedSymbol}_${timeframe}_${outputsize}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getTwelveDataApiKey();

  if (!apiKey) {
    throw new Error('Twelve Data API key not configured. Set TWELVE_DATA_API_KEY in .env.local');
  }

  try {
    // Twelve Data Time Series API
    // https://twelvedata.com/docs#time-series
    const url = new URL(`${TWELVE_DATA_BASE_URL}/time_series`);
    url.searchParams.append('symbol', formattedSymbol);
    url.searchParams.append('interval', timeframe);
    url.searchParams.append('outputsize', outputsize.toString());
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('format', 'JSON');

    const response = await fetch(url.toString());

    // Track API call in database (persists across serverless invocations)
    // Fire and forget - don't await to avoid blocking
    trackApiCall('twelve-data', TWELVE_DATA_LIMITS).catch(err => {
      console.error('Error tracking API call:', err);
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Twelve Data API rate limit exceeded (8 calls/min or 800 calls/day on free tier)');
      }
      if (response.status === 401) {
        throw new Error('Twelve Data API authentication failed - check your API key');
      }
      throw new Error(`Twelve Data API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.status === 'error') {
      throw new Error(`Twelve Data error: ${data.message || 'Unknown error'}`);
    }

    if (!data.values || !Array.isArray(data.values)) {
      throw new Error(`No intraday data returned from Twelve Data for ${formattedSymbol}`);
    }

    if (data.values.length === 0) {
      throw new Error(`No bars available for ${formattedSymbol} at ${timeframe} timeframe`);
    }

    // Transform to Candle format
    // Twelve Data returns newest first, we need oldest first
    const candles: Candle[] = data.values
      .reverse()
      .map((bar: any) => ({
        timestamp: bar.datetime, // ISO format: "2025-01-15 14:30:00"
        open: parseFloat(bar.open),
        high: parseFloat(bar.high),
        low: parseFloat(bar.low),
        close: parseFloat(bar.close),
        volume: parseFloat(bar.volume || '0'),
      }));

    // Cache the result
    setCache(cacheKey, candles);

    return candles;
  } catch (error) {
    console.error(`Error fetching crypto intraday candles from Twelve Data for ${formattedSymbol}:`, error);
    throw error;
  }
}

/**
 * Batch fetch intraday candles for multiple cryptos with rate limiting
 * Respects Twelve Data API limits: 8 calls/min (free tier)
 *
 * @param symbols - Array of crypto symbols
 * @param timeframe - Bar interval: '1min', '5min', '15min', etc.
 * @param outputsize - Number of bars per symbol
 * @returns Map of symbol to candles
 */
export async function batchGetCryptoIntradayCandles(
  symbols: string[],
  timeframe: '1min' | '5min' | '15min' | '30min' | '1h' = '5min',
  outputsize: number = 60
): Promise<Map<string, Candle[]>> {
  const results = new Map<string, Candle[]>();

  console.log(`📊 Batch fetching ${symbols.length} cryptos (${timeframe} bars)...`);

  // Twelve Data rate limit: 8 calls/min (free tier)
  const batchSize = 8;
  const delayBetweenBatches = 60000; // 1 minute

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    console.log(`⏳ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)}...`);

    // Process batch in parallel
    const promises = batch.map(async (symbol) => {
      try {
        const candles = await getCryptoIntradayCandles(symbol, timeframe, outputsize);
        results.set(symbol, candles);
      } catch (error) {
        console.warn(`⚠️ Skipping ${symbol} - fetch failed:`, error);
      }
    });

    await Promise.all(promises);

    // Delay between batches (except for last batch)
    if (i + batchSize < symbols.length) {
      console.log(`⏸️  Rate limit delay: waiting 60s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log(`✅ Batch complete: ${results.size}/${symbols.length} successful`);
  return results;
}

/**
 * Get current crypto price (last close from most recent bar)
 *
 * @param symbol - Crypto symbol (BTC, ETH, etc.)
 * @returns Current price
 */
export async function getCurrentCryptoPrice(symbol: string): Promise<number> {
  try {
    // Fetch just 1 bar (most recent)
    const candles = await getCryptoIntradayCandles(symbol, '1min', 1);

    if (candles.length === 0) {
      throw new Error(`No price data available for ${symbol}`);
    }

    return candles[candles.length - 1].close;
  } catch (error) {
    console.error(`Error fetching current crypto price for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Check if crypto markets are open
 * Crypto markets trade 24/7, so this always returns true
 */
export function isCryptoMarketOpen(): boolean {
  return true; // Crypto never sleeps!
}

/**
 * Get crypto market status (always open)
 */
export function getCryptoMarketStatus() {
  return {
    isOpen: true,
    status: 'open' as const,
    message: 'Crypto markets trade 24/7',
  };
}
