/**
 * Patterns Module - Exports
 *
 * Centralized exports for all pattern detection functionality.
 */

// Candlestick patterns
export {
  detectCandlestickPatterns,
  PATTERN_METADATA,
  type CandlestickPattern,
} from './candlestick';

// Channel detection
export {
  detectChannel,
  getChannelQuality,
  type ChannelResult,
} from './channel';

// Technical indicators
export {
  calculateRSI,
  calculateATR,
  calculateSMA,
  calculateEMA,
  calculateADX,
  analyzeVolume,
  analyzeIntradayVolume,
} from './indicators';
