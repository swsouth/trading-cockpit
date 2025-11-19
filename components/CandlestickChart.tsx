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
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={{ stroke: '#cbd5e1' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={{ stroke: '#cbd5e1' }}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload;
              const isGreen = data.close >= data.open;
              return (
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                  <p className="text-sm font-medium text-slate-900 mb-2">{data.date}</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600">
                      Open: <span className="font-medium text-slate-900">${data.open.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-600">
                      High: <span className="font-medium text-green-600">${data.high.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-600">
                      Low: <span className="font-medium text-red-600">${data.low.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-600">
                      Close: <span className={`font-medium ${isGreen ? 'text-green-600' : 'text-red-600'}`}>
                        ${data.close.toFixed(2)}
                      </span>
                    </p>
                    <p className={`text-xs font-medium mt-1 ${isGreen ? 'text-green-600' : 'text-red-600'}`}>
                      {isGreen ? '▲' : '▼'} {Math.abs(((data.close - data.open) / data.open) * 100).toFixed(2)}%
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
              strokeWidth={3}
              strokeDasharray="8 4"
              label={{
                value: `Support: $${channel.support.toFixed(2)}`,
                position: 'insideTopRight',
                fill: '#10b981',
                fontSize: 13,
                fontWeight: 600,
              }}
            />
            <ReferenceLine
              y={channel.resistance}
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="8 4"
              label={{
                value: `Resistance: $${channel.resistance.toFixed(2)}`,
                position: 'insideBottomRight',
                fill: '#ef4444',
                fontSize: 13,
                fontWeight: 600,
              }}
            />
          </>
        )}

        {/* High-Low range as light area */}
        <Area
          type="monotone"
          dataKey="high"
          stroke="none"
          fill="#cbd5e1"
          fillOpacity={0.2}
        />
        <Area
          type="monotone"
          dataKey="low"
          stroke="none"
          fill="#ffffff"
          fillOpacity={1}
        />

        {/* Close price line - prominent */}
        <Line
          type="monotone"
          dataKey="close"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ fill: '#3b82f6', r: 3 }}
          activeDot={{ r: 5 }}
        />

        {/* Open price line - subtle */}
        <Line
          type="monotone"
          dataKey="open"
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
