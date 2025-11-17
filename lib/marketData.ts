import { Candle, Quote } from './types';

export async function getDailyOHLC(symbol: string): Promise<Candle[]> {
  const candles: Candle[] = [];
  const now = new Date();
  const basePrice = 150 + Math.random() * 50;

  for (let i = 60; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    const dayOffset = Math.sin(i / 10) * 15 + (Math.random() - 0.5) * 5;
    const open = basePrice + dayOffset;
    const close = open + (Math.random() - 0.5) * 8;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;

    candles.push({
      timestamp: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(1000000 + Math.random() * 5000000),
    });
  }

  return candles;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const candles = await getDailyOHLC(symbol);
  const latestCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2];

  if (!latestCandle || !previousCandle) {
    throw new Error('Insufficient data');
  }

  const changePercent = ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100;

  return {
    symbol,
    price: latestCandle.close,
    changePercent: parseFloat(changePercent.toFixed(2)),
    open: latestCandle.open,
    high: latestCandle.high,
    low: latestCandle.low,
    previousClose: previousCandle.close,
    volume: latestCandle.volume,
    timestamp: new Date().toISOString(),
  };
}
