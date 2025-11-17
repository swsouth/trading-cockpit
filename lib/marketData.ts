import { Candle, Quote } from './types';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

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

  // If no API key, use mock data
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('Alpha Vantage API key not configured, using mock data');
    return generateMockCandles(symbol);
  }

  try {
    // Alpha Vantage TIME_SERIES_DAILY endpoint
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data['Error Message']) {
      console.warn(`Invalid symbol ${symbol}:`, data['Error Message']);
      return generateMockCandles(symbol);
    }

    if (data['Note']) {
      console.warn('Alpha Vantage rate limit reached:', data['Note']);
      return generateMockCandles(symbol);
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      console.warn(`No data found for symbol ${symbol}, using mock data`);
      return generateMockCandles(symbol);
    }

    // Convert Alpha Vantage format to our Candle format
    const candles: Candle[] = Object.entries(timeSeries)
      .map(([date, values]: [string, any]) => ({
        timestamp: date,
        open: parseFloat(parseFloat(values['1. open']).toFixed(2)),
        high: parseFloat(parseFloat(values['2. high']).toFixed(2)),
        low: parseFloat(parseFloat(values['3. low']).toFixed(2)),
        close: parseFloat(parseFloat(values['4. close']).toFixed(2)),
        volume: parseInt(values['5. volume']),
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)); // Sort chronologically

    // Cache the results
    setCache(cacheKey, candles);

    return candles;
  } catch (error) {
    console.error('Error fetching candles from Alpha Vantage:', error);
    console.warn('Falling back to mock data');
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

  // If no API key, use mock data
  if (!FINNHUB_API_KEY) {
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
