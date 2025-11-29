/**
 * Twelve Data API Usage Endpoint
 *
 * Returns current API usage statistics from Twelve Data
 * Database-backed to persist across serverless function invocations
 */

import { NextResponse } from 'next/server';
import { getTwelveDataUsageStats } from '@/lib/twelveDataCrypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getTwelveDataUsageStats();

    if (!stats) {
      return NextResponse.json({
        available: false,
        message: 'No crypto API calls made yet',
      });
    }

    return NextResponse.json({
      available: true,
      stats: {
        requestsLimitPerMinute: stats.requestsLimitPerMinute,
        requestsLimitPerDay: stats.requestsLimitPerDay,
        requestsUsedThisMinute: stats.requestsUsedThisMinute,
        requestsUsedToday: stats.requestsUsedToday,
        resetTime: stats.resetTime.toISOString(),
        lastUpdated: stats.lastUpdated.toISOString(),
        percentUsedMinute: stats.percentUsedMinute,
        percentUsedDay: stats.percentUsedDay,
      },
    });
  } catch (error) {
    console.error('Error fetching Twelve Data usage stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch usage stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
