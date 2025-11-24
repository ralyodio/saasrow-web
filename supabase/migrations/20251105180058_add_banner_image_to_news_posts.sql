/*
  # Add banner image support to news posts

  1. Schema Changes
    - Add `banner_image` column to `news_posts` table
      - `banner_image` (text, nullable) - URL to banner image in storage

  2. Purpose
    - Store AI-generated banner images for each news post
    - Optional field that can be added after post generation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_posts' AND column_name = 'banner_image'
  ) THEN
    ALTER TABLE news_posts ADD COLUMN banner_image text;
  END IF;
END $$;
