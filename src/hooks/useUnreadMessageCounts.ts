'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Real-time unread message counts hook.
 *
 * Tracks unread messages per conversation by listening to
 * direct_messages table changes and counting new messages
 * from other users.
 *
 * Returns: Record<conversationId, unreadCount>
 */
export function useUnreadMessageCounts(workspaceId: string) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchInitialCounts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get all conversations for user
      const { data: conversations } = await supabase
        .from('direct_message_conversations')
        .select('id')
        .eq('workspace_id', workspaceId)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

      if (!conversations) {
        setLoading(false);
        return;
      }

      // Initialize counts to 0 for all conversations
      const counts: Record<string, number> = {};
      for (const conv of conversations) {
        counts[conv.id] = 0;
      }
      setUnreadCounts(counts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch initial unread counts:', error);
      setLoading(false);
    }
  }, [supabase, workspaceId]);

  useEffect(() => {
    let subscription: any;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await fetchInitialCounts();

      // Subscribe to all direct_messages changes
      subscription = supabase
        .channel(`unread-messages:${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
          },
          async (payload) => {
            try {
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              if (!currentUser) return;

              const newMessage = payload.new;

              // Only count if message is from someone else (not current user)
              if (newMessage.sender_id !== currentUser.id) {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [newMessage.conversation_id]: (prev[newMessage.conversation_id] || 0) + 1,
                }));
              }
            } catch (error) {
              console.error('Error updating unread counts:', error);
            }
          }
        )
        .subscribe();
    })();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [workspaceId, supabase, fetchInitialCounts]);

  return { unreadCounts, loading };
}
