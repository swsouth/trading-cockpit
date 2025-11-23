import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/scan/trigger
 *
 * Triggers the daily market scanner
 *
 * Security: Requires SCAN_SECRET_KEY in Authorization header
 *
 * Usage:
 * curl -X POST https://your-site.com/api/scan/trigger \
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
        { error: 'Scanner not configured' },
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

    console.log('🔐 Authorization verified - Starting market scan...');

    // 2. Import and run the scanner
    // We do a dynamic import to avoid loading heavy dependencies on every API request
    const { runDailyMarketScan } = await import('@/scripts/dailyMarketScan');

    const scanStartTime = Date.now();

    // 3. Run the scanner
    await runDailyMarketScan();

    const scanDuration = Date.now() - scanStartTime;

    console.log(`✅ Scan completed in ${(scanDuration / 1000).toFixed(1)}s`);

    // 4. Return success response
    return NextResponse.json({
      success: true,
      message: 'Market scan completed successfully',
      durationMs: scanDuration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Scan trigger failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Scanner execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scan/trigger
 *
 * Returns information about the scanner endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Daily Market Scanner Trigger Endpoint',
    method: 'POST',
    authentication: 'Required - Bearer token in Authorization header',
    usage: 'curl -X POST https://your-site.com/api/scan/trigger -H "Authorization: Bearer YOUR_SECRET"',
  });
}
