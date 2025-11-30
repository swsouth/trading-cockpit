export type Strategy = 'Conservative' | 'Swing' | 'Aggressive';

export type UserConfig = {
  strategy: Strategy;
  riskLevel: number; // 1-10
  targetProfitPct: number;
  stopMinPct: number;
  stopMaxPct: number;
  timeframeDays?: number;
  timeframeHours?: number;
  confidenceThreshold: number; // 0-1
  minRR: number;
  trailStartPct?: number;
};
