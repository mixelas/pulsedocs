'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getCurrentUserRole } from '@/lib/auth-helpers';
import { canCreateChannel, canCreateDocument, canDeleteContent } from '@/lib/permissions';
import { logActivity } from '@/app/actions/activity';
import type { Workspace, Channel, Message, Document, DocumentFolder } from '@/types/database';

// Workspace operations
export async function getWorkspaceById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Workspace;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) return [];
  return data || [];
}

export async function createWorkspace(name: string, description: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();
  const slug = name.toLowerCase().replace(/\s+/g, '-').substring(0, 50);

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name,
      slug,
      description,
      created_by: user.id,
    })
    .select()
    .single();

  if (wsError || !workspace) throw wsError || new Error('Failed to create workspace');

  // Add creator as owner
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberError) throw memberError;

  return workspace;
}

// Channel operations
export async function getChannelsForWorkspace(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data as Channel[] || [];
}

export async function getChannelById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Channel;
}

export async function createChannel(workspaceId: string, name: string, description?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const role = await getCurrentUserRole(workspaceId);
  if (!role || !canCreateChannel(role)) {
    throw new Error('Permission denied');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('channels')
    .insert({
      workspace_id: workspaceId,
      name,
      description,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity(workspaceId, 'channel_created', `Created channel #${name}`, {
    channelId: data.id,
    channelName: name,
  });

  return data as Channel;
}

// Message operations
export async function getMessagesForChannel(channelId: string, limit = 50) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []).reverse() as Message[];
}

export async function sendMessage(channelId: string, workspaceId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      workspace_id: workspaceId,
      sender_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

export async function deleteMessage(messageId: string, workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  const { data: message } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single();

  if (!message) throw new Error('Message not found');
  
  const role = await getCurrentUserRole(workspaceId);
  if (message.sender_id !== user.id && (!role || !canDeleteContent(role))) {
    throw new Error('Permission denied');
  }

  const { error } = await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) throw error;
}

// Document operations
export async function getDocumentsForWorkspace(workspaceId: string, folderId?: string | null) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  let query = supabase
    .from('documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null);

  if (folderId !== undefined) {
    if (folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', folderId);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return [];
  return data as Document[] || [];
}

export async function getDocumentById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;
  return data as Document;
}

export async function createDocument(
  workspaceId: string,
  title: string,
  content: string = '',
  folderId?: string | null
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const role = await getCurrentUserRole(workspaceId);
  if (!role || !canCreateDocument(role)) {
    throw new Error('Permission denied');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .insert({
      workspace_id: workspaceId,
      title,
      content,
      folder_id: folderId || null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity(workspaceId, 'document_created', `Created document "${title}"`, {
    documentId: data.id,
    documentTitle: title,
  });

  return data as Document;
}

export async function updateDocument(
  documentId: string,
  title?: string,
  content?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  // Fetch document to get workspace_id for logging
  const { data: doc } = await supabase
    .from('documents')
    .select('workspace_id, title')
    .eq('id', documentId)
    .single();

  const updateData: any = { updated_by: user.id };
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;

  const { error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', documentId);

  if (error) throw error;

  if (doc) {
    await logActivity(doc.workspace_id, 'document_updated', `Updated document "${doc.title}"`, {
      documentId,
    });
  }
}

export async function deleteDocument(documentId: string, workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const role = await getCurrentUserRole(workspaceId);
  if (!role || !canDeleteContent(role)) {
    throw new Error('Permission denied');
  }

  const supabase = await createClient();

  // Fetch document to get title for logging
  const { data: doc } = await supabase
    .from('documents')
    .select('title')
    .eq('id', documentId)
    .single();

  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', documentId);

  if (error) throw error;

  await logActivity(workspaceId, 'document_deleted', `Deleted document "${doc?.title || 'Unknown'}"`, {
    documentId,
  });
}

export async function getDocumentFolders(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_folders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data as DocumentFolder[] || [];
}

export async function createDocumentFolder(workspaceId: string, name: string, parentId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_folders')
    .insert({
      workspace_id: workspaceId,
      name,
      parent_folder_id: parentId || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DocumentFolder;
}

// Search
export async function searchWorkspace(workspaceId: string, query: string) {
  const user = await getCurrentUser();
  if (!user) return { documents: [], messages: [], channels: [] };

  const supabase = await createClient();

  const [docsRes, msgsRes, chansRes] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, content, created_at, updated_at, updated_by')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`),
    supabase
      .from('messages')
      .select('id, content, created_at, sender_id, channel_id')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .ilike('content', `%${query}%`),
    supabase
      .from('channels')
      .select('id, name, description')
      .eq('workspace_id', workspaceId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`),
  ]);

  return {
    documents: docsRes.data || [],
    messages: msgsRes.data || [],
    channels: chansRes.data || [],
  };
}
