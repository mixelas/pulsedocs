-- Direct message conversations table
-- Stores 1:1 conversation metadata
CREATE TABLE IF NOT EXISTS direct_message_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure conversation is unique per pair and workspace
  UNIQUE(workspace_id, participant_1_id, participant_2_id),
  -- Prevent self-conversations
  CHECK(participant_1_id < participant_2_id)
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES direct_message_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Enable full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    TO_TSVECTOR('english', content)
  ) STORED
);

-- User presence/online status table
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline', -- 'online', 'away', 'offline'
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dm_conversations_workspace ON direct_message_conversations(workspace_id);
CREATE INDEX idx_dm_conversations_participants ON direct_message_conversations(participant_1_id, participant_2_id);
CREATE INDEX idx_dm_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_dm_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_dm_messages_created ON direct_messages(created_at DESC);
CREATE INDEX idx_dm_search ON direct_messages USING GIN(search_vector);
CREATE INDEX idx_user_presence_workspace ON user_presence(workspace_id);

-- RLS Policies for direct_message_conversations
ALTER TABLE direct_message_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they're part of"
  ON direct_message_conversations
  FOR SELECT
  USING (
    (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = direct_message_conversations.workspace_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations in their workspace"
  ON direct_message_conversations
  FOR INSERT
  WITH CHECK (
    (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_id
        AND user_id = auth.uid()
    )
  );

-- RLS Policies for direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in conversations they're part of"
  ON direct_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM direct_message_conversations dmc
      WHERE dmc.id = direct_messages.conversation_id
        AND (dmc.participant_1_id = auth.uid() OR dmc.participant_2_id = auth.uid())
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can insert messages in conversations they're part of"
  ON direct_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM direct_message_conversations dmc
      WHERE dmc.id = conversation_id
        AND (dmc.participant_1_id = auth.uid() OR dmc.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON direct_messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can soft-delete their own messages"
  ON direct_messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- RLS Policies for user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence in their workspace"
  ON user_presence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = user_presence.workspace_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own presence"
  ON user_presence
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own presence"
  ON user_presence
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
