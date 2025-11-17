'use client';

import { useMemo } from 'react';
import { Candle, ChannelDetectionResult } from '@/lib/types';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CandlestickChartProps {
  candles: Candle[];
  channel: ChannelDetectionResult | null;
}

export function CandlestickChart({ candles, channel }: CandlestickChartProps) {
  const chartData = useMemo(() => {
    return candles.map((candle) => ({
      date: new Date(candle.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      high: candle.high,
      low: candle.low,
      open: candle.open,
      close: candle.close,
    }));
  }, [candles]);

  const yDomain = useMemo(() => {
    const allValues = candles.flatMap((c) => [c.high, c.low]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [candles]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#cbd5e1' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#cbd5e1' }}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload;
              return (
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                  <p className="text-sm font-medium text-slate-900 mb-2">{data.date}</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600">
                      Open: <span className="font-medium text-slate-900">${data.open.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-600">
                      High: <span className="font-medium text-slate-900">${data.high.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-600">
                      Low: <span className="font-medium text-slate-900">${data.low.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-600">
                      Close: <span className="font-medium text-slate-900">${data.close.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />

        {channel && channel.hasChannel && (
          <>
            <ReferenceLine
              y={channel.support}
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Support: $${channel.support.toFixed(2)}`,
                position: 'right',
                fill: '#10b981',
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={channel.resistance}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Resistance: $${channel.resistance.toFixed(2)}`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 12,
              }}
            />
          </>
        )}

        <Area
          type="monotone"
          dataKey="high"
          stroke="none"
          fill="#e2e8f0"
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="low"
          stroke="none"
          fill="#ffffff"
          fillOpacity={1}
        />
        <Line
          type="monotone"
          dataKey="close"
          stroke="#1e293b"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
