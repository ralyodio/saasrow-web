/*
  # Create Storage Bucket for News Banners

  1. New Storage Bucket
    - `news-banners` - For storing AI-generated banner images for news posts
  
  2. Storage Policies
    - Public read access for all users
    - Authenticated insert access for admin functions
  
  3. Configuration
    - File size limit: 5MB
    - Allowed types: PNG, JPEG, JPG, WEBP
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('news-banners', 'news-banners', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for news banners"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'news-banners');

CREATE POLICY "Anyone can upload news banners"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'news-banners');

CREATE POLICY "Anyone can update news banners"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'news-banners');

CREATE POLICY "Anyone can delete news banners"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'news-banners');
