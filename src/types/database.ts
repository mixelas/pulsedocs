export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

export type NotificationType =
  | 'workspace_invite'
  | 'message_mention'
  | 'message_reply'
  | 'document_comment'
  | 'document_mention'
  | 'direct_message'
  | 'system';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  workspace_id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  reply_to_message_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DocumentFolder {
  id: string;
  workspace_id: string;
  name: string;
  parent_folder_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DocumentComment {
  id: string;
  workspace_id: string;
  document_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  workspace_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  target_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  invited_by: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface DirectMessageConversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type UserPresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  id: string;
  user_id: string;
  workspace_id: string;
  status: UserPresenceStatus;
  last_seen_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  actor_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  change_summary: string | null;
}

export interface DocumentEdit {
  id: string;
  document_id: string;
  edited_by: string;
  edit_type: 'title_changed' | 'content_added' | 'content_removed' | 'content_replaced';
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface ActiveEditor {
  id: string;
  document_id: string;
  user_id: string;
  last_seen_at: string;
  cursor_position: number;
}

export interface DocumentCommentThread {
  id: string;
  workspace_id: string;
  document_id: string;
  author_id: string;
  content: string;
  line_number: number | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

