/**
 * Twelve Data Adapter for Crypto Intraday Data
 *
 * Optimized for day trading with 15-minute candle bars
 * Uses 100% of freed-up Twelve Data quota (no longer shared with stocks)
 *
 * Coverage: BTC, ETH, SOL, BNB, XRP, ADA, DOGE, DOT, MATIC, LINK, etc.
 * Update frequency: Real-time (15-min bars)
 * Cost: FREE tier (800 calls/day, 8 calls/min) - now 100% available for crypto
 */

import { Candle } from '@/lib/types';

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

// Helper to get API key
const getTwelveDataApiKey = () => process.env.TWELVE_DATA_API_KEY;

// In-memory cache for intraday data (shorter cache - 5 minutes for day trading)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes (tighter cache for day trading)

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
 * Get 15-minute intraday candles for crypto (last 24 hours)
 *
 * @param symbol - Crypto ticker (e.g., 'BTC/USD', 'ETH/USD')
 * @param hours - Number of hours to look back (default: 24)
 * @returns Array of 15-minute candles
 */
export async function getCrypto15MinCandles(
  symbol: string,
  hours: number = 24
): Promise<Candle[]> {
  const cacheKey = `crypto_15min_${symbol}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getTwelveDataApiKey();
  if (!apiKey) {
    throw new Error('Twelve Data API key not configured for crypto intraday data');
  }

  try {
    // Calculate outputsize: 15-min bars in N hours = N * 4
    const outputsize = hours * 4;

    console.log(`📊 Fetching ${hours}h of 15-min data for ${symbol} from Twelve Data...`);

    // Twelve Data crypto format: BTC/USD, ETH/USD, etc.
    const cryptoSymbol = symbol.includes('/') ? symbol : `${symbol}/USD`;

    // Fetch 15-minute bars
    const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${cryptoSymbol}&interval=15min&outputsize=${outputsize}&apikey=${apiKey}`;

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
    // Twelve Data returns newest first, reverse for chronological order
    const candles: Candle[] = data.values
      .map((bar: any) => ({
        timestamp: bar.datetime, // ISO datetime string
        open: parseFloat(bar.open),
        high: parseFloat(bar.high),
        low: parseFloat(bar.low),
        close: parseFloat(bar.close),
        volume: parseFloat(bar.volume) || 0,
      }))
      .reverse(); // Oldest first

    if (candles.length === 0) {
      throw new Error(`No 15-min data returned for ${symbol}`);
    }

    console.log(`✅ Retrieved ${candles.length} 15-min bars for ${symbol}`);
    setCache(cacheKey, candles);
    return candles;

  } catch (error) {
    console.error(`❌ Error fetching 15-min crypto data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get latest crypto quote from Twelve Data
 *
 * @param symbol - Crypto ticker (e.g., 'BTC/USD')
 * @returns Current price and metadata
 */
export async function getCryptoQuoteTwelveData(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}> {
  const apiKey = getTwelveDataApiKey();
  if (!apiKey) {
    throw new Error('Twelve Data API key not configured');
  }

  try {
    const cryptoSymbol = symbol.includes('/') ? symbol : `${symbol}/USD`;
    const url = `${TWELVE_DATA_BASE_URL}/quote?symbol=${cryptoSymbol}&apikey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(`Twelve Data error: ${data.message}`);
    }

    return {
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      volume: parseFloat(data.volume) || 0,
      timestamp: data.datetime,
    };

  } catch (error) {
    console.error(`❌ Error fetching crypto quote for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get 1-hour candles for crypto (for higher timeframe trend analysis)
 *
 * @param symbol - Crypto ticker (e.g., 'BTC/USD', 'ETH/USD')
 * @param hours - Number of hours to look back (default: 168 = 1 week)
 * @returns Array of 1-hour candles
 */
export async function getCrypto1HCandles(
  symbol: string,
  hours: number = 168 // 1 week default
): Promise<Candle[]> {
  const cacheKey = `crypto_1h_${symbol}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getTwelveDataApiKey();
  if (!apiKey) {
    throw new Error('Twelve Data API key not configured for crypto data');
  }

  try {
    // 1H bars = hours requested
    const outputsize = hours;

    console.log(`📊 Fetching ${hours}h of 1H data for ${symbol} from Twelve Data...`);

    // Twelve Data crypto format: BTC/USD, ETH/USD, etc.
    const cryptoSymbol = symbol.includes('/') ? symbol : `${symbol}/USD`;

    // Fetch 1-hour bars
    const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${cryptoSymbol}&interval=1h&outputsize=${outputsize}&apikey=${apiKey}`;

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

    // Transform to Candle format (oldest first)
    const candles: Candle[] = data.values
      .map((bar: any) => ({
        timestamp: bar.datetime,
        open: parseFloat(bar.open),
        high: parseFloat(bar.high),
        low: parseFloat(bar.low),
        close: parseFloat(bar.close),
        volume: parseFloat(bar.volume) || 0,
      }))
      .reverse(); // Oldest first

    if (candles.length === 0) {
      throw new Error(`No 1H data returned for ${symbol}`);
    }

    console.log(`✅ Retrieved ${candles.length} 1H bars for ${symbol}`);
    setCache(cacheKey, candles);
    return candles;

  } catch (error) {
    console.error(`❌ Error fetching 1H crypto data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Batch fetch 15-min data for multiple crypto symbols
 * Respects rate limits (8 calls/min)
 *
 * @param symbols - Array of crypto tickers
 * @param hours - Hours of historical data
 * @returns Map of symbol → candles
 */
export async function batchGetCrypto15MinData(
  symbols: string[],
  hours: number = 24
): Promise<Map<string, Candle[]>> {
  const results = new Map<string, Candle[]>();

  console.log(`📊 Batch fetching ${symbols.length} cryptos (15-min bars)...`);

  // Twelve Data rate limit: 8 calls/min (free tier)
  // Process in batches of 8 with delays
  const batchSize = 8;
  const delayBetweenBatches = 60000; // 1 minute

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    console.log(`⏳ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)}...`);

    // Process batch in parallel
    const promises = batch.map(async (symbol) => {
      try {
        const candles = await getCrypto15MinCandles(symbol, hours);
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
 * Batch fetch BOTH 15-min AND 1H data for multi-timeframe analysis
 * Fetches both timeframes in a single batch to respect rate limits
 *
 * @param symbols - Array of crypto tickers
 * @returns Map of symbol → { candles15m, candles1h }
 */
export async function batchGetCryptoMultiTimeframe(
  symbols: string[]
): Promise<Map<string, { candles15m: Candle[]; candles1h: Candle[] }>> {
  const results = new Map<string, { candles15m: Candle[]; candles1h: Candle[] }>();

  console.log(`📊 Batch fetching ${symbols.length} cryptos (15m + 1H bars for MTF analysis)...`);

  // Need to fetch 2 calls per symbol (15m + 1h)
  // Rate limit: 8 calls/min = 4 symbols per batch
  const batchSize = 4;
  const delayBetweenBatches = 60000; // 1 minute

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    console.log(`⏳ Processing MTF batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)}...`);

    // Fetch both timeframes for each symbol in batch
    // Add 7.5s delay between each crypto to spread 8 calls across 30s (well under 60s limit)
    for (let j = 0; j < batch.length; j++) {
      const symbol = batch[j];

      try {
        const [candles15m, candles1h] = await Promise.all([
          getCrypto15MinCandles(symbol, 24),  // Last 24 hours of 15m bars
          getCrypto1HCandles(symbol, 168),    // Last week of 1H bars
        ]);
        results.set(symbol, { candles15m, candles1h });
      } catch (error) {
        console.warn(`⚠️ Skipping ${symbol} - MTF fetch failed:`, error);
      }

      // Delay between cryptos within batch (except last one)
      if (j < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 7500)); // 7.5s between cryptos
      }
    }

    // Delay between batches (except for last batch)
    if (i + batchSize < symbols.length) {
      console.log(`⏸️  Rate limit delay: waiting 60s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log(`✅ MTF batch complete: ${results.size}/${symbols.length} successful`);
  return results;
}

/**
 * Calculate how many minutes until next 15-min bar closes
 * Used for countdown timer on crypto cards
 *
 * @returns Minutes until next 15-min bar
 */
export function getMinutesUntilNext15MinBar(): number {
  const now = new Date();
  const minutes = now.getMinutes();
  const minutesIntoBar = minutes % 15;
  const minutesRemaining = 15 - minutesIntoBar;
  return minutesRemaining;
}

/**
 * Get timestamp of next 15-min bar close
 * Used for "Valid until" display
 *
 * @returns ISO timestamp of next bar close
 */
export function getNext15MinBarClose(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const minutesIntoBar = minutes % 15;
  const minutesRemaining = 15 - minutesIntoBar;

  const nextClose = new Date(now);
  nextClose.setMinutes(now.getMinutes() + minutesRemaining);
  nextClose.setSeconds(0);
  nextClose.setMilliseconds(0);

  return nextClose.toISOString();
}
