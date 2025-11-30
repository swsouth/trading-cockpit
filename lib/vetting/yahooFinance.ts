/**
 * Yahoo Finance Integration
 *
 * Provides fundamental data, earnings calendar, and analyst ratings
 * using yahoo-finance2 package (free, unlimited API calls)
 *
 * Cost savings: $0/month vs. $14.99/month for FMP fundamentals
 */

import YahooFinance from 'yahoo-finance2';
import type { FundamentalData, EarningsCalendar, AnalystRating } from './types';

// Create Yahoo Finance instance (v3.x requires instantiation)
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});

// Cache with 1-hour TTL for fundamental data (changes infrequently)
const fundamentalCache = new Map<string, { data: FundamentalData; timestamp: number }>();
const FUNDAMENTAL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Cache with 24-hour TTL for earnings data (updates daily)
const earningsCache = new Map<string, { data: EarningsCalendar | null; timestamp: number }>();
const EARNINGS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get fundamental data for a stock (P/E, market cap, debt/equity, etc.)
 * Free and unlimited - replaces FMP fundamentals API
 */
export async function getFundamentals(symbol: string): Promise<FundamentalData> {
  // Check cache
  const cached = fundamentalCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < FUNDAMENTAL_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch quote summary (contains fundamental metrics)
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'price']
    });

    const summaryDetail = result.summaryDetail;
    const keyStats = result.defaultKeyStatistics;
    const financialData = result.financialData;
    const price = result.price;

    const fundamentals: FundamentalData = {
      symbol,
      marketCap: (price?.marketCap as number) || 0,
      peRatio: summaryDetail?.trailingPE || keyStats?.trailingEps ?
        ((summaryDetail?.trailingPE as number) || null) : null,
      debtToEquity: (financialData?.debtToEquity as number) || null,
      averageVolume: ((summaryDetail?.averageVolume as number) || (price?.averageVolume as number)) || 0,
      beta: (keyStats?.beta as number) || null,
      dividendYield: (summaryDetail?.dividendYield as number) || null,
      industry: (price?.industry as string) || 'Unknown',
      sector: (price?.sector as string) || 'Unknown',
    };

    // Cache the result
    fundamentalCache.set(symbol, { data: fundamentals, timestamp: Date.now() });

    console.log(`✅ Fetched fundamentals for ${symbol} from Yahoo Finance`);
    return fundamentals;
  } catch (error) {
    console.error(`Error fetching fundamentals for ${symbol}:`, error);
    throw new Error(`Failed to fetch fundamentals for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get upcoming earnings date for a stock
 * Critical for vetting - avoid trades within 7 days of earnings
 */
export async function getEarningsCalendar(symbol: string): Promise<EarningsCalendar | null> {
  // Check cache
  const cached = earningsCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < EARNINGS_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch calendar events (includes earnings date)
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['calendarEvents', 'earnings']
    });

    const calendarEvents = result.calendarEvents;
    const earnings = result.earnings;

    // Get next earnings date
    const earningsDate = calendarEvents?.earnings?.earningsDate?.[0];

    if (!earningsDate) {
      // No upcoming earnings data available
      earningsCache.set(symbol, { data: null, timestamp: Date.now() });
      return null;
    }

    const earningsDateObj = new Date(earningsDate);
    const today = new Date();
    const daysUntilEarnings = Math.ceil((earningsDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Get estimated EPS from earnings history
    const estimatedEPS = earnings?.earningsChart?.quarterly?.[0]?.estimate || undefined;

    const earningsInfo: EarningsCalendar = {
      symbol,
      earningsDate: earningsDateObj.toISOString(),
      daysUntilEarnings,
      estimatedEPS,
    };

    // Cache the result
    earningsCache.set(symbol, { data: earningsInfo, timestamp: Date.now() });

    console.log(`✅ Earnings for ${symbol}: ${daysUntilEarnings} days away (${earningsDateObj.toLocaleDateString()})`);
    return earningsInfo;
  } catch (error) {
    console.error(`Error fetching earnings calendar for ${symbol}:`, error);
    // Cache null to avoid repeated failures
    earningsCache.set(symbol, { data: null, timestamp: Date.now() });
    return null;
  }
}

/**
 * Get analyst ratings and price targets
 * Useful for sentiment validation
 */
export async function getAnalystRatings(symbol: string): Promise<AnalystRating | null> {
  try {
    // Fetch recommendation trend from Yahoo Finance
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['recommendationTrend', 'financialData']
    });

    const recommendationTrend = result.recommendationTrend;
    const financialData = result.financialData;

    if (!recommendationTrend?.trend || recommendationTrend.trend.length === 0) {
      return null;
    }

    // Get most recent trend
    const latestTrend = recommendationTrend.trend[0];

    // Calculate average rating (1=strong buy, 5=strong sell)
    const buy = latestTrend.strongBuy || 0;
    const hold = latestTrend.hold || 0;
    const sell = latestTrend.sell || 0;
    const strongSell = latestTrend.strongSell || 0;
    const strongBuy = latestTrend.strongBuy || 0;

    const totalAnalysts = buy + hold + sell + strongSell + strongBuy;

    if (totalAnalysts === 0) {
      return null;
    }

    // Weighted average: 1=strong_buy, 2=buy, 3=hold, 4=sell, 5=strong_sell
    const avgScore = (
      (strongBuy * 1) +
      (buy * 2) +
      (hold * 3) +
      (sell * 4) +
      (strongSell * 5)
    ) / totalAnalysts;

    // Convert to rating
    let rating: AnalystRating['rating'];
    if (avgScore <= 1.5) rating = 'strong_buy';
    else if (avgScore <= 2.5) rating = 'buy';
    else if (avgScore <= 3.5) rating = 'hold';
    else if (avgScore <= 4.5) rating = 'sell';
    else rating = 'strong_sell';

    const analystRating: AnalystRating = {
      symbol,
      rating,
      targetPrice: financialData?.targetMeanPrice || null,
      numberOfAnalysts: totalAnalysts,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`✅ Analyst rating for ${symbol}: ${rating} (${totalAnalysts} analysts)`);
    return analystRating;
  } catch (error) {
    console.error(`Error fetching analyst ratings for ${symbol}:`, error);
    return null;
  }
}

/**
 * Batch fetch fundamentals for multiple symbols
 * More efficient than individual calls
 */
export async function batchGetFundamentals(symbols: string[]): Promise<Map<string, FundamentalData>> {
  const results = new Map<string, FundamentalData>();

  // Process in batches of 10 to avoid overwhelming Yahoo API
  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (symbol) => {
        try {
          const fundamentals = await getFundamentals(symbol);
          results.set(symbol, fundamentals);
        } catch (error) {
          console.warn(`Skipping ${symbol} - fundamentals fetch failed:`, error);
        }
      })
    );

    // Small delay between batches to be polite
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
