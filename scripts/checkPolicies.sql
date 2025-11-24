-- Run this query in Supabase SQL Editor to check RLS policies

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'trade_recommendations';

-- Check existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'trade_recommendations';

-- Count rows (should be 8)
SELECT COUNT(*) as total_rows FROM trade_recommendations;

-- Check active recommendations
SELECT
  COUNT(*) as active_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_true,
  COUNT(*) FILTER (WHERE recommendation_type = 'long') as long_count,
  COUNT(*) FILTER (WHERE recommendation_type = 'short') as short_count
FROM trade_recommendations;
