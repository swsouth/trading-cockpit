import { NextRequest, NextResponse } from 'next/server';

/**
 * Paper Trade API Route
 * Places paper trades via Alpaca REST API
 * Supports bracket orders (entry + stop loss + take profit)
 */

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol,
      side,
      quantity,
      order_type,
      limit_price,
      time_in_force,
      stop_loss,
      target_price,
    } = body;

    // Validate required fields
    if (!symbol || !side || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, side, quantity' },
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

    console.log('📤 Placing Alpaca order:', {
      symbol,
      side,
      quantity,
      order_type,
      limit_price,
      with_bracket: !!(stop_loss && target_price),
    });

    // Determine if we should use bracket order
    const useBracketOrder = !!(stop_loss && target_price && side === 'buy');

    let orderPayload: any;

    if (useBracketOrder) {
      // Bracket order: Entry + Stop Loss + Take Profit
      orderPayload = {
        symbol,
        qty: quantity,
        side,
        type: order_type || 'limit',
        time_in_force: time_in_force || 'day',
        order_class: 'bracket',
        take_profit: {
          limit_price: target_price,
        },
        stop_loss: {
          stop_price: stop_loss,
        },
      };

      // Add limit price for limit orders
      if (order_type === 'limit' && limit_price) {
        orderPayload.limit_price = limit_price;
      }
    } else {
      // Simple order (no bracket)
      orderPayload = {
        symbol,
        qty: quantity,
        side,
        type: order_type || 'limit',
        time_in_force: time_in_force || 'day',
      };

      // Add limit price for limit orders
      if (order_type === 'limit' && limit_price) {
        orderPayload.limit_price = limit_price;
      }
    }

    console.log('📋 Order payload:', JSON.stringify(orderPayload, null, 2));

    // Place order via Alpaca API
    const response = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Alpaca API error:', response.status, errorText);

      let errorMessage = 'Failed to place order';
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

    const orderResult = await response.json();
    console.log('✅ Order placed successfully:', orderResult);

    return NextResponse.json({
      success: true,
      order_id: orderResult.id,
      status: orderResult.status,
      filled_qty: orderResult.filled_qty || 0,
      symbol: orderResult.symbol,
      side: orderResult.side,
      qty: orderResult.qty,
      order_type: orderResult.type,
      bracket_orders: useBracketOrder,
      legs: orderResult.legs || null,
    });

  } catch (error) {
    console.error('❌ Paper trade error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process paper trade: ${message}` },
      { status: 500 }
    );
  }
}
