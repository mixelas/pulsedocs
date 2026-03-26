'use client';

import { useState, useEffect, useRef } from 'react';
import { getChannelById, sendMessage } from '@/app/actions/workspace';
import { useMessagesSubscription } from '@/hooks/useMessagesSubscription';
import type { Channel } from '@/types/database';

interface Props {
  params: { id: string; channelId: string };
}

export default function ChannelView({ params: { id, channelId } }: Props) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, loading } = useMessagesSubscription(channelId);

  useEffect(() => {
    async function loadChannel() {
      const chan = await getChannelById(channelId);
      setChannel(chan);
    }

    loadChannel();
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    setError('');

    try {
      await sendMessage(channelId, id, content);
      setContent('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!channel && loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading channel...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Channel not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h2 className="text-2xl font-bold text-primary">#{channel.name}</h2>
        {channel.description && (
          <p className="text-sm text-muted-foreground mt-1">{channel.description}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-foreground text-sm">
                  {msg.sender_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
              <p className="text-foreground mt-2">{msg.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-border bg-card p-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            rows={3}
            className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition h-fit"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
