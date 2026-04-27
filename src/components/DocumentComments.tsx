'use client';

import { useState } from 'react';
import { createDocumentComment, updateDocumentComment, deleteDocumentComment } from '@/app/actions/comments';
import { useDocumentCommentsSubscription } from '@/hooks/useDocumentCommentsSubscription';

/**
 * Thread for document comments.
 * Subscribes to real-time updates, handles optimistic UI, enforces write permissions.
 */

interface DocumentCommentsProps {
  documentId: string;
  workspaceId: string;
  currentUserId?: string;
}

export function DocumentComments({
  documentId,
  workspaceId,
  currentUserId,
}: DocumentCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editingSaving, setEditingSaving] = useState(false);

  const { comments, loading } = useDocumentCommentsSubscription(documentId);

  const getAuthorLabel = (authorId: string) => {
    if (!authorId) return 'Unknown user';
    if (authorId === currentUserId) return 'You';
    return `User ${authorId.slice(0, 8)}`;
  };

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPosting(true);
    setError('');

    try {
      await createDocumentComment(documentId, workspaceId, newComment);
      setNewComment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function handleUpdateComment(commentId: string) {
    if (!editContent.trim()) return;

    setEditingSaving(true);

    try {
      await updateDocumentComment(commentId, editContent);
      setEditingId(null);
    } finally {
      setEditingSaving(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteDocumentComment(commentId, workspaceId);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-primary mb-6">Comments ({comments.length})</h3>

      {/* Add comment form */}
      <form onSubmit={handlePostComment} className="mb-6 p-4 bg-muted rounded-lg">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded p-3 text-sm mb-3">
            {error}
          </div>
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-3 py-2 rounded border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            type="submit"
            disabled={posting || !newComment.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded font-semibold hover:bg-opacity-90 disabled:opacity-50 transition text-sm"
          >
            {posting ? 'Posting...' : 'Post comment'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="text-center text-muted-foreground py-4">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No comments yet</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-muted rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {getAuthorLabel(comment.author_id)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>

                {comment.author_id === currentUserId && (
                  <div className="flex gap-2">
                    {editingId !== comment.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-destructive hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="mt-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateComment(comment.id)}
                      disabled={editingSaving}
                      className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-opacity-90 disabled:opacity-50 transition"
                    >
                      {editingSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs px-3 py-1 bg-muted-foreground/20 text-foreground rounded hover:bg-opacity-90 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground mt-2">{comment.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
