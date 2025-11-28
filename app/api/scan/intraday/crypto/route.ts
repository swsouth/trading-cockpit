/**
 * Manual Crypto Intraday Scanner Trigger
 *
 * Allows authenticated users to manually trigger crypto intraday scanner
 * Crypto markets are 24/7, so no market hours check needed
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

    // Run crypto scanner
    console.log(`🚀 Manual crypto intraday scan triggered by user ${user.email}`);
    console.log(`📊 Environment check:`);
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);
    console.log(`   TWELVE_DATA_API_KEY: ${process.env.TWELVE_DATA_API_KEY ? 'SET' : 'MISSING'}`);

    try {
      const { runCryptoScan } = await import('@/scripts/cryptoIntradayScan');
      console.log('✅ Crypto scanner module imported successfully');

      const opportunitiesCount = await runCryptoScan();

      console.log(`✅ Manual crypto intraday scan completed successfully - found ${opportunitiesCount} opportunities`);

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        opportunitiesCount,
        message: opportunitiesCount > 0
          ? `Found ${opportunitiesCount} new crypto ${opportunitiesCount === 1 ? 'opportunity' : 'opportunities'}`
          : 'Scan completed - no crypto setups found at this time',
      });
    } catch (scanError) {
      console.error('❌ Crypto scanner execution error:', scanError);
      console.error('   Error stack:', scanError instanceof Error ? scanError.stack : 'No stack trace');
      throw scanError; // Re-throw to be caught by outer catch block
    }

  } catch (error) {
    console.error('Manual crypto intraday scanner error:', error);
    return NextResponse.json(
      {
        error: 'Crypto scanner failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
