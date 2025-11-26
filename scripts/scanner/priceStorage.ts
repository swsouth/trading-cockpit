/**
 * Price Data Storage Module
 *
 * Stores historical OHLC data from market scans into the database
 * This eliminates redundant API calls and provides persistent data
 */

import { createClient } from '@supabase/supabase-js';
import { Candle } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for price storage');
}

// Create service role client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Store OHLC price data for a single symbol
 */
export async function storePriceData(
  symbol: string,
  candles: Candle[],
  dataSource: string = 'twelvedata'
): Promise<number> {
  if (!candles || candles.length === 0) {
    console.warn(`⚠️  No candles to store for ${symbol}`);
    return 0;
  }

  try {
    // Transform candles to database records
    const priceRecords = candles.map(candle => ({
      symbol: symbol.toUpperCase(),
      date: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      adjusted_close: candle.close, // Use close price as adjusted close
      data_source: dataSource,
    }));

    // Use upsert to handle duplicates (update if exists, insert if new)
    const { data, error } = await supabase
      .from('stock_prices')
      .upsert(priceRecords, {
        onConflict: 'symbol,date',
        ignoreDuplicates: false, // Update existing records
      })
      .select('id');

    if (error) {
      console.error(`❌ Error storing prices for ${symbol}:`, error.message);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error(`❌ Exception storing prices for ${symbol}:`, error);
    return 0;
  }
}

/**
 * Store price data for multiple symbols in batch
 */
export async function storePriceDataBatch(
  priceDataMap: Map<string, Candle[]>,
  dataSource: string = 'twelvedata'
): Promise<{ total: number; successful: number; failed: number }> {
  const stats = {
    total: priceDataMap.size,
    successful: 0,
    failed: 0,
  };

  console.log(`\n💾 Storing price data for ${stats.total} symbols...`);

  // Convert Map entries to array to avoid downlevelIteration requirement
  for (const [symbol, candles] of Array.from(priceDataMap.entries())) {
    const stored = await storePriceData(symbol, candles, dataSource);

    if (stored > 0) {
      stats.successful++;
      console.log(`   ✅ ${symbol}: ${stored} bars stored`);
    } else {
      stats.failed++;
      console.log(`   ❌ ${symbol}: Failed to store`);
    }
  }

  console.log(`\n💾 Price storage complete: ${stats.successful}/${stats.total} successful\n`);

  return stats;
}

/**
 * Get the latest price date for a symbol (to determine what to fetch)
 */
export async function getLatestPriceDate(symbol: string): Promise<Date | null> {
  try {
    const { data, error } = await supabase
      .from('stock_prices')
      .select('date')
      .eq('symbol', symbol.toUpperCase())
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return new Date(data.date);
  } catch (error) {
    return null;
  }
}

/**
 * Get stored price data for a symbol
 */
export async function getStoredPriceData(
  symbol: string,
  days: number = 60
): Promise<Candle[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('stock_prices')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error || !data) {
      return [];
    }

    // Transform database records to Candle format
    return data.map(record => ({
      timestamp: record.date,
      open: parseFloat(record.open),
      high: parseFloat(record.high),
      low: parseFloat(record.low),
      close: parseFloat(record.close),
      volume: parseInt(record.volume),
    }));
  } catch (error) {
    console.error(`Error fetching stored price data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Clean up old price data (optional - keep for historical analysis)
 */
export async function cleanupOldPriceData(daysToKeep: number = 365): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('stock_prices')
      .delete()
      .lt('date', cutoffDate.toISOString().split('T')[0])
      .select('id');

    if (error) {
      console.error('Error cleaning up old price data:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Exception cleaning up old price data:', error);
    return 0;
  }
}
