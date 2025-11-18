/**
 * Market Scanner Library
 *
 * Provides automated scanning of watchlist stocks with actionable trading recommendations.
 * Designed to scale from personal watchlist scans to market-wide scanning.
 */

export { generateTradingAction } from './actionGenerator';
export {
  calculateConfidence,
  calculateRiskReward,
  calculatePercentChange,
} from './confidenceScorer';
export {
  scanSymbol,
  scanWatchlist,
  applyScanCriteria,
  sortScanResults,
  getScanStats,
} from './scanner';
