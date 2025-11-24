/*
  # Drop Unused Authentication Tables

  1. Tables Dropped
    - `users` - Not needed, app uses email-based sessions
    - `user_favorites` - Not needed, using existing `bookmarks` table instead
  
  2. Security
    - Removes foreign key constraints safely
    - Cleans up unused RLS policies
  
  3. Important Notes
    - The `bookmarks` table already exists and uses `user_email` directly
    - No data loss as these tables were never used in production
*/

-- Drop user_favorites table (references users)
DROP TABLE IF EXISTS user_favorites CASCADE;

-- Drop users table
DROP TABLE IF EXISTS users CASCADE;