'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createChannel } from '@/app/actions/workspace';

interface Props {
  params: { id: string };
}

export default function CreateChannel({ params: { id } }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const channel = await createChannel(id, name, description || undefined);
      router.push(`/workspace/${id}/channels/${channel.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">Create Channel</h2>
        <p className="text-muted-foreground">
          Channels are spaces for your team to discuss topics
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Channel Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="general"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-2">2-50 characters, lowercase and hyphens only</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this channel for?"
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Creating...' : 'Create Channel'}
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
