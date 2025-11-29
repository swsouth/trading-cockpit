import { NextRequest, NextResponse } from 'next/server';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = (process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets/v2').replace(/\/v2$/, '');

export async function POST(request: NextRequest) {
  try {
    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Alpaca credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { symbol, qty, percentage } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Build query params for position close
    const params = new URLSearchParams();
    if (qty) params.append('qty', qty);
    if (percentage) params.append('percentage', percentage);

    const url = `${ALPACA_BASE_URL}/v2/positions/${symbol}${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca API error:', errorText);

      let errorMessage = 'Failed to close position';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorText;
      } catch {
        errorMessage = errorText;
      }

      return NextResponse.json(
        { error: `Alpaca API error: ${errorMessage}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      order_id: result.id,
      symbol: result.symbol,
      qty: result.qty,
      side: result.side,
    });
  } catch (error) {
    console.error('Error closing position:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to close position: ${message}` },
      { status: 500 }
    );
  }
}
