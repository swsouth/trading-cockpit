import { NextRequest, NextResponse } from 'next/server';

/**
 * Crypto Paper Trade API Route
 * Places crypto paper trades via Alpaca REST API
 *
 * Key differences from stock trading:
 * - Uses crypto pairs (e.g., BTC/USD, ETH/USD)
 * - Supports notional (dollar amount) or qty (coin amount)
 * - Time in force: GTC or IOC only (no DAY orders)
 * - Market orders require notional XOR qty
 * - Limit orders require qty and limit_price
 * - Stop limit orders require qty, stop_price, and limit_price
 */

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = (process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets').replace(/\/v2$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol,
      side,
      quantity,
      notional,
      order_type,
      limit_price,
      stop_price,
      time_in_force,
      stop_loss,
      target_price,
    } = body;

    // Validate required fields
    if (!symbol || !side) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, side' },
        { status: 400 }
      );
    }

    // Validate quantity/notional
    if (!quantity && !notional) {
      return NextResponse.json(
        { error: 'Must provide either quantity or notional' },
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

    console.log('📤 Placing Alpaca crypto order:', {
      symbol,
      side,
      quantity,
      notional,
      order_type,
      limit_price,
      with_bracket: !!(stop_loss && target_price),
    });

    // Build order payload based on order type
    let orderPayload: any;

    // Determine effective order type
    const effectiveOrderType = order_type || 'market';

    if (effectiveOrderType === 'market') {
      // Market order: requires qty XOR notional
      orderPayload = {
        symbol,
        side,
        type: 'market',
        time_in_force: time_in_force || 'gtc', // GTC or IOC for crypto
      };

      // Add either qty or notional (not both)
      if (quantity) {
        orderPayload.qty = quantity;
      } else if (notional) {
        orderPayload.notional = notional;
      }
    } else if (effectiveOrderType === 'limit') {
      // Limit order: requires qty and limit_price
      if (!limit_price || !quantity) {
        return NextResponse.json(
          { error: 'Limit orders require both quantity and limit_price' },
          { status: 400 }
        );
      }

      orderPayload = {
        symbol,
        side,
        type: 'limit',
        qty: quantity,
        limit_price,
        time_in_force: time_in_force || 'gtc',
      };
    } else if (effectiveOrderType === 'stop_limit') {
      // Stop limit order: requires qty, stop_price, and limit_price
      if (!limit_price || !stop_price || !quantity) {
        return NextResponse.json(
          { error: 'Stop limit orders require quantity, stop_price, and limit_price' },
          { status: 400 }
        );
      }

      orderPayload = {
        symbol,
        side,
        type: 'stop_limit',
        qty: quantity,
        limit_price,
        stop_price,
        time_in_force: time_in_force || 'gtc',
      };
    } else {
      return NextResponse.json(
        { error: `Unsupported order type: ${effectiveOrderType}` },
        { status: 400 }
      );
    }

    console.log('📋 Crypto order payload:', JSON.stringify(orderPayload, null, 2));

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
      console.error('❌ Alpaca API error:', {
        status: response.status,
        statusText: response.statusText,
        url: `${ALPACA_BASE_URL}/v2/orders`,
        errorText,
      });

      let errorMessage = 'Failed to place crypto order';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.code || errorData.error || errorText;
        console.error('Parsed error:', errorData);
      } catch {
        errorMessage = errorText || response.statusText;
      }

      return NextResponse.json(
        {
          error: `Alpaca API error: ${errorMessage}`,
          details: {
            status: response.status,
            symbol: symbol,
            endpoint: `${ALPACA_BASE_URL}/v2/orders`,
          }
        },
        { status: response.status }
      );
    }

    const orderResult = await response.json();
    console.log('✅ Crypto order placed successfully:', orderResult);

    return NextResponse.json({
      success: true,
      order_id: orderResult.id,
      status: orderResult.status,
      filled_qty: orderResult.filled_qty || 0,
      symbol: orderResult.symbol,
      side: orderResult.side,
      qty: orderResult.qty,
      notional: orderResult.notional,
      order_type: orderResult.type,
      bracket_orders: false, // Crypto doesn't support bracket orders yet
    });

  } catch (error) {
    console.error('❌ Crypto paper trade error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process crypto paper trade: ${message}` },
      { status: 500 }
    );
  }
}
