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

    // TEMPORARILY DISABLED: Allow scanning even when market is closed for testing
    // TODO: Re-enable this check before production
    // if (!marketStatus.isOpen) {
    //   return NextResponse.json({
    //     success: true,
    //     skipped: true,
    //     reason: 'Market closed',
    //     message: marketStatus.message,
    //   });
    // }

    console.log(`⏰ Market status: ${marketStatus.isOpen ? 'OPEN' : 'CLOSED'} - Running scanner anyway for testing`);

    // Run stock scanner
    console.log(`🚀 Manual intraday scan triggered by user ${user.email}`);
    console.log(`📊 Environment check:`);
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);
    console.log(`   ALPACA_API_KEY: ${process.env.ALPACA_API_KEY ? 'SET' : 'MISSING'}`);
    console.log(`   ALPACA_SECRET_KEY: ${process.env.ALPACA_SECRET_KEY ? 'SET' : 'MISSING'}`);

    try {
      const { runIntradayMarketScan } = await import('@/scripts/intradayMarketScan');
      console.log('✅ Scanner module imported successfully');

      const opportunitiesCount = await runIntradayMarketScan();

      console.log(`✅ Manual intraday scan completed successfully - found ${opportunitiesCount} opportunities`);

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        opportunitiesCount,
        message: opportunitiesCount > 0
          ? `Found ${opportunitiesCount} new stock ${opportunitiesCount === 1 ? 'opportunity' : 'opportunities'}`
          : 'Scan completed - no stock setups found at this time',
      });
    } catch (scanError) {
      console.error('❌ Scanner execution error:', scanError);
      console.error('   Error stack:', scanError instanceof Error ? scanError.stack : 'No stack trace');
      throw scanError; // Re-throw to be caught by outer catch block
    }

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
