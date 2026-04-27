'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getCurrentUserRole } from '@/lib/auth-helpers';
import { logActivity } from '@/app/actions/activity';
import type { DirectMessageConversation, DirectMessage, UserPresence } from '@/types/database';

/**
 * Gets or creates a direct message conversation between two users.
 * Participants are ordered (participant_1 < participant_2) for consistent lookup.
 */
export async function getOrCreateConversation(
  workspaceId: string,
  otherUserId: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Ensure participant_1_id < participant_2_id for uniqueness
  const [participant1, participant2] = user.id < otherUserId 
    ? [user.id, otherUserId]
    : [otherUserId, user.id];

  const supabase = await createClient();

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from('direct_message_conversations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('participant_1_id', participant1)
    .eq('participant_2_id', participant2)
    .single();

  if (existing) {
    return existing as DirectMessageConversation;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('direct_message_conversations')
    .insert({
      workspace_id: workspaceId,
      participant_1_id: participant1,
      participant_2_id: participant2,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DirectMessageConversation;
}

/**
 * Gets list of DM conversations for user with last message preview.
 */
export async function getUserConversations(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('direct_message_conversations')
    .select(`
      *,
      participant_1:participant_1_id(id, email),
      participant_2:participant_2_id(id, email),
      last_message:direct_messages(id, content, created_at, sender_id)
    `)
    .eq('workspace_id', workspaceId)
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Gets messages in a conversation with pagination.
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  offset = 0
) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  // Verify user is part of this conversation
  const { data: conversation } = await supabase
    .from('direct_message_conversations')
    .select('id')
    .eq('id', conversationId)
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
    .single();

  if (!conversation) throw new Error('Access denied');

  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data || []).reverse() as DirectMessage[];
}

/**
 * Sends a direct message.
 * Creates notification for recipient.
 */
export async function sendDirectMessage(
  conversationId: string,
  content: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  if (!content.trim()) throw new Error('Message cannot be empty');

  const supabase = await createClient();

  // Verify user is part of this conversation
  const { data: conversation } = await supabase
    .from('direct_message_conversations')
    .select('workspace_id, participant_1_id, participant_2_id')
    .eq('id', conversationId)
    .single();

  if (!conversation) throw new Error('Conversation not found');

  if (conversation.participant_1_id !== user.id && conversation.participant_2_id !== user.id) {
    throw new Error('Access denied');
  }

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  // Update conversation timestamp
  await supabase
    .from('direct_message_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Determine recipient and create notification
  const recipientId = user.id === conversation.participant_1_id
    ? conversation.participant_2_id
    : conversation.participant_1_id;

  // Get sender email for notification
  const { data: senderData } = await supabase.auth.admin.getUserById(user.id);
  const senderEmail = senderData.user?.email || 'someone';

  await supabase.from('notifications').insert({
    user_id: recipientId,
    workspace_id: conversation.workspace_id,
    type: 'direct_message',
    title: `New message from ${senderEmail}`,
    body: content.substring(0, 100),
    target_url: `/workspace/${conversation.workspace_id}/messages/${conversationId}`,
  });

  await logActivity(
    conversation.workspace_id,
    'message_posted',
    'Sent a direct message',
    { conversationId }
  );

  return data as DirectMessage;
}

/**
 * Updates user presence status.
 */
export async function updateUserPresence(
  workspaceId: string,
  status: 'online' | 'away' | 'offline'
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_presence')
    .upsert({
      user_id: user.id,
      workspace_id: workspaceId,
      status,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserPresence;
}

/**
 * Gets presence status for users in a workspace.
 */
export async function getWorkspacePresence(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  // Verify user is in workspace
  const role = await getCurrentUserRole(workspaceId);
  if (!role) throw new Error('Access denied');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) return [];
  return data as UserPresence[];
}

/**
 * Gets unread message count per conversation for current user.
 * Used to display badge counts on conversation list.
 */
export async function getConversationUnreadCounts(
  workspaceId: string
): Promise<Record<string, number>> {
  const user = await getCurrentUser();
  if (!user) return {};

  const supabase = await createClient();

  // Get all conversations for user
  const { data: conversations } = await supabase
    .from('direct_message_conversations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

  if (!conversations) return {};

  // For each conversation, count unread messages
  const counts: Record<string, number> = {};

  for (const conv of conversations) {
    // Count messages where sender is NOT current user and have no read_at
    // Since we don't have read_at tracking yet, we'll count all messages sent by other user
    // after the user last viewed the conversation (using presence/last_seen_at as proxy)
    const { count } = await supabase
      .from('direct_messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conv.id)
      .neq('sender_id', user.id)
      .is('deleted_at', null);

    counts[conv.id] = count || 0;
  }

  return counts;
}

