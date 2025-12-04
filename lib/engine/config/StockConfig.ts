/**
 * Stock Analysis Configuration
 *
 * Parameters optimized for stock market analysis.
 * Based on traditional market characteristics and liquidity.
 */

import { AnalysisConfig } from '../types';

export const STOCK_CONFIG: AnalysisConfig = {
  assetType: 'stock',
  timeframe: 'daily',

  // Score threshold (30 allows more setups, UI highlights <50 as risky)
  minScore: 30,

  // Channel detection parameters
  channel: {
    minTouches: 2,          // Minimum 2 support + 2 resistance touches
    maxOutOfBand: 0.05,     // 5% tolerance for price outside channel
    minWidth: 0.02,         // 2% minimum channel width
    maxWidth: 0.25,         // 25% maximum channel width
  },

  // Risk management parameters
  risk: {
    maxStopLoss: 0.15,      // 15% maximum stop loss
    minRiskReward: 1.5,     // Minimum 1.5:1 risk/reward ratio (relaxed from 2.0)
    maxRisk: 0.10,          // Max 10% portfolio risk per trade
  },

  // Pre-trade filters
  filters: {
    minADV: 1_000_000,      // $1M minimum average daily volume
    maxSpread: 0.02,        // 2% maximum bid-ask spread
    earningsBuffer: 3,      // Avoid 3 days before/after earnings
  },

  // Scoring weights (sum to 1.0)
  scoring: {
    trendWeight: 0.30,      // 30% - Trend strength (channel, EMA alignment)
    patternWeight: 0.25,    // 25% - Pattern quality and reliability
    volumeWeight: 0.20,     // 20% - Volume confirmation
    riskRewardWeight: 0.15, // 15% - R:R ratio quality
    momentumWeight: 0.10,   // 10% - RSI and momentum indicators
  },
};

// Intraday stock configuration (for day trading)
export const STOCK_INTRADAY_CONFIG: AnalysisConfig = {
  ...STOCK_CONFIG,
  timeframe: 'intraday',
  minScore: 40,  // Higher threshold for intraday (more noise)

  // Tighter parameters for intraday
  channel: {
    ...STOCK_CONFIG.channel,
    maxOutOfBand: 0.03,     // 3% tolerance (tighter for intraday)
  },

  risk: {
    ...STOCK_CONFIG.risk,
    maxStopLoss: 0.10,      // 10% max stop (tighter for day trades)
  },

  filters: {
    ...STOCK_CONFIG.filters,
    minADV: 5_000_000,      // $5M ADV (need high liquidity for intraday)
    earningsBuffer: 0,      // No earnings filter for intraday
  },
};
