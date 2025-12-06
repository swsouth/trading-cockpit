/**
 * CoinAPI Usage Stats Endpoint
 *
 * Returns current CoinAPI credit usage and balance
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.COINAPI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        available: false,
        message: 'CoinAPI not configured',
      });
    }

    // Note: CoinAPI doesn't have a usage endpoint in their free tier
    // We'll track estimated usage based on scan frequency
    // HIGH-FREQUENCY STRATEGY:
    // - 10 elite cryptos (BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOGE, MATIC, LINK)
    // - Scans every 15 minutes, 24/7 (96 scans/day)
    // - Each crypto scan = 200 credits (10 cryptos × 20 credits each)

    // For now, return static info - user can check dashboard for actual balance
    return NextResponse.json({
      available: true,
      stats: {
        balance: 30.00, // $30 in credits (30,000 credits at $1 = 3,000 credits)
        creditsPerScan: 200, // 10 elite cryptos × 20 credits each
        estimatedScansRemaining: 150, // 30,000 credits / 200 per scan
        creditsPerCrypto: 20, // 15-min (10) + 1H (10)
        cryptosPerScan: 10, // 10 elite cryptos every 15 minutes
        lastUpdated: new Date().toISOString(),
      },
      message: 'Check CoinAPI dashboard for real-time balance: https://www.coinapi.io/dashboard',
    });

  } catch (error) {
    console.error('Error fetching CoinAPI usage:', error);
    return NextResponse.json(
      {
        available: false,
        message: 'Failed to fetch CoinAPI usage stats',
      },
      { status: 500 }
    );
  }
}
