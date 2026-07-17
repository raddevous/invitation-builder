-- Create table for predefined options (fonts, colors, images, videos)
CREATE TABLE IF NOT EXISTS predefined_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'heading_fonts', 'body_fonts', 'section_colors', 'background_images', 'background_videos', 'theme_colors', 'typography_fonts'
  name TEXT NOT NULL, -- Display name for the option
  value TEXT NOT NULL, -- The actual value (font name, color hex, URL, etc.)
  order_index INTEGER DEFAULT 0, -- For ordering options in UI
  is_active BOOLEAN DEFAULT true, -- To enable/disable options without deleting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by category
CREATE INDEX IF NOT EXISTS idx_predefined_options_category ON predefined_options(category);
CREATE INDEX IF NOT EXISTS idx_predefined_options_active ON predefined_options(is_active);

-- Enable RLS
ALTER TABLE predefined_options ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to predefined_options" ON predefined_options;
DROP POLICY IF EXISTS "Allow admin to modify predefined_options" ON predefined_options;

-- Allow read access to everyone (for public use)
CREATE POLICY "Allow read access to predefined_options" ON predefined_options
  FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated users (admin)
CREATE POLICY "Allow admin to modify predefined_options" ON predefined_options
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial data

-- Heading fonts
INSERT INTO predefined_options (category, name, value, order_index) VALUES
  ('heading_fonts', 'Playfair Display', 'Playfair Display', 1),
  ('heading_fonts', 'Cormorant Garamond', 'Cormorant Garamond', 2),
  ('heading_fonts', 'Lora', 'Lora', 3),
  ('heading_fonts', 'Merriweather', 'Merriweather', 4),
  ('heading_fonts', 'Libre Baskerville', 'Libre Baskerville', 5),
  ('heading_fonts', 'Cinzel', 'Cinzel', 6),
  ('heading_fonts', 'Bodoni Moda', 'Bodoni Moda', 7),
  ('heading_fonts', 'Italiana', 'Italiana', 8);

-- Body fonts
INSERT INTO predefined_options (category, name, value, order_index) VALUES
  ('body_fonts', 'Inter', 'Inter', 1),
  ('body_fonts', 'Lato', 'Lato', 2),
  ('body_fonts', 'Open Sans', 'Open Sans', 3),
  ('body_fonts', 'Roboto', 'Roboto', 4),
  ('body_fonts', 'Montserrat', 'Montserrat', 5),
  ('body_fonts', 'Poppins', 'Poppins', 6),
  ('body_fonts', 'Raleway', 'Raleway', 7),
  ('body_fonts', 'Source Sans Pro', 'Source Sans Pro', 8);

-- Section colors (for heading and message colors)
INSERT INTO predefined_options (category, name, value, order_index) VALUES
  ('section_colors', 'Black', '#000000', 1),
  ('section_colors', 'White', '#FFFFFF', 2),
  ('section_colors', 'Dark Gray', '#333333', 3),
  ('section_colors', 'Light Gray', '#666666', 4),
  ('section_colors', 'Gold', '#D4AF37', 5),
  ('section_colors', 'Rose Gold', '#B76E79', 6),
  ('section_colors', 'Sage Green', '#9CAF88', 7),
  ('section_colors', 'Navy Blue', '#1B3B5F', 8),
  ('section_colors', 'Burgundy', '#722F37', 9),
  ('section_colors', 'Champagne', '#F7E7CE', 10),
  ('section_colors', 'Blush Pink', '#DE5D83', 11),
  ('section_colors', 'Dusty Blue', '#8BA3B8', 12);

-- Background images
INSERT INTO predefined_options (category, name, value, order_index) VALUES
  ('background_images', 'Gift Package', 'https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg', 1),
  ('background_images', 'Bridal Rings', 'https://images.pexels.com/photos/372225/pexels-photo-372225.jpeg', 2),
  ('background_images', 'Elegant Flowers', 'https://images.pexels.com/photos/29509518/pexels-photo-29509518.jpeg', 3),
  ('background_images', 'Wedding Decor', 'https://images.pexels.com/photos/24838552/pexels-photo-24838552.jpeg', 4),
  ('background_images', 'Gift Box', 'https://images.pexels.com/photos/5717416/pexels-photo-5717416.jpeg', 5),
  ('background_images', 'Roses', 'https://images.pexels.com/photos/595909/pexels-photo-595909.jpeg', 6),
  ('background_images', 'Floral Arrangement', 'https://images.pexels.com/photos/5493922/pexels-photo-5493922.jpeg', 7),
  ('background_images', 'Wedding Bouquet', 'https://images.pexels.com/photos/9974582/pexels-photo-9974582.jpeg', 8),
  ('background_images', 'Romantic Setting', 'https://images.pexels.com/photos/30206392/pexels-photo-30206392.jpeg', 9),
  ('background_images', 'Wedding Table', 'https://images.pexels.com/photos/30655486/pexels-photo-30655486.jpeg', 10),
  ('background_images', 'Bridal Party', 'https://images.pexels.com/photos/14726787/pexels-photo-14726787.jpeg', 11),
  ('background_images', 'Wedding Venue', 'https://images.pexels.com/photos/34203781/pexels-photo-34203781.jpeg', 12),
  ('background_images', 'Wedding Cake', 'https://images.pexels.com/photos/9115347/pexels-photo-9115347.jpeg', 13),
  ('background_images', 'Bridal Veil', 'https://images.pexels.com/photos/5618793/pexels-photo-5618793.jpeg', 14);

-- Background videos
INSERT INTO predefined_options (category, name, value, order_index) VALUES
  ('background_videos', 'Elegant Background', 'https://www.pexels.com/download/video/7108970/', 1),
  ('background_videos', 'Wedding Scene', 'https://www.pexels.com/download/video/4782594/', 2),
  ('background_videos', 'Floral Video', 'https://www.pexels.com/download/video/35166878/', 3),
  ('background_videos', 'Romantic Video', 'https://www.pexels.com/download/video/15200323/', 4),
  ('background_videos', 'Gift Video', 'https://www.pexels.com/download/video/28561007/', 5),
  ('background_videos', 'Celebration Video', 'https://www.pexels.com/download/video/33352808/', 6),
  ('background_videos', 'Wedding Video', 'https://www.pexels.com/download/video/33026640/', 7);

-- Theme colors (main color 1, main color 2, neutral color 1, neutral color 2)
INSERT INTO predefined_options (category, name, value, order_index) VALUES
  ('theme_colors', 'Blush & Gold', '#B88A78', 1),
  ('theme_colors', 'Sage & Cream', '#9CAF88', 2),
  ('theme_colors', 'Navy & Silver', '#1B3B5F', 3),
  ('theme_colors', 'Rose & Champagne', '#B76E79', 4),
  ('theme_colors', 'Burgundy & Gold', '#722F37', 5),
  ('theme_colors', 'Dusty Blue & Gray', '#8BA3B8', 6),
  ('theme_colors', 'Emerald & Ivory', '#2E8B57', 7),
  ('theme_colors', 'Lavender & Silver', '#E6E6FA', 8),
  ('theme_colors', 'Coral & Sand', '#FF7F50', 9),
  ('theme_colors', 'Plum & Gold', '#8E4585', 10);

-- Typography fonts (combined heading and body)
INSERT INTO predefined_options (category, name, value, order_index) VALUES
  ('typography_fonts', 'Playfair Display + Inter', 'Playfair Display, Inter', 1),
  ('typography_fonts', 'Cormorant Garamond + Lato', 'Cormorant Garamond, Lato', 2),
  ('typography_fonts', 'Lora + Open Sans', 'Lora, Open Sans', 3),
  ('typography_fonts', 'Merriweather + Roboto', 'Merriweather, Roboto', 4),
  ('typography_fonts', 'Cinzel + Montserrat', 'Cinzel, Montserrat', 5),
  ('typography_fonts', 'Bodoni Moda + Poppins', 'Bodoni Moda, Poppins', 6),
  ('typography_fonts', 'Italiana + Raleway', 'Italiana, Raleway', 7),
  ('typography_fonts', 'Libre Baskerville + Source Sans Pro', 'Libre Baskerville, Source Sans Pro', 8);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_predefined_options_updated_at
  BEFORE UPDATE ON predefined_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
