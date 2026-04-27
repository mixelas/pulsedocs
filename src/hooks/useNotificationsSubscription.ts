import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/types/database';

export function useNotificationsSubscription() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setNotifications(data as Notification[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    const setup = async () => {
      await fetchNotifications();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      subscription = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newNotification = payload.new as Notification;
              setNotifications((prev) =>
                prev.some((n) => n.id === newNotification.id)
                  ? prev
                  : [newNotification, ...prev]
              );
            } else if (payload.eventType === 'UPDATE') {
              const updatedNotification = payload.new as Notification;
              setNotifications((prev) =>
                prev.map((notif) =>
                  notif.id === updatedNotification.id ? updatedNotification : notif
                )
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedNotification = payload.old as Notification;
              setNotifications((prev) =>
                prev.filter((notif) => notif.id !== deletedNotification.id)
              );
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            fetchNotifications();
          }
        });
    };

    setup();

    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchNotifications, supabase]);

  return { notifications, loading, error };
}
