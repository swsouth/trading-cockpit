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
    const status = searchParams.get('status') || 'all';
    const limit = searchParams.get('limit') || '50';

    const response = await fetch(
      `${ALPACA_BASE_URL}/v2/orders?status=${status}&limit=${limit}&direction=desc`,
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
        { error: 'Failed to fetch orders' },
        { status: response.status }
      );
    }

    const orders = await response.json();

    // Transform to match our interface
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      qty: parseFloat(order.qty),
      filled_qty: parseFloat(order.filled_qty || 0),
      type: order.type,
      status: order.status,
      limit_price: order.limit_price ? parseFloat(order.limit_price) : undefined,
      filled_avg_price: order.filled_avg_price
        ? parseFloat(order.filled_avg_price)
        : undefined,
      created_at: order.created_at,
      filled_at: order.filled_at,
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
