/**
 * Paper Trading Utilities
 * Calculates position sizes and executes paper trades via Alpaca MCP
 */

export interface PositionSizeParams {
  accountEquity: number;
  riskPercent: number; // 1 = 1% of account
  entryPrice: number;
  stopPrice: number;
}

export interface PaperTradeParams {
  symbol: string;
  recommendationType: 'long' | 'short';
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  accountEquity: number;
  riskPercent?: number; // Default 1%
}

/**
 * Calculate number of shares to buy based on risk management rules
 * Formula: Position Size = (Account Equity × Risk %) / (Entry - Stop)
 */
export function calculatePositionSize(params: PositionSizeParams): number {
  const { accountEquity, riskPercent, entryPrice, stopPrice } = params;

  // Calculate dollar risk per share
  const riskPerShare = Math.abs(entryPrice - stopPrice);

  if (riskPerShare === 0) {
    throw new Error('Entry and stop prices cannot be the same');
  }

  // Calculate dollar amount willing to risk
  const dollarRisk = accountEquity * (riskPercent / 100);

  // Calculate position size
  const positionSize = Math.floor(dollarRisk / riskPerShare);

  // Ensure at least 1 share
  return Math.max(1, positionSize);
}

/**
 * Validate trade parameters before placing order
 */
export function validateTrade(params: PaperTradeParams): {
  valid: boolean;
  error?: string;
  shares?: number;
  costBasis?: number;
  dollarRisk?: number;
} {
  const {
    symbol,
    recommendationType,
    entryPrice,
    stopPrice,
    targetPrice,
    accountEquity,
    riskPercent = 1,
  } = params;

  // Basic validations
  if (!symbol || symbol.trim() === '') {
    return { valid: false, error: 'Symbol is required' };
  }

  if (entryPrice <= 0 || stopPrice <= 0 || targetPrice <= 0) {
    return { valid: false, error: 'All prices must be greater than 0' };
  }

  if (accountEquity <= 0) {
    return { valid: false, error: 'Account equity must be greater than 0' };
  }

  // Validate price relationships for long trades
  if (recommendationType === 'long') {
    if (stopPrice >= entryPrice) {
      return { valid: false, error: 'Stop loss must be below entry for long trades' };
    }
    if (targetPrice <= entryPrice) {
      return { valid: false, error: 'Target must be above entry for long trades' };
    }
  }

  // Validate price relationships for short trades
  if (recommendationType === 'short') {
    if (stopPrice <= entryPrice) {
      return { valid: false, error: 'Stop loss must be above entry for short trades' };
    }
    if (targetPrice >= entryPrice) {
      return { valid: false, error: 'Target must be below entry for short trades' };
    }
  }

  // Calculate position size
  let shares: number;
  try {
    shares = calculatePositionSize({
      accountEquity,
      riskPercent,
      entryPrice,
      stopPrice,
    });
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Position size calculation failed' };
  }

  // Calculate cost basis
  const costBasis = shares * entryPrice;

  // Check if we have enough buying power (2x leverage for margin accounts)
  const maxBuyingPower = accountEquity * 2;
  if (costBasis > maxBuyingPower) {
    return {
      valid: false,
      error: `Insufficient buying power. Trade requires $${costBasis.toFixed(2)}, available: $${maxBuyingPower.toFixed(2)}`
    };
  }

  // Calculate dollar risk
  const dollarRisk = shares * Math.abs(entryPrice - stopPrice);

  return {
    valid: true,
    shares,
    costBasis,
    dollarRisk,
  };
}

/**
 * Format trade summary for display
 */
export function formatTradeSummary(params: {
  symbol: string;
  shares: number;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  costBasis: number;
  dollarRisk: number;
  riskPercent: number;
}): string {
  const { symbol, shares, entryPrice, stopPrice, targetPrice, costBasis, dollarRisk, riskPercent } = params;

  const potentialGain = shares * Math.abs(targetPrice - entryPrice);
  const riskRewardRatio = potentialGain / dollarRisk;

  return `
📊 Paper Trade Summary

Symbol: ${symbol}
Shares: ${shares}
Entry: $${entryPrice.toFixed(2)}
Stop: $${stopPrice.toFixed(2)}
Target: $${targetPrice.toFixed(2)}

Cost Basis: $${costBasis.toFixed(2)}
Dollar Risk: $${dollarRisk.toFixed(2)} (${riskPercent}% of account)
Potential Gain: $${potentialGain.toFixed(2)}
Risk/Reward: ${riskRewardRatio.toFixed(2)}:1
  `.trim();
}
