'use client';

import { useEffect, useRef, memo } from 'react';

export interface TradingViewMiniChartProps {
  symbol: string;
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
  interval?: string;
  dateRange?: string;
  colorTheme?: 'light' | 'dark';
  trendLineColor?: string;
  underLineColor?: string;
  underLineBottomColor?: string;
  isTransparent?: boolean;
  autosize?: boolean;
  largeChartUrl?: string;
  className?: string;
}

/**
 * TradingView Mini Chart Widget
 *
 * Compact sparkline-style chart for card/list views
 * Responsive and mobile-friendly
 *
 * @example
 * <TradingViewMiniChart symbol="NASDAQ:AAPL" height={150} />
 */
function TradingViewMiniChart({
  symbol,
  width = '100%',
  height = 150,
  theme = 'light',
  interval = 'D',
  dateRange = '12M',
  colorTheme = 'light',
  trendLineColor = 'rgba(41, 98, 255, 1)',
  underLineColor = 'rgba(41, 98, 255, 0.3)',
  underLineBottomColor = 'rgba(41, 98, 255, 0)',
  isTransparent = false,
  autosize = false,
  largeChartUrl,
  className = '',
}: TradingViewMiniChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptAppended = useRef(false);

  useEffect(() => {
    if (scriptAppended.current) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: autosize ? '100%' : width,
      height: autosize ? '100%' : height,
      locale: 'en',
      dateRange: dateRange,
      colorTheme: colorTheme,
      trendLineColor: trendLineColor,
      underLineColor: underLineColor,
      underLineBottomColor: underLineBottomColor,
      isTransparent: isTransparent,
      autosize: autosize,
      largeChartUrl: largeChartUrl || '',
    });

    if (container.current) {
      container.current.appendChild(script);
      scriptAppended.current = true;
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [
    symbol,
    width,
    height,
    dateRange,
    colorTheme,
    trendLineColor,
    underLineColor,
    underLineBottomColor,
    isTransparent,
    autosize,
    largeChartUrl,
  ]);

  return (
    <div
      className={`tradingview-widget-container ${className}`}
      style={{ height: autosize ? '100%' : height, width: autosize ? '100%' : width }}
    >
      <div
        className="tradingview-widget-container__widget"
        ref={container}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

export default memo(TradingViewMiniChart);
