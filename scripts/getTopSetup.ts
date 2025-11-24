import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTopSetups() {
  try {
    const { data, error } = await supabase
      .from('trade_recommendations')
      .select('*')
      .order('opportunity_score', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('  TOP 3 TRADE RECOMMENDATIONS');
      console.log('═══════════════════════════════════════════════════════════\n');

      data.forEach((rec, i) => {
        const rr = ((rec.target_price - rec.entry_price) / (rec.entry_price - rec.stop_loss)).toFixed(2);
        const risk = (((rec.entry_price - rec.stop_loss) / rec.entry_price) * 100).toFixed(2);
        const reward = (((rec.target_price - rec.entry_price) / rec.entry_price) * 100).toFixed(2);

        console.log(`${i + 1}. ${rec.symbol} - ${rec.recommendation_type.toUpperCase()}`);
        console.log(`   Score: ${rec.opportunity_score} | Confidence: ${rec.confidence_level}`);
        console.log(`   Entry:  $${rec.entry_price.toFixed(2)}`);
        console.log(`   Target: $${rec.target_price.toFixed(2)} (+${reward}%)`);
        console.log(`   Stop:   $${rec.stop_loss.toFixed(2)} (-${risk}%)`);
        console.log(`   R:R Ratio: ${rr}:1`);
        console.log(`   Rationale: ${rec.rationale}`);
        console.log('');
      });
    } else {
      console.log('No recommendations found.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

getTopSetups();
