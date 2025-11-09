import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST /api/analytics/paywall
 * Log a paywall event to the database
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { eventType, triggerLocation, metadata = {} } = body;

    // 3. Validate required fields
    if (!eventType || !triggerLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, triggerLocation' },
        { status: 400 }
      );
    }

    // 4. Insert event into database
    const { error: insertError } = await supabaseAdmin
      .from('paywall_events')
      .insert({
        user_id: user.id,
        event_type: eventType,
        trigger_location: triggerLocation,
        metadata,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting paywall event:', insertError);
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/analytics/paywall:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/paywall
 * Get paywall analytics summary (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // 2. Check if user is admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // 4. Build query
    let query = supabaseAdmin
      .from('paywall_events')
      .select('event_type, trigger_location, created_at');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: events, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching paywall events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // 5. Calculate metrics
    const totalEvents = events.length;
    const eventsByType = events.reduce((acc: Record<string, number>, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    const eventsByLocation = events.reduce((acc: Record<string, number>, event) => {
      acc[event.trigger_location] = (acc[event.trigger_location] || 0) + 1;
      return acc;
    }, {});

    // Calculate conversion rate (checkouts completed / modals shown)
    const modalsShown = eventsByType['modal_shown'] || 0;
    const checkoutsCompleted = eventsByType['checkout_completed'] || 0;
    const conversionRate = modalsShown > 0
      ? ((checkoutsCompleted / modalsShown) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      totalEvents,
      eventsByType,
      eventsByLocation,
      conversionRate: `${conversionRate}%`,
      dateRange: {
        start: startDate || 'all time',
        end: endDate || 'now',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/paywall:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
