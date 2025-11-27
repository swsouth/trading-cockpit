/**
 * Order Flow Analysis Types
 *
 * Based on Jay Ortani's "Market DNA" strategy - focusing on actual buyers/sellers
 * rather than lagging indicators.
 */

/**
 * Time and Sales Data (Tape Reading)
 *
 * Represents individual trades with bid/ask side identification
 */
export interface TimeAndSalesData {
  timestamp: Date;
  price: number;
  size: number;
  side: 'bid' | 'ask';  // Which side was hit (bid = seller initiated, ask = buyer initiated)
  aggressive: boolean;   // Market order (true) vs limit order (false)
}

/**
 * Level 2 Order Book
 *
 * Real-time market depth showing orders at each price level
 */
export interface Level2OrderBook {
  bids: OrderBookLevel[];  // Buy orders (descending by price)
  asks: OrderBookLevel[];  // Sell orders (ascending by price)
  timestamp: Date;
}

export interface OrderBookLevel {
  price: number;
  size: number;       // Total shares at this price
  orderCount: number; // Number of orders (helps identify spoofing)
}

/**
 * Order Flow Metrics
 *
 * Comprehensive order flow analysis for a stock
 */
export interface OrderFlowMetrics {
  // Bid/Ask Pressure
  bidAskRatio: number;           // % of orders hitting bid vs ask (0-100, >50 = buying pressure)
  largeOrderImbalance: number;   // Net large orders (positive = buying, negative = selling)

  // Order Characteristics
  aggressiveBuyers: number;      // Count of market orders hitting ask
  aggressiveSellers: number;     // Count of market orders hitting bid
  avgBuySize: number;            // Average size of buy orders
  avgSellSize: number;           // Average size of sell orders

  // Absorption Detection
  absorptionScore: number;       // 0-100 (high = strong absorption detected)
  absorptionType: 'buying' | 'selling' | 'none';

  // Large Order Tracking
  largeOrders: LargeOrder[];     // Recent large orders (>threshold)

  // Raw Data
  timeAndSales: TimeAndSalesData[]; // Recent trades
  level2: Level2OrderBook;       // Current order book
}

/**
 * Large Order Tracking
 *
 * Tracks institutional-size orders for absorption detection
 */
export interface LargeOrder {
  timestamp: Date;
  price: number;
  size: number;
  side: 'bid' | 'ask';
  priceImpact: number;  // How much price moved after this order (%)
  absorbed: boolean;     // Did price absorb this order without significant movement?
}

/**
 * Absorption Pattern
 *
 * Detects when order flow (action) doesn't create expected price movement (reaction)
 */
export interface AbsorptionPattern {
  type: 'buying' | 'selling' | 'none';
  confidence: number;  // 0-100
  description: string;
  volumeRatio: number;  // How much volume vs expected
  priceReaction: number;  // How little price moved (%)
  detectionIndex: number;  // Which candle detected it
  largeOrdersInvolved: number;  // Count of large orders during absorption
}

/**
 * Order Flow Configuration
 *
 * Configurable thresholds for order flow analysis
 */
export interface OrderFlowConfig {
  largeOrderThreshold: number;    // Minimum shares to be considered "large"
  absorptionVolumeMultiple: number; // Volume must be >Nx average for absorption
  absorptionPriceThreshold: number; // Price change must be <X% for absorption
  timeWindowSeconds: number;      // How many seconds of tape to analyze
  level2Depth: number;            // How many levels deep to analyze in order book
}

/**
 * Default configuration for order flow analysis
 */
export const DEFAULT_ORDER_FLOW_CONFIG: OrderFlowConfig = {
  largeOrderThreshold: 5000,        // 5K shares = institutional
  absorptionVolumeMultiple: 2.0,    // 2x average volume
  absorptionPriceThreshold: 0.003,  // 0.3% price change
  timeWindowSeconds: 60,            // Last 60 seconds
  level2Depth: 10,                  // Top 10 levels each side
};
