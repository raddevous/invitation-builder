-- Drop existing trigger and table if they exist
DROP TRIGGER IF EXISTS update_local_data_backups_updated_at ON local_data_backups;
DROP TABLE IF EXISTS local_data_backups;

-- Create table for local data backups
CREATE TABLE local_data_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_local_data_backups_user_id ON local_data_backups(user_id);

-- Note: RLS policies disabled for this table since we use invitation-based identification
-- rather than Supabase auth. Access control is handled at the API level.

-- Create trigger for updating updated_at (using existing function)
CREATE TRIGGER update_local_data_backups_updated_at
  BEFORE UPDATE ON local_data_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
