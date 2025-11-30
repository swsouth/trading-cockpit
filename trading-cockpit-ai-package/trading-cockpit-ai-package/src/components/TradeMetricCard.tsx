import React from 'react';
import type { TradeInputs } from '@/lib/calc';
import { calculateTradeMetrics } from '@/lib/calc';

type Props = {
  symbol: string;
  inputs: TradeInputs;
};

export const TradeMetricCard: React.FC<Props> = ({ symbol, inputs }) => {
  const m = calculateTradeMetrics(inputs);
  const fmt = (n: number) => (Math.abs(n) >= 1 ? n.toFixed(2) : n.toFixed(4));

  return (
    <div className="trade-card" style={{border:'1px solid #ddd', borderRadius:8, padding:12}}>
      <strong>{symbol}</strong>
      <div>Investing ${fmt(inputs.amount)} @ ${fmt(inputs.entry)} → Qty {fmt(m.qty)}</div>
      <div>Target: Net ${fmt(m.targetNetPnL)} ({fmt(m.targetROI)}%) • Stop: Net ${fmt(m.stopNetPnL)} ({fmt(m.stopROI)}%)</div>
      <div>R/R: {m.rr} • Breakeven: ${fmt(m.breakevenPrice)}</div>
      <details style={{marginTop:6}}>
        <summary>Details</summary>
        <div>Gross @ Target: ${fmt(m.targetGrossPnL)} | Fees: ${fmt(m.targetFees)}</div>
        <div>Gross @ Stop: ${fmt(m.stopGrossPnL)} | Fees: ${fmt(m.stopFees)}</div>
      </details>
    </div>
  );
};
