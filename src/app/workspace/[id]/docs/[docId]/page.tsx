'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getDocumentById, updateDocument, deleteDocument } from '@/app/actions/workspace';
import { DocumentComments } from '@/components/DocumentComments';
import { getCurrentUser } from '@/lib/auth-helpers';
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
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
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

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      await updateDocument(docId, title, content);
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
    <div className="p-6 max-w-4xl mx-auto">
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
  );
}
