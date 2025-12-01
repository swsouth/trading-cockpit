/**
 * Configuration Loader
 *
 * Centralized configuration loader that selects the appropriate
 * config based on asset type and timeframe.
 */

import { AnalysisConfig, EngineOptions } from '../types';
import { STOCK_CONFIG, STOCK_INTRADAY_CONFIG } from './StockConfig';
import { CRYPTO_CONFIG, CRYPTO_INTRADAY_CONFIG } from './CryptoConfig';

/**
 * Load the appropriate configuration based on options
 */
export function loadConfig(options: EngineOptions): AnalysisConfig {
  let baseConfig: AnalysisConfig;

  // Select base config based on asset type and timeframe
  if (options.assetType === 'stock') {
    baseConfig = options.timeframe === 'intraday'
      ? STOCK_INTRADAY_CONFIG
      : STOCK_CONFIG;
  } else {
    baseConfig = options.timeframe === 'intraday'
      ? CRYPTO_INTRADAY_CONFIG
      : CRYPTO_CONFIG;
  }

  // Merge with any custom overrides
  if (options.config) {
    return {
      ...baseConfig,
      ...options.config,
      // Deep merge nested objects
      channel: { ...baseConfig.channel, ...options.config.channel },
      risk: { ...baseConfig.risk, ...options.config.risk },
      filters: { ...baseConfig.filters, ...options.config.filters },
      scoring: { ...baseConfig.scoring, ...options.config.scoring },
    };
  }

  return baseConfig;
}

// Export all configs for direct access
export { STOCK_CONFIG, STOCK_INTRADAY_CONFIG } from './StockConfig';
export { CRYPTO_CONFIG, CRYPTO_INTRADAY_CONFIG } from './CryptoConfig';
