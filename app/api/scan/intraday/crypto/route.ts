/**
 * Crypto Intraday Scanner Trigger (Dual Authentication)
 *
 * Supports two authentication methods:
 * 1. Service Key (SCAN_SECRET_KEY) - For GitHub Actions automated scans
 * 2. User Session Token - For manual user-triggered scans
 *
 * Crypto markets are 24/7, so no market hours check needed
 * Uses CoinAPI (no rate limiting - date-bounded queries at 10 credits per call)
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
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const scanSecretKey = process.env.SCAN_SECRET_KEY;

    // Check for service key authentication (GitHub Actions)
    if (scanSecretKey && token === scanSecretKey) {
      console.log('🔐 Service key authentication successful (GitHub Actions)');

      // For service authentication, we need to use a system user ID
      // Get the first user from the database or use a fixed system ID
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Get first user as system user for service scans
      const { data: users } = await supabaseAdmin.from('profiles').select('id').limit(1);
      const systemUserId = users && users.length > 0 ? users[0].id : null;

      if (!systemUserId) {
        console.log('❌ No system user found for service scan');
        return NextResponse.json(
          { error: 'System user not configured' },
          { status: 500 }
        );
      }

      console.log(`✓ Using system user ID: ${systemUserId}`);

      // Run scanner with system user ID
      const userId = systemUserId;
      const triggerSource = 'GitHub Actions';

      console.log(`🚀 Service crypto scan triggered by ${triggerSource}`);
      console.log(`📊 Environment check:`);
      console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
      console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);
      console.log(`   COINAPI_API_KEY: ${process.env.COINAPI_API_KEY ? 'SET' : 'MISSING'}`);

      try {
        console.log('✓ Importing crypto scanner module');
        const { runCryptoScan } = await import('@/lib/cryptoScanner');
        console.log('✅ Crypto scanner module imported successfully');

        console.log('✓ Starting crypto scan (FOREGROUND - with full feedback)');

        const opportunitiesCount = await runCryptoScan(userId);

        console.log(`✅ Service crypto scan completed - found ${opportunitiesCount} opportunities`);

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          message: `Crypto scan completed using CoinAPI - found ${opportunitiesCount} opportunities`,
          scanStatus: 'completed',
          opportunitiesFound: opportunitiesCount,
          triggerSource,
        });
      } catch (scanError) {
        console.error('❌ Crypto scanner execution error:', scanError);
        console.error('   Error stack:', scanError instanceof Error ? scanError.stack : 'No stack trace');
        throw scanError;
      }
    }

    // User session authentication (manual scans)
    console.log('✓ Verifying user session with Supabase');
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
    console.log(`   COINAPI_API_KEY: ${process.env.COINAPI_API_KEY ? 'SET' : 'MISSING'}`);

    try {
      console.log('✓ Importing crypto scanner module');
      const { runCryptoScan } = await import('@/lib/cryptoScanner');
      console.log('✅ Crypto scanner module imported successfully');

      console.log('✓ Starting crypto scan (FOREGROUND - with full feedback)');

      // Run scanner in foreground (AWAIT - provide full feedback to user)
      // Pass user ID for database foreign key constraint
      const opportunitiesCount = await runCryptoScan(user.id);

      console.log(`✅ Crypto scan completed - found ${opportunitiesCount} opportunities`);

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: `Crypto scan completed using CoinAPI - found ${opportunitiesCount} opportunities`,
        scanStatus: 'completed',
        opportunitiesFound: opportunitiesCount,
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
