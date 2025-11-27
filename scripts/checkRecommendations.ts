import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecommendations() {
  try {
    const { data, error, count } = await supabase
      .from('trade_recommendations')
      .select('*', { count: 'exact' })
      .order('opportunity_score', { ascending: false });

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log(`\nTotal recommendations: ${count}\n`);

    if (data && data.length > 0) {
      console.log('All recommendations:');
      data.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.symbol} - Score: ${rec.opportunity_score} - Date: ${rec.scan_date} - Type: ${rec.recommendation_type}`);
      });

      // Check scan dates
      const uniqueDates = Array.from(new Set(data.map(r => r.scan_date)));
      console.log(`\nUnique scan dates: ${uniqueDates.join(', ')}`);

      // Check if these are test data
      const testSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META', 'AMD'];
      const hasTestData = data.some(r => testSymbols.includes(r.symbol));
      if (hasTestData) {
        console.log('\n⚠️  These appear to be test recommendations (from npm run test-populate)');
      }
    } else {
      console.log('No recommendations found.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

checkRecommendations();
