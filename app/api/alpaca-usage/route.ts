/**
 * Alpaca API Usage Endpoint
 *
 * Returns current API usage statistics from Alpaca
 * Updated automatically whenever intraday data is fetched
 */

import { NextResponse } from 'next/server';
import { getAlpacaUsageStats } from '@/lib/intradayMarketData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = getAlpacaUsageStats();

    if (!stats) {
      return NextResponse.json({
        available: false,
        message: 'No API calls made yet',
      });
    }

    return NextResponse.json({
      available: true,
      stats: {
        requestsLimit: stats.requestsLimit,
        requestsRemaining: stats.requestsRemaining,
        resetTime: stats.resetTime.toISOString(),
        lastUpdated: stats.lastUpdated.toISOString(),
        percentUsed: stats.percentUsed,
      },
    });
  } catch (error) {
    console.error('Error fetching Alpaca usage stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch usage stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
