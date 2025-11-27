// Quick earnings filter - run AFTER daily scanner completes
// Usage: npx tsx scripts/filterEarnings.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EarningsEvent {
  symbol: string;
  reportDate: string;
  estimate?: number;
}

async function getUpcomingEarnings(): Promise<EarningsEvent[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  No Alpha Vantage API key - skipping earnings filter');
    return [];
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${apiKey}`
    );

    const csvText = await response.text();

    // Parse CSV (format: symbol,name,reportDate,fiscalDateEnding,estimate,currency)
    const lines = csvText.split('\n').slice(1); // Skip header
    const earnings: EarningsEvent[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const [symbol, , reportDate, , estimate] = line.split(',');
      if (symbol && reportDate) {
        earnings.push({
          symbol: symbol.trim(),
          reportDate: reportDate.trim(),
          estimate: estimate ? parseFloat(estimate) : undefined
        });
      }
    }

    console.log(`✅ Fetched ${earnings.length} upcoming earnings events`);
    return earnings;

  } catch (error) {
    console.error('❌ Failed to fetch earnings calendar:', error);
    return [];
  }
}

function daysBetween(date1: Date, date2: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diff = date2.getTime() - date1.getTime();
  return Math.round(diff / MS_PER_DAY);
}

async function filterRecommendations() {
  console.log('\n🔍 Earnings Filter Started\n');

  // 1. Get today's recommendations
  const { data: recommendations, error: recError } = await supabase
    .from('trade_recommendations')
    .select('*')
    .gte('scan_date', new Date().toISOString().split('T')[0])
    .eq('is_active', true);

  if (recError || !recommendations) {
    console.error('❌ Failed to fetch recommendations:', recError);
    return;
  }

  console.log(`📊 Found ${recommendations.length} recommendations from today's scan\n`);

  if (recommendations.length === 0) {
    console.log('ℹ️  No recommendations to filter (scanner may not have run yet)');
    return;
  }

  // 2. Get upcoming earnings
  const earningsEvents = await getUpcomingEarnings();

  if (earningsEvents.length === 0) {
    console.log('ℹ️  No earnings data - keeping all recommendations');
    return;
  }

  // 3. Filter out stocks with earnings within ±3 days
  const today = new Date();
  const filtered: string[] = [];

  for (const rec of recommendations) {
    const earnings = earningsEvents.find(e => e.symbol === rec.symbol);

    if (!earnings) continue; // No earnings scheduled, keep it

    const reportDate = new Date(earnings.reportDate);
    const daysUntil = daysBetween(today, reportDate);

    // Skip if earnings within ±3 days
    if (daysUntil >= -1 && daysUntil <= 3) {
      filtered.push(rec.symbol);
      console.log(`⚠️  Filtering ${rec.symbol} (earnings in ${daysUntil} days on ${earnings.reportDate})`);
    }
  }

  // 4. Mark filtered recommendations as inactive
  if (filtered.length > 0) {
    const { error: updateError } = await supabase
      .from('trade_recommendations')
      .update({ is_active: false, rationale: 'Filtered: Earnings within 3 days' })
      .in('symbol', filtered)
      .gte('scan_date', new Date().toISOString().split('T')[0]);

    if (updateError) {
      console.error('❌ Failed to update recommendations:', updateError);
    } else {
      console.log(`\n✅ Filtered ${filtered.length} recommendations due to upcoming earnings`);
      console.log(`📈 ${recommendations.length - filtered.length} recommendations remain active\n`);
    }
  } else {
    console.log('\n✅ No recommendations filtered - all stocks are clear of earnings\n');
  }

  // 5. Show final top 10
  const { data: finalRecs } = await supabase
    .from('trade_recommendations')
    .select('symbol, opportunity_score, recommendation_type, entry_price')
    .eq('is_active', true)
    .gte('scan_date', new Date().toISOString().split('T')[0])
    .order('opportunity_score', { ascending: false })
    .limit(10);

  if (finalRecs && finalRecs.length > 0) {
    console.log('🏆 Top 10 Recommendations (after earnings filter):\n');
    finalRecs.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.symbol} - Score: ${rec.opportunity_score}, Type: ${rec.recommendation_type}, Entry: $${rec.entry_price}`);
    });
  }
}

// Run the filter
filterRecommendations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Filter failed:', error);
    process.exit(1);
  });
