export type TradeInputs = {
  amount: number;        // dollars to deploy
  entry: number;         // entry price
  target?: number;       // single target price
  targets?: { price: number; weight: number }[]; // weights sum to 1
  stop: number;          // stop price
  feePct: number;        // per side, e.g. 0.1% -> 0.001
  slipPct: number;       // per side, e.g. 0.05% -> 0.0005
};

export type TradeMetrics = {
  qty: number;
  costWithFees: number;
  targetGrossPnL: number;
  targetFees: number;
  targetNetPnL: number;
  targetROI: number;     // %
  stopGrossPnL: number;
  stopFees: number;
  stopNetPnL: number;
  stopROI: number;       // %
  rr: number;            // risk/reward (price-based, intuitive)
  breakevenPrice: number;
};

function sideCost(price: number, qty: number, f: number) {
  return qty * price * f;
}

export function calculateTradeMetrics(i: TradeInputs): TradeMetrics {
  const f = i.feePct + i.slipPct;
  const effectiveEntry = i.entry * (1 + f);
  const qty = i.amount / effectiveEntry;

  const exitPrice = i.targets?.length
    ? i.targets.reduce((acc, t) => acc + t.price * t.weight, 0)
    : (i.target ?? i.entry);

  const targetGrossPnL = qty * (exitPrice - i.entry);
  const stopGrossPnL   = qty * (i.stop - i.entry);

  const buyCosts  = sideCost(i.entry, qty, f);
  const sellCosts = sideCost(exitPrice, qty, f);
  const stopSellCosts = sideCost(i.stop, qty, f);

  const targetNetPnL = targetGrossPnL - buyCosts - sellCosts;
  const stopNetPnL   = stopGrossPnL   - buyCosts - stopSellCosts;

  const targetROI = (targetNetPnL / i.amount) * 100;
  const stopROI   = (stopNetPnL   / i.amount) * 100;

  const reward = Math.max(exitPrice - i.entry, 0);
  const risk   = Math.max(i.entry - i.stop, 0);
  const rr = risk > 0 ? +(reward / risk).toFixed(2) : Infinity;

  const breakevenPrice = i.entry * (1 + f) / (1 - f);

  return {
    qty,
    costWithFees: i.amount,
    targetGrossPnL,
    targetFees: buyCosts + sellCosts,
    targetNetPnL,
    targetROI,
    stopGrossPnL,
    stopFees: buyCosts + stopSellCosts,
    stopNetPnL,
    stopROI,
    rr,
    breakevenPrice
  };
}
