'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DocumentEdit, DocumentVersion } from '@/types/database';

/**
 * Real-time hook for tracking active editors on a document.
 * Shows who is currently editing.
 */
export function useActiveEditors(documentId: string) {
  const [activeEditors, setActiveEditors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchActiveEditors = async () => {
      const { data, error } = await supabase
        .from('active_editors')
        .select(`
          *,
          user:user_id(id, email)
        `)
        .eq('document_id', documentId)
        .gt('last_seen_at', new Date(Date.now() - 30000).toISOString());

      if (!error) {
        setActiveEditors(data || []);
      }
      setLoading(false);
    };

    fetchActiveEditors();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`editor:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_editors',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setActiveEditors((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setActiveEditors((prev) =>
              prev.map((e) => (e.id === payload.new.id ? payload.new : e))
            );
          } else if (payload.eventType === 'DELETE') {
            setActiveEditors((prev) => prev.filter((e) => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [documentId, supabase]);

  return { activeEditors, loading };
}

/**
 * Real-time hook for document edits.
 * Shows who changed what and when.
 */
export function useDocumentEdits(documentId: string) {
  const [edits, setEdits] = useState<DocumentEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchEdits = async () => {
      const { data, error } = await supabase
        .from('document_edits')
        .select(`
          *,
          editor:edited_by(id, email)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error) {
        setEdits(data || []);
      }
      setLoading(false);
    };

    fetchEdits();

    // Subscribe to new edits
    const subscription = supabase
      .channel(`edits:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_edits',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          setEdits((prev) => [payload.new as DocumentEdit, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [documentId, supabase]);

  return { edits, loading };
}

/**
 * Hook for accessing document version history.
 */
export function useDocumentVersions(documentId: string) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchVersions = async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select(`
          *,
          created_by_user:created_by(id, email)
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (!error) {
        setVersions(data || []);
      }
      setLoading(false);
    };

    fetchVersions();

    // Subscribe to new versions
    const subscription = supabase
      .channel(`versions:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_versions',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          setVersions((prev) => [payload.new as DocumentVersion, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [documentId, supabase]);

  return { versions, loading };
}

/**
 * Hook for document comments/threads.
 */
export function useDocumentComments(documentId: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('document_comments')
        .select(`
          *,
          author:author_id(id, email)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (!error) {
        setComments(data || []);
      }
      setLoading(false);
    };

    fetchComments();

    // Subscribe to new comments
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
            setComments((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setComments((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new : c))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [documentId, supabase]);

  return { comments, loading };
}
