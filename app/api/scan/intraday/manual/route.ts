/**
 * Manual Intraday Scanner Trigger (User-Facing)
 *
 * Allows authenticated users to manually trigger intraday scanner
 * No secret key required - authentication via Supabase session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated via Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // Verify the session token with Supabase
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid session - please log in again' },
        { status: 401 }
      );
    }

    // Check if stock market is open
    const { getMarketStatus } = await import('@/lib/intradayMarketData');
    const marketStatus = getMarketStatus();

    if (!marketStatus.isOpen) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Market closed',
        message: marketStatus.message,
      });
    }

    // Run stock scanner
    console.log(`Manual intraday scan triggered by user ${user.email}`);
    const { runIntradayMarketScan } = await import('@/scripts/intradayMarketScan');

    await runIntradayMarketScan();

    console.log('Manual intraday scan completed successfully');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Stock scanner completed successfully',
    });

  } catch (error) {
    console.error('Manual intraday scanner error:', error);
    return NextResponse.json(
      {
        error: 'Scanner failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
