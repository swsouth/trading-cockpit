/**
 * Market Data Module
 *
 * Fetches real-time quotes and historical OHLC data for stocks
 * with intelligent caching and database-first approach
 *
 * DATA SOURCE PRIORITY (for stocks):
 * 1. Yahoo Finance (FREE, unlimited) - PRIMARY for daily scanner
 * 2. Twelve Data (800 calls/day) - FALLBACK, reserved for crypto
 * 3. FMP (250 calls/day) - Last resort
 *
 * NO MOCK DATA - Production-ready only
 */

import { Quote, Candle } from './types';
import { createClient } from '@supabase/supabase-js';
import { getYahooHistoricalData } from './marketData/yahooFinanceAdapter';

// API Base URLs
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Helper functions to get API keys at runtime
const getTwelveDataApiKey = () => process.env.TWELVE_DATA_API_KEY;
const getFmpApiKey = () => process.env.FMP_API_KEY;
const getFinnhubApiKey = () => process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

// In-memory cache with timestamps
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch stored price data from database
 */
async function getStoredCandles(symbol: string, days: number = 60): Promise<Candle[] | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('stock_prices')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    // Transform to Candle format
    return data.map(record => ({
      timestamp: record.date,
      open: parseFloat(record.open),
      high: parseFloat(record.high),
      low: parseFloat(record.low),
      close: parseFloat(record.close),
      volume: parseInt(record.volume),
    }));
  } catch (error) {
    console.error(`Error fetching stored candles for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch historical OHLC data from Twelve Data API
 */
async function fetchTwelveDataCandles(symbol: string, days: number = 365): Promise<Candle[]> {
  const apiKey = getTwelveDataApiKey();
  if (!apiKey) {
    throw new Error('Twelve Data API key not configured');
  }

  try {
    // Twelve Data time_series endpoint
    // outputsize: number of data points to return (max 5000)
    // adjust=none: CRITICAL - Get unadjusted prices to match actual market levels
    const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${days}&adjust=none&apikey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Twelve Data API rate limit exceeded');
      }
      throw new Error(`Twelve Data API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.status === 'error') {
      throw new Error(`Twelve Data error: ${data.message || 'Unknown error'}`);
    }

    if (!data.values || !Array.isArray(data.values)) {
      throw new Error(`Invalid response from Twelve Data for ${symbol}`);
    }

    // Transform to Candle format
    // Twelve Data returns newest first, so we need to reverse
    const candles: Candle[] = data.values
      .map((bar: any) => ({
        timestamp: bar.datetime,
        open: parseFloat(bar.open),
        high: parseFloat(bar.high),
        low: parseFloat(bar.low),
        close: parseFloat(bar.close),
        volume: parseInt(bar.volume) || 0,
      }))
      .reverse(); // Reverse to chronological order (oldest first)

    if (candles.length === 0) {
      throw new Error(`No data returned from Twelve Data for ${symbol}`);
    }

    console.log(`✅ Fetched ${candles.length} candles for ${symbol} from Twelve Data`);
    return candles;
  } catch (error) {
    console.error(`Error fetching candles from Twelve Data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch historical OHLC data from FMP API
 */
async function fetchFmpCandles(symbol: string): Promise<Candle[]> {
  const fmpKey = getFmpApiKey();
  if (!fmpKey) {
    throw new Error('FMP API key not configured');
  }

  try {
    const url = `${FMP_BASE_URL}/historical-price-full/${symbol}?apikey=${fmpKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('FMP API rate limit exceeded');
      }
      throw new Error(`FMP API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data['Error Message'] || data.error) {
      const errorMsg = data['Error Message'] || data.error;
      throw new Error(`FMP error for ${symbol}: ${errorMsg}`);
    }

    if (!data.historical || !Array.isArray(data.historical)) {
      throw new Error(`Invalid response from FMP for ${symbol}`);
    }

    // Transform to Candle format
    const candles: Candle[] = data.historical.map((bar: any) => ({
      timestamp: bar.date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }));

    if (candles.length === 0) {
      throw new Error(`No data returned from FMP for ${symbol}`);
    }

    // Sort by timestamp (chronological order - oldest first)
    candles.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log(`✅ Fetched ${candles.length} candles for ${symbol} from FMP`);
    return candles;
  } catch (error) {
    console.error(`Error fetching candles from FMP for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get daily OHLC data - Database first, then Twelve Data, then FMP API fallback
 *
 * @param symbol - Stock ticker symbol
 * @param source - 'database' (default) or 'api' - force specific source
 * @returns Array of candle data
 * @throws Error if no data available from any source
 */
export async function getDailyOHLC(symbol: string, source: 'database' | 'api' | 'auto' = 'auto'): Promise<Candle[]> {
  // Check cache first
  const cacheKey = `candles_${symbol}_${source}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Try database first (unless explicitly requesting API)
  if (source === 'database' || source === 'auto') {
    const storedCandles = await getStoredCandles(symbol, 60);
    if (storedCandles && storedCandles.length >= 20) {
      console.log(`✅ Using stored data for ${symbol} (${storedCandles.length} bars from database)`);
      setCache(cacheKey, storedCandles);
      return storedCandles;
    }

    if (source === 'database') {
      // Database explicitly requested but not available
      throw new Error(`No historical data available in database for ${symbol}`);
    }
  }

  // Try Yahoo Finance first (FREE, unlimited - PRIMARY for stocks)
  try {
    console.log(`🔄 Trying Yahoo Finance for ${symbol}...`);
    const candles = await getYahooHistoricalData(symbol, 365);
    setCache(cacheKey, candles);
    return candles;
  } catch (error) {
    console.warn(`Yahoo Finance failed for ${symbol}, trying Twelve Data:`, error);
  }

  // Fallback to Twelve Data API (800 calls/day, reserved for crypto)
  const twelveDataKey = getTwelveDataApiKey();
  if (twelveDataKey) {
    console.log(`🔄 Trying Twelve Data for ${symbol}...`);
    try {
      const candles = await fetchTwelveDataCandles(symbol, 365);
      setCache(cacheKey, candles);
      return candles;
    } catch (error) {
      console.warn(`Twelve Data failed for ${symbol}, trying FMP:`, error);
      // Fall through to FMP
    }
  } else {
    console.log(`⚠️  TWELVE_DATA_API_KEY not set, skipping Twelve Data`);
  }

  // Final fallback to FMP API (250 calls/day)
  const fmpKey = getFmpApiKey();
  if (!fmpKey) {
    throw new Error(`No API keys configured (Yahoo Finance, Twelve Data, or FMP). Unable to fetch data for ${symbol}.`);
  }

  try {
    console.log(`🔄 Trying FMP for ${symbol}...`);
    const candles = await fetchFmpCandles(symbol);
    setCache(cacheKey, candles);
    return candles;
  } catch (error) {
    // All sources failed
    throw new Error(`Failed to fetch market data for ${symbol} from all sources (Database, Yahoo Finance, Twelve Data, FMP). ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get real-time quote - Finnhub API
 *
 * @param symbol - Stock ticker symbol
 * @returns Quote data
 * @throws Error if Finnhub API not configured or request fails
 */
export async function getQuote(symbol: string): Promise<Quote> {
  // Check cache first
  const cacheKey = `quote_${symbol}`;
  const cached = getCached<Quote>(cacheKey);
  if (cached) {
    return cached;
  }

  const finnhubKey = getFinnhubApiKey();
  if (!finnhubKey) {
    throw new Error('Finnhub API key not configured. Unable to fetch real-time quotes.');
  }

  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${finnhubKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Finnhub API rate limit exceeded');
      }
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for valid data
    if (!data.c || data.c === 0) {
      throw new Error(`No quote data available for ${symbol} from Finnhub`);
    }

    const quote: Quote = {
      symbol,
      price: data.c, // current price
      changePercent: data.dp, // change percent
      previousClose: data.pc, // previous close
      high: data.h, // high
      low: data.l, // low
      open: data.o, // open
      volume: 0, // Finnhub doesn't provide volume in quote endpoint
      timestamp: new Date(data.t * 1000).toISOString(), // convert unix timestamp to ISO string
    };

    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    throw new Error(`Failed to fetch quote for ${symbol}. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
