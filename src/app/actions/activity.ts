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
  | 'document_restored'
  | 'document_commented'
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
  const { error } = await supabase.from('activity_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    activity_type: activityType,
    description,
    metadata: metadata || {},
  });

  // Backward compatibility with original schema (entity_type/action).
  if (error) {
    await supabase.from('activity_logs').insert({
      workspace_id: workspaceId,
      actor_id: user.id,
      entity_type: 'workspace',
      entity_id: null,
      action: activityType,
      metadata: {
        description,
        ...(metadata || {}),
      },
    });
  }
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

  return ((data || []) as any[]).map((row) => ({
    id: row.id,
    workspace_id: row.workspace_id,
    actor_id: row.actor_id,
    activity_type: row.activity_type || row.action || 'activity',
    description: row.description || row.metadata?.description || row.action || 'Activity',
    metadata: row.metadata || {},
    created_at: row.created_at,
  })) as ActivityLog[];
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
    const modernQuery = query.in('activity_type', activityTypes);
    const { data: modernData, error: modernError } = await modernQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!modernError) {
      return ((modernData || []) as any[]).map((row) => ({
        id: row.id,
        workspace_id: row.workspace_id,
        actor_id: row.actor_id,
        activity_type: row.activity_type || row.action || 'activity',
        description: row.description || row.metadata?.description || row.action || 'Activity',
        metadata: row.metadata || {},
        created_at: row.created_at,
      })) as ActivityLog[];
    }

    // Fallback for legacy action column.
    const { data: legacyData, error: legacyError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('action', activityTypes)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (legacyError) return [];

    return ((legacyData || []) as any[]).map((row) => ({
      id: row.id,
      workspace_id: row.workspace_id,
      actor_id: row.actor_id,
      activity_type: row.activity_type || row.action || 'activity',
      description: row.description || row.metadata?.description || row.action || 'Activity',
      metadata: row.metadata || {},
      created_at: row.created_at,
    })) as ActivityLog[];
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return ((data || []) as any[]).map((row) => ({
    id: row.id,
    workspace_id: row.workspace_id,
    actor_id: row.actor_id,
    activity_type: row.activity_type || row.action || 'activity',
    description: row.description || row.metadata?.description || row.action || 'Activity',
    metadata: row.metadata || {},
    created_at: row.created_at,
  })) as ActivityLog[];
}
