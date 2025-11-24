import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCount() {
  try {
    const { count, error } = await supabase
      .from('scan_universe')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error querying scan_universe:', error);
      process.exit(1);
    }

    console.log(`\nTotal records in scan_universe: ${count}\n`);

    // Also get a breakdown by sector
    const { data: sectors, error: sectorError } = await supabase
      .from('scan_universe')
      .select('sector');

    if (!sectorError && sectors) {
      const sectorCounts = sectors.reduce((acc, { sector }) => {
        acc[sector] = (acc[sector] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Breakdown by sector:');
      Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]).forEach(([sector, count]) => {
        console.log(`  ${sector}: ${count}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

checkCount();
