import React from 'react';
import type { UserConfig } from '@/types';

type Props = {
  value: UserConfig;
  onChange: (v: UserConfig) => void;
};

export const StrategyControls: React.FC<Props> = ({ value, onChange }) => {
  const update = (patch: Partial<UserConfig>) => onChange({ ...value, ...patch });

  return (
    <div className="strategy-controls">
      <fieldset>
        <legend>Strategy</legend>
        {['Conservative','Swing','Aggressive'].map(s => (
          <label key={s} style={{marginRight:12}}>
            <input
              type="radio"
              name="strategy"
              value={s}
              checked={value.strategy === s}
              onChange={() => update({ strategy: s as UserConfig['strategy'] })}
            />
            {' '}{s}
          </label>
        ))}
      </fieldset>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:12}}>
        <label>Risk level: {value.riskLevel}
          <input type="range" min={1} max={10} value={value.riskLevel}
            onChange={e=>update({riskLevel: Number(e.target.value)})} />
        </label>

        <label>Target profit %: {value.targetProfitPct}
          <input type="range" min={1} max={20} value={value.targetProfitPct}
            onChange={e=>update({targetProfitPct: Number(e.target.value)})} />
        </label>

        <label>Stop min %: {value.stopMinPct}
          <input type="range" min={0.5} max={6} step={0.1} value={value.stopMinPct}
            onChange={e=>update({stopMinPct: Number(e.target.value)})} />
        </label>

        <label>Stop max %: {value.stopMaxPct}
          <input type="range" min={0.8} max={8} step={0.1} value={value.stopMaxPct}
            onChange={e=>update({stopMaxPct: Number(e.target.value)})} />
        </label>

        <label>Confidence ≥: {value.confidenceThreshold.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={value.confidenceThreshold}
            onChange={e=>update({confidenceThreshold: Number(e.target.value)})} />
        </label>

        <label>Min R/R: {value.minRR.toFixed(2)}
          <input type="range" min={0.8} max={3} step={0.1} value={value.minRR}
            onChange={e=>update({minRR: Number(e.target.value)})} />
        </label>

        {value.strategy !== 'Aggressive' ? (
          <label>Timeframe (days): {value.timeframeDays}
            <input type="range" min={1} max={14} value={value.timeframeDays ?? 3}
              onChange={e=>update({timeframeDays: Number(e.target.value), timeframeHours: undefined})} />
          </label>
        ) : (
          <>
            <label>Timeframe (hours): {value.timeframeHours}
              <input type="range" min={1} max={48} value={value.timeframeHours ?? 8}
                onChange={e=>update({timeframeHours: Number(e.target.value), timeframeDays: undefined})} />
            </label>
            <label>Trail start %: {value.trailStartPct}
              <input type="range" min={1} max={15} value={value.trailStartPct ?? 5}
                onChange={e=>update({trailStartPct: Number(e.target.value)})} />
            </label>
          </>
        )}
      </div>
    </div>
  );
};
