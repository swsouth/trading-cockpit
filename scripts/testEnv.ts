/**
 * Test Environment Variable Loading
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

console.log('Loading .env.local from:', path.resolve(__dirname, '../.env.local'));
const result = dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (result.error) {
  console.error('Error loading .env.local:', result.error);
} else {
  console.log('\nEnvironment variables loaded successfully!');
}

console.log('\nAPI Key Status:');
console.log('TWELVE_DATA_API_KEY:', process.env.TWELVE_DATA_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('FMP_API_KEY:', process.env.FMP_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
