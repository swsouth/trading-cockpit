/**
 * API Rate Limit Tracking (Database-Backed)
 *
 * Tracks API usage across serverless function invocations using Supabase.
 * Handles minute and daily rate limits.
 */

import { createClient } from '@supabase/supabase-js';

export interface RateLimitInfo {
  limitPerMinute: number;
  limitPerDay: number;
  usedThisMinute: number;
  usedToday: number;
  minuteResetTime: Date;
  percentUsedMinute: number;
  percentUsedDay: number;
}

/**
 * Track an API call and return current usage stats
 */
export async function trackApiCall(
  apiName: string,
  limitsConfig: { perMinute: number; perDay: number }
): Promise<RateLimitInfo> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing for rate limit tracking');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();

  // Calculate current minute window (truncate to minute)
  const currentMinute = new Date(now);
  currentMinute.setSeconds(0, 0);

  // Calculate current day window (truncate to day)
  const currentDay = new Date(now);
  currentDay.setHours(0, 0, 0, 0);

  // Increment minute counter
  const { data: minuteData } = await supabase
    .from('api_rate_limits')
    .upsert({
      api_name: apiName,
      time_window: 'minute',
      window_start: currentMinute.toISOString(),
      calls_count: 1,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'api_name,time_window,window_start',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  // If record existed, increment it
  if (minuteData && minuteData.calls_count === 1) {
    // New record, already at 1
  } else {
    // Existing record, increment
    await supabase
      .from('api_rate_limits')
      .update({
        calls_count: (minuteData?.calls_count || 0) + 1,
        updated_at: now.toISOString(),
      })
      .eq('api_name', apiName)
      .eq('time_window', 'minute')
      .eq('window_start', currentMinute.toISOString());
  }

  // Increment day counter
  await supabase
    .from('api_rate_limits')
    .upsert({
      api_name: apiName,
      time_window: 'day',
      window_start: currentDay.toISOString(),
      calls_count: 1,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'api_name,time_window,window_start',
      ignoreDuplicates: false,
    });

  // Get updated counts
  const { data: minuteCount } = await supabase
    .from('api_rate_limits')
    .select('calls_count')
    .eq('api_name', apiName)
    .eq('time_window', 'minute')
    .eq('window_start', currentMinute.toISOString())
    .single();

  const { data: dayCount } = await supabase
    .from('api_rate_limits')
    .select('calls_count')
    .eq('api_name', apiName)
    .eq('time_window', 'day')
    .eq('window_start', currentDay.toISOString())
    .single();

  const usedThisMinute = minuteCount?.calls_count || 0;
  const usedToday = dayCount?.calls_count || 0;

  // Calculate reset time (next minute)
  const minuteResetTime = new Date(currentMinute);
  minuteResetTime.setMinutes(minuteResetTime.getMinutes() + 1);

  return {
    limitPerMinute: limitsConfig.perMinute,
    limitPerDay: limitsConfig.perDay,
    usedThisMinute,
    usedToday,
    minuteResetTime,
    percentUsedMinute: Math.round((usedThisMinute / limitsConfig.perMinute) * 100),
    percentUsedDay: Math.round((usedToday / limitsConfig.perDay) * 100),
  };
}

/**
 * Get current rate limit info without incrementing
 */
export async function getRateLimitInfo(
  apiName: string,
  limitsConfig: { perMinute: number; perDay: number }
): Promise<RateLimitInfo> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use anon key for reads

  if (!supabaseUrl || !supabaseKey) {
    return {
      limitPerMinute: limitsConfig.perMinute,
      limitPerDay: limitsConfig.perDay,
      usedThisMinute: 0,
      usedToday: 0,
      minuteResetTime: new Date(Date.now() + 60000),
      percentUsedMinute: 0,
      percentUsedDay: 0,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();

  // Calculate current minute window
  const currentMinute = new Date(now);
  currentMinute.setSeconds(0, 0);

  // Calculate current day window
  const currentDay = new Date(now);
  currentDay.setHours(0, 0, 0, 0);

  // Get counts
  const { data: minuteCount } = await supabase
    .from('api_rate_limits')
    .select('calls_count')
    .eq('api_name', apiName)
    .eq('time_window', 'minute')
    .eq('window_start', currentMinute.toISOString())
    .maybeSingle();

  const { data: dayCount } = await supabase
    .from('api_rate_limits')
    .select('calls_count')
    .eq('api_name', apiName)
    .eq('time_window', 'day')
    .eq('window_start', currentDay.toISOString())
    .maybeSingle();

  const usedThisMinute = minuteCount?.calls_count || 0;
  const usedToday = dayCount?.calls_count || 0;

  // Calculate reset time (next minute)
  const minuteResetTime = new Date(currentMinute);
  minuteResetTime.setMinutes(minuteResetTime.getMinutes() + 1);

  return {
    limitPerMinute: limitsConfig.perMinute,
    limitPerDay: limitsConfig.perDay,
    usedThisMinute,
    usedToday,
    minuteResetTime,
    percentUsedMinute: Math.round((usedThisMinute / limitsConfig.perMinute) * 100),
    percentUsedDay: Math.round((usedToday / limitsConfig.perDay) * 100),
  };
}
