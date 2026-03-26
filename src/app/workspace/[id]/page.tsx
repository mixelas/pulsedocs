'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getWorkspaceById } from '@/app/actions/workspace';
import { useChannelsSubscription } from '@/hooks/useChannelsSubscription';
import { useDocumentsSubscription } from '@/hooks/useDocumentsSubscription';
import type { Workspace } from '@/types/database';

interface Props {
  params: { id: string };
}

export default function Dashboard({ params: { id } }: Props) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { channels } = useChannelsSubscription(id);
  const { documents: allDocs } = useDocumentsSubscription(id);

  useEffect(() => {
    async function load() {
      const ws = await getWorkspaceById(id);
      setWorkspace(ws);
      setLoading(false);
    }

    load();
  }, [id]);

  const recentDocs = allDocs.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-primary mb-2">{workspace.name}</h2>
        {workspace.description && (
          <p className="text-muted-foreground">{workspace.description}</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/workspace/${id}/channels/new`}
          className="bg-card rounded-lg p-6 border border-border hover:border-primary transition cursor-pointer"
        >
          <h3 className="font-semibold text-primary mb-2">Create Channel</h3>
          <p className="text-sm text-muted-foreground">Start a new discussion channel</p>
        </Link>

        <Link
          href={`/workspace/${id}/docs/new`}
          className="bg-card rounded-lg p-6 border border-border hover:border-primary transition cursor-pointer"
        >
          <h3 className="font-semibold text-primary mb-2">Create Document</h3>
          <p className="text-sm text-muted-foreground">Write and organize knowledge</p>
        </Link>
      </div>

      {/* Channels section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Channels</h3>
          <Link
            href={`/workspace/${id}/channels/new`}
            className="text-sm text-primary hover:underline font-medium"
          >
            View all
          </Link>
        </div>

        {channels.length === 0 ? (
          <div className="bg-card rounded-lg p-8 border border-border text-center">
            <p className="text-muted-foreground mb-4">No channels yet</p>
            <Link
              href={`/workspace/${id}/channels/new`}
              className="text-sm text-primary hover:underline font-medium"
            >
              Create the first channel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.slice(0, 4).map((channel) => (
              <Link
                key={channel.id}
                href={`/workspace/${id}/channels/${channel.id}`}
                className="bg-card rounded-lg p-4 border border-border hover:border-primary transition"
              >
                <h4 className="font-semibold text-primary mb-1">#{channel.name}</h4>
                {channel.description && (
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent documents section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Recent Documents</h3>
          <Link
            href={`/workspace/${id}/docs`}
            className="text-sm text-primary hover:underline font-medium"
          >
            View all
          </Link>
        </div>

        {recentDocs.length === 0 ? (
          <div className="bg-card rounded-lg p-8 border border-border text-center">
            <p className="text-muted-foreground mb-4">No documents yet</p>
            <Link
              href={`/workspace/${id}/docs/new`}
              className="text-sm text-primary hover:underline font-medium"
            >
              Create your first document
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/workspace/${id}/docs/${doc.id}`}
                className="block bg-card rounded-lg p-4 border border-border hover:border-primary transition"
              >
                <h4 className="font-semibold text-primary">{doc.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {new Date(doc.updated_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
