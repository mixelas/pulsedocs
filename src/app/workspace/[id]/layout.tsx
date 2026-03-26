'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getWorkspaceById } from '@/app/actions/workspace';
import { useChannelsSubscription } from '@/hooks/useChannelsSubscription';
import { NotificationBell } from '@/components/NotificationBell';
import type { Workspace } from '@/types/database';

interface WorkspaceLayoutProps {
  params: { id: string };
  children: React.ReactNode;
}

export default function WorkspaceLayout({ params: { id }, children }: WorkspaceLayoutProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  
  const { channels } = useChannelsSubscription(id);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      setUser(user);
      const ws = await getWorkspaceById(id);
      if (!ws) {
        router.push('/dashboard');
        return;
      }

      setWorkspace(ws);
      setLoading(false);
    }

    load();
  }, [id, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const isDocsPage = pathname.includes('/docs');
  const isDashboard = pathname === `/workspace/${id}`;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        {/* Workspace header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-primary truncate">{workspace.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{workspace.slug}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link
            href={`/workspace/${id}`}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
              isDashboard
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Dashboard
          </Link>

          <div className="mt-6">
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Channels
              </h3>
              <Link
                href={`/workspace/${id}/channels/new`}
                className="text-xs text-primary hover:underline font-medium"
              >
                +
              </Link>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/workspace/${id}/channels/${channel.id}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition ${
                    pathname === `/workspace/${id}/channels/${channel.id}`
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  # {channel.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`/workspace/${id}/docs`}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                isDocsPage
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Documents
            </Link>
          </div>

          <div className="mt-6">
            <Link
              href={`/workspace/${id}/search`}
              className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition"
            >
              Search
            </Link>
          </div>

          <div className="mt-6">
            <Link
              href={`/workspace/${id}/members`}
              className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition"
            >
              Members
            </Link>
          </div>

          <div className="mt-6">
            <Link
              href={`/workspace/${id}/activity`}
              className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition"
            >
              Activity
            </Link>
          </div>
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-border space-y-2">
          {user && (
            <div className="text-xs text-muted-foreground truncate">
              {user.email}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 text-xs text-left text-muted-foreground hover:bg-muted rounded-lg transition"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">PulseDocs</h1>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-primary transition"
              >
                Back to workspaces
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
