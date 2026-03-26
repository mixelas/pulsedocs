import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Channel } from '@/types/database';

/**
 * Real-time channel subscription hook.
 * 
 * Subscribes to channel list changes within workspace using postgres_changes.
 * Maintains optimal list immutability and handles concurrent insert/update/delete.
 */
export function useChannelsSubscription(workspaceId: string) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchChannels = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('channels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setChannels(data as Channel[]);
    setLoading(false);
  }, [workspaceId, supabase]);

  useEffect(() => {
    fetchChannels();

    const subscription = supabase
      .channel(`channels:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newChannel = payload.new as Channel;
            setChannels((prev) => [...prev, newChannel]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedChannel = payload.new as Channel;
            setChannels((prev) =>
              prev.map((ch) => (ch.id === updatedChannel.id ? updatedChannel : ch))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedChannel = payload.old as Channel;
            setChannels((prev) => prev.filter((ch) => ch.id !== deletedChannel.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [workspaceId, fetchChannels, supabase]);

  return { channels, loading, error };
}
