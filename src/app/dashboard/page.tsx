'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createWorkspace } from '@/app/actions/workspace';
import { acceptWorkspaceInvitation, getMyPendingInvitations } from '@/app/actions/members';
import { NotificationBell } from '@/components/NotificationBell';
import type { Workspace } from '@/types/database';

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      setUser(user);
      
      // Fetch workspaces using client-side query
      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspaces(id, name, slug, logo_url, description, created_by, created_at, updated_at)')
        .eq('user_id', user.id);

      if (!error && data) {
        const workspaceList = data.map((m: any) => m.workspaces).filter(Boolean);
        setWorkspaces(workspaceList);
      }

      const invites = await getMyPendingInvitations();
      setPendingInvitations(invites);

      setLoading(false);
    }

    load();
  }, [router, supabase]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const ws = await createWorkspace(newName, newDescription);
      setWorkspaces([...workspaces, ws]);
      setNewName('');
      setNewDescription('');
      setShowCreate(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleAcceptInvitation(invitationId: string) {
    setError('');
    setAcceptingInvitationId(invitationId);

    try {
      const result = await acceptWorkspaceInvitation(invitationId);
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      router.push(`/workspace/${result.workspaceId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation');
    } finally {
      setAcceptingInvitationId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">PulseDocs</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            {user && (
              <span className="text-sm text-muted-foreground">{user.email}</span>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-muted-foreground hover:text-primary transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {pendingInvitations.length > 0 && (
          <div className="bg-card rounded-lg p-6 border border-border mb-8">
            <h3 className="text-lg font-semibold text-primary mb-2">Pending Invitations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You were invited to join these workspaces.
            </p>

            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{inv.workspaces?.name || 'Workspace'}</p>
                    <p className="text-xs text-muted-foreground">
                      Role: {inv.role} - Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptInvitation(inv.id)}
                    disabled={acceptingInvitationId === inv.id}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
                  >
                    {acceptingInvitationId === inv.id ? 'Accepting...' : 'Accept'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2">Workspaces</h2>
            <p className="text-muted-foreground">
              Manage your team collaboration spaces
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition"
          >
            {showCreate ? 'Cancel' : 'New Workspace'}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-card rounded-lg p-6 border border-border mb-8">
            <h3 className="text-lg font-semibold text-primary mb-4">Create Workspace</h3>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="My Team"
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What is this workspace for?"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
              >
                {creating ? 'Creating...' : 'Create Workspace'}
              </button>
            </form>
          </div>
        )}

        {/* Workspaces grid */}
        {workspaces.length === 0 ? (
          <div className="bg-card rounded-lg p-12 border border-border text-center">
            <p className="text-muted-foreground mb-4">
              You have not created any workspaces yet
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-primary hover:underline font-medium"
            >
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspace/${ws.id}`}
                className="bg-card rounded-lg p-6 border border-border hover:border-primary transition cursor-pointer"
              >
                <h3 className="text-lg font-bold text-primary mb-2">{ws.name}</h3>
                {ws.description && (
                  <p className="text-sm text-muted-foreground mb-4">{ws.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {new Date(ws.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
