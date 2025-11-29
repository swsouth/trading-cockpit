/**
 * Live Quote Fetching
 * Gets current market price for position sizing validation
 */

export interface LiveQuote {
  symbol: string;
  price: number;
  timestamp: Date;
  source: 'alpaca' | 'mock';
}

export interface QuoteValidation {
  isValid: boolean;
  deviation: number;
  deviationPercent: number;
  warning?: string;
  currentPrice: number;
  scannerPrice: number;
}

/**
 * Fetch live quote for a symbol
 * In production, this would call Alpaca MCP: mcp__alpaca__get_stock_latest_quote
 * For now, returns mock data with realistic variation
 */
export async function fetchLiveQuote(symbol: string): Promise<LiveQuote> {
  try {
    // TODO: Implement Alpaca MCP call
    // const result = await mcp__alpaca__get_stock_latest_quote({ symbol });
    // return {
    //   symbol,
    //   price: (result.ask_price + result.bid_price) / 2,
    //   timestamp: new Date(result.timestamp),
    //   source: 'alpaca',
    // };

    // Mock implementation for development
    // Simulates realistic price movement since scanner ran
    const mockPrice = getMockCurrentPrice(symbol);

    return {
      symbol,
      price: mockPrice,
      timestamp: new Date(),
      source: 'mock',
    };
  } catch (error) {
    console.error(`❌ Failed to fetch live quote for ${symbol}:`, error);
    throw new Error(`Unable to fetch current price for ${symbol}`);
  }
}

/**
 * Validate scanner entry price against current market price
 */
export function validateEntryPrice(
  scannerEntryPrice: number,
  currentMarketPrice: number,
  recommendationType: 'long' | 'short',
  maxDeviationPercent: number = 5
): QuoteValidation {
  const deviation = currentMarketPrice - scannerEntryPrice;
  const deviationPercent = Math.abs((deviation / scannerEntryPrice) * 100);

  // For longs: Current price should be AT or BELOW scanner entry
  // For shorts: Current price should be AT or ABOVE scanner entry
  const isPriceActionable = recommendationType === 'long'
    ? currentMarketPrice <= scannerEntryPrice * 1.02  // Within 2% for longs
    : currentMarketPrice >= scannerEntryPrice * 0.98; // Within 2% for shorts

  let warning: string | undefined;

  if (deviationPercent > maxDeviationPercent) {
    // Price moved significantly
    warning = `Price moved ${deviationPercent.toFixed(1)}% since scanner ran. ` +
      `Scanner: $${scannerEntryPrice.toFixed(2)}, Current: $${currentMarketPrice.toFixed(2)}. ` +
      `Setup may no longer be valid.`;
  } else if (!isPriceActionable) {
    // Price moved past entry point
    if (recommendationType === 'long') {
      warning = `Stock is above scanner entry ($${currentMarketPrice.toFixed(2)} > $${scannerEntryPrice.toFixed(2)}). ` +
        `Entry opportunity may have passed. Consider waiting for pullback or using market order.`;
    } else {
      warning = `Stock is below scanner entry ($${currentMarketPrice.toFixed(2)} < $${scannerEntryPrice.toFixed(2)}). ` +
        `Entry opportunity may have passed. Consider waiting for bounce or using market order.`;
    }
  }

  return {
    isValid: deviationPercent <= maxDeviationPercent && isPriceActionable,
    deviation,
    deviationPercent,
    warning,
    currentPrice: currentMarketPrice,
    scannerPrice: scannerEntryPrice,
  };
}

/**
 * Mock current price for development
 * Simulates realistic price movement since scanner ran (±1-3%)
 */
function getMockCurrentPrice(symbol: string): number {
  // Use symbol hash to generate consistent but varied prices
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = hash % 100;

  // Base prices for common symbols
  const basePrices: Record<string, number> = {
    'AAPL': 150,
    'MSFT': 300,
    'GOOGL': 140,
    'TSLA': 200,
    'NVDA': 500,
    'META': 350,
    'AMZN': 130,
  };

  const basePrice = basePrices[symbol] || 100 + seed;

  // Simulate price movement: -3% to +3%
  const movementPercent = ((seed % 60) - 30) / 10; // -3 to +3
  const currentPrice = basePrice * (1 + movementPercent / 100);

  return Math.round(currentPrice * 100) / 100; // Round to 2 decimals
}

/**
 * Get recommended order type based on price action
 */
export function getRecommendedOrderType(
  scannerEntry: number,
  currentPrice: number,
  recommendationType: 'long' | 'short'
): {
  orderType: 'limit' | 'market' | 'stop-limit';
  limitPrice?: number;
  reasoning: string;
} {
  const deviation = Math.abs((currentPrice - scannerEntry) / scannerEntry) * 100;

  if (deviation < 1) {
    // Within 1% - use limit order at scanner entry
    return {
      orderType: 'limit',
      limitPrice: scannerEntry,
      reasoning: 'Price is near scanner entry level. Using limit order.',
    };
  } else if (deviation < 2) {
    // 1-2% away - still use limit but warn
    return {
      orderType: 'limit',
      limitPrice: scannerEntry,
      reasoning: 'Price moved slightly from entry. Limit order may take time to fill.',
    };
  } else {
    // >2% away - entry missed
    if (recommendationType === 'long') {
      if (currentPrice > scannerEntry) {
        return {
          orderType: 'market',
          reasoning: 'Stock broke above entry level. Consider market order or wait for pullback.',
        };
      }
    } else {
      if (currentPrice < scannerEntry) {
        return {
          orderType: 'market',
          reasoning: 'Stock broke below entry level. Consider market order or wait for bounce.',
        };
      }
    }

    return {
      orderType: 'limit',
      limitPrice: scannerEntry,
      reasoning: 'Price deviated significantly. Entry setup may no longer be valid.',
    };
  }
}
