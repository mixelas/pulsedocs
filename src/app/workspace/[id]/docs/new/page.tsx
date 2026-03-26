'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDocument } from '@/app/actions/workspace';

interface Props {
  params: { id: string };
}

export default function CreateDocument({ params: { id } }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const doc = await createDocument(id, title, content);
      router.push(`/workspace/${id}/docs/${doc.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">New Document</h2>
        <p className="text-muted-foreground">
          Create a document to organize and share knowledge with your team
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Document Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Meeting notes, Documentation, etc."
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Write in Markdown&#10;Use **bold**, *italic*, and `code` formatting..."
            rows={12}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Supports Markdown syntax including headings, lists, and code blocks
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Creating...' : 'Create Document'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-opacity-90 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
