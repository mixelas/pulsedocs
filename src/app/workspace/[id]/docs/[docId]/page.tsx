'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getDocumentById, updateDocument, deleteDocument } from '@/app/actions/workspace';
import { createDocumentVersion, updateActiveEditorStatus } from '@/app/actions/documentVersioning';
import { DocumentComments } from '@/components/DocumentComments';
import { ActiveEditorsIndicator } from '@/components/ActiveEditorsIndicator';
import { VersionHistoryPanel } from '@/components/VersionHistoryPanel';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types/database';

interface Props {
  params: { id: string; docId: string };
}

export default function DocumentView({ params: { id, docId } }: Props) {
  const [document, setDocument] = useState<Document | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const doc = await getDocumentById(docId);
      if (doc) {
        setDocument(doc);
        setTitle(doc.title);
        setContent(doc.content);
      }
      setLoading(false);
    }

    load();
  }, [docId]);

  // Track editing status in real-time
  useEffect(() => {
    if (isEditing && currentUserId) {
      updateActiveEditorStatus(docId, true);

      const interval = setInterval(() => {
        updateActiveEditorStatus(docId, true);
      }, 10000); // Update status every 10 seconds

      return () => {
        clearInterval(interval);
        updateActiveEditorStatus(docId, false);
      };
    }
  }, [isEditing, docId, currentUserId]);

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      // Calculate change summary
      const titleChanged = document?.title !== title;
      const contentChanged = document?.content !== content;
      let changeSummary = '';

      if (titleChanged) {
        changeSummary = `Changed title from "${document?.title}" to "${title}"`;
      }
      if (contentChanged) {
        const contentDiff = content.length - (document?.content.length || 0);
        if (contentDiff > 0) {
          changeSummary += (changeSummary ? ' and ' : '') + `Added ${contentDiff} characters`;
        } else if (contentDiff < 0) {
          changeSummary += (changeSummary ? ' and ' : '') + `Removed ${Math.abs(contentDiff)} characters`;
        }
      }

      // Update document
      await updateDocument(docId, title, content);

      // Create version snapshot
      await createDocumentVersion(docId, title, content, changeSummary || undefined);

      setDocument({ ...document!, title, content });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(docId, id);
      router.push(`/workspace/${id}/docs`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading document...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Document not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 max-w-4xl mx-auto w-full flex-1 overflow-y-auto">
          {/* Active editors indicator */}
          <div className="mb-4">
            <ActiveEditorsIndicator documentId={docId} />
          </div>

          {/* Header */}
          <div className="mb-8 flex items-baseline justify-between">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-bold text-primary bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <h1 className="text-3xl font-bold text-primary">{title}</h1>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Updated {new Date(document.updated_at).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                  >
                    {showHistory ? 'Hide' : 'History'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
          ) : (
            <div className="prose prose-invert max-w-none bg-card rounded-lg p-6 border border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*No content yet*'}
              </ReactMarkdown>
            </div>
          )}

          {!isEditing && (
            <div className="mt-8">
              <DocumentComments
                documentId={docId}
                workspaceId={id}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Version history sidebar */}
      {showHistory && (
        <div className="w-80 border-l border-border bg-card">
          <VersionHistoryPanel documentId={docId} />
        </div>
      )}
    </div>
  );
}
