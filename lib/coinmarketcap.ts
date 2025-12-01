/**
 * CoinMarketCap API Integration
 *
 * Uses FREE Basic plan:
 * - 10,000 credits/month
 * - 30 requests/minute
 * - Updates every 1 minute
 *
 * Purpose: Daily universe refresh to identify which coins are hot
 */

const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY || '';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

export interface CMCCrypto {
  id: number;
  name: string;
  symbol: string;
  rank: number;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
    };
  };
}

export interface CMCListingResponse {
  data: CMCCrypto[];
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    credit_count: number;
  };
}

/**
 * Fetch top N cryptocurrencies by market cap with volume data
 *
 * @param limit Number of coins to fetch (default 100)
 * @returns Array of crypto data sorted by market cap
 */
export async function fetchTopCryptos(limit: number = 100): Promise<CMCCrypto[]> {
  if (!CMC_API_KEY) {
    console.warn('⚠️  CoinMarketCap API key not configured - using static universe');
    return [];
  }

  try {
    const url = `${CMC_BASE_URL}/cryptocurrency/listings/latest`;
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort: 'market_cap',
      sort_dir: 'desc',
      cryptocurrency_type: 'all',
      convert: 'USD',
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CMC API error: ${response.status} - ${errorText}`);
    }

    const data: CMCListingResponse = await response.json();

    console.log(`✅ Fetched ${data.data.length} cryptos from CoinMarketCap`);
    console.log(`   Credits used: ${data.status.credit_count}`);

    return data.data;
  } catch (error) {
    console.error('❌ Error fetching from CoinMarketCap:', error);
    return [];
  }
}

/**
 * Identify "hot" coins with unusually high volume
 *
 * @param cryptos Array of crypto data
 * @param volumeThreshold Minimum 24h volume change % (default 200%)
 * @returns Symbols of hot coins
 */
export function identifyHotCoins(
  cryptos: CMCCrypto[],
  volumeThreshold: number = 200
): string[] {
  return cryptos
    .filter(crypto => crypto.quote.USD.volume_change_24h >= volumeThreshold)
    .map(crypto => crypto.symbol)
    .slice(0, 20); // Top 20 hot coins
}

/**
 * Get recommended tier for a coin based on rank and volume
 *
 * @param crypto Crypto data from CMC
 * @returns Recommended tier (1-4)
 */
export function getRecommendedTier(crypto: CMCCrypto): 1 | 2 | 3 | 4 {
  const { rank } = crypto;
  const { volume_24h, volume_change_24h } = crypto.quote.USD;

  // Hot coin promotion: If volume spike > 300%, bump up 1 tier
  const isVolumeSpike = volume_change_24h >= 300;

  if (rank <= 10) return isVolumeSpike ? 1 : 1;
  if (rank <= 30) return isVolumeSpike ? 1 : 2;
  if (rank <= 60) return isVolumeSpike ? 2 : 3;
  if (rank <= 100) return isVolumeSpike ? 3 : 4;

  return 4;
}

/**
 * Build dynamic crypto universe from CMC data
 *
 * Returns tiered universe with promoted hot coins
 */
export async function buildDynamicUniverse(): Promise<{
  tier1: string[];
  tier2: string[];
  tier3: string[];
  tier4: string[];
  hotCoins: string[];
}> {
  const cryptos = await fetchTopCryptos(100);

  if (cryptos.length === 0) {
    console.warn('⚠️  Failed to fetch from CMC, using static universe');
    return {
      tier1: [],
      tier2: [],
      tier3: [],
      tier4: [],
      hotCoins: [],
    };
  }

  const tier1: string[] = [];
  const tier2: string[] = [];
  const tier3: string[] = [];
  const tier4: string[] = [];

  // Categorize by recommended tier
  for (const crypto of cryptos) {
    const tier = getRecommendedTier(crypto);
    const symbol = crypto.symbol;

    switch (tier) {
      case 1: tier1.push(symbol); break;
      case 2: tier2.push(symbol); break;
      case 3: tier3.push(symbol); break;
      case 4: tier4.push(symbol); break;
    }
  }

  // Identify hot coins (volume spikes)
  const hotCoins = identifyHotCoins(cryptos);

  console.log('\n📊 DYNAMIC UNIVERSE BUILT');
  console.log(`   Tier 1: ${tier1.length} coins`);
  console.log(`   Tier 2: ${tier2.length} coins`);
  console.log(`   Tier 3: ${tier3.length} coins`);
  console.log(`   Tier 4: ${tier4.length} coins`);
  console.log(`   Hot Coins: ${hotCoins.length} coins (volume spike >200%)`);

  if (hotCoins.length > 0) {
    console.log(`   🔥 Hot: ${hotCoins.slice(0, 5).join(', ')}...`);
  }

  return { tier1, tier2, tier3, tier4, hotCoins };
}

/**
 * Get scan priority for a symbol
 * Higher = scan more frequently
 *
 * @param symbol Crypto symbol
 * @param hotCoins Array of hot coin symbols
 * @param tier Current tier
 * @returns Priority score (1-5, higher = more important)
 */
export function getScanPriority(
  symbol: string,
  hotCoins: string[],
  tier: 1 | 2 | 3 | 4
): number {
  // Hot coin bonus: +2 priority
  const hotBonus = hotCoins.includes(symbol) ? 2 : 0;

  // Tier-based priority
  const tierPriority = {
    1: 5,
    2: 4,
    3: 3,
    4: 2,
  }[tier];

  return Math.min(tierPriority + hotBonus, 5); // Max priority = 5
}

/**
 * Mock data for testing (when API key not configured)
 */
export function getMockTopCryptos(): CMCCrypto[] {
  const mockCoins = [
    'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'SOL', 'USDC', 'DOGE', 'ADA', 'TRX',
    'LINK', 'XLM', 'BCH', 'DOT', 'UNI', 'LTC', 'NEAR', 'MATIC', 'ATOM', 'ICP',
  ];

  return mockCoins.map((symbol, index) => ({
    id: index + 1,
    name: symbol,
    symbol,
    rank: index + 1,
    quote: {
      USD: {
        price: 100 - index * 5,
        volume_24h: 1000000000 - index * 10000000,
        volume_change_24h: Math.random() * 100 - 50,
        percent_change_1h: Math.random() * 2 - 1,
        percent_change_24h: Math.random() * 10 - 5,
        percent_change_7d: Math.random() * 20 - 10,
        market_cap: 10000000000 - index * 100000000,
      },
    },
  }));
}
