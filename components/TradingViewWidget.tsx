'use client';

import { useEffect, useRef, memo } from 'react';

// Declare TradingView global
declare global {
  interface Window {
    TradingView: any;
  }
}

export interface TradingViewWidgetProps {
  symbol: string;
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
  interval?: string;
  timezone?: string;
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
  autosize?: boolean;
  studies?: string[];
  show_popup_button?: boolean;
  popup_width?: string;
  popup_height?: string;
  hide_side_toolbar?: boolean;
  hide_top_toolbar?: boolean;
  hide_legend?: boolean;
  save_image?: boolean;
  className?: string;
}

/**
 * TradingView Advanced Chart Widget
 *
 * Embeds the full TradingView advanced chart with all features
 * Responsive and mobile-friendly
 *
 * @example
 * <TradingViewWidget symbol="NASDAQ:AAPL" />
 *
 * @example
 * <TradingViewWidget
 *   symbol="NASDAQ:AAPL"
 *   interval="D"
 *   theme="dark"
 *   height={500}
 * />
 */
function TradingViewWidget({
  symbol,
  width = '100%',
  height = 500,
  theme = 'light',
  interval = 'D',
  timezone = 'Etc/UTC',
  style = '1',
  locale = 'en',
  toolbar_bg = '#f1f3f6',
  enable_publishing = false,
  allow_symbol_change = true,
  container_id,
  autosize = false,
  studies = [],
  show_popup_button = true,
  popup_width = '1000',
  popup_height = '650',
  hide_side_toolbar = false,
  hide_top_toolbar = false,
  hide_legend = false,
  save_image = true,
  className = '',
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptAppended = useRef(false);

  useEffect(() => {
    // Only append script once
    if (scriptAppended.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (container.current && typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          width: autosize ? '100%' : width,
          height: autosize ? '100%' : height,
          symbol: symbol,
          interval: interval,
          timezone: timezone,
          theme: theme,
          style: style,
          locale: locale,
          toolbar_bg: toolbar_bg,
          enable_publishing: enable_publishing,
          allow_symbol_change: allow_symbol_change,
          container_id: container_id || container.current.id,
          autosize: autosize,
          studies: studies,
          show_popup_button: show_popup_button,
          popup_width: popup_width,
          popup_height: popup_height,
          hide_side_toolbar: hide_side_toolbar,
          hide_top_toolbar: hide_top_toolbar,
          hide_legend: hide_legend,
          save_image: save_image,
        });
      }
    };

    document.head.appendChild(script);
    scriptAppended.current = true;

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [
    symbol,
    width,
    height,
    theme,
    interval,
    timezone,
    style,
    locale,
    toolbar_bg,
    enable_publishing,
    allow_symbol_change,
    container_id,
    autosize,
    studies,
    show_popup_button,
    popup_width,
    popup_height,
    hide_side_toolbar,
    hide_top_toolbar,
    hide_legend,
    save_image,
  ]);

  return (
    <div
      className={`tradingview-widget-container ${className}`}
      style={{ height: autosize ? '100%' : height }}
    >
      <div
        id={container_id || `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`}
        ref={container}
        style={{ height: '100%', width: '100%' }}
      />
      <div className="tradingview-widget-copyright text-xs text-gray-500 mt-1">
        <a
          href={`https://www.tradingview.com/symbols/${symbol}/`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="blue-text">Track {symbol} on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
