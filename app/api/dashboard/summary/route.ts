/**
 * Dashboard Summary API
 *
 * Aggregates data from multiple sources to create a "Mission Control" view:
 * - Performance metrics (P/L, win rate, open positions)
 * - Top 3 recommendations (highest scoring opportunities)
 * - Active positions (up to 3 most recent)
 * - Scan status (last scan time, next scan, opportunities found)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DashboardSummary {
  performance: {
    totalPL: number;
    todaysPL: number;
    winRate: number;
    openPositions: number;
  };
  topOpportunities: any[];
  activePositions: any[];
  scanStatus: {
    lastScan: string | null;
    nextScan: string | null;
    opportunitiesFound: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Parallel data fetching for performance
    const [
      recommendationsResult,
      positionsResult,
      closedTradesResult,
    ] = await Promise.all([
      // Top 3 recommendations (highest scores, active only)
      supabase
        .from('trade_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('opportunity_score', 60) // Only medium+ confidence
        .order('opportunity_score', { ascending: false })
        .limit(3),

      // Active paper trading positions
      supabase
        .from('paper_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(3),

      // Closed trades for win rate calculation
      supabase
        .from('paper_positions')
        .select('exit_price, entry_price, side')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .not('exit_price', 'is', null)
    ]);

    // Handle errors
    if (recommendationsResult.error) {
      console.error('Error fetching recommendations:', recommendationsResult.error);
    }
    if (positionsResult.error) {
      console.error('Error fetching positions:', positionsResult.error);
    }
    if (closedTradesResult.error) {
      console.error('Error fetching closed trades:', closedTradesResult.error);
    }

    const recommendations = recommendationsResult.data || [];
    const positions = positionsResult.data || [];
    const closedTrades = closedTradesResult.data || [];

    // Calculate performance metrics
    const totalPL = positions.reduce((sum, pos) => {
      const unrealizedPL = pos.current_price
        ? (pos.side === 'long'
            ? (pos.current_price - pos.entry_price) * pos.quantity
            : (pos.entry_price - pos.current_price) * pos.quantity)
        : 0;
      return sum + unrealizedPL;
    }, 0);

    // Calculate today's P/L (positions opened today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysPL = positions
      .filter(pos => new Date(pos.created_at) >= today)
      .reduce((sum, pos) => {
        const unrealizedPL = pos.current_price
          ? (pos.side === 'long'
              ? (pos.current_price - pos.entry_price) * pos.quantity
              : (pos.entry_price - pos.current_price) * pos.quantity)
          : 0;
        return sum + unrealizedPL;
      }, 0);

    // Calculate win rate from closed trades
    let winRate = 0;
    if (closedTrades.length > 0) {
      const wins = closedTrades.filter(trade => {
        if (trade.side === 'long') {
          return trade.exit_price > trade.entry_price;
        } else {
          return trade.exit_price < trade.entry_price;
        }
      }).length;
      winRate = (wins / closedTrades.length) * 100;
    }

    // Get scan status (most recent recommendation scan date)
    const lastScan = recommendations.length > 0
      ? recommendations[0].scan_date
      : null;

    const summary: DashboardSummary = {
      performance: {
        totalPL: Math.round(totalPL * 100) / 100,
        todaysPL: Math.round(todaysPL * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        openPositions: positions.length,
      },
      topOpportunities: recommendations,
      activePositions: positions,
      scanStatus: {
        lastScan,
        nextScan: null, // TODO: Calculate based on cron schedule
        opportunitiesFound: recommendations.length,
      },
    };

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60', // 5min cache
      },
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
