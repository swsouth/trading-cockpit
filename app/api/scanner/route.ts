import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import { scanWatchlist, applyScanCriteria, sortScanResults, getScanStats } from '@/lib/scanner';
import { WatchlistItem, ScanCriteria } from '@/lib/types';

/**
 * POST /api/scanner
 *
 * Scan user's watchlist and return trading recommendations
 *
 * Body (optional):
 * {
 *   criteria?: ScanCriteria,
 *   sortBy?: 'riskReward' | 'confidence' | 'priceChange' | 'setup'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const criteria: ScanCriteria | undefined = body.criteria;
    const sortBy: 'riskReward' | 'confidence' | 'priceChange' | 'setup' =
      body.sortBy || 'riskReward';

    // Fetch user's watchlist
    const { data: watchlistItems, error: watchlistError } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (watchlistError) {
      console.error('Error fetching watchlist:', watchlistError);
      return NextResponse.json(
        { error: 'Failed to fetch watchlist' },
        { status: 500 }
      );
    }

    if (!watchlistItems || watchlistItems.length === 0) {
      return NextResponse.json({
        results: [],
        stats: {
          total: 0,
          actionable: 0,
          byAction: {},
          byConfidence: {},
          avgRiskReward: 0,
        },
        message: 'No symbols in watchlist to scan',
      });
    }

    // Scan all watchlist items
    console.log(`Scanning ${watchlistItems.length} symbols for user ${user.id}`);
    let scanResults = await scanWatchlist(watchlistItems as WatchlistItem[]);

    // Apply filters if criteria provided
    if (criteria) {
      scanResults = applyScanCriteria(scanResults, criteria);
    }

    // Sort results
    scanResults = sortScanResults(scanResults, sortBy);

    // Calculate stats
    const stats = getScanStats(scanResults);

    // Optionally save results to database for historical tracking
    // (We'll implement this later when needed)

    return NextResponse.json({
      results: scanResults,
      stats,
      scannedAt: new Date().toISOString(),
      symbolsScanned: watchlistItems.length,
    });
  } catch (error) {
    console.error('Error in scanner API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scanner
 *
 * Get the last scan results for the user (from database)
 * This is for future implementation when we save scan results
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch latest scan results from database
    const { data: opportunities, error: dbError } = await supabase
      .from('market_opportunities')
      .select('*')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(100); // Limit to 100 most recent

    if (dbError) {
      console.error('Error fetching opportunities:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch scan results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      opportunities: opportunities || [],
    });
  } catch (error) {
    console.error('Error in scanner GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
