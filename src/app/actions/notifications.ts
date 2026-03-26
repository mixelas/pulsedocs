'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import type { Notification, NotificationType } from '@/types/database';

export async function createNotification(
  userId: string,
  workspaceId: string,
  type: NotificationType,
  title: string,
  body?: string,
  targetUrl?: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      type,
      title,
      body,
      target_url: targetUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

export async function getUserNotifications(limit = 50) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as Notification[] || [];
}

export async function getUnreadNotificationCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) return 0;
  return count || 0;
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) throw error;
}

export async function deleteNotification(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) throw error;
}
