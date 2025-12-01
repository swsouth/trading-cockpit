/**
 * Crypto Analysis Configuration
 *
 * Parameters optimized for cryptocurrency market analysis.
 * Accounts for higher volatility, 24/7 trading, and wider price swings.
 */

import { AnalysisConfig } from '../types';

export const CRYPTO_CONFIG: AnalysisConfig = {
  assetType: 'crypto',
  timeframe: 'daily',

  // Channel detection parameters (wider for crypto volatility)
  channel: {
    minTouches: 2,          // Same minimum touches
    maxOutOfBand: 0.08,     // 8% tolerance (vs 5% for stocks)
    minWidth: 0.03,         // 3% minimum channel width (vs 2% for stocks)
    maxWidth: 0.40,         // 40% maximum channel width (vs 25% for stocks)
  },

  // Risk management parameters (wider stops for crypto)
  risk: {
    maxStopLoss: 0.20,      // 20% maximum stop loss (vs 15% for stocks)
    minRiskReward: 2.0,     // Same minimum 2:1 R:R
    maxRisk: 0.05,          // Max 5% portfolio risk (lower due to volatility)
  },

  // Pre-trade filters
  filters: {
    minADV: 500_000,        // $500k minimum ADV (vs $1M for stocks)
    maxSpread: 0.05,        // 5% maximum spread (vs 2% for stocks)
    earningsBuffer: 0,      // N/A for crypto (no earnings reports)
  },

  // Scoring weights (adjusted for crypto characteristics)
  scoring: {
    trendWeight: 0.25,      // 25% - Less weight (crypto more choppy)
    patternWeight: 0.30,    // 30% - More weight (patterns still reliable)
    volumeWeight: 0.25,     // 25% - Higher weight (volume critical for crypto)
    riskRewardWeight: 0.10, // 10% - Lower weight (wider targets normal)
    momentumWeight: 0.10,   // 10% - Same weight
  },
};

// Intraday crypto configuration (for crypto day trading)
export const CRYPTO_INTRADAY_CONFIG: AnalysisConfig = {
  ...CRYPTO_CONFIG,
  timeframe: 'intraday',

  // Even tighter parameters for crypto intraday
  channel: {
    ...CRYPTO_CONFIG.channel,
    maxOutOfBand: 0.10,     // 10% tolerance (crypto is volatile even intraday)
  },

  risk: {
    ...CRYPTO_CONFIG.risk,
    maxStopLoss: 0.15,      // 15% max stop for intraday (tighter than daily)
  },

  filters: {
    ...CRYPTO_CONFIG.filters,
    minADV: 1_000_000,      // $1M ADV (need high liquidity for intraday trading)
  },

  // Adjust weights for intraday crypto
  scoring: {
    trendWeight: 0.20,      // Even less weight on trend (intraday is choppy)
    patternWeight: 0.30,    // Patterns still important
    volumeWeight: 0.30,     // Volume even more critical intraday
    riskRewardWeight: 0.10,
    momentumWeight: 0.10,
  },
};
