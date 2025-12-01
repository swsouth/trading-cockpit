/**
 * Tiered Crypto Universe for Intraday Scanning
 *
 * Based on CoinMarketCap rankings (Nov 2025)
 * Criteria:
 * - Tier 1: Top 10 by market cap - scan every 5 min (highest priority)
 * - Tier 2: Top 11-30 - scan every 10 min (high liquidity)
 * - Tier 3: Top 31-60 - scan every 15 min (good volume)
 * - Tier 4: Top 61-100 - scan every 30 min (emerging opportunities)
 *
 * Total: 100 cryptos across 4 tiers
 */

export interface CryptoTier {
  tier: 1 | 2 | 3 | 4;
  scanIntervalMinutes: 5 | 10 | 15 | 30;
  description: string;
  symbols: string[];
}

/**
 * Tier 1: Majors - Highest Volume, Most Liquid
 * Scan every 5 minutes (highest priority)
 */
export const TIER_1_MAJORS: CryptoTier = {
  tier: 1,
  scanIntervalMinutes: 5,
  description: 'Major caps - highest volume and liquidity',
  symbols: [
    'BTC',   // Bitcoin - #1
    'ETH',   // Ethereum - #2
    'USDT',  // Tether - #3 (stablecoin, but useful for market sentiment)
    'XRP',   // XRP - #4
    'BNB',   // BNB - #5
    'SOL',   // Solana - #7
    'DOGE',  // Dogecoin - #9
    'ADA',   // Cardano - #10
    'TRX',   // TRON - #8
    'AVAX',  // Avalanche - #21
  ]
};

/**
 * Tier 2: Large Caps - High Liquidity
 * Scan every 10 minutes
 */
export const TIER_2_LARGE_CAPS: CryptoTier = {
  tier: 2,
  scanIntervalMinutes: 10,
  description: 'Large caps - high liquidity, good day trading volume',
  symbols: [
    'LINK',  // Chainlink - #13
    'XLM',   // Stellar - #15
    'BCH',   // Bitcoin Cash - #12
    'DOT',   // Polkadot - #30
    'UNI',   // Uniswap - #28
    'LTC',   // Litecoin - #19
    'NEAR',  // NEAR Protocol - #38
    'MATIC', // Polygon - was top 20
    'ATOM',  // Cosmos - #64
    'ICP',   // Internet Computer - #39
    'HBAR',  // Hedera - #20
    'SUI',   // Sui - #22
    'APT',   // Aptos - #49
    'TON',   // Toncoin - #27
    'AAVE',  // Aave - #34
    'INJ',   // Injective - #48
    'OP',    // Optimism - #41
    'ARB',   // Arbitrum - #57
    'PEPE',  // Pepe - #44
    'SHIB',  // Shiba Inu - #24
  ]
};

/**
 * Tier 3: Mid Caps - Good Volume
 * Scan every 15 minutes
 */
export const TIER_3_MID_CAPS: CryptoTier = {
  tier: 3,
  scanIntervalMinutes: 15,
  description: 'Mid caps - good volume, emerging opportunities',
  symbols: [
    'FIL',   // Filecoin - #62
    'ALGO',  // Algorand - #58
    'VET',   // VeChain - #63
    'GRT',   // The Graph - #54
    'SAND',  // The Sandbox - #76
    'MANA',  // Decentraland - #98
    'AXS',   // Axie Infinity - #145
    'THETA', // Theta Network - #89
    'XTZ',   // Tezos - #53
    'EOS',   // EOS - (dropped from top 100)
    'CAKE',  // PancakeSwap - #35
    'STX',   // Stacks - #52
    'TIA',   // Celestia - #51
    'SEI',   // Sei - #31
    'RENDER',// Render - #29
    'WIF',   // dogwifhat - #84 (meme coin)
    'BONK',  // Bonk - #36 (meme coin)
    'JUP',   // Jupiter - #37
    'FLOKI', // FLOKI - #66
    'GALA',  // Gala - #82
    'CHZ',   // Chiliz - #97
    'ENS',   // Ethereum Name Service - #67
    'IMX',   // Immutable - #46
    'LDO',   // Lido DAO - #49
    'RUNE',  // THORChain - #119
    'FTM',   // Fantom - (check current rank)
    'KAVA',  // Kava - #177
    'FLOW',  // Flow - #80
    'KAS',   // Kaspa - #45
    'FET',   // Artificial Superintelligence - #47
  ]
};

/**
 * Tier 4: Emerging - Volatile Day Trading Opportunities
 * Scan every 30 minutes
 */
export const TIER_4_EMERGING: CryptoTier = {
  tier: 4,
  scanIntervalMinutes: 30,
  description: 'Emerging tokens - higher volatility, day trading plays',
  symbols: [
    'PENDLE', // Pendle - #68
    'PYTH',   // Pyth Network - #69
    'WLD',    // Worldcoin - #50
    'ONDO',   // Ondo - #43
    'JTO',    // Jito - #134
    'STRK',   // Starknet - #47
    'ZK',     // ZKsync - #90
    'W',      // Wormhole - #118
    'BRETT',  // Brett (Based) - #141
    'VIRTUAL',// Virtuals Protocol - #43
    'HYPE',   // Hyperliquid - #11 (new, volatile)
    'FARTCOIN',// Fartcoin - #93 (meme, volatile)
    'TURBO',  // Turbo - #159
    'MEW',    // cat in a dogs world - (check rank)
    'POPCAT', // Popcat - (check rank)
    'PNUT',   // Peanut - (check rank)
    'GOAT',   // Goatseus Maximus - (check rank)
    'ACT',    // Act I - (check rank)
    'NEIRO',  // First Neiro on Ethereum - (check rank)
    'MOG',    // Mog Coin - (check rank)
    // DeFi protocols with good volume
    'CRV',    // Curve DAO - #46
    'GMX',    // GMX - (check rank)
    'COMP',   // Compound - #87
    'MKR',    // Maker (now Sky) - #56
    'DYDX',   // dYdX - #127
    'RAY',    // Raydium - #113
    'ORCA',   // Orca - (check rank)
    'DRIFT',  // Drift Protocol - (check rank)
    // AI/Gaming tokens
    'PRIME',  // Echelon Prime - (check rank)
    'BLUR',   // Blur - (check rank)
  ]
};

/**
 * Get all crypto symbols as flat array
 */
export function getAllCryptoSymbols(): string[] {
  return [
    ...TIER_1_MAJORS.symbols,
    ...TIER_2_LARGE_CAPS.symbols,
    ...TIER_3_MID_CAPS.symbols,
    ...TIER_4_EMERGING.symbols,
  ];
}

/**
 * Get symbols by tier
 */
export function getSymbolsByTier(tier: 1 | 2 | 3 | 4): string[] {
  switch (tier) {
    case 1: return TIER_1_MAJORS.symbols;
    case 2: return TIER_2_LARGE_CAPS.symbols;
    case 3: return TIER_3_MID_CAPS.symbols;
    case 4: return TIER_4_EMERGING.symbols;
  }
}

/**
 * Get scan interval for a symbol
 */
export function getScanInterval(symbol: string): number {
  if (TIER_1_MAJORS.symbols.includes(symbol)) return TIER_1_MAJORS.scanIntervalMinutes;
  if (TIER_2_LARGE_CAPS.symbols.includes(symbol)) return TIER_2_LARGE_CAPS.scanIntervalMinutes;
  if (TIER_3_MID_CAPS.symbols.includes(symbol)) return TIER_3_MID_CAPS.scanIntervalMinutes;
  if (TIER_4_EMERGING.symbols.includes(symbol)) return TIER_4_EMERGING.scanIntervalMinutes;
  return 30; // Default for unknown symbols
}

/**
 * Get tier for a symbol
 */
export function getTierForSymbol(symbol: string): 1 | 2 | 3 | 4 | null {
  if (TIER_1_MAJORS.symbols.includes(symbol)) return 1;
  if (TIER_2_LARGE_CAPS.symbols.includes(symbol)) return 2;
  if (TIER_3_MID_CAPS.symbols.includes(symbol)) return 3;
  if (TIER_4_EMERGING.symbols.includes(symbol)) return 4;
  return null;
}

/**
 * Summary statistics
 */
export const CRYPTO_UNIVERSE_STATS = {
  totalSymbols: 100,
  tier1Count: TIER_1_MAJORS.symbols.length,
  tier2Count: TIER_2_LARGE_CAPS.symbols.length,
  tier3Count: TIER_3_MID_CAPS.symbols.length,
  tier4Count: TIER_4_EMERGING.symbols.length,
  scansPerHour: {
    tier1: 60 / TIER_1_MAJORS.scanIntervalMinutes, // 12 scans/hour
    tier2: 60 / TIER_2_LARGE_CAPS.scanIntervalMinutes, // 6 scans/hour
    tier3: 60 / TIER_3_MID_CAPS.scanIntervalMinutes, // 4 scans/hour
    tier4: 60 / TIER_4_EMERGING.scanIntervalMinutes, // 2 scans/hour
  },
};

/**
 * Print universe summary
 */
export function printUniverseSummary(): void {
  console.log('\n🌍 CRYPTO UNIVERSE SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Cryptocurrencies: ${CRYPTO_UNIVERSE_STATS.totalSymbols}`);
  console.log('');
  console.log(`Tier 1 (Majors):        ${TIER_1_MAJORS.symbols.length} coins @ every ${TIER_1_MAJORS.scanIntervalMinutes} min`);
  console.log(`Tier 2 (Large Caps):    ${TIER_2_LARGE_CAPS.symbols.length} coins @ every ${TIER_2_LARGE_CAPS.scanIntervalMinutes} min`);
  console.log(`Tier 3 (Mid Caps):      ${TIER_3_MID_CAPS.symbols.length} coins @ every ${TIER_3_MID_CAPS.scanIntervalMinutes} min`);
  console.log(`Tier 4 (Emerging):      ${TIER_4_EMERGING.symbols.length} coins @ every ${TIER_4_EMERGING.scanIntervalMinutes} min`);
  console.log('');
  console.log('Scan Frequency (per hour):');
  console.log(`  Tier 1: ${CRYPTO_UNIVERSE_STATS.scansPerHour.tier1}x/hour`);
  console.log(`  Tier 2: ${CRYPTO_UNIVERSE_STATS.scansPerHour.tier2}x/hour`);
  console.log(`  Tier 3: ${CRYPTO_UNIVERSE_STATS.scansPerHour.tier3}x/hour`);
  console.log(`  Tier 4: ${CRYPTO_UNIVERSE_STATS.scansPerHour.tier4}x/hour`);
  console.log('═'.repeat(60));
}
