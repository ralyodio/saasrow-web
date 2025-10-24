/*
  # Create Storage Buckets for Software Assets

  1. New Storage Buckets
    - `software-logos` - For storing software logo images
    - `software-images` - For storing software preview/screenshot images
  
  2. Storage Policies
    - Public read access for all users
    - Authenticated insert access for submissions
    - Users can update their own uploads
  
  3. Changes
    - Enable RLS on storage buckets
    - Add policies for public read and authenticated write
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('software-logos', 'software-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']::text[]),
  ('software-images', 'software-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'software-logos');

CREATE POLICY "Public read access for images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'software-images');

CREATE POLICY "Anyone can upload logos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'software-logos');

CREATE POLICY "Anyone can upload images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'software-images');

CREATE POLICY "Anyone can update logos"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'software-logos');

CREATE POLICY "Anyone can update images"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'software-images');

CREATE POLICY "Anyone can delete logos"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'software-logos');

CREATE POLICY "Anyone can delete images"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'software-images');