import { NextRequest, NextResponse } from 'next/server';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = (process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets/v2').replace(/\/v2$/, '');

export async function GET(request: NextRequest) {
  try {
    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Alpaca credentials not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Fetch latest quote from Alpaca
    const response = await fetch(
      `${ALPACA_BASE_URL}/v2/stocks/${symbol}/quotes/latest`,
      {
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch quote' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const quote = data.quote;

    // Calculate mid-price from bid/ask
    const price = (quote.ap + quote.bp) / 2;

    return NextResponse.json({
      symbol: quote.S,
      price: price,
      ask_price: quote.ap,
      bid_price: quote.bp,
      ask_size: quote.as,
      bid_size: quote.bs,
      timestamp: quote.t,
      source: 'alpaca',
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
