import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserPresence } from '@/types/database';

/**
 * Real-time user presence subscription hook.
 *
 * Maintains online status for all users in workspace.
 * Updates when users go online/away/offline.
 */
export function usePresenceSubscription(workspaceId: string) {
  const [presence, setPresence] = useState<Record<string, UserPresence>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial load
    (async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (data) {
        const presenceMap = data.reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, UserPresence>);
        setPresence(presenceMap);
      }
      setLoading(false);
    })();

    const subscription = supabase
      .channel(`presence:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedPresence = payload.new as UserPresence;
            setPresence((prev) => ({
              ...prev,
              [updatedPresence.user_id]: updatedPresence,
            }));
          } else if (payload.eventType === 'DELETE') {
            const deletedPresence = payload.old as UserPresence;
            setPresence((prev) => {
              const next = { ...prev };
              delete next[deletedPresence.user_id];
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [workspaceId, supabase]);

  return { presence, loading };
}
