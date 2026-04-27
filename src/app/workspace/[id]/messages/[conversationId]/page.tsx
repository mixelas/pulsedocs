'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DirectMessagesThread } from '@/components/DirectMessagesThread';

interface Props {
  params: { id: string; conversationId: string };
}

export default function DirectMessageThreadPage({ params: { id, conversationId } }: Props) {
  const [conversation, setConversation] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      try {
        // Fetch conversation details
        const supabase = createClient();
        const { data: convo } = await supabase
          .from('direct_message_conversations')
          .select('*, participant_1(id, email), participant_2(id, email)')
          .eq('id', conversationId)
          .single();

        setConversation(convo);
      } catch (err) {
        router.push(`/workspace/${id}/messages`);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, conversationId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const otherUser = conversation.participant_1_id === currentUserId
    ? conversation.participant_2
    : conversation.participant_1;

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
        <Link
          href={`/workspace/${id}/messages`}
          className="text-sm text-muted-foreground hover:text-primary transition"
        >
          ← Back to messages
        </Link>
      </div>

      <DirectMessagesThread
        conversationId={conversationId}
        workspaceId={id}
        otherUserEmail={otherUser?.email}
        currentUserId={currentUserId}
      />
    </div>
  );
}
