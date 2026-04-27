import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DocumentComment } from '@/types/database';

/**
 * Real-time document comment subscription hook.
 * 
 * Maintains comment thread state in real-time.
 * Handles threaded conversations with edit and soft-delete support.
 */
export function useDocumentCommentsSubscription(documentId: string) {
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchComments = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('document_comments')
      .select('*')
      .eq('document_id', documentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setComments(data as DocumentComment[]);
    }

    setLoading(false);
  }, [documentId, supabase]);

  useEffect(() => {
    fetchComments();

    const subscription = supabase
      .channel(`comments:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_comments',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new as DocumentComment;
            if (newComment.deleted_at === null) {
              setComments((prev) =>
                prev.some((c) => c.id === newComment.id) ? prev : [...prev, newComment]
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedComment = payload.new as DocumentComment;
            if (updatedComment.deleted_at === null) {
              setComments((prev) =>
                prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
              );
            } else {
              setComments((prev) => prev.filter((c) => c.id !== updatedComment.id));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedComment = payload.old as DocumentComment;
            setComments((prev) => prev.filter((c) => c.id !== deletedComment.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchComments();
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [documentId, fetchComments, supabase]);

  return { comments, loading, error };
}
