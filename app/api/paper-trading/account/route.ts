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

    const response = await fetch(`${ALPACA_BASE_URL}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch account info' },
        { status: response.status }
      );
    }

    const account = await response.json();

    return NextResponse.json({
      equity: parseFloat(account.equity),
      cash: parseFloat(account.cash),
      buying_power: parseFloat(account.buying_power),
      portfolio_value: parseFloat(account.portfolio_value),
      long_market_value: parseFloat(account.long_market_value || 0),
      short_market_value: parseFloat(account.short_market_value || 0),
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
