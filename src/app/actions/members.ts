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
    .select(`
      *,
      user:user_id(id, email)
    `)
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });

  if (error) {
    // Fallback for environments where relation to auth.users is not exposed via PostgREST.
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (fallbackError) return [];
    return (fallbackData as WorkspaceMember[]) || [];
  }

  return data as WorkspaceMember[] || [];
}

export async function inviteMemberToWorkspace(
  workspaceId: string,
  email: string,
  role: WorkspaceRole = 'member'
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  // Resolve role in the same request context used for insert.
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Unable to verify permissions: ${membershipError.message}`);
  }

  if (!membership || !canInviteMembers(membership.role as WorkspaceRole)) {
    throw new Error('Only workspace owners or admins can send invitations');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if there is already a pending invitation for this email.
  const { data: existingInvite } = await supabase
    .from('workspace_invitations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', normalizedEmail)
    .is('accepted_at', null)
    .maybeSingle();

  if (existingInvite) {
    throw new Error('An invitation for this email is already pending');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email: normalizedEmail,
      role,
      invited_by: user.id,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity(workspaceId, 'member_invited', `Invited ${email} as ${role}`, {
    email: normalizedEmail,
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

export async function getMyPendingInvitations() {
  const user = await getCurrentUser();
  if (!user?.email) return [];

  const supabase = await createClient();
  const normalizedEmail = user.email.toLowerCase();

  const { data, error } = await supabase
    .from('workspace_invitations')
    .select(`
      id,
      workspace_id,
      email,
      role,
      invited_by,
      token,
      accepted_at,
      expires_at,
      created_at,
      workspaces:workspace_id(id, name, slug)
    `)
    .eq('email', normalizedEmail)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function acceptWorkspaceInvitation(invitationId: string) {
  const user = await getCurrentUser();
  if (!user?.email) throw new Error('Not authenticated');

  const supabase = await createClient();
  const normalizedEmail = user.email.toLowerCase();

  const { data: invitation, error: invitationError } = await supabase
    .from('workspace_invitations')
    .select('id, workspace_id, role, email, accepted_at, expires_at')
    .eq('id', invitationId)
    .eq('email', normalizedEmail)
    .single();

  if (invitationError || !invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.accepted_at) {
    throw new Error('Invitation already accepted');
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    throw new Error('Invitation has expired');
  }

  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invitation.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: joinError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role,
      });

    if (joinError) throw joinError;
  }

  const acceptedAt = new Date().toISOString();

  const { data: acceptedInvitation, error: acceptError } = await supabase
    .from('workspace_invitations')
    .update({ accepted_at: acceptedAt })
    .eq('id', invitation.id)
    .eq('email', normalizedEmail)
    .is('accepted_at', null)
    .select('id, accepted_at')
    .maybeSingle();

  if (acceptError) throw acceptError;

  if (!acceptedInvitation || !acceptedInvitation.accepted_at) {
    throw new Error('Invitation could not be finalized. Please refresh and try again.');
  }

  await logActivity(
    invitation.workspace_id,
    'member_joined',
    `${user.email} accepted workspace invitation`,
    { invitationId: invitation.id }
  );

  return { workspaceId: invitation.workspace_id };
}
