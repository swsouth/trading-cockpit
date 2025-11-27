/**
 * Stock Universe Analytics
 *
 * Functions for querying stock performance metrics across scanners
 */

import { createClient } from '@supabase/supabase-js';

export interface DailyStockAnalytics {
  symbol: string;
  company_name: string | null;
  sector: string;
  market_cap: string;
  status: 'active' | 'paused' | 'removed';
  paused_at: string | null;
  removed_at: string | null;
  opps_30d: number;
  opps_60d: number;
  opps_90d: number;
  avg_score: number;
  max_score: number | null;
  last_opportunity_date: string | null;
}

export interface IntradayStockAnalytics {
  symbol: string;
  company_name: string | null;
  sector: string;
  market_cap: string;
  is_active: boolean;
  added_at: string;
  paused_at: string | null;
  opps_7d: number;
  opps_30d: number;
  opps_90d: number;
  avg_score: number;
  max_score: number | null;
  last_opportunity_timestamp: string | null;
  days_active: number;
}

/**
 * Get analytics for daily scanner stocks
 */
export async function getDailyStockAnalytics(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<DailyStockAnalytics[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('daily_scanner_analytics')
    .select('*')
    .order('opps_90d', { ascending: false });

  if (error) {
    console.error('Error fetching daily scanner analytics:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get analytics for intraday scanner stocks
 */
export async function getIntradayStockAnalytics(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<IntradayStockAnalytics[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('intraday_scanner_analytics')
    .select('*')
    .order('opps_90d', { ascending: false });

  if (error) {
    console.error('Error fetching intraday scanner analytics:', error);
    throw error;
  }

  return data || [];
}

/**
 * Pause a stock in the daily scanner
 */
export async function pauseDailyStock(
  supabaseUrl: string,
  supabaseAnonKey: string,
  symbol: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error } = await supabase.rpc('pause_daily_stock', {
    stock_symbol: symbol,
  });

  if (error) {
    console.error('Error pausing daily stock:', error);
    throw error;
  }
}

/**
 * Resume a stock in the daily scanner
 */
export async function resumeDailyStock(
  supabaseUrl: string,
  supabaseAnonKey: string,
  symbol: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error } = await supabase.rpc('resume_daily_stock', {
    stock_symbol: symbol,
  });

  if (error) {
    console.error('Error resuming daily stock:', error);
    throw error;
  }
}

/**
 * Pause a stock in the intraday scanner
 */
export async function pauseIntradayStock(
  supabaseUrl: string,
  supabaseAnonKey: string,
  symbol: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error } = await supabase.rpc('pause_intraday_stock', {
    stock_symbol: symbol,
  });

  if (error) {
    console.error('Error pausing intraday stock:', error);
    throw error;
  }
}

/**
 * Resume a stock in the intraday scanner
 */
export async function resumeIntradayStock(
  supabaseUrl: string,
  supabaseAnonKey: string,
  symbol: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error } = await supabase.rpc('resume_intraday_stock', {
    stock_symbol: symbol,
  });

  if (error) {
    console.error('Error resuming intraday stock:', error);
    throw error;
  }
}

/**
 * Get summary stats for daily scanner
 */
export async function getDailyScannerSummary(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{
  totalStocks: number;
  activeStocks: number;
  pausedStocks: number;
  totalOpportunities: number;
  avgScore: number;
}> {
  const analytics = await getDailyStockAnalytics(supabaseUrl, supabaseAnonKey);

  const totalStocks = analytics.length;
  const activeStocks = analytics.filter((s) => s.status === 'active').length;
  const pausedStocks = analytics.filter((s) => s.status === 'paused').length;
  const totalOpportunities = analytics.reduce((sum, s) => sum + s.opps_90d, 0);
  const avgScore =
    analytics.length > 0
      ? Math.round(analytics.reduce((sum, s) => sum + s.avg_score, 0) / analytics.length)
      : 0;

  return {
    totalStocks,
    activeStocks,
    pausedStocks,
    totalOpportunities,
    avgScore,
  };
}

/**
 * Get summary stats for intraday scanner
 */
export async function getIntradayScannerSummary(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{
  totalStocks: number;
  activeStocks: number;
  pausedStocks: number;
  totalOpportunities: number;
  avgScore: number;
}> {
  const analytics = await getIntradayStockAnalytics(supabaseUrl, supabaseAnonKey);

  const totalStocks = analytics.length;
  const activeStocks = analytics.filter((s) => s.is_active).length;
  const pausedStocks = analytics.filter((s) => !s.is_active).length;
  const totalOpportunities = analytics.reduce((sum, s) => sum + s.opps_90d, 0);
  const avgScore =
    analytics.length > 0
      ? Math.round(analytics.reduce((sum, s) => sum + s.avg_score, 0) / analytics.length)
      : 0;

  return {
    totalStocks,
    activeStocks,
    pausedStocks,
    totalOpportunities,
    avgScore,
  };
}

/**
 * Get performance tier for a stock based on opportunities
 */
export function getPerformanceTier(
  opps: number
): 'high' | 'medium' | 'low' | 'none' {
  if (opps >= 15) return 'high';
  if (opps >= 5) return 'medium';
  if (opps >= 1) return 'low';
  return 'none';
}

/**
 * Get color class for performance tier
 */
export function getPerformanceColor(tier: 'high' | 'medium' | 'low' | 'none'): string {
  switch (tier) {
    case 'high':
      return 'text-green-600 bg-green-50';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
      return 'text-orange-600 bg-orange-50';
    case 'none':
      return 'text-gray-600 bg-gray-50';
  }
}
