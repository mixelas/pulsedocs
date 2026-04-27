'use client';

import { useState } from 'react';
import Link from 'next/link';
import { searchWorkspace } from '@/app/actions/workspace';

interface Props {
  params: { id: string };
}

interface SearchResults {
  documents: any[];
  messages: any[];
  channels: any[];
}

export default function Search({ params: { id } }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    const res = await searchWorkspace(id, query);
    setResults(res);
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-4">Search</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, messages, channels..."
            className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {!searched && (
        <div className="text-center text-muted-foreground py-12">
          <p>Start typing to search your workspace</p>
        </div>
      )}

      {searched && loading && (
        <div className="text-center text-muted-foreground py-12">
          <p>Searching...</p>
        </div>
      )}

      {searched && !loading && results && (
        <div className="space-y-8">
          {/* Documents */}
          {results.documents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">
                Documents ({results.documents.length})
              </h3>
              <div className="space-y-2">
                {results.documents.map((doc: any) => (
                  <Link
                    key={doc.id}
                    href={`/workspace/${id}/docs/${doc.id}`}
                    className="block bg-card rounded-lg p-4 border border-border hover:border-primary transition"
                  >
                    <h4 className="font-semibold text-primary">{doc.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {doc.content}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {results.messages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">
                Messages ({results.messages.length})
              </h3>
              <div className="space-y-2">
                {results.messages.map((msg: any) => (
                  <Link
                    key={msg.id}
                    href={`/workspace/${id}/channels/${msg.channel_id}`}
                    className="block bg-card rounded-lg p-4 border border-border hover:border-primary transition"
                  >
                    <div className="flex justify-between items-baseline">
                      <p className="font-semibold text-foreground text-sm">
                        Message in channel
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-foreground mt-2">{msg.content}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Channels */}
          {results.channels.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">
                Channels ({results.channels.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.channels.map((chan: any) => (
                  <Link
                    key={chan.id}
                    href={`/workspace/${id}/channels/${chan.id}`}
                    className="bg-card rounded-lg p-4 border border-border hover:border-primary transition"
                  >
                    <h4 className="font-semibold text-primary mb-1">#{chan.name}</h4>
                    {chan.description && (
                      <p className="text-sm text-muted-foreground">{chan.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.documents.length === 0 &&
            results.messages.length === 0 &&
            results.channels.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
