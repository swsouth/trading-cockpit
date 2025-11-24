/**
 * Test querying recommendations as an authenticated user (not service role)
 * This mimics what the API endpoint does
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testAuthQuery() {
  console.log('\n🔍 Testing authenticated user query...\n');

  // Create client with ANON key (like the API does)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Try to sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'swsouth@yahoo.com',
    password: 'your-password-here', // You'll need to enter your password
  });

  if (authError) {
    console.error('❌ Auth error:', authError.message);
    console.log('\nPlease update the script with your actual password');
    return;
  }

  console.log('✅ Authenticated as:', authData.user?.email);
  console.log('Session token:', authData.session?.access_token.substring(0, 20) + '...\n');

  // Query recommendations (exactly like the API does)
  const { data, error } = await supabase
    .from('trade_recommendations')
    .select('*')
    .eq('is_active', true)
    .order('opportunity_score', { ascending: false })
    .limit(30);

  console.log('📊 Query results:');
  console.log('   Count:', data?.length || 0);
  console.log('   Error:', error);

  if (data && data.length > 0) {
    console.log('\n✅ SUCCESS! Authenticated users CAN read the data');
    console.log('\nTop 3:');
    data.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.symbol} - Score: ${rec.opportunity_score}`);
    });
  } else if (error) {
    console.log('\n❌ ERROR querying as authenticated user');
    console.log('This suggests an RLS policy issue');
  } else {
    console.log('\n❌ No data returned (but no error either)');
    console.log('The data might not exist, or RLS is blocking access');
  }

  // Sign out
  await supabase.auth.signOut();
}

testAuthQuery();
