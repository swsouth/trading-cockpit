/**
 * Absorption Detection Module
 *
 * Detects when order flow (action) doesn't create expected price movement (reaction).
 * This reveals hidden institutional buying/selling before price moves.
 *
 * Based on Jay Ortani's strategy: "When I see 50K shares sold and price doesn't move,
 * I know institutions are absorbing that supply."
 */

import { Candle } from '../types';
import { VolumeAnalysis } from '../scoring/types';
import { AbsorptionPattern, OrderFlowConfig, DEFAULT_ORDER_FLOW_CONFIG, TimeAndSalesData } from './types';

/**
 * Detect absorption patterns in recent candles
 *
 * Absorption occurs when:
 * 1. Volume > 2x average (high action)
 * 2. Price change < 0.5% (low reaction)
 * 3. Small candle body relative to range (indecision)
 *
 * @param candles - Price candles
 * @param volume - Volume analysis data
 * @param config - Order flow configuration
 * @returns Absorption pattern detection result
 */
export function detectAbsorption(
  candles: Candle[],
  volume: VolumeAnalysis,
  config: OrderFlowConfig = DEFAULT_ORDER_FLOW_CONFIG
): AbsorptionPattern {
  if (candles.length < 5) {
    return createNoAbsorptionPattern();
  }

  // Look at last 5 candles for absorption pattern
  const recentCandles = candles.slice(-5);
  const avgVolume = volume.avgVolume;

  for (let i = recentCandles.length - 1; i >= 0; i--) {
    const candle = recentCandles[i];
    const volumeRatio = candle.volume / avgVolume;
    const bodySize = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    const priceChangePct = bodySize / candle.open;

    // Absorption criteria
    const hasHighVolume = volumeRatio > config.absorptionVolumeMultiple;
    const hasLowPriceChange = priceChangePct < config.absorptionPriceThreshold;

    if (hasHighVolume && hasLowPriceChange) {
      const bodyRatio = range > 0 ? bodySize / range : 0;

      // Buying absorption: High volume, closes near high despite selling pressure
      if (candle.close > candle.open && bodyRatio < 0.4) {
        return {
          type: 'buying',
          confidence: Math.min(100, volumeRatio * 30),
          description: `Heavy selling absorbed by buyers. ${formatVolume(candle.volume)} shares traded, price only ${(priceChangePct * 100).toFixed(2)}% change`,
          volumeRatio,
          priceReaction: priceChangePct,
          detectionIndex: candles.length - (recentCandles.length - i),
          largeOrdersInvolved: 0, // Will be populated if we have time and sales data
        };
      }

      // Selling absorption: High volume, closes near low despite buying pressure
      if (candle.close < candle.open && bodyRatio < 0.4) {
        return {
          type: 'selling',
          confidence: Math.min(100, volumeRatio * 30),
          description: `Heavy buying absorbed by sellers. ${formatVolume(candle.volume)} shares traded, price only ${(priceChangePct * 100).toFixed(2)}% change`,
          volumeRatio,
          priceReaction: priceChangePct,
          detectionIndex: candles.length - (recentCandles.length - i),
          largeOrdersInvolved: 0,
        };
      }

      // Neutral absorption: Very high volume but essentially no price movement
      if (bodyRatio < 0.2 && volumeRatio > config.absorptionVolumeMultiple * 1.5) {
        // Determine type based on where price is in range
        const pricePosition = (candle.close - candle.low) / range;
        const absorptionType = pricePosition > 0.5 ? 'buying' : 'selling';

        return {
          type: absorptionType,
          confidence: Math.min(100, volumeRatio * 25),
          description: `Massive absorption detected. ${formatVolume(candle.volume)} shares (${volumeRatio.toFixed(1)}x avg), price nearly flat`,
          volumeRatio,
          priceReaction: priceChangePct,
          detectionIndex: candles.length - (recentCandles.length - i),
          largeOrdersInvolved: 0,
        };
      }
    }
  }

  return createNoAbsorptionPattern();
}

/**
 * Detect absorption from time and sales data (more precise)
 *
 * Uses actual trade-by-trade data to detect absorption more accurately
 * than candle-based analysis.
 *
 * @param timeAndSales - Recent trades with bid/ask flags
 * @param config - Order flow configuration
 * @returns Absorption pattern detection
 */
export function detectAbsorptionFromTape(
  timeAndSales: TimeAndSalesData[],
  config: OrderFlowConfig = DEFAULT_ORDER_FLOW_CONFIG
): AbsorptionPattern {
  if (timeAndSales.length < 20) {
    return createNoAbsorptionPattern();
  }

  // Analyze last 20 trades (or timeWindow seconds)
  const recentTrades = timeAndSales.slice(-20);
  const totalVolume = recentTrades.reduce((sum, t) => sum + t.size, 0);
  const avgTradeSize = totalVolume / recentTrades.length;

  // Calculate price movement
  const firstPrice = recentTrades[0].price;
  const lastPrice = recentTrades[recentTrades.length - 1].price;
  const priceChange = Math.abs(lastPrice - firstPrice);
  const priceChangePct = priceChange / firstPrice;

  // Count large orders
  const largeOrders = recentTrades.filter(t => t.size >= config.largeOrderThreshold);
  const largeOrderVolume = largeOrders.reduce((sum, t) => sum + t.size, 0);

  // Calculate bid/ask pressure
  const bidHits = recentTrades.filter(t => t.side === 'bid').reduce((sum, t) => sum + t.size, 0);
  const askHits = recentTrades.filter(t => t.side === 'ask').reduce((sum, t) => sum + t.size, 0);

  // Absorption detection
  const hasHighVolume = largeOrderVolume > avgTradeSize * 10; // Large orders present
  const hasLowPriceChange = priceChangePct < config.absorptionPriceThreshold;

  if (hasHighVolume && hasLowPriceChange) {
    // Buying absorption: Heavy selling but price doesn't drop
    if (bidHits > askHits * 1.5) {
      return {
        type: 'buying',
        confidence: Math.min(100, (largeOrderVolume / (avgTradeSize * 10)) * 40),
        description: `${largeOrders.length} large sell orders absorbed. ${formatVolume(bidHits)} shares sold, price held`,
        volumeRatio: largeOrderVolume / avgTradeSize,
        priceReaction: priceChangePct,
        detectionIndex: timeAndSales.length - 1,
        largeOrdersInvolved: largeOrders.length,
      };
    }

    // Selling absorption: Heavy buying but price doesn't rise
    if (askHits > bidHits * 1.5) {
      return {
        type: 'selling',
        confidence: Math.min(100, (largeOrderVolume / (avgTradeSize * 10)) * 40),
        description: `${largeOrders.length} large buy orders absorbed. ${formatVolume(askHits)} shares bought, price didn't rally`,
        volumeRatio: largeOrderVolume / avgTradeSize,
        priceReaction: priceChangePct,
        detectionIndex: timeAndSales.length - 1,
        largeOrdersInvolved: largeOrders.length,
      };
    }
  }

  return createNoAbsorptionPattern();
}

/**
 * Calculate absorption score for opportunity scoring
 *
 * Used in lib/scoring/index.ts to add absorption component (+10 pts)
 *
 * @param absorption - Detected absorption pattern
 * @returns Score 0-10
 */
export function scoreAbsorption(absorption: AbsorptionPattern): number {
  if (absorption.type === 'none') return 0;

  // High confidence absorption adds up to 10 points
  return Math.min(10, (absorption.confidence / 100) * 10);
}

/**
 * Helper: Create "no absorption" pattern
 */
function createNoAbsorptionPattern(): AbsorptionPattern {
  return {
    type: 'none',
    confidence: 0,
    description: 'No absorption pattern detected',
    volumeRatio: 1,
    priceReaction: 0,
    detectionIndex: -1,
    largeOrdersInvolved: 0,
  };
}

/**
 * Helper: Format volume with K/M suffix
 */
function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
}
