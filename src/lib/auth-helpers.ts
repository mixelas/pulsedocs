import { createClient } from './supabase/server';
import type { User } from '@supabase/supabase-js';
import type { WorkspaceRole } from '@/types/database';

/**
 * Retrieves the currently authenticated user from the session.
 * @returns The authenticated user or null if no session exists.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Gets the user's role within a specific workspace.
 * Workspace membership and roles are enforced at the database layer via RLS.
 * @param workspaceId - The workspace ID
 * @returns The user's role or null if not a member
 */
export async function getCurrentUserRole(workspaceId: string): Promise<WorkspaceRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  return data?.role ?? null;
}

/**
 * Lists all workspaces the user is a member of.
 * Uses foreign key join to efficiently fetch workspace metadata in a single query.
 * @returns Array of workspaces or empty array
 */
export async function getWorkspacesForUser() {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('workspace_members')
    .select('workspaces(id, name, slug, logo_url, description, created_by, created_at, updated_at)')
    .eq('user_id', user.id);

  return data?.map((m: any) => m.workspaces).filter(Boolean) || [];
}
