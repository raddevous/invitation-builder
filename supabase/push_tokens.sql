-- Push notification tokens table
-- Run this in Supabase SQL Editor (Dashboard > SQL > New Query)

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invitation_id, token)
);

-- Allow the service role to manage push tokens (service role bypasses RLS, but adding policy for completeness)
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage push tokens"
  ON push_tokens
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
