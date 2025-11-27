import {
  Candle,
  ChannelDetectionResult,
  PatternDetectionResult,
  CombinedSignal,
  DetectedPattern,
  ChannelStatus,
} from './types';
import { calculateATR } from './scoring/indicators';

export function detectChannel(
  candles: Candle[],
  lookbackPeriod = 40
): ChannelDetectionResult {
  const recentCandles = candles.slice(-lookbackPeriod);
  const n = recentCandles.length;

  if (n < 10) {
    return {
      hasChannel: false,
      support: 0,
      resistance: 0,
      mid: 0,
      widthPct: 0,
      supportTouches: 0,
      resistanceTouches: 0,
      outOfBandPct: 0,
      status: 'inside',
    };
  }

  const closes = recentCandles.map((c) => c.close);
  const low = Math.min(...closes);
  const high = Math.max(...closes);
  const mid = (low + high) / 2;
  const width = high - low;
  const widthPct = width / mid;

  // Calculate ATR for volatility-aware thresholds
  const atr = calculateATR(recentCandles, 14);
  const currentPrice = recentCandles[recentCandles.length - 1].close;
  const atrPercent = atr / currentPrice;

  // ATR-normalized thresholds (replace fixed percentages)
  // Touch tolerance: 0.3x ATR (tighter for precise detection)
  // Near threshold: 0.5x ATR (where to consider "near" support/resistance)
  // Max channel width: 10x ATR (beyond this = too choppy)
  const touchTolerancePct = Math.max(0.3 * atrPercent, 0.005); // Min 0.5% for very low-vol stocks
  const nearThresholdPct = Math.max(0.5 * atrPercent, 0.01);   // Min 1% for very low-vol stocks
  const maxChannelPct = Math.min(10 * atrPercent, 0.25);       // Max 25% cap
  const minChannelPct = Math.max(2 * atrPercent, 0.02);        // Min 2% or 2x ATR

  if (widthPct < minChannelPct || widthPct > maxChannelPct) {
    return {
      hasChannel: false,
      support: low,
      resistance: high,
      mid,
      widthPct,
      supportTouches: 0,
      resistanceTouches: 0,
      outOfBandPct: 0,
      status: 'inside',
    };
  }

  const support = low;
  const resistance = high;

  let supportTouches = 0;
  let resistanceTouches = 0;
  let outOfBandCount = 0;

  for (const candle of recentCandles) {
    const { close } = candle;

    if (close <= support * (1 + touchTolerancePct)) {
      supportTouches++;
    }
    if (close >= resistance * (1 - touchTolerancePct)) {
      resistanceTouches++;
    }
    if (close < support * (1 - touchTolerancePct) || close > resistance * (1 + touchTolerancePct)) {
      outOfBandCount++;
    }
  }

  const outOfBandPct = outOfBandCount / n;

  // Relaxed from 2+2 to 1+1 touches for better detection rate
  // Relaxed out-of-band from 10% to 15% for more flexible channels
  if (supportTouches < 1 || resistanceTouches < 1 || outOfBandPct > 0.15) {
    return {
      hasChannel: false,
      support,
      resistance,
      mid,
      widthPct,
      supportTouches,
      resistanceTouches,
      outOfBandPct,
      status: 'inside',
    };
  }

  const lastClose = recentCandles[recentCandles.length - 1].close;
  let status: ChannelStatus = 'inside';

  // Use ATR-normalized thresholds for status determination
  if (lastClose < support * (1 - touchTolerancePct)) {
    status = 'broken_out';
  } else if (lastClose > resistance * (1 + touchTolerancePct)) {
    status = 'broken_out';
  } else if (lastClose <= support * (1 + nearThresholdPct)) {
    status = 'near_support';
  } else if (lastClose >= resistance * (1 - nearThresholdPct)) {
    status = 'near_resistance';
  } else {
    status = 'inside';
  }

  return {
    hasChannel: true,
    support,
    resistance,
    mid,
    widthPct,
    supportTouches,
    resistanceTouches,
    outOfBandPct,
    status,
  };
}

export function detectPatterns(candles: Candle[]): PatternDetectionResult {
  if (candles.length < 2) {
    return { mainPattern: 'none' };
  }

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const lastBody = Math.abs(last.close - last.open);
  const lastRange = last.high - last.low;
  const lastUpperShadow = last.high - Math.max(last.open, last.close);
  const lastLowerShadow = Math.min(last.open, last.close) - last.low;

  const prevBody = Math.abs(prev.close - prev.open);

  const isBullishCandle = (c: Candle) => c.close > c.open;
  const isBearishCandle = (c: Candle) => c.close < c.open;

  if (
    isBearishCandle(prev) &&
    isBullishCandle(last) &&
    last.open <= prev.close &&
    last.close >= prev.open &&
    lastBody > prevBody * 0.8
  ) {
    return { mainPattern: 'bullish_engulfing' };
  }

  if (
    isBullishCandle(prev) &&
    isBearishCandle(last) &&
    last.open >= prev.close &&
    last.close <= prev.open &&
    lastBody > prevBody * 0.8
  ) {
    return { mainPattern: 'bearish_engulfing' };
  }

  if (
    isBullishCandle(last) &&
    lastLowerShadow > lastBody * 2 &&
    lastUpperShadow < lastBody * 0.5 &&
    lastBody > lastRange * 0.2
  ) {
    return { mainPattern: 'hammer' };
  }

  if (
    isBearishCandle(last) &&
    lastUpperShadow > lastBody * 2 &&
    lastLowerShadow < lastBody * 0.5 &&
    lastBody > lastRange * 0.2
  ) {
    return { mainPattern: 'shooting_star' };
  }

  if (lastBody < lastRange * 0.1) {
    return { mainPattern: 'doji' };
  }

  if (
    isBearishCandle(prev) &&
    isBullishCandle(last) &&
    last.open < prev.low &&
    last.close > prev.close + prevBody * 0.5 &&
    last.close < prev.open
  ) {
    return { mainPattern: 'piercing_line' };
  }

  if (
    isBullishCandle(prev) &&
    isBearishCandle(last) &&
    last.open > prev.high &&
    last.close < prev.close - prevBody * 0.5 &&
    last.close > prev.open
  ) {
    return { mainPattern: 'dark_cloud_cover' };
  }

  return { mainPattern: 'none' };
}

export function computeCombinedSignal(
  channel: ChannelDetectionResult,
  pattern: PatternDetectionResult,
  candles: Candle[]
): CombinedSignal {
  if (!channel.hasChannel) {
    return {
      bias: 'neutral',
      notes: [
        'No clear channel detected in the recent price action.',
        'Consider waiting for a more defined trading range to form.',
      ],
      cautions: ['Lacking directional bias without a clear channel structure.'],
    };
  }

  const bullishPatterns: DetectedPattern[] = [
    'bullish_engulfing',
    'hammer',
    'piercing_line',
  ];
  const bearishPatterns: DetectedPattern[] = [
    'bearish_engulfing',
    'shooting_star',
    'dark_cloud_cover',
  ];

  const isBullishPattern = bullishPatterns.includes(pattern.mainPattern);
  const isBearishPattern = bearishPatterns.includes(pattern.mainPattern);

  const lastClose = candles[candles.length - 1].close;

  if (channel.status === 'near_support' && isBullishPattern) {
    return {
      bias: 'bullish',
      notes: [
        'Price is near channel support with a bullish reversal pattern.',
        'This often suggests a potential bounce within the range.',
        `Support level: $${channel.support.toFixed(2)}`,
      ],
      cautions: [
        'Confirm with follow-through and volume in the next session.',
        'A close below support would weaken this setup significantly.',
      ],
    };
  }

  if (channel.status === 'near_resistance' && isBearishPattern) {
    return {
      bias: 'bearish',
      notes: [
        'Price is near channel resistance with a bearish reversal pattern.',
        'This often suggests a potential rejection from the top of the range.',
        `Resistance level: $${channel.resistance.toFixed(2)}`,
      ],
      cautions: [
        'A strong close above resistance may signal a breakout instead.',
        'Monitor for false signals at key resistance zones.',
      ],
    };
  }

  if (channel.status === 'near_support' && isBearishPattern) {
    return {
      bias: 'bearish',
      notes: [
        'Price is at or near channel support, but a bearish pattern has formed.',
        'This increases the risk of a breakdown below the range.',
        `Support at risk: $${channel.support.toFixed(2)}`,
      ],
      cautions: [
        'Be cautious assuming a bounce; consider waiting for confirmation.',
        'Support failure could lead to accelerated downside movement.',
      ],
    };
  }

  if (channel.status === 'near_resistance' && isBullishPattern) {
    return {
      bias: 'bullish',
      notes: [
        'Price is near channel resistance with a bullish pattern.',
        'This may indicate a possible breakout attempt above the range.',
        `Resistance to watch: $${channel.resistance.toFixed(2)}`,
      ],
      cautions: [
        'Breakouts can fail; monitor follow-through carefully.',
        'Avoid chasing extended moves without confirmation.',
      ],
    };
  }

  if (channel.status === 'inside' && pattern.mainPattern === 'none') {
    return {
      bias: 'neutral',
      notes: [
        'Price is within the channel without a strong reversal pattern.',
        'Edge may be limited until price approaches support or resistance.',
        `Channel range: $${channel.support.toFixed(2)} - $${channel.resistance.toFixed(2)}`,
      ],
      cautions: [
        'Consider waiting for a better location (support/resistance) before acting.',
        'Mid-channel entries carry higher risk of whipsaw.',
      ],
    };
  }

  if (channel.status === 'broken_out') {
    const breakoutDirection = lastClose > channel.resistance ? 'bullish' : 'bearish';
    return {
      bias: breakoutDirection,
      notes: [
        'Price has broken out of the previously defined channel.',
        breakoutDirection === 'bullish'
          ? `Breakout above resistance at $${channel.resistance.toFixed(2)}`
          : `Breakdown below support at $${channel.support.toFixed(2)}`,
      ],
      cautions: [
        'Old channel boundaries may act as support/resistance on retests.',
        'Expect increased volatility after breakouts.',
        'Watch for false breakouts and potential mean reversion.',
      ],
    };
  }

  if (channel.status === 'near_support') {
    return {
      bias: 'neutral',
      notes: [
        'Price is near support but without a clear reversal pattern.',
        `Support level: $${channel.support.toFixed(2)}`,
      ],
      cautions: [
        'Wait for confirmation before assuming a bounce.',
        'Support breaks can lead to sharp moves lower.',
      ],
    };
  }

  if (channel.status === 'near_resistance') {
    return {
      bias: 'neutral',
      notes: [
        'Price is near resistance but without a clear reversal pattern.',
        `Resistance level: $${channel.resistance.toFixed(2)}`,
      ],
      cautions: [
        'Wait for confirmation before assuming rejection or breakout.',
        'Resistance breaks require strong follow-through.',
      ],
    };
  }

  return {
    bias: 'neutral',
    notes: ['Price action is within the channel range.'],
    cautions: ['Monitor for clearer signals at support or resistance levels.'],
  };
}
