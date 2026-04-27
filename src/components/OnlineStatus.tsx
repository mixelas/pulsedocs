'use client';

import { usePresenceSubscription } from '@/hooks/usePresenceSubscription';

interface OnlineStatusProps {
  userId: string;
  workspaceId: string;
  showLabel?: boolean;
}

/**
 * Online status indicator.
 * Shows real-time presence status with color coding.
 */
export function OnlineStatus({ userId, workspaceId, showLabel = false }: OnlineStatusProps) {
  const { presence } = usePresenceSubscription(workspaceId);
  const userStatus = presence[userId]?.status || 'offline';

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500',
  };

  const statusLabels = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${statusColors[userStatus]}`} />
      {showLabel && <span className="text-sm text-muted-foreground">{statusLabels[userStatus]}</span>}
    </div>
  );
}
