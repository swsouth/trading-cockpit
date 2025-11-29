/**
 * Manual Crypto Intraday Scanner Trigger
 *
 * Allows authenticated users to manually trigger crypto intraday scanner
 * Crypto markets are 24/7, so no market hours check needed
 *
 * Uses database-backed rate limiting for Twelve Data API (8/min, 800/day)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log('🚀 Crypto scanner API route called');

  try {
    console.log('✓ Checking authorization header');
    // Verify user is authenticated via Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    console.log('✓ Verifying session with Supabase');
    // Verify the session token with Supabase
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Invalid session:', authError?.message);
      return NextResponse.json(
        { error: 'Invalid session - please log in again' },
        { status: 401 }
      );
    }

    console.log(`✓ User authenticated: ${user.email}`);
    // Run crypto scanner
    console.log(`🚀 Manual crypto intraday scan triggered by user ${user.email}`);
    console.log(`📊 Environment check:`);
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);
    console.log(`   TWELVE_DATA_API_KEY: ${process.env.TWELVE_DATA_API_KEY ? 'SET' : 'MISSING'}`);

    try {
      console.log('✓ Importing crypto scanner module');
      const { runCryptoScan } = await import('@/lib/cryptoScanner');
      console.log('✅ Crypto scanner module imported successfully');

      console.log('✓ Starting crypto scan');
      const opportunitiesCount = await runCryptoScan();

      console.log(`✅ Crypto scan completed - found ${opportunitiesCount} opportunities`);

      // Get updated usage stats after scan (database-backed)
      const { getTwelveDataUsageStats } = await import('@/lib/twelveDataCrypto');
      const usageStats = await getTwelveDataUsageStats();

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        opportunitiesCount,
        message: opportunitiesCount > 0
          ? `Found ${opportunitiesCount} new crypto ${opportunitiesCount === 1 ? 'opportunity' : 'opportunities'}`
          : 'Scan completed - no crypto setups found at this time',
        usageStats: usageStats ? {
          requestsLimitPerMinute: usageStats.requestsLimitPerMinute,
          requestsLimitPerDay: usageStats.requestsLimitPerDay,
          requestsUsedThisMinute: usageStats.requestsUsedThisMinute,
          requestsUsedToday: usageStats.requestsUsedToday,
          resetTime: usageStats.resetTime.toISOString(),
          lastUpdated: usageStats.lastUpdated.toISOString(),
          percentUsedMinute: usageStats.percentUsedMinute,
          percentUsedDay: usageStats.percentUsedDay,
        } : null,
      });
    } catch (scanError) {
      console.error('❌ Crypto scanner execution error:', scanError);
      console.error('   Error stack:', scanError instanceof Error ? scanError.stack : 'No stack trace');

      // Even on error, return usage stats to update client (database-backed)
      const { getTwelveDataUsageStats } = await import('@/lib/twelveDataCrypto');
      const usageStats = await getTwelveDataUsageStats();

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
