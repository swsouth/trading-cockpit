import { NextRequest, NextResponse } from 'next/server';

/**
 * Cancel Order API Route
 * Cancels a pending paper trade order via Alpaca REST API
 */

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = (process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets').replace(/\/v2$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id } = body;

    // Validate required fields
    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing required field: order_id' },
        { status: 400 }
      );
    }

    // Validate Alpaca credentials
    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Alpaca credentials not configured' },
        { status: 500 }
      );
    }

    console.log('🚫 Cancelling Alpaca order:', order_id);

    // Cancel order via Alpaca API
    const response = await fetch(`${ALPACA_BASE_URL}/v2/orders/${order_id}`, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Alpaca API error:', {
        status: response.status,
        statusText: response.statusText,
        url: `${ALPACA_BASE_URL}/v2/orders/${order_id}`,
        errorText,
      });

      let errorMessage = 'Failed to cancel order';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.code || errorData.error || errorText;
      } catch {
        errorMessage = errorText || response.statusText;
      }

      return NextResponse.json(
        {
          error: `Alpaca API error: ${errorMessage}`,
          details: {
            status: response.status,
            order_id: order_id,
          }
        },
        { status: response.status }
      );
    }

    console.log('✅ Order cancelled successfully');

    return NextResponse.json({
      success: true,
      order_id: order_id,
      message: 'Order cancelled successfully',
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to cancel order: ${message}` },
      { status: 500 }
    );
  }
}
