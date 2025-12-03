/**
 * CoinAPI Adapter for Crypto Intraday Data
 *
 * Premium crypto market data with optimized credit usage:
 * - Date-bounded queries: 10 credit cap (even for large datasets!)
 * - Direct WebSocket feeds from exchanges
 * - Historical data back to 2014
 * - 400+ supported exchanges
 *
 * Cost Optimization:
 * - Use date parameters to trigger 10-credit cap per request
 * - 15min + 1H data = 2 calls × 10 credits = 20 credits per crypto
 * - 15 cryptos × 20 credits = 300 credits per scan
 * - ~15 scans/day = 4,500 credits/day (stays within $25 free tier!)
 *
 * References:
 * - API Docs: https://docs.coinapi.io/
 * - Pricing: https://www.coinapi.io/products/market-data-api/pricing
 * - Rate Limits: https://docs.coinapi.io/market-data/api-limits-and-billing-metrics
 */

import { Candle } from '@/lib/types';

const COINAPI_BASE_URL = 'https://rest.coinapi.io/v1';

// Helper to get API key
const getCoinApiKey = () => process.env.COINAPI_API_KEY;

// In-memory cache for intraday data (5 minutes for day trading)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes

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
 * Convert crypto symbol to CoinAPI format
 * BTC/USD → BINANCE_SPOT_BTC_USDT (using Binance as primary exchange)
 */
function toCoinApiSymbol(symbol: string): string {
  // Split on slash to separate base and quote
  const [base, quote] = symbol.split('/');

  // Convert USD to USDT for Binance (Binance uses USDT, not USD)
  const binanceQuote = quote === 'USD' ? 'USDT' : quote;

  // CoinAPI format: {EXCHANGE}_SPOT_{BASE}_{QUOTE}
  return `BINANCE_SPOT_${base}_${binanceQuote}`;
}

/**
 * Calculate time range for date-bounded queries
 * Returns ISO timestamps for optimal credit usage (10 credit cap)
 */
function getTimeRange(hours: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Get 15-minute intraday candles for crypto (last 24 hours)
 *
 * COST OPTIMIZATION: Uses date-bounded query (10 credit cap regardless of bars returned)
 *
 * @param symbol - Crypto ticker (e.g., 'BTC/USD', 'ETH/USD')
 * @param hours - Number of hours to look back (default: 24)
 * @returns Array of 15-minute candles
 */
export async function getCrypto15MinCandles(
  symbol: string,
  hours: number = 24
): Promise<Candle[]> {
  const cacheKey = `coinapi_15min_${symbol}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getCoinApiKey();
  if (!apiKey) {
    throw new Error('CoinAPI API key not configured');
  }

  try {
    const coinApiSymbol = toCoinApiSymbol(symbol);
    const { start, end } = getTimeRange(hours);

    console.log(`📊 Fetching ${hours}h of 15-min data for ${symbol} from CoinAPI...`);

    // CoinAPI OHLCV endpoint with date-bounded query (10 credit cap!)
    // Using header authentication (recommended method)
    const url = `${COINAPI_BASE_URL}/ohlcv/${coinApiSymbol}/history?period_id=15MIN&time_start=${start}&time_end=${end}`;

    const response = await fetch(url, {
      headers: {
        'X-CoinAPI-Key': apiKey,
      },
    });

    if (!response.ok) {
      // Log full error details for debugging
      const errorText = await response.text();
      console.error(`CoinAPI Error ${response.status} for ${symbol}:`);
      console.error(`URL: ${url}`);
      console.error(`Response: ${errorText}`);

      if (response.status === 429) {
        throw new Error('CoinAPI rate limit exceeded');
      }
      if (response.status === 550) {
        throw new Error(`CoinAPI: No data available for ${symbol}`);
      }
      throw new Error(`CoinAPI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No 15-min data returned for ${symbol}`);
    }

    // Transform to Candle format
    const candles: Candle[] = data.map((bar: any) => ({
      timestamp: bar.time_period_start,
      open: parseFloat(bar.price_open),
      high: parseFloat(bar.price_high),
      low: parseFloat(bar.price_low),
      close: parseFloat(bar.price_close),
      volume: parseFloat(bar.volume_traded) || 0,
    }));

    console.log(`✅ Retrieved ${candles.length} 15-min bars for ${symbol} (10 credits max)`);
    setCache(cacheKey, candles);
    return candles;

  } catch (error) {
    console.error(`❌ Error fetching 15-min crypto data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get 1-hour candles for crypto (for higher timeframe trend analysis)
 *
 * COST OPTIMIZATION: Uses date-bounded query (10 credit cap regardless of bars returned)
 *
 * @param symbol - Crypto ticker (e.g., 'BTC/USD', 'ETH/USD')
 * @param hours - Number of hours to look back (default: 168 = 1 week)
 * @returns Array of 1-hour candles
 */
export async function getCrypto1HCandles(
  symbol: string,
  hours: number = 168 // 1 week default
): Promise<Candle[]> {
  const cacheKey = `coinapi_1h_${symbol}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getCoinApiKey();
  if (!apiKey) {
    throw new Error('CoinAPI API key not configured');
  }

  try {
    const coinApiSymbol = toCoinApiSymbol(symbol);
    const { start, end } = getTimeRange(hours);

    console.log(`📊 Fetching ${hours}h of 1H data for ${symbol} from CoinAPI...`);

    // CoinAPI OHLCV endpoint with date-bounded query (10 credit cap!)
    // Using header authentication (recommended method)
    const url = `${COINAPI_BASE_URL}/ohlcv/${coinApiSymbol}/history?period_id=1HRS&time_start=${start}&time_end=${end}`;

    const response = await fetch(url, {
      headers: {
        'X-CoinAPI-Key': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('CoinAPI rate limit exceeded');
      }
      if (response.status === 550) {
        throw new Error(`CoinAPI: No data available for ${symbol}`);
      }
      throw new Error(`CoinAPI error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No 1H data returned for ${symbol}`);
    }

    // Transform to Candle format
    const candles: Candle[] = data.map((bar: any) => ({
      timestamp: bar.time_period_start,
      open: parseFloat(bar.price_open),
      high: parseFloat(bar.price_high),
      low: parseFloat(bar.price_low),
      close: parseFloat(bar.price_close),
      volume: parseFloat(bar.volume_traded) || 0,
    }));

    console.log(`✅ Retrieved ${candles.length} 1H bars for ${symbol} (10 credits max)`);
    setCache(cacheKey, candles);
    return candles;

  } catch (error) {
    console.error(`❌ Error fetching 1H crypto data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get latest crypto quote from CoinAPI
 *
 * @param symbol - Crypto ticker (e.g., 'BTC/USD')
 * @returns Current price and metadata
 */
export async function getCryptoQuoteCoinApi(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}> {
  const apiKey = getCoinApiKey();
  if (!apiKey) {
    throw new Error('CoinAPI API key not configured');
  }

  try {
    const coinApiSymbol = toCoinApiSymbol(symbol);

    // Get latest OHLCV (1 bar = 1 credit)
    const url = `${COINAPI_BASE_URL}/ohlcv/${coinApiSymbol}/latest?period_id=1MIN&limit=1&apikey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinAPI error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No quote data for ${symbol}`);
    }

    const bar = data[0];
    const price = parseFloat(bar.price_close);
    const open = parseFloat(bar.price_open);
    const change = price - open;
    const changePercent = (change / open) * 100;

    return {
      price,
      change,
      changePercent,
      high: parseFloat(bar.price_high),
      low: parseFloat(bar.price_low),
      volume: parseFloat(bar.volume_traded) || 0,
      timestamp: bar.time_period_start,
    };

  } catch (error) {
    console.error(`❌ Error fetching crypto quote for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Batch fetch BOTH 15-min AND 1H data for multi-timeframe analysis
 *
 * RATE LIMITING: Sequential with 1-second delays to avoid concurrency limits
 * COST: 2 calls × 10 credits = 20 credits per crypto (date-bounded cap)
 *
 * @param symbols - Array of crypto tickers
 * @returns Map of symbol → { candles15m, candles1h }
 */
export async function batchGetCryptoMultiTimeframe(
  symbols: string[]
): Promise<Map<string, { candles15m: Candle[]; candles1h: Candle[] }>> {
  const results = new Map<string, { candles15m: Candle[]; candles1h: Candle[] }>();

  console.log(`📊 Batch fetching ${symbols.length} cryptos (15m + 1H bars for MTF analysis)...`);
  console.log(`💰 Cost estimate: ${symbols.length} cryptos × 20 credits = ${symbols.length * 20} credits total`);

  // Process sequentially with 1s delay to respect rate limits
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];

    try {
      console.log(`⏳ Processing ${symbol} (${i + 1}/${symbols.length})...`);

      // Fetch both timeframes (date-bounded = 10 credits each = 20 total)
      const [candles15m, candles1h] = await Promise.all([
        getCrypto15MinCandles(symbol, 24),  // Last 24 hours of 15m bars
        getCrypto1HCandles(symbol, 168),    // Last week of 1H bars
      ]);

      results.set(symbol, { candles15m, candles1h });

      // Delay 1 second between cryptos to avoid concurrency limits
      if (i < symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.warn(`⚠️ Skipping ${symbol} - MTF fetch failed:`, error);
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
