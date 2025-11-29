import { NextResponse } from 'next/server';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = (process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets/v2').replace(/\/v2$/, '');

export async function GET() {
  try {
    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Alpaca credentials not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${ALPACA_BASE_URL}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch positions' },
        { status: response.status }
      );
    }

    const positions = await response.json();

    // Transform to match our interface
    const formattedPositions = positions.map((pos: any) => ({
      symbol: pos.symbol,
      qty: parseFloat(pos.qty),
      side: pos.side,
      avg_entry_price: parseFloat(pos.avg_entry_price),
      current_price: parseFloat(pos.current_price),
      market_value: parseFloat(pos.market_value),
      cost_basis: parseFloat(pos.cost_basis),
      unrealized_pl: parseFloat(pos.unrealized_pl),
      unrealized_plpc: parseFloat(pos.unrealized_plpc) * 100, // Convert to percentage
      asset_id: pos.asset_id,
    }));

    return NextResponse.json({ positions: formattedPositions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
