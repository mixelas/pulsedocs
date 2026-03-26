'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDocumentFolders } from '@/app/actions/workspace';
import { getDocumentCommentCounts } from '@/app/actions/comments';
import { useDocumentsSubscription } from '@/hooks/useDocumentsSubscription';
import type { DocumentFolder } from '@/types/database';

interface Props {
  params: { id: string };
}

export default function DocumentsList({ params: { id } }: Props) {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [folderLoading, setFolderLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const { documents, loading: docsLoading } = useDocumentsSubscription(id);

  useEffect(() => {
    async function loadFolders() {
      const foldersData = await getDocumentFolders(id);
      setFolders(foldersData);
      setFolderLoading(false);
    }

    loadFolders();
  }, [id]);

  useEffect(() => {
    async function loadCommentCounts() {
      const counts = await getDocumentCommentCounts(id);
      setCommentCounts(counts);
    }

    loadCommentCounts();
  }, [id]);

  const loading = docsLoading || folderLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary mb-2">Documents</h2>
          <p className="text-muted-foreground">
            Organize and manage your workspace knowledge base
          </p>
        </div>
        <Link
          href={`/workspace/${id}/docs/new`}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition"
        >
          New Document
        </Link>
      </div>

      {documents.length === 0 && folders.length === 0 ? (
        <div className="bg-card rounded-lg p-12 border border-border text-center">
          <p className="text-muted-foreground mb-4">No documents or folders yet</p>
          <Link
            href={`/workspace/${id}/docs/new`}
            className="text-sm text-primary hover:underline font-medium"
          >
            Create your first document
          </Link>
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-primary mb-4">Folders</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="bg-card rounded-lg p-4 border border-border hover:border-primary transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📁</span>
                      <h4 className="font-semibold text-foreground">{folder.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">Documents</h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/workspace/${id}/docs/${doc.id}`}
                    className="block bg-card rounded-lg p-4 border border-border hover:border-primary transition"
                  >
                    <div className="flex items-baseline justify-between">
                      <h4 className="font-semibold text-primary">{doc.title}</h4>
                      <div className="flex items-center gap-3">
                        {(commentCounts[doc.id] || 0) > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                            💬 {commentCounts[doc.id]}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {doc.content || 'No content'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
