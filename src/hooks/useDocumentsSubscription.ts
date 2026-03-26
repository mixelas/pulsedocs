import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types/database';

export function useDocumentsSubscription(workspaceId: string, folderId?: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchDocuments = useCallback(async () => {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (folderId !== undefined) {
      if (folderId === null) {
        query = query.is('folder_id', null);
      } else {
        query = query.eq('folder_id', folderId);
      }
    }

    const { data, error: fetchError } = await query.order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setDocuments(data as Document[]);
    setLoading(false);
  }, [workspaceId, folderId, supabase]);

  useEffect(() => {
    fetchDocuments();

    const subscription = supabase
      .channel(`documents:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new as Document;
            if (newDoc.deleted_at === null) {
              const shouldInclude =
                folderId === undefined ||
                (folderId === null && newDoc.folder_id === null) ||
                (folderId !== null && newDoc.folder_id === folderId);

              if (shouldInclude) {
                setDocuments((prev) => [newDoc, ...prev]);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new as Document;
            if (updatedDoc.deleted_at === null) {
              const shouldInclude =
                folderId === undefined ||
                (folderId === null && updatedDoc.folder_id === null) ||
                (folderId !== null && updatedDoc.folder_id === folderId);

              if (shouldInclude) {
                setDocuments((prev) =>
                  prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
                );
              } else {
                setDocuments((prev) => prev.filter((doc) => doc.id !== updatedDoc.id));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedDoc = payload.old as Document;
            setDocuments((prev) => prev.filter((doc) => doc.id !== deletedDoc.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [workspaceId, folderId, fetchDocuments, supabase]);

  return { documents, loading, error };
}
