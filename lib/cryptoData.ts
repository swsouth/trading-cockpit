import { Quote, Candle } from './types';

const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Note: This module is production-ready. It throws errors instead of returning mock data.
// This ensures users always see real crypto data or clear error messages.

// Cache for crypto data (10 minute cache)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 minutes

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

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'USDC': 'usd-coin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum',
};

function getCoinGeckoId(symbol: string): string {
  return SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
}

export async function getCryptoQuote(symbol: string): Promise<Quote> {
  const cacheKey = `crypto_quote_${symbol}`;
  const cached = getCached<Quote>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const coinId = getCoinGeckoId(symbol);
    const headers: HeadersInit = {};

    // Add API key if available (for Demo API tier)
    if (COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
    }

    const url = `${COINGECKO_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data[coinId]) {
      throw new Error(`Crypto symbol ${symbol} not found`);
    }

    const coinData = data[coinId];
    const price = coinData.usd;
    const changePercent = coinData.usd_24h_change || 0;

    const quote: Quote = {
      symbol: symbol.toUpperCase(),
      price: parseFloat(price.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      open: price, // CoinGecko doesn't provide daily open, using current price
      high: price,
      low: price,
      previousClose: price / (1 + changePercent / 100),
      volume: coinData.usd_24h_vol || 0,
      timestamp: new Date().toISOString(),
    };

    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    console.error('Error fetching crypto quote from CoinGecko:', error);
    throw error;
  }
}

export async function getCryptoOHLC(symbol: string): Promise<Candle[]> {
  const cacheKey = `crypto_candles_${symbol}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const coinId = getCoinGeckoId(symbol);
    const headers: HeadersInit = {};

    if (COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
    }

    // Get 90 days of data
    const url = `${COINGECKO_BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=90`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No OHLC data found for ${symbol}`);
    }

    // CoinGecko returns: [timestamp, open, high, low, close]
    const candles: Candle[] = data.map((item: number[]) => ({
      timestamp: new Date(item[0]).toISOString().split('T')[0],
      open: parseFloat(item[1].toFixed(2)),
      high: parseFloat(item[2].toFixed(2)),
      low: parseFloat(item[3].toFixed(2)),
      close: parseFloat(item[4].toFixed(2)),
      volume: 0, // CoinGecko OHLC doesn't include volume in this endpoint
    }));

    setCache(cacheKey, candles);
    return candles;
  } catch (error) {
    console.error('Error fetching crypto OHLC from CoinGecko:', error);
    throw error;
  }
}
