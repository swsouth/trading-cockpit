'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CandlestickChart } from './CandlestickChart';
import { Candle, ChannelDetectionResult } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { getDailyOHLC } from '@/lib/marketData';
import { detectChannels } from '@/lib/analysis';

interface ChartModalProps {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChartModal({ symbol, isOpen, onClose }: ChartModalProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [channel, setChannel] = useState<ChannelDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && symbol) {
      fetchChartData();
    }
  }, [isOpen, symbol]);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch 60 days of OHLC data
      const ohlcData = await getDailyOHLC(symbol, 'auto');

      if (!ohlcData || ohlcData.length === 0) {
        throw new Error('No chart data available');
      }

      setCandles(ohlcData);

      // Detect channels
      const channelResult = detectChannels(ohlcData);
      setChannel(channelResult);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{symbol} - Price Chart</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-muted-foreground">Loading chart data...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-[400px] text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && candles.length > 0 && (
            <div className="space-y-4">
              {/* Chart Legend */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-600"></div>
                  <span>Close Price</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-slate-400" style={{ borderTop: '1px dashed' }}></div>
                  <span>Open Price</span>
                </div>
                {channel?.hasChannel && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-green-500" style={{ borderTop: '3px dashed' }}></div>
                      <span>Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '3px dashed' }}></div>
                      <span>Resistance</span>
                    </div>
                  </>
                )}
              </div>

              {/* Candlestick Chart */}
              <CandlestickChart candles={candles} channel={channel} />

              {/* Channel Info */}
              {channel?.hasChannel && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground">Support</div>
                    <div className="text-sm font-bold text-green-600">${channel.support.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Resistance</div>
                    <div className="text-sm font-bold text-red-600">${channel.resistance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Channel Width</div>
                    <div className="text-sm font-bold">{channel.channelWidth.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Position</div>
                    <div className="text-sm font-bold capitalize">
                      {channel.pricePosition.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
