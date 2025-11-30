// Paper Trading Types
export type PaperTradeStatus = 'open' | 'closed' | 'cancelled';

export type ExitReason = 'hit_target' | 'hit_stop' | 'manual_close' | 'expired' | 'cancelled';

export interface PaperTrade {
  id: string;
  user_id: string;
  recommendation_id: string | null;
  symbol: string;
  recommendation_type: 'long' | 'short';
  setup_type: string | null;
  candlestick_pattern: string | null;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  exit_price: number | null;
  shares: number;
  cost_basis: number;
  predicted_r_multiple: number;
  realized_r_multiple: number | null;
  dollar_risk: number;
  realized_pnl: number | null;
  alpaca_order_id: string | null;
  alpaca_stop_order_id: string | null;
  alpaca_target_order_id: string | null;
  status: PaperTradeStatus;
  exit_reason: ExitReason | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetrics {
  user_id: string;
  recommendation_type: 'long' | 'short' | null;
  setup_type: string | null;
  candlestick_pattern: string | null;
  total_trades: number;
  win_rate_percent: number;
  avg_r_multiple: number;
  avg_predicted_r_multiple: number;
  total_pnl: number;
  avg_pnl: number;
  best_trade_pnl: number;
  worst_trade_pnl: number;
  best_r_multiple: number;
  worst_r_multiple: number;
}

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

// Scanner Types
export type RecommendedAction =
  | 'BUY'
  | 'SELL'
  | 'SHORT'
  | 'BUY_BREAKOUT'
  | 'WAIT';

export type ConfidenceLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type TradingAction = {
  recommendation: RecommendedAction;
  entry: {
    type: 'market' | 'limit' | 'stop';
    price: number;
    range: { low: number; high: number };
  } | null;
  target: {
    primary: number;      // Conservative target
    secondary: number | null;  // Aggressive target
    rationale: string;
  } | null;
  stopLoss: {
    price: number;
    rationale: string;
  } | null;
  riskReward: number | null;
  confidence: ConfidenceLevel;
  reasoning: string[];
  cautions: string[];
  setup: string; // "Support Bounce", "Resistance Rejection", "Breakout", etc.
};

export type ScanResult = {
  watchlistItem: WatchlistItem;
  quote: Quote;
  channel: ChannelDetectionResult;
  pattern: PatternDetectionResult;
  signal: CombinedSignal;
  action: TradingAction;
  scannedAt: string;
};

export type ScanCriteria = {
  signalBias?: 'bullish' | 'bearish' | 'neutral';
  patterns?: DetectedPattern[];
  channelStatus?: ChannelStatus[];
  recommendedActions?: RecommendedAction[];
  minRiskReward?: number;
  confidenceLevels?: ConfidenceLevel[];
  minVolume?: number;
  priceChangeMin?: number;
  priceChangeMax?: number;
};

export type MarketOpportunity = {
  id: string;
  user_id: string | null; // Nullable for market-wide scans (future)
  symbol: string;
  scanned_at: string;

  // Price data
  price: number;
  change_percent: number | null;
  volume: number | null;

  // Technical analysis
  has_channel: boolean;
  channel_status: ChannelStatus | null;
  support: number | null;
  resistance: number | null;
  mid_channel: number | null;
  channel_width_pct: number | null;
  support_touches: number | null;
  resistance_touches: number | null;

  pattern: DetectedPattern | null;
  bias: 'bullish' | 'bearish' | 'neutral' | 'conflicting';
  notes: string[];
  cautions: string[];

  // Trading action
  recommended_action: RecommendedAction;
  entry_price: number | null;
  entry_range_low: number | null;
  entry_range_high: number | null;
  entry_type: 'market' | 'limit' | 'stop' | null;

  target_price_1: number | null;
  target_price_2: number | null;
  stop_loss: number | null;

  potential_gain_1_pct: number | null;
  potential_gain_2_pct: number | null;
  potential_loss_pct: number | null;

  risk_reward_ratio: number | null;

  confidence: ConfidenceLevel;
  confidence_score: number | null;
  reasoning: string[];

  setup: string | null;

  created_at: string;
};

export type TradeRecommendation = {
  id: string;
  symbol: string;
  scan_date: string;

  // Trade Details
  recommendation_type: 'long' | 'short';
  setup_type: string; // "Support Bounce", "Resistance Rejection", "Breakout", etc.
  timeframe: string;

  // Entry/Exit/Stop
  entry_price: number;
  target_price: number;
  stop_loss: number;

  // Risk/Reward Metrics
  risk_amount: number;
  reward_amount: number;
  risk_reward_ratio: number;

  // Scoring
  opportunity_score: number; // 0-100
  confidence_level: 'high' | 'medium' | 'low';

  // Technical Context
  current_price: number;
  channel_status: string | null;
  pattern_detected: string | null;
  volume_status: string | null;
  rsi: number | null;
  trend: string | null;

  // Fundamental Context
  market_cap: number | null;
  sector: string | null;

  // Rationale & Context
  rationale: string;
  technical_summary: string | null;

  // Tracking & Lifecycle
  is_active: boolean;
  outcome: 'hit_target' | 'hit_stop' | 'expired' | 'pending' | 'invalidated' | null;
  outcome_price: number | null;
  outcome_date: string | null;
  created_at: string;
  expires_at: string | null;
  invalidated_at: string | null;
  invalidation_reason: string | null;
};
