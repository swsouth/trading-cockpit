/**
 * Intraday Scanner Trigger API
 *
 * Triggered by Netlify scheduled function every 5 minutes during market hours
 * Runs the intraday scanner and stores opportunities in database
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout (Netlify Pro supports up to 26s)

export async function POST(request: NextRequest) {
  try {
    // Verify secret key (same pattern as daily scanner)
    const authHeader = request.headers.get('authorization');
    const scanSecretKey = process.env.SCAN_SECRET_KEY;

    if (!authHeader || !scanSecretKey) {
      return NextResponse.json(
        { error: 'Missing authentication' },
        { status: 401 }
      );
    }

    const providedKey = authHeader.replace('Bearer ', '');

    if (providedKey !== scanSecretKey) {
      console.error('Invalid scan secret key provided');
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 403 }
      );
    }

    // Check if market is open (skip scan if closed)
    const { isMarketOpen } = await import('@/lib/intradayMarketData');
    if (!isMarketOpen()) {
      console.log('Market is closed, skipping intraday scan');
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Market closed',
      });
    }

    // Import and run the scanner
    console.log('Starting intraday market scan...');
    const { runIntradayMarketScan } = await import('@/scripts/intradayMarketScan');

    await runIntradayMarketScan();

    console.log('Intraday scan completed successfully');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Intraday scanner API error:', error);
    return NextResponse.json(
      {
        error: 'Scanner failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    scanner: 'intraday',
    timestamp: new Date().toISOString(),
  });
}
