'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserConversations } from '@/app/actions/directMessages';
import { getOrCreateConversation } from '@/app/actions/directMessages';
import { getWorkspaceMembers } from '@/app/actions/members';
import { createClient } from '@/lib/supabase/client';
import { OnlineStatus } from '@/components/OnlineStatus';
import { useUnreadMessageCounts } from '@/hooks/useUnreadMessageCounts';
import { useRouter } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default function DirectMessagesPage({ params: { id } }: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingConversationFor, setStartingConversationFor] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const { unreadCounts } = useUnreadMessageCounts(id);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const convos = await getUserConversations(id);
      setConversations(convos);

      const membersData = await getWorkspaceMembers(id);
      setMembers(membersData || []);
      setLoading(false);
    }

    load();
  }, [id]);

  async function handleStartConversation(otherUserId: string) {
    if (!otherUserId) return;

    setStartingConversationFor(otherUserId);
    try {
      const conversation = await getOrCreateConversation(id, otherUserId);
      router.push(`/workspace/${id}/messages/${conversation.id}`);
    } finally {
      setStartingConversationFor(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">Direct Messages</h2>
        <p className="text-muted-foreground">1:1 conversations with team members</p>
      </div>

      <div className="bg-card rounded-lg p-4 border border-border mb-6">
        <h3 className="text-sm font-semibold text-primary mb-3">Start a conversation</h3>
        <div className="space-y-2">
          {members
            .filter((m) => m.user_id !== currentUserId)
            .map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.user?.email || `User ${String(member.user_id).slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <button
                  onClick={() => handleStartConversation(member.user_id)}
                  disabled={startingConversationFor === member.user_id}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-opacity-90 disabled:opacity-50 transition"
                >
                  {startingConversationFor === member.user_id ? 'Opening...' : 'Message'}
                </button>
              </div>
            ))}

          {members.filter((m) => m.user_id !== currentUserId).length === 0 && (
            <p className="text-xs text-muted-foreground">No other members yet.</p>
          )}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-card rounded-lg p-12 border border-border text-center">
          <p className="text-muted-foreground mb-4">No conversations yet</p>
          <p className="text-sm text-muted-foreground">Start a DM from the member list above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((convo) => {
            const otherUser = convo.participant_1_id === currentUserId
              ? convo.participant_2
              : convo.participant_1;
            const lastMessage = convo.last_message?.[0];
            const unreadCount = unreadCounts[convo.id] || 0;

            return (
              <Link
                key={convo.id}
                href={`/workspace/${id}/messages/${convo.id}`}
                className="block bg-card rounded-lg p-4 border border-border hover:border-primary transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <OnlineStatus userId={otherUser.id} workspaceId={id} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-primary">{otherUser.email}</p>
                      {lastMessage && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {lastMessage && (
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(lastMessage.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
