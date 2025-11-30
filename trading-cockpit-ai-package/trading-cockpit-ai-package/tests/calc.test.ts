import { describe, it, expect } from 'vitest';
import { calculateTradeMetrics } from '../src/lib/calc';

describe('calculateTradeMetrics', () => {
  it('computes ROI, RR and breakeven', () => {
    const m = calculateTradeMetrics({
      amount: 1000,
      entry: 10,
      target: 10.6,
      stop: 9.7,
      feePct: 0.001, // 0.1%
      slipPct: 0.0005 // 0.05%
    });
    expect(m.rr).toBeGreaterThan(1);
    expect(m.breakevenPrice).toBeGreaterThan(10);
  });
});
