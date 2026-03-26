export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

export type NotificationType =
  | 'workspace_invite'
  | 'message_mention'
  | 'message_reply'
  | 'document_comment'
  | 'document_mention'
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

export interface ActivityLog {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown>;
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
