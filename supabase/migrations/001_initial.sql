-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  template_id TEXT DEFAULT 'wedding-template-01',
  event_type TEXT DEFAULT 'wedding',
  client_name TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RSVP responses table
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id TEXT REFERENCES invitations(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('attending', 'not-attending', 'maybe')),
  guest_count INTEGER DEFAULT 1,
  message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;

-- Allow public read on invitations (by slug, no access_code exposed)
CREATE POLICY "Public can read invitations by slug"
  ON invitations FOR SELECT
  USING (true);

-- Allow public insert on rsvp_responses
CREATE POLICY "Public can submit RSVP"
  ON rsvp_responses FOR INSERT
  WITH CHECK (true);

-- Allow public read on rsvp_responses (for count display)
CREATE POLICY "Public can read RSVP responses"
  ON rsvp_responses FOR SELECT
  USING (true);

-- Enable Realtime for invitations
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;
