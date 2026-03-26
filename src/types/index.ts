/**
 * Database Entity Types
 * Auto-generated or manually curated based on Supabase schema
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  logo_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joined_at: string;
}

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
}

export interface Document {
  id: string;
  workspace_id: string;
  folder_id?: string;
  title: string;
  content: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  workspace_id: string;
  name: string;
  parent_folder_id?: string;
  created_at: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'mention' | 'invite' | 'comment' | 'activity';
  related_entity_id: string;
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  entity_type: 'channel' | 'message' | 'document' | 'comment';
  entity_id: string;
  created_at: string;
}
