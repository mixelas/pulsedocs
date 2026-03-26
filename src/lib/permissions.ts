import type { WorkspaceRole } from '@/types/database';

/**
 * Role hierarchy for permission inference.
 * Higher values = more permissions. Used for role comparison logic.
 */
export const ROLE_PRIORITY: Record<WorkspaceRole, number> = {
  guest: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/**
 * Checks if a role has at least the permission level of another role.
 * @param currentRole - The user's current role
 * @param minimumRole - The minimum required role  
 * @returns true if currentRole >= minimumRole in the hierarchy
 */
export function hasAtLeastRole(currentRole: WorkspaceRole, minimumRole: WorkspaceRole): boolean {
  return ROLE_PRIORITY[currentRole] >= ROLE_PRIORITY[minimumRole];
}

/** Workspace settings, billing, and deletion require admin+ privileges. */
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

/** Invitations are restricted to admins to preserve workspace access control. */
export function canInviteMembers(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

/** Members can create channels to encourage communication. Guests remain read-only. */
export function canCreateChannel(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}

/** Channel management (rename, delete, settings) is admin-only. */
export function canManageChannels(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

/** Members and above can contribute documents to the knowledge base. */
export function canCreateDocument(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}

/** All members can edit documents they belong to. Ownership/RLS enforced at DB layer. */
export function canEditDocument(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}

/** Content deletion (permanent removal) is restricted to prevent accidental data loss. */
export function canDeleteContent(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

/** Only members and above can participate in discussions. Guests are read-only observers. */
export function canComment(role: WorkspaceRole): boolean {
  return role !== 'guest';
}
