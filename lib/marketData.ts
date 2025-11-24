import { Candle, Quote } from './types';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'false';

// Simple in-memory cache to reduce API calls
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

// Fallback mock data generator
function generateMockCandles(symbol: string): Candle[] {
  const candles: Candle[] = [];
  const now = new Date();
  const basePrice = 150 + Math.random() * 50;

  for (let i = 60; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    const dayOffset = Math.sin(i / 10) * 15 + (Math.random() - 0.5) * 5;
    const open = basePrice + dayOffset;
    const close = open + (Math.random() - 0.5) * 8;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;

    candles.push({
      timestamp: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(1000000 + Math.random() * 5000000),
    });
  }

  return candles;
}

export async function getDailyOHLC(symbol: string): Promise<Candle[]> {
  // Check cache first
  const cacheKey = `candles_${symbol}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // If no API key in production, throw error
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

    // Stable endpoint returns array directly
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`No data found for symbol ${symbol}`);
      if (isProduction) {
        throw new Error(`No market data available for ${symbol}`);
      }
      return generateMockCandles(symbol);
    }

    // Convert FMP format to our Candle format
    // FMP returns newest first, so we reverse to get chronological order
    const candles: Candle[] = data
      .map((item: any) => ({
        timestamp: item.date,
        open: parseFloat(parseFloat(item.open).toFixed(2)),
        high: parseFloat(parseFloat(item.high).toFixed(2)),
        low: parseFloat(parseFloat(item.low).toFixed(2)),
        close: parseFloat(parseFloat(item.close).toFixed(2)),
        volume: parseInt(item.volume),
      }))
      .reverse(); // Reverse to get chronological order (oldest to newest)

    // Cache the results
    setCache(cacheKey, candles);

    return candles;
  } catch (error) {
    console.error('Error fetching candles from FMP:', error);
    if (isProduction) {
      throw new Error(`Failed to fetch market data for ${symbol}. Please try again later.`);
    }
    console.warn('Falling back to mock data for development');
    return generateMockCandles(symbol);
  }
}

export async function getQuote(symbol: string): Promise<Quote> {
  // Check cache first
  const cacheKey = `quote_${symbol}`;
  const cached = getCached<Quote>(cacheKey);
  if (cached) {
    return cached;
  }

  // If no API key, fallback to candle data (which will throw in production if unavailable)
  if (!FINNHUB_API_KEY) {
    if (isProduction) {
      console.warn('Finnhub API key not configured, using FMP candle data for quotes');
    } else {
      console.warn('Finnhub API key not configured, using candle data for development');
    }

    const candles = await getDailyOHLC(symbol);
    const latestCandle = candles[candles.length - 1];
    const previousCandle = candles[candles.length - 2];

    if (!latestCandle || !previousCandle) {
      throw new Error(`Insufficient data for ${symbol}`);
    }

    const changePercent = ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100;

    return {
      symbol,
      price: latestCandle.close,
      changePercent: parseFloat(changePercent.toFixed(2)),
      open: latestCandle.open,
      high: latestCandle.high,
      low: latestCandle.low,
      previousClose: previousCandle.close,
      volume: latestCandle.volume,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Finnhub quote response: { c: current, d: change, dp: percent change, h: high, l: low, o: open, pc: previous close }
    if (!data.c || data.c === 0) {
      // No current price, fall back to candle data
      const candles = await getDailyOHLC(symbol);
      const latestCandle = candles[candles.length - 1];
      const previousCandle = candles[candles.length - 2];

      if (!latestCandle || !previousCandle) {
        throw new Error('Insufficient data');
      }

      const changePercent = ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100;

      const quote = {
        symbol,
        price: latestCandle.close,
        changePercent: parseFloat(changePercent.toFixed(2)),
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        previousClose: previousCandle.close,
        volume: latestCandle.volume,
        timestamp: new Date().toISOString(),
      };

      setCache(cacheKey, quote);
      return quote;
    }

    const quote: Quote = {
      symbol,
      price: parseFloat(data.c.toFixed(2)),
      changePercent: parseFloat(data.dp.toFixed(2)),
      open: parseFloat(data.o.toFixed(2)),
      high: parseFloat(data.h.toFixed(2)),
      low: parseFloat(data.l.toFixed(2)),
      previousClose: parseFloat(data.pc.toFixed(2)),
      volume: 0, // Finnhub quote doesn't include volume, would need separate call
      timestamp: new Date().toISOString(),
    };

    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    console.error('Error fetching quote from Finnhub:', error);
    console.warn('Falling back to candle-based quote');

    // Fallback to candle data
    const candles = await getDailyOHLC(symbol);
    const latestCandle = candles[candles.length - 1];
    const previousCandle = candles[candles.length - 2];

    if (!latestCandle || !previousCandle) {
      throw new Error('Insufficient data');
    }

    const changePercent = ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100;

    return {
      symbol,
      price: latestCandle.close,
      changePercent: parseFloat(changePercent.toFixed(2)),
      open: latestCandle.open,
      high: latestCandle.high,
      low: latestCandle.low,
      previousClose: previousCandle.close,
      volume: latestCandle.volume,
      timestamp: new Date().toISOString(),
    };
  }
}
