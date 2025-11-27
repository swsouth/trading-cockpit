/**
 * Order Flow Analysis Module
 *
 * Main entry point for order flow analysis.
 * Calculates bid/ask pressure, large order imbalances, and absorption patterns.
 *
 * Based on Jay Ortani's "Market DNA" strategy:
 * "I don't use indicators because they're created by price action,
 * which is created by buyers and sellers. I go straight to the source."
 */

import {
  OrderFlowMetrics,
  TimeAndSalesData,
  Level2OrderBook,
  LargeOrder,
  OrderFlowConfig,
  DEFAULT_ORDER_FLOW_CONFIG,
} from './types';
import { detectAbsorption, detectAbsorptionFromTape } from './absorption';
import { Candle } from '../types';
import { VolumeAnalysis } from '../scoring/types';

/**
 * Calculate comprehensive order flow metrics
 *
 * @param level2Data - Level 2 order book (market depth)
 * @param timeAndSales - Recent trades with bid/ask flags
 * @param config - Order flow configuration
 * @returns Complete order flow analysis
 */
export function calculateOrderFlow(
  level2Data: Level2OrderBook,
  timeAndSales: TimeAndSalesData[],
  config: OrderFlowConfig = DEFAULT_ORDER_FLOW_CONFIG
): OrderFlowMetrics {
  // Calculate bid/ask ratio from time and sales
  const askHits = timeAndSales.filter(t => t.side === 'ask').length;
  const bidHits = timeAndSales.filter(t => t.side === 'bid').length;
  const totalHits = askHits + bidHits;
  const bidAskRatio = totalHits > 0 ? (bidHits / totalHits) * 100 : 50;

  // Calculate aggressive order counts
  const aggressiveBuyers = timeAndSales.filter(t => t.side === 'ask' && t.aggressive).length;
  const aggressiveSellers = timeAndSales.filter(t => t.side === 'bid' && t.aggressive).length;

  // Calculate average order sizes
  const buyOrders = timeAndSales.filter(t => t.side === 'ask');
  const sellOrders = timeAndSales.filter(t => t.side === 'bid');
  const avgBuySize = buyOrders.length > 0
    ? buyOrders.reduce((sum, t) => sum + t.size, 0) / buyOrders.length
    : 0;
  const avgSellSize = sellOrders.length > 0
    ? sellOrders.reduce((sum, t) => sum + t.size, 0) / sellOrders.length
    : 0;

  // Detect large orders
  const largeOrders = identifyLargeOrders(timeAndSales, config);

  // Calculate large order imbalance (net buying/selling pressure)
  const largeOrderImbalance = largeOrders.reduce((sum, order) => {
    return sum + (order.side === 'ask' ? order.size : -order.size);
  }, 0);

  // Detect absorption from tape
  const absorption = detectAbsorptionFromTape(timeAndSales, config);

  return {
    bidAskRatio,
    largeOrderImbalance,
    aggressiveBuyers,
    aggressiveSellers,
    avgBuySize,
    avgSellSize,
    absorptionScore: absorption.confidence,
    absorptionType: absorption.type,
    largeOrders,
    timeAndSales,
    level2: level2Data,
  };
}

/**
 * Calculate order flow score for opportunity scoring
 *
 * Used in lib/scoring/index.ts to add order flow component (+15 pts)
 *
 * @param metrics - Order flow metrics
 * @param setupType - Trade setup type (long/short)
 * @returns Score 0-15
 */
export function scoreOrderFlow(
  metrics: OrderFlowMetrics,
  setupType: 'long' | 'short'
): number {
  let score = 0;

  // Bid/ask ratio scoring (0-5 pts)
  if (setupType === 'long') {
    // For longs, prefer buying pressure (bidAskRatio < 50 means more ask hits = buying)
    if (metrics.bidAskRatio < 40) score += 5;  // Strong buying
    else if (metrics.bidAskRatio < 50) score += 3;  // Moderate buying
  } else {
    // For shorts, prefer selling pressure (bidAskRatio > 50 means more bid hits = selling)
    if (metrics.bidAskRatio > 60) score += 5;  // Strong selling
    else if (metrics.bidAskRatio > 50) score += 3;  // Moderate selling
  }

  // Large order imbalance (0-5 pts)
  const imbalanceThreshold = 10000; // 10K shares
  if (setupType === 'long' && metrics.largeOrderImbalance > imbalanceThreshold) {
    score += Math.min(5, (metrics.largeOrderImbalance / imbalanceThreshold) * 2.5);
  } else if (setupType === 'short' && metrics.largeOrderImbalance < -imbalanceThreshold) {
    score += Math.min(5, (Math.abs(metrics.largeOrderImbalance) / imbalanceThreshold) * 2.5);
  }

  // Absorption detection (0-5 pts)
  if (setupType === 'long' && metrics.absorptionType === 'buying') {
    score += (metrics.absorptionScore / 100) * 5;
  } else if (setupType === 'short' && metrics.absorptionType === 'selling') {
    score += (metrics.absorptionScore / 100) * 5;
  }

  return Math.min(15, Math.round(score));
}

/**
 * Identify large orders from time and sales data
 *
 * Large orders indicate institutional activity and potential absorption
 *
 * @param timeAndSales - Recent trades
 * @param config - Order flow configuration
 * @returns Array of large orders with price impact analysis
 */
export function identifyLargeOrders(
  timeAndSales: TimeAndSalesData[],
  config: OrderFlowConfig = DEFAULT_ORDER_FLOW_CONFIG
): LargeOrder[] {
  const largeOrders: LargeOrder[] = [];

  timeAndSales.forEach((trade, index) => {
    if (trade.size >= config.largeOrderThreshold) {
      // Calculate price impact (how much price moved after this order)
      let priceImpact = 0;
      let absorbed = false;

      if (index < timeAndSales.length - 5) {
        // Look at next 5 trades to measure impact
        const nextTrades = timeAndSales.slice(index + 1, index + 6);
        const priceAfter = nextTrades[nextTrades.length - 1].price;
        priceImpact = Math.abs(priceAfter - trade.price) / trade.price;

        // Absorbed if impact < 0.2% despite large size
        absorbed = priceImpact < 0.002;
      }

      largeOrders.push({
        timestamp: trade.timestamp,
        price: trade.price,
        size: trade.size,
        side: trade.side,
        priceImpact,
        absorbed,
      });
    }
  });

  return largeOrders;
}

/**
 * Analyze order book imbalance from Level 2 data
 *
 * Measures buying vs selling pressure in the order book
 *
 * @param level2 - Level 2 order book
 * @param depth - How many levels to analyze (default 5)
 * @returns Imbalance ratio (>1 = buying pressure, <1 = selling pressure)
 */
export function analyzeOrderBookImbalance(
  level2: Level2OrderBook,
  depth: number = 5
): number {
  const topBids = level2.bids.slice(0, depth);
  const topAsks = level2.asks.slice(0, depth);

  const bidSize = topBids.reduce((sum, level) => sum + level.size, 0);
  const askSize = topAsks.reduce((sum, level) => sum + level.size, 0);

  if (askSize === 0) return 2; // Max buying pressure
  return bidSize / askSize;
}

// Re-export types and utilities
export * from './types';
export * from './absorption';
