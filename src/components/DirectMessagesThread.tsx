'use client';

import { useState, useEffect, useRef } from 'react';
import { sendDirectMessage } from '@/app/actions/directMessages';
import { useDirectMessageSubscription } from '@/hooks/useDirectMessageSubscription';
import { OnlineStatus } from './OnlineStatus';

interface DirectMessagesThreadProps {
  conversationId: string;
  workspaceId: string;
  otherUserEmail?: string;
  currentUserId?: string;
}

/**
 * Direct message thread component.
 * Displays message list and input for 1:1 conversations.
 * Integrates real-time subscriptions for live updates.
 */
export function DirectMessagesThread({
  conversationId,
  workspaceId,
  otherUserEmail,
  currentUserId,
}: DirectMessagesThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading } = useDirectMessageSubscription(conversationId);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setError('');

    try {
      await sendDirectMessage(conversationId, newMessage);
      setNewMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-primary">{otherUserEmail}</h2>
            {currentUserId && (
              <OnlineStatus userId={currentUserId} workspaceId={workspaceId} showLabel={true} />
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === currentUserId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-6 bg-card">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded p-3 text-sm mb-3">
            {error}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-2 rounded border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
