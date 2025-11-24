import {
  WatchlistItem,
  ScanResult,
  ScanCriteria,
  Candle,
} from '../types';
import { getDailyOHLC, getQuote } from '../marketData';
import { getCryptoOHLC, getCryptoQuote } from '../cryptoData';
import { detectChannel, detectPatterns, computeCombinedSignal } from '../analysis';
import { generateTradingAction } from './actionGenerator';

/**
 * Scan a single watchlist item and generate trading recommendation
 */
export async function scanSymbol(
  watchlistItem: WatchlistItem
): Promise<ScanResult | null> {
  try {
    const { symbol, asset_type } = watchlistItem;

    // Fetch quote and candles based on asset type
    let quote;
    let candles: Candle[];

    if (asset_type === 'crypto') {
      [quote, candles] = await Promise.all([
        getCryptoQuote(symbol),
        getCryptoOHLC(symbol),
      ]);
    } else {
      // Use database-first for watchlist scanner (avoids FMP API calls)
      // Falls back to mock data in development if database empty
      [quote, candles] = await Promise.all([
        getQuote(symbol),
        getDailyOHLC(symbol, 'auto'), // Try database first, then API if needed
      ]);
    }

    // Run technical analysis
    const channel = detectChannel(candles);
    const pattern = detectPatterns(candles);
    const signal = computeCombinedSignal(channel, pattern, candles);

    // Generate trading action
    const action = generateTradingAction(symbol, quote, channel, pattern, signal);

    return {
      watchlistItem,
      quote,
      channel,
      pattern,
      signal,
      action,
      scannedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error scanning ${watchlistItem.symbol}:`, error);
    return null;
  }
}

/**
 * Scan multiple watchlist items in parallel
 *
 * @param watchlistItems - Array of watchlist items to scan
 * @param batchSize - Number of concurrent scans (default: 5 to avoid rate limits)
 * @returns Array of scan results
 */
export async function scanWatchlist(
  watchlistItems: WatchlistItem[],
  batchSize: number = 5
): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  // Process in batches to avoid overwhelming APIs
  for (let i = 0; i < watchlistItems.length; i += batchSize) {
    const batch = watchlistItems.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((item) => scanSymbol(item))
    );

    // Filter out null results (errors)
    const validResults = batchResults.filter(
      (result): result is ScanResult => result !== null
    );

    results.push(...validResults);
  }

  return results;
}

/**
 * Apply scan criteria to filter results
 *
 * @param results - Scan results to filter
 * @param criteria - Filter criteria
 * @returns Filtered scan results
 */
export function applyScanCriteria(
  results: ScanResult[],
  criteria: ScanCriteria
): ScanResult[] {
  return results.filter((result) => {
    // Filter by signal bias
    if (criteria.signalBias && result.signal.bias !== criteria.signalBias) {
      return false;
    }

    // Filter by patterns
    if (
      criteria.patterns &&
      criteria.patterns.length > 0 &&
      !criteria.patterns.includes(result.pattern.mainPattern)
    ) {
      return false;
    }

    // Filter by channel status
    if (
      criteria.channelStatus &&
      criteria.channelStatus.length > 0 &&
      (!result.channel.hasChannel ||
        !criteria.channelStatus.includes(result.channel.status))
    ) {
      return false;
    }

    // Filter by recommended actions
    if (
      criteria.recommendedActions &&
      criteria.recommendedActions.length > 0 &&
      !criteria.recommendedActions.includes(result.action.recommendation)
    ) {
      return false;
    }

    // Filter by minimum risk/reward
    if (criteria.minRiskReward && result.action.riskReward !== null) {
      if (result.action.riskReward < criteria.minRiskReward) {
        return false;
      }
    }

    // Filter by confidence levels
    if (
      criteria.confidenceLevels &&
      criteria.confidenceLevels.length > 0 &&
      !criteria.confidenceLevels.includes(result.action.confidence)
    ) {
      return false;
    }

    // Filter by minimum volume
    if (criteria.minVolume && result.quote.volume) {
      if (result.quote.volume < criteria.minVolume) {
        return false;
      }
    }

    // Filter by price change range
    if (criteria.priceChangeMin !== undefined) {
      if (result.quote.changePercent < criteria.priceChangeMin) {
        return false;
      }
    }
    if (criteria.priceChangeMax !== undefined) {
      if (result.quote.changePercent > criteria.priceChangeMax) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort scan results by various criteria
 */
export function sortScanResults(
  results: ScanResult[],
  sortBy: 'riskReward' | 'confidence' | 'priceChange' | 'setup' = 'riskReward'
): ScanResult[] {
  const sorted = [...results];

  switch (sortBy) {
    case 'riskReward':
      sorted.sort((a, b) => {
        const aRR = a.action.riskReward || 0;
        const bRR = b.action.riskReward || 0;
        return bRR - aRR; // Descending
      });
      break;

    case 'confidence':
      const confidenceOrder = { HIGH: 3, MODERATE: 2, LOW: 1 };
      sorted.sort((a, b) => {
        return (
          confidenceOrder[b.action.confidence] -
          confidenceOrder[a.action.confidence]
        );
      });
      break;

    case 'priceChange':
      sorted.sort((a, b) => {
        return Math.abs(b.quote.changePercent) - Math.abs(a.quote.changePercent);
      });
      break;

    case 'setup':
      sorted.sort((a, b) => {
        return a.action.setup.localeCompare(b.action.setup);
      });
      break;
  }

  return sorted;
}

/**
 * Get quick stats from scan results
 */
export function getScanStats(results: ScanResult[]) {
  const total = results.length;
  const actionable = results.filter(
    (r) =>
      r.action.recommendation === 'BUY' ||
      r.action.recommendation === 'SELL' ||
      r.action.recommendation === 'SHORT' ||
      r.action.recommendation === 'BUY_BREAKOUT'
  ).length;

  const byAction = results.reduce((acc, r) => {
    const action = r.action.recommendation;
    acc[action] = (acc[action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byConfidence = results.reduce((acc, r) => {
    const conf = r.action.confidence;
    acc[conf] = (acc[conf] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgRiskReward =
    results
      .filter((r) => r.action.riskReward !== null)
      .reduce((sum, r) => sum + (r.action.riskReward || 0), 0) /
    results.filter((r) => r.action.riskReward !== null).length || 0;

  return {
    total,
    actionable,
    byAction,
    byConfidence,
    avgRiskReward: parseFloat(avgRiskReward.toFixed(2)),
  };
}
