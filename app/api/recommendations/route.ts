import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TradeRecommendation } from '@/lib/types';

/**
 * GET /api/recommendations
 *
 * Fetch daily market-wide trade recommendations
 *
 * Query params (optional):
 * - direction: 'long' | 'short'
 * - confidenceLevel: 'LOW' | 'MODERATE' | 'HIGH'
 * - minScore: number (0-100)
 * - limit: number (default 30)
 * - activeOnly: boolean (default true)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with the access token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get authenticated user using the provided token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('🔐 Auth check:', {
      hasUser: !!user,
      userEmail: user?.email,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const recommendationType = searchParams.get('recommendationType') as 'long' | 'short' | null;
    const confidenceLevel = searchParams.get('confidenceLevel') as 'low' | 'medium' | 'high' | null;
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : 0;
    const minVettingScore = searchParams.get('minVettingScore') ? parseInt(searchParams.get('minVettingScore')!) : 0;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 30;
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // default true
    const sortBy = searchParams.get('sortBy') as 'score' | 'symbol' | 'confidence' | 'setup' | 'riskReward' | 'vettingScore' || 'score';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Map sort options to database columns
    const sortColumnMap = {
      score: 'opportunity_score',
      vettingScore: 'vetting_score',
      symbol: 'symbol',
      confidence: 'confidence_level',
      setup: 'setup_type',
      riskReward: 'risk_reward_ratio'
    };

    const sortColumn = sortColumnMap[sortBy] || 'opportunity_score';
    const ascending = sortOrder === 'asc';

    // Build query
    let query = supabase
      .from('trade_recommendations')
      .select('*')
      .order(sortColumn, { ascending })
      .order('created_at', { ascending: false }); // Secondary sort by date

    // Apply filters
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (recommendationType) {
      query = query.eq('recommendation_type', recommendationType);
    }

    if (confidenceLevel) {
      query = query.eq('confidence_level', confidenceLevel);
    }

    if (minScore > 0) {
      query = query.gte('opportunity_score', minScore);
    }

    if (minVettingScore > 0) {
      query = query.gte('vetting_score', minVettingScore);
    }

    query = query.limit(limit);

    // Execute query
    const { data: recommendations, error: dbError } = await query;

    console.log('📊 Query results:', {
      count: recommendations?.length || 0,
      error: dbError,
      filters: { recommendationType, confidenceLevel, minScore, activeOnly, limit }
    });

    if (dbError) {
      console.error('Error fetching recommendations:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }

    // Calculate stats
    const maxScore = recommendations && recommendations.length > 0
      ? Math.max(...recommendations.map(r => r.opportunity_score))
      : 0;

    const maxRiskReward = recommendations && recommendations.length > 0
      ? Math.max(...recommendations.map(r => r.risk_reward_ratio))
      : 0;

    console.log('📊 Calculated max values:', { maxScore, maxRiskReward, count: recommendations?.length });

    const stats = {
      total: recommendations?.length || 0,
      byType: {
        long: recommendations?.filter(r => r.recommendation_type === 'long').length || 0,
        short: recommendations?.filter(r => r.recommendation_type === 'short').length || 0,
      },
      byConfidence: {
        high: recommendations?.filter(r => r.confidence_level === 'high').length || 0,
        medium: recommendations?.filter(r => r.confidence_level === 'medium').length || 0,
        low: recommendations?.filter(r => r.confidence_level === 'low').length || 0,
      },
      avgScore: recommendations && recommendations.length > 0
        ? recommendations.reduce((sum, r) => sum + r.opportunity_score, 0) / recommendations.length
        : 0,
      avgRiskReward: recommendations && recommendations.length > 0
        ? recommendations.reduce((sum, r) => sum + r.risk_reward_ratio, 0) / recommendations.length
        : 0,
      maxScore,
      maxRiskReward,
      topScoreSymbol: recommendations?.find(r => r.opportunity_score === maxScore)?.symbol || null,
      topRiskRewardSymbol: recommendations?.find(r => r.risk_reward_ratio === maxRiskReward)?.symbol || null,
    };

    console.log('📊 Final stats object:', stats);

    // Get the latest scan date (most recent created_at timestamp)
    const latestScanDate = recommendations && recommendations.length > 0
      ? recommendations.reduce((latest, rec) => {
          return new Date(rec.created_at) > new Date(latest) ? rec.created_at : latest;
        }, recommendations[0].created_at)
      : null;

    return NextResponse.json({
      recommendations: recommendations || [],
      stats,
      latestScanDate,
    });
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
