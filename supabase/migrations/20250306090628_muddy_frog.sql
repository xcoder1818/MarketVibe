-- Drop existing channels table and recreate with proper UUID handling
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channels CASCADE;

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_private BOOLEAN DEFAULT false,
  members UUID[] DEFAULT ARRAY[]::UUID[],
  UNIQUE(name, company_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[],
  reactions JSONB DEFAULT '[]',
  mentions UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for channels
CREATE POLICY "channel_select"
  ON channels
  FOR SELECT
  USING (
    auth.uid() = ANY(members) OR
    (
      NOT is_private AND
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.company_id = channels.company_id
      )
    )
  );

CREATE POLICY "channel_insert"
  ON channels
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.company_id = channels.company_id
      AND user_permissions.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "channel_update"
  ON channels
  FOR UPDATE
  USING (
    auth.uid() = ANY(members) OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.company_id = channels.company_id
      AND user_permissions.role = 'admin'
    )
  );

CREATE POLICY "channel_delete"
  ON channels
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.company_id = channels.company_id
      AND user_permissions.role = 'admin'
    )
  );

-- Create policies for messages
CREATE POLICY "message_select"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = messages.channel_id
      AND (
        auth.uid() = ANY(channels.members) OR
        (
          NOT channels.is_private AND
          EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND user_permissions.company_id = channels.company_id
          )
        )
      )
    )
  );

CREATE POLICY "message_insert"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = messages.channel_id
      AND auth.uid() = ANY(channels.members)
    )
  );

CREATE POLICY "message_update"
  ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "message_delete"
  ON messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- Add triggers for updated_at
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Create indexes
CREATE INDEX idx_channels_company ON channels(company_id);
CREATE INDEX idx_channels_members ON channels USING gin(members);
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);