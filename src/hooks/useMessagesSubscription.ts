import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/database';

/**
 * Real-time message subscription hook.
 * 
 * Fetches initial messages, then subscribes to postgres_changes events.
 * Handles INSERT/UPDATE/DELETE and soft-delete filtering (deleted_at IS NULL).
 * Automatically cleans up subscription on unmount.
 */
export function useMessagesSubscription(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setMessages(data as Message[]);
    setLoading(false);
  }, [channelId, supabase]);

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            if (newMessage.deleted_at === null) {
              setMessages((prev) => [...prev, newMessage]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedMessage = payload.old as Message;
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== deletedMessage.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channelId, fetchMessages, supabase]);

  return { messages, loading, error };
}
