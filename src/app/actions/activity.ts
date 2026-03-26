'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import type { ActivityLog } from '@/types/database';

export type ActivityType = 
  | 'member_joined'
  | 'member_left'
  | 'member_role_changed'
  | 'member_invited'
  | 'invitation_revoked'
  | 'channel_created'
  | 'channel_deleted'
  | 'message_posted'
  | 'message_deleted'
  | 'document_created'
  | 'document_updated'
  | 'document_deleted'
  | 'comment_posted'
  | 'comment_deleted';

export async function logActivity(
  workspaceId: string,
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, any>
) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from('activity_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    activity_type: activityType,
    description,
    metadata: metadata || {},
  });
}

export async function getActivityLogs(
  workspaceId: string,
  limit = 100,
  offset = 0
) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return data as ActivityLog[] || [];
}

export async function getActivityLogsFiltered(
  workspaceId: string,
  activityTypes?: ActivityType[],
  limit = 100,
  offset = 0
) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (activityTypes && activityTypes.length > 0) {
    query = query.in('activity_type', activityTypes);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return data as ActivityLog[] || [];
}
