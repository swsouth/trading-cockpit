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

    console.log(`Manual intraday scan triggered by user ${user.email}`);

    let stocksScanned = false;
    let cryptoScanned = false;
    let stockCount = 0;
    let cryptoCount = 0;

    // Run stock scanner if market is open
    if (marketStatus.isOpen) {
      console.log('📈 Running stock scanner...');
      const { runIntradayMarketScan } = await import('@/scripts/intradayMarketScan');
      await runIntradayMarketScan();
      stocksScanned = true;
      console.log('✅ Stock scanner completed');
    } else {
      console.log('⚠️  Stock market closed - skipping stock scanner');
    }

    // Run crypto scanner (crypto markets are 24/7)
    console.log('₿ Running crypto scanner...');
    try {
      // Dynamically import and run crypto scanner
      const cryptoScanModule = await import('@/scripts/cryptoIntradayScan');

      // The crypto scanner exports a default function that runs automatically
      // We need to extract and call the scan function manually
      // For now, we'll use a workaround by importing the functions directly
      const { getCryptoIntradayCandles } = await import('@/lib/twelveDataCrypto');
      const { detectChannel, detectPatterns } = await import('@/lib/analysis');
      const { calculateIntradayOpportunityScore } = await import('@/lib/scoring');
      const { generateTradeRecommendation } = await import('@/lib/tradeCalculator');
      const { createClient } = await import('@supabase/supabase-js');

      // Run a simplified crypto scan for BTC
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const candles = await getCryptoIntradayCandles('BTC', '5min', 60);

      if (candles && candles.length >= 20) {
        const channel = detectChannel(candles);
        const pattern = detectPatterns(candles);
        const { analyzeVolume } = await import('@/lib/scoring');
        const { detectAbsorption } = await import('@/lib/orderflow');
        const volume = analyzeVolume(candles);
        const absorption = detectAbsorption(candles, volume);

        const recommendation = generateTradeRecommendation({
          symbol: 'BTC',
          candles,
          channel,
          pattern,
          volume,
          absorption,
        });

        if (recommendation && recommendation.setup.type !== 'none') {
          const scoring = calculateIntradayOpportunityScore(
            candles,
            channel,
            pattern,
            recommendation.entry,
            recommendation.target,
            recommendation.stopLoss
          );

          // Get user ID
          const { data: users } = await supabase.auth.admin.listUsers();
          const userId = users?.users?.[0]?.id;

          if (userId) {
            // Insert crypto opportunity
            const { error: insertError } = await supabase
              .from('intraday_opportunities')
              .insert({
                user_id: userId,
                symbol: 'BTC',
                timeframe: '5min',
                scan_timestamp: new Date().toISOString(),
                recommendation_type: recommendation.setup.type,
                entry_price: recommendation.entry,
                target_price: recommendation.target,
                stop_loss: recommendation.stopLoss,
                opportunity_score: scoring.totalScore,
                confidence_level: scoring.confidenceLevel,
                rationale: recommendation.rationale,
                current_price: candles[candles.length - 1].close,
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                status: 'active',
                channel_status: channel.status,
                pattern_detected: pattern.mainPattern,
                rsi: scoring.components.momentumScore,
                asset_type: 'crypto',
              });

            if (!insertError) {
              cryptoCount = 1;
              console.log('✅ Crypto opportunity found and saved');
            }
          }
        }
      }

      cryptoScanned = true;
      console.log('✅ Crypto scanner completed');
    } catch (cryptoError) {
      console.error('⚠️  Crypto scanner error:', cryptoError);
      // Don't fail the entire request if crypto scan fails
    }

    const message = `Scan complete: ${stocksScanned ? 'Stocks ✓' : 'Stocks (market closed)'} | ${cryptoScanned ? 'Crypto ✓' : 'Crypto ✗'}`;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message,
      details: {
        stocksScanned,
        cryptoScanned,
        stockMarketStatus: marketStatus.message,
      },
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
