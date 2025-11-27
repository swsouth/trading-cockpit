/**
 * Intraday Market Data Module
 *
 * Fetches intraday OHLC data (1/5/15-min bars) from Alpaca Markets
 * Separate from daily market data - dedicated to day trading feature
 */

import { Candle } from './types';

// Alpaca API Base URLs
const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';

// Helper functions to get API keys at runtime
const getAlpacaApiKey = () => process.env.ALPACA_API_KEY;
const getAlpacaSecretKey = () => process.env.ALPACA_SECRET_KEY;

// In-memory cache with timestamps
const intradayCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds for intraday (faster refresh than daily)

function getCached<T>(key: string): T | null {
  const cached = intradayCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  intradayCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch intraday OHLC bars from Alpaca Markets
 *
 * @param symbol - Stock ticker symbol
 * @param timeframe - Bar interval: '1Min', '5Min', '15Min', '30Min', '1Hour'
 * @param limit - Number of bars to fetch (max 10000)
 * @returns Array of candle data in chronological order (oldest first)
 * @throws Error if API keys not configured or request fails
 */
export async function getIntradayCandles(
  symbol: string,
  timeframe: '1Min' | '5Min' | '15Min' | '30Min' | '1Hour' = '5Min',
  limit: number = 60
): Promise<Candle[]> {
  // Check cache first
  const cacheKey = `intraday_${symbol}_${timeframe}_${limit}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getAlpacaApiKey();
  const secretKey = getAlpacaSecretKey();

  if (!apiKey || !secretKey) {
    throw new Error('Alpaca API keys not configured. Set ALPACA_API_KEY and ALPACA_SECRET_KEY in .env.local');
  }

  try {
    // Alpaca Bars API v2
    // https://alpaca.markets/docs/api-references/market-data-api/stock-pricing-data/historical/
    const url = `${ALPACA_DATA_URL}/stocks/bars?symbols=${symbol}&timeframe=${timeframe}&limit=${limit}&adjustment=raw&feed=iex&sort=asc`;

    const response = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Alpaca API rate limit exceeded (200 req/min)');
      }
      if (response.status === 401) {
        throw new Error('Alpaca API authentication failed - check your API keys');
      }
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.code || data.message) {
      throw new Error(`Alpaca error: ${data.message || 'Unknown error'}`);
    }

    if (!data.bars || !data.bars[symbol] || !Array.isArray(data.bars[symbol])) {
      throw new Error(`No intraday data returned from Alpaca for ${symbol}`);
    }

    const bars = data.bars[symbol];

    if (bars.length === 0) {
      throw new Error(`No bars available for ${symbol} at ${timeframe} timeframe`);
    }

    // Transform to Candle format
    // Alpaca bars are already in ascending order (oldest first) due to sort=asc
    const candles: Candle[] = bars.map((bar: any) => ({
      timestamp: bar.t, // ISO 8601 timestamp
      open: parseFloat(bar.o),
      high: parseFloat(bar.h),
      low: parseFloat(bar.l),
      close: parseFloat(bar.c),
      volume: parseInt(bar.v) || 0,
    }));

    console.log(`✅ Fetched ${candles.length} ${timeframe} bars for ${symbol} from Alpaca`);

    setCache(cacheKey, candles);
    return candles;
  } catch (error) {
    console.error(`Error fetching intraday candles from Alpaca for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Check if market is currently open (US stock market hours)
 * 9:30 AM - 4:00 PM ET, Monday-Friday
 *
 * @returns true if market is open, false otherwise
 */
export function isMarketOpen(): boolean {
  const now = new Date();

  // Convert to ET timezone
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
 * Get time until market opens/closes
 *
 * @returns Object with status and time remaining
 */
export function getMarketStatus(): {
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
    const daysUntilMonday = day === 0 ? 1 : 2;
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
 * @param limit - Number of bars per symbol
 * @returns Map of symbol to candles
 */
export async function batchGetIntradayCandles(
  symbols: string[],
  timeframe: '1Min' | '5Min' | '15Min' | '30Min' | '1Hour' = '5Min',
  limit: number = 60
): Promise<Map<string, Candle[]>> {
  const results = new Map<string, Candle[]>();

  // Alpaca supports multi-symbol requests (up to 100 symbols per request)
  // But for simplicity and error isolation, fetch one at a time
  for (const symbol of symbols) {
    try {
      const candles = await getIntradayCandles(symbol, timeframe, limit);
      results.set(symbol, candles);
    } catch (error) {
      console.error(`Failed to fetch intraday data for ${symbol}:`, error);
      // Continue with other symbols even if one fails
    }
  }

  return results;
}
