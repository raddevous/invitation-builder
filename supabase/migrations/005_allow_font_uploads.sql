-- Update user-uploads bucket to allow font file MIME types
-- This bucket may have been created with a restricted mime type list
-- We need to allow font/* and application/octet-stream for font uploads

DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if the bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'user-uploads'
  ) INTO bucket_exists;

  IF NOT bucket_exists THEN
    -- Create the bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'user-uploads',
      true,
      ARRAY[
        'image/*',
        'audio/*',
        'video/*',
        'font/woff2',
        'font/woff',
        'font/ttf',
        'font/otf',
        'application/x-font-woff',
        'application/x-font-woff2',
        'application/x-font-ttf',
        'application/x-font-opentype',
        'application/font-woff',
        'application/font-woff2',
        'application/font-ttf',
        'application/font-sfnt',
        'application/octet-stream'
      ],
      10485760, -- 10MB
      now(),
      now()
    );
  ELSE
    -- Update the bucket to allow font mime types
    UPDATE storage.buckets
    SET allowed_mime_types = ARRAY[
      'image/*',
      'audio/*',
      'video/*',
      'font/woff2',
      'font/woff',
      'font/ttf',
      'font/otf',
      'application/x-font-woff',
      'application/x-font-woff2',
      'application/x-font-ttf',
      'application/x-font-opentype',
      'application/font-woff',
      'application/font-woff2',
      'application/font-ttf',
      'application/font-sfnt',
      'application/octet-stream'
    ],
    file_size_limit = 10485760, -- 10MB
    updated_at = now()
    WHERE name = 'user-uploads';
  END IF;
END $$;
