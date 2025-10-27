/*
  # Rename bookmarks table to favorites

  1. Changes
    - Rename `bookmarks` table to `favorites`
    - Preserve all existing data and relationships
    - Maintain RLS policies
  
  2. Security
    - All existing RLS policies are preserved
    - Foreign key constraints remain intact
*/

-- Rename the table
ALTER TABLE IF EXISTS bookmarks RENAME TO favorites;