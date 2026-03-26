'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getCurrentUserRole } from '@/lib/auth-helpers';
import { canInviteMembers, canManageWorkspace } from '@/lib/permissions';
import { logActivity } from '@/app/actions/activity';
import type { WorkspaceMember, WorkspaceRole } from '@/types/database';
import crypto from 'crypto';

export async function getWorkspaceMembers(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });

  if (error) return [];
  return data as WorkspaceMember[] || [];
}

export async function inviteMemberToWorkspace(
  workspaceId: string,
  email: string,
  role: WorkspaceRole = 'member'
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const userRole = await getCurrentUserRole(workspaceId);
  if (!userRole || !canInviteMembers(userRole)) {
    throw new Error('Permission denied');
  }

  const supabase = await createClient();

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .match({ user_id: user.id })
    .single();

  if (existingMember) {
    throw new Error('User is already a member of this workspace');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email,
      role,
      invited_by: user.id,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity(workspaceId, 'member_invited', `Invited ${email} as ${role}`, {
    email,
    role,
  });

  return data;
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const userRole = await getCurrentUserRole(workspaceId);
  if (!userRole || !canManageWorkspace(userRole)) {
    throw new Error('Permission denied');
  }

  const supabase = await createClient();

  // Prevent changing the owner's role
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('id', memberId)
    .single();

  if (member?.role === 'owner') {
    throw new Error('Cannot change role of workspace owner');
  }

  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  await logActivity(workspaceId, 'member_role_changed', `Changed member role to ${newRole}`, {
    memberId,
    newRole,
  });
}

export async function removeMemberFromWorkspace(workspaceId: string, memberId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const userRole = await getCurrentUserRole(workspaceId);
  if (!userRole || !canManageWorkspace(userRole)) {
    throw new Error('Permission denied');
  }

  const supabase = await createClient();

  // Prevent removing the owner
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role, user_id')
    .eq('id', memberId)
    .single();

  if (member?.role === 'owner') {
    throw new Error('Cannot remove workspace owner');
  }

  if (member?.user_id === user.id) {
    throw new Error('Cannot remove yourself from the workspace');
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  await logActivity(workspaceId, 'member_left', `Member removed from workspace`, {
    memberId,
  });
}

export async function getWorkspaceInvitations(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const userRole = await getCurrentUserRole(workspaceId);
  if (!userRole || !canManageWorkspace(userRole)) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function revokeInvitation(invitationId: string, workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const userRole = await getCurrentUserRole(workspaceId);
  if (!userRole || !canManageWorkspace(userRole)) {
    throw new Error('Permission denied');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId);

  if (error) throw error;
}
