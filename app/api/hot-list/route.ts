import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/hot-list
 *
 * Fetch user's hot list items with full recommendation details
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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Fetch hot list items with full recommendation details (JOIN)
    const { data: hotListItems, error: dbError } = await supabase
      .from('hot_list_items')
      .select(`
        id,
        pinned_at,
        notes,
        trade_recommendations (
          id,
          symbol,
          scan_date,
          recommendation_type,
          setup_type,
          timeframe,
          entry_price,
          target_price,
          stop_loss,
          risk_amount,
          reward_amount,
          risk_reward_ratio,
          opportunity_score,
          confidence_level,
          current_price,
          channel_status,
          pattern_detected,
          volume_status,
          rsi,
          trend,
          rationale,
          expires_at,
          vetting_score,
          vetting_passed,
          vetting_summary,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('pinned_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching hot list:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch hot list' },
        { status: 500 }
      );
    }

    // Transform data to flatten recommendation details
    const formattedItems = hotListItems?.map(item => ({
      hot_list_id: item.id,
      pinned_at: item.pinned_at,
      notes: item.notes,
      // Flatten recommendation details
      ...(Array.isArray(item.trade_recommendations)
        ? item.trade_recommendations[0]
        : item.trade_recommendations),
    })) || [];

    return NextResponse.json({
      items: formattedItems,
      total: formattedItems.length,
    });
  } catch (error) {
    console.error('Error in hot-list GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hot-list
 *
 * Add a recommendation to user's hot list
 *
 * Body: { recommendation_id: string, notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { recommendation_id, notes } = body;

    if (!recommendation_id) {
      return NextResponse.json(
        { error: 'Missing recommendation_id' },
        { status: 400 }
      );
    }

    // Insert hot list item
    const { data, error: insertError } = await supabase
      .from('hot_list_items')
      .insert({
        user_id: user.id,
        recommendation_id,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      // Check for unique constraint violation (already pinned)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'This recommendation is already in your hot list' },
          { status: 409 }
        );
      }

      console.error('Error adding to hot list:', insertError);
      return NextResponse.json(
        { error: 'Failed to add to hot list' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch (error) {
    console.error('Error in hot-list POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hot-list
 *
 * Remove a recommendation from user's hot list
 *
 * Query params: ?hot_list_id=uuid
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Get hot_list_id from query params
    const { searchParams } = new URL(request.url);
    const hot_list_id = searchParams.get('hot_list_id');

    if (!hot_list_id) {
      return NextResponse.json(
        { error: 'Missing hot_list_id query parameter' },
        { status: 400 }
      );
    }

    // Delete hot list item (RLS ensures user can only delete their own items)
    const { error: deleteError } = await supabase
      .from('hot_list_items')
      .delete()
      .eq('id', hot_list_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error removing from hot list:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove from hot list' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in hot-list DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
