import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/scan/refresh-prices
 *
 * Refreshes current prices for all active recommendations (every 15 min during market hours)
 *
 * Security: Requires SCAN_SECRET_KEY in Authorization header
 *
 * Usage:
 * curl -X POST https://your-site.com/api/scan/refresh-prices \
 *   -H "Authorization: Bearer YOUR_SCAN_SECRET_KEY"
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.SCAN_SECRET_KEY;

    if (!expectedSecret) {
      console.error('❌ SCAN_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Price refresh not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const providedSecret = authHeader.replace('Bearer ', '');

    if (providedSecret !== expectedSecret) {
      console.warn('❌ Invalid scan secret attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('🔐 Authorization verified - Starting price refresh...');

    // 2. Import and run the price refresh
    const { refreshPrices, isMarketOpen } = await import('@/scripts/intradayPriceRefresh');

    // 3. Check market hours first
    if (!isMarketOpen()) {
      console.log('⏸️  Market closed - skipping price refresh');
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Market closed',
        timestamp: new Date().toISOString(),
      });
    }

    const refreshStartTime = Date.now();

    // 4. Run the price refresh
    await refreshPrices();

    const refreshDuration = Date.now() - refreshStartTime;

    console.log(`✅ Price refresh completed in ${(refreshDuration / 1000).toFixed(1)}s`);

    // 5. Return success response
    return NextResponse.json({
      success: true,
      skipped: false,
      message: 'Price refresh completed successfully',
      durationMs: refreshDuration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Price refresh failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Price refresh execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scan/refresh-prices
 *
 * Returns information about the price refresh endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Intraday Price Refresh Endpoint',
    method: 'POST',
    schedule: 'Every 15 minutes during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)',
    authentication: 'Required - Bearer token in Authorization header',
    usage: 'curl -X POST https://your-site.com/api/scan/refresh-prices -H "Authorization: Bearer YOUR_SECRET"',
  });
}
