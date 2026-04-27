import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DirectMessage } from '@/types/database';

/**
 * Real-time direct message subscription hook.
 * 
 * Subscribes to message updates in a conversation and maintains
 * message list state. Handles INSERT/UPDATE/DELETE events.
 */
export function useDirectMessageSubscription(conversationId: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchMessages = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMessages((data || []) as DirectMessage[]);
    }
    setLoading(false);
  }, [conversationId, supabase]);

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel(`dm:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as DirectMessage;
            if (newMessage.deleted_at === null) {
              setMessages((prev) =>
                prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as DirectMessage;
            if (updatedMessage.deleted_at === null) {
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
              );
            } else {
              setMessages((prev) => prev.filter((m) => m.id !== updatedMessage.id));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedMessage = payload.old as DirectMessage;
            setMessages((prev) => prev.filter((m) => m.id !== deletedMessage.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Re-sync after reconnect/subscription establishment.
          fetchMessages();
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId, fetchMessages, supabase]);

  return { messages, loading, error };
}
