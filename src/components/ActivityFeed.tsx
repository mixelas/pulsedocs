'use client';

import { useEffect, useState } from 'react';
import { getActivityLogs } from '@/app/actions/activity';
import type { ActivityLog } from '@/types/database';

interface Props {
  workspaceId: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  member_joined: '👋',
  member_left: '👋',
  member_role_changed: '🔑',
  member_invited: '💌',
  invitation_revoked: '❌',
  channel_created: '🆕',
  channel_deleted: '❌',
  message_posted: '💬',
  message_deleted: '🗑️',
  document_created: '📄',
  document_updated: '✏️',
  document_deleted: '🗑️',
  comment_posted: '💬',
  comment_deleted: '🗑️',
};

const ACTIVITY_COLORS: Record<string, string> = {
  member_joined: 'bg-green-500/20 text-green-700',
  member_left: 'bg-orange-500/20 text-orange-700',
  member_role_changed: 'bg-blue-500/20 text-blue-700',
  member_invited: 'bg-purple-500/20 text-purple-700',
  invitation_revoked: 'bg-red-500/20 text-red-700',
  channel_created: 'bg-green-500/20 text-green-700',
  channel_deleted: 'bg-red-500/20 text-red-700',
  message_posted: 'bg-cyan-500/20 text-cyan-700',
  message_deleted: 'bg-red-500/20 text-red-700',
  document_created: 'bg-green-500/20 text-green-700',
  document_updated: 'bg-blue-500/20 text-blue-700',
  document_deleted: 'bg-red-500/20 text-red-700',
  comment_posted: 'bg-cyan-500/20 text-cyan-700',
  comment_deleted: 'bg-red-500/20 text-red-700',
};

export function ActivityFeed({ workspaceId }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const data = await getActivityLogs(workspaceId, 50, page * 50);
      if (page === 0) {
        setLogs(data);
      } else {
        setLogs((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === 50);
      setLoading(false);
    }

    loadLogs();
  }, [workspaceId, page]);

  const getActivityLabel = (type: string): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading activity...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No activity yet</div>
      ) : (
        <>
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border border-border ${
                ACTIVITY_COLORS[log.activity_type] || 'bg-muted text-foreground'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-1">
                    {ACTIVITY_ICONS[log.activity_type] || '📌'}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">
                      {getActivityLabel(log.activity_type)}
                    </p>
                    <p className="text-sm mt-1">{log.description}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2 text-xs opacity-75">
                        <summary className="cursor-pointer hover:opacity-100">
                          Details
                        </summary>
                        <pre className="mt-2 bg-black/20 p-2 rounded overflow-auto max-w-sm text-xs">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
              className="w-full mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
