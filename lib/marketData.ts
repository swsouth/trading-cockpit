/**
 * Market Data Module
 *
 * Fetches real-time quotes and historical OHLC data for stocks
 * with intelligent caching and database-first approach
 */

import { Quote, Candle } from './types';
import { generateMockCandles } from './mockData';
import { createClient } from '@supabase/supabase-js';

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'false';

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
      date: record.date,
      open: parseFloat(record.open),
      high: parseFloat(record.high),
      low: parseFloat(record.low),
      close: parseFloat(record.close),
      volume: parseInt(record.volume),
      adjClose: record.adjusted_close ? parseFloat(record.adjusted_close) : undefined,
    }));
  } catch (error) {
    console.error(`Error fetching stored candles for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get daily OHLC data - Database first, then FMP API fallback
 *
 * @param symbol - Stock ticker symbol
 * @param source - 'database' (default) or 'api' - force specific source
 * @returns Array of candle data
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
      console.warn(`⚠️  No stored data for ${symbol}, falling back to mock`);
      if (isProduction) {
        throw new Error(`No historical data available for ${symbol}`);
      }
      return generateMockCandles(symbol);
    }
  }

  // Fallback to FMP API (market scan use case)
  if (!FMP_API_KEY) {
    if (isProduction) {
      throw new Error('FMP API key not configured. Please contact support.');
    }
    console.warn('FMP API key not configured, using mock data for development');
    return generateMockCandles(symbol);
  }

  try {
    // FMP stable endpoint - historical-price-eod/full
    // This endpoint provides complete OHLC + volume data
    const url = `${FMP_BASE_URL}/historical-price-eod/full?symbol=${symbol}&apikey=${FMP_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data['Error Message'] || data.error) {
      const errorMsg = data['Error Message'] || data.error;
      console.warn(`Invalid symbol ${symbol}:`, errorMsg);
      if (isProduction) {
        throw new Error(`Unable to fetch data for ${symbol}: ${errorMsg}`);
      }
      return generateMockCandles(symbol);
    }

    // Parse the response (FMP returns array of {date, open, high, low, close, volume})
    const candles: Candle[] = (data.historical || data).map((bar: any) => ({
      date: bar.date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
      adjClose: bar.adjClose,
    }));

    if (candles.length === 0) {
      console.warn(`No candle data returned for ${symbol}`);
      if (isProduction) {
        throw new Error(`No price data available for ${symbol}`);
      }
      return generateMockCandles(symbol);
    }

    // Sort by date (most recent first) and reverse to get chronological order
    candles.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`✅ Fetched ${candles.length} candles for ${symbol} from FMP API`);
    setCache(cacheKey, candles);
    return candles;
  } catch (error) {
    console.error(`Error fetching candles from FMP:`, error);

    if (isProduction) {
      throw new Error(`Failed to fetch market data for ${symbol}. Please try again later.`);
    }
    console.warn('Falling back to mock data for development');
    return generateMockCandles(symbol);
  }
}

/**
 * Get real-time quote - Finnhub API
 */
export async function getQuote(symbol: string): Promise<Quote> {
  // Check cache first
  const cacheKey = `quote_${symbol}`;
  const cached = getCached<Quote>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!FINNHUB_API_KEY) {
    if (isProduction) {
      throw new Error('Finnhub API key not configured. Please contact support.');
    }

    // Return mock quote for development
    console.warn(`Finnhub API key not configured, using mock quote for ${symbol}`);
    const mockQuote: Quote = {
      symbol,
      price: 100 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      previousClose: 100,
      high: 110,
      low: 90,
      open: 95,
      volume: 1000000,
      timestamp: Date.now(),
    };
    return mockQuote;
  }

  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for valid data
    if (!data.c || data.c === 0) {
      console.warn(`No quote data for ${symbol} from Finnhub`);
      if (isProduction) {
        throw new Error(`Unable to fetch quote for ${symbol}`);
      }

      // Return mock data for development
      const mockQuote: Quote = {
        symbol,
        price: 100,
        change: 0,
        changePercent: 0,
        previousClose: 100,
        high: 100,
        low: 100,
        open: 100,
        volume: 0,
        timestamp: Date.now(),
      };
      return mockQuote;
    }

    const quote: Quote = {
      symbol,
      price: data.c, // current price
      change: data.d, // change
      changePercent: data.dp, // change percent
      previousClose: data.pc, // previous close
      high: data.h, // high
      low: data.l, // low
      open: data.o, // open
      volume: 0, // Finnhub doesn't provide volume in quote endpoint
      timestamp: data.t * 1000, // convert to milliseconds
    };

    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    console.error(`Error fetching quote from Finnhub:`, error);

    if (isProduction) {
      throw new Error(`Failed to fetch quote for ${symbol}. Please try again later.`);
    }

    // Return mock data for development
    console.warn('Falling back to mock quote for development');
    const mockQuote: Quote = {
      symbol,
      price: 100,
      change: 0,
      changePercent: 0,
      previousClose: 100,
      high: 100,
      low: 100,
      open: 100,
      volume: 0,
      timestamp: Date.now(),
    };
    return mockQuote;
  }
}
