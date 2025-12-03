import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Use Yahoo Finance API - no auth required, more reliable
    const yahooResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!yahooResponse.ok) {
      console.error('Yahoo Finance API error:', yahooResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch quote from Yahoo Finance' },
        { status: yahooResponse.status }
      );
    }

    const data = await yahooResponse.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.meta) {
      return NextResponse.json(
        { error: 'Invalid response from Yahoo Finance' },
        { status: 500 }
      );
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;

    if (!currentPrice) {
      return NextResponse.json(
        { error: 'No price data available for symbol' },
        { status: 404 }
      );
    }

    // Get bid/ask if available (only during market hours)
    const bid = meta.bid || null;
    const ask = meta.ask || null;

    return NextResponse.json({
      symbol: symbol,
      price: currentPrice,
      ask_price: ask,
      bid_price: bid,
      previous_close: meta.previousClose,
      change: meta.regularMarketPrice ? currentPrice - meta.previousClose : 0,
      change_percent: meta.regularMarketPrice
        ? ((currentPrice - meta.previousClose) / meta.previousClose) * 100
        : 0,
      volume: meta.regularMarketVolume || 0,
      timestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
      market_state: meta.marketState, // PRE, REGULAR, POST, CLOSED
      source: 'yahoo_finance',
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch quote: ${message}` },
      { status: 500 }
    );
  }
}
