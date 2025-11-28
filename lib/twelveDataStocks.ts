/**
 * Twelve Data Stocks Integration
 *
 * Fetches intraday OHLC data for stocks using Twelve Data API
 * Replaces Alpaca for intraday scanning (works with free tier: 800 calls/day)
 *
 * NOTE: This is a fallback for users without Alpaca market data subscription
 */

import { Candle } from './types';

// Twelve Data API Base URL
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

// Helper function to get API key at runtime
const getTwelveDataApiKey = () => process.env.TWELVE_DATA_API_KEY;

// In-memory cache with timestamps
const stockCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds for intraday (faster refresh)

function getCached<T>(key: string): T | null {
  const cached = stockCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  stockCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch intraday OHLC bars for stocks from Twelve Data
 *
 * @param symbol - Stock ticker symbol (AAPL, MSFT, etc.)
 * @param timeframe - Bar interval: '1min', '5min', '15min', '30min', '1h'
 * @param outputsize - Number of bars to fetch (max 5000)
 * @returns Array of candle data in chronological order (oldest first)
 * @throws Error if API key not configured or request fails
 *
 * Twelve Data Stock Documentation:
 * https://twelvedata.com/docs#time-series
 */
export async function getStockIntradayCandles(
  symbol: string,
  timeframe: '1min' | '5min' | '15min' | '30min' | '1h' = '5min',
  outputsize: number = 60
): Promise<Candle[]> {
  // Check cache first
  const cacheKey = `stock_intraday_${symbol}_${timeframe}_${outputsize}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit for ${symbol} (${timeframe})`);
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
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('interval', timeframe);
    url.searchParams.append('outputsize', outputsize.toString());
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('format', 'JSON');

    console.log(`📡 Fetching ${symbol} from Twelve Data (${timeframe}, ${outputsize} bars)...`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Twelve Data API rate limit exceeded (800 calls/day on free tier)');
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
      throw new Error(`No intraday data returned from Twelve Data for ${symbol}`);
    }

    if (data.values.length === 0) {
      throw new Error(`No bars available for ${symbol} at ${timeframe} timeframe`);
    }

    // Transform to Candle format
    // Twelve Data returns newest first, we need oldest first
    const candles: Candle[] = data.values
      .reverse()
      .map((bar: any) => ({
        timestamp: bar.datetime, // ISO format: "2025-11-28 14:30:00"
        open: parseFloat(bar.open),
        high: parseFloat(bar.high),
        low: parseFloat(bar.low),
        close: parseFloat(bar.close),
        volume: parseFloat(bar.volume || '0'),
      }));

    console.log(`✅ Fetched ${candles.length} ${timeframe} bars for ${symbol} from Twelve Data`);

    // Cache the result
    setCache(cacheKey, candles);

    return candles;
  } catch (error) {
    console.error(`Error fetching stock intraday candles from Twelve Data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get current stock price (last close from most recent bar)
 *
 * @param symbol - Stock ticker symbol
 * @returns Current price
 */
export async function getCurrentStockPrice(symbol: string): Promise<number> {
  try {
    // Fetch just 1 bar (most recent)
    const candles = await getStockIntradayCandles(symbol, '1min', 1);

    if (candles.length === 0) {
      throw new Error(`No price data available for ${symbol}`);
    }

    return candles[candles.length - 1].close;
  } catch (error) {
    console.error(`Error fetching current stock price for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Check if US stock market is currently open
 * 9:30 AM - 4:00 PM ET, Monday-Friday
 */
export function isStockMarketOpen(): boolean {
  const now = new Date();
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  // Check if weekend
  const day = etTime.getDay();
  if (day === 0 || day === 6) {
    return false; // Sunday or Saturday
  }

  // Check market hours (9:30 AM - 4:00 PM ET)
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}

/**
 * Get US stock market status with detailed info
 */
export function getStockMarketStatus(): {
  isOpen: boolean;
  status: 'open' | 'closed' | 'pre-market' | 'after-hours';
  message: string;
  minutesUntilChange?: number;
} {
  const now = new Date();
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  const day = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  // Weekend
  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      status: 'closed',
      message: `Market closed (weekend). Opens Monday 9:30 AM ET`,
    };
  }

  // Market open
  if (totalMinutes >= marketOpen && totalMinutes < marketClose) {
    const minutesUntilClose = marketClose - totalMinutes;
    return {
      isOpen: true,
      status: 'open',
      message: `Market open. Closes at 4:00 PM ET`,
      minutesUntilChange: minutesUntilClose,
    };
  }

  // Pre-market (before 9:30 AM)
  if (totalMinutes < marketOpen) {
    const minutesUntilOpen = marketOpen - totalMinutes;
    return {
      isOpen: false,
      status: 'pre-market',
      message: `Market opens at 9:30 AM ET`,
      minutesUntilChange: minutesUntilOpen,
    };
  }

  // After-hours (after 4:00 PM)
  return {
    isOpen: false,
    status: 'after-hours',
    message: `Market closed. Opens tomorrow 9:30 AM ET`,
  };
}

/**
 * Batch fetch intraday candles for multiple symbols
 * Useful for scanning multiple stocks at once
 *
 * @param symbols - Array of stock ticker symbols
 * @param timeframe - Bar interval
 * @param outputsize - Number of bars per symbol
 * @returns Map of symbol to candles
 */
export async function batchGetStockIntradayCandles(
  symbols: string[],
  timeframe: '1min' | '5min' | '15min' | '30min' | '1h' = '5min',
  outputsize: number = 60
): Promise<Map<string, Candle[]>> {
  const results = new Map<string, Candle[]>();

  // Fetch one at a time with delay to respect rate limits
  for (const symbol of symbols) {
    try {
      const candles = await getStockIntradayCandles(symbol, timeframe, outputsize);
      results.set(symbol, candles);

      // Small delay to avoid rate limiting (800 calls/day = ~0.1 calls/min = safe to call frequently)
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    } catch (error) {
      console.error(`Failed to fetch intraday data for ${symbol}:`, error);
      // Continue with other symbols even if one fails
    }
  }

  return results;
}
