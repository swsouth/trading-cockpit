export type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type Quote = {
  symbol: string;
  price: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume?: number;
  timestamp: string;
};

export type ChannelStatus =
  | 'near_support'
  | 'near_resistance'
  | 'inside'
  | 'broken_out';

export type DetectedPattern =
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'hammer'
  | 'shooting_star'
  | 'doji'
  | 'piercing_line'
  | 'dark_cloud_cover'
  | 'none';

export type ChannelDetectionResult = {
  hasChannel: boolean;
  support: number;
  resistance: number;
  mid: number;
  widthPct: number;
  supportTouches: number;
  resistanceTouches: number;
  outOfBandPct: number;
  status: ChannelStatus;
};

export type PatternDetectionResult = {
  mainPattern: DetectedPattern;
};

export type CombinedSignal = {
  bias: 'bullish' | 'bearish' | 'neutral' | 'conflicting';
  notes: string[];
  cautions: string[];
};

export type WatchlistItem = {
  id: string;
  user_id: string;
  symbol: string;
  display_name: string | null;
  asset_type: 'stock' | 'crypto';
  created_at: string;
};

export type TickerNote = {
  id: string;
  user_id: string;
  symbol: string;
  title: string | null;
  body: string | null;
  timeframe: string | null;
  created_at: string;
  updated_at: string;
};

export type Upload = {
  id: string;
  user_id: string;
  storage_path: string;
  filename: string;
  symbols: string[];
  tags: string[];
  note: string | null;
  uploaded_at: string;
};

export type PriceAlert = {
  id: string;
  user_id: string;
  symbol: string;
  target_price: number;
  direction: 'above' | 'below';
  is_active: boolean;
  created_at: string;
  triggered_at: string | null;
};

export type CombinedSignalRecord = {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  detected_at: string;
  bias: 'bullish' | 'bearish' | 'neutral' | 'conflicting';
  channel_status: ChannelStatus;
  main_pattern: string | null;
  notes: string[];
  cautions: string[];
};

export type Profile = {
  id: string;
  created_at: string;
  display_name: string | null;
  settings: Record<string, any>;
};
