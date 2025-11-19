/*
  # Enable Demo Profile Access

  This migration removes foreign key constraints temporarily to allow demo mode without authentication.
  
  1. Changes
    - Drop foreign key constraint from profiles to auth.users
    - Insert demo profile record
    
  2. Security
    - This is temporary for single-user demo mode
    - Will be re-added when authentication is implemented
*/

-- Drop the foreign key constraint from profiles to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop foreign key constraints from other tables to profiles (we'll recreate them as non-enforced)
ALTER TABLE watchlist_items DROP CONSTRAINT IF EXISTS watchlist_items_user_id_fkey;
ALTER TABLE ticker_notes DROP CONSTRAINT IF EXISTS ticker_notes_user_id_fkey;
ALTER TABLE uploads DROP CONSTRAINT IF EXISTS uploads_user_id_fkey;
ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_user_id_fkey;
ALTER TABLE combined_signals DROP CONSTRAINT IF EXISTS combined_signals_user_id_fkey;

-- Insert demo profile
INSERT INTO profiles (id, display_name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Demo User')
ON CONFLICT (id) DO NOTHING;
