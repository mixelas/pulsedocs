'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getCurrentUserRole } from '@/lib/auth-helpers';
import { canComment, canDeleteContent } from '@/lib/permissions';
import { logActivity } from '@/app/actions/activity';
import type { DocumentComment } from '@/types/database';

export async function getDocumentCommentCounts(workspaceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('document_comments')
    .select('document_id')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null);

  const counts: Record<string, number> = {};
  (data || []).forEach((comment: any) => {
    counts[comment.document_id] = (counts[comment.document_id] || 0) + 1;
  });

  return counts;
}

export async function getDocumentComments(documentId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_comments')
    .select('*')
    .eq('document_id', documentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data as DocumentComment[] || [];
}

export async function createDocumentComment(
  documentId: string,
  workspaceId: string,
  content: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const role = await getCurrentUserRole(workspaceId);
  if (!role || !canComment(role)) {
    throw new Error('Permission denied');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_comments')
    .insert({
      document_id: documentId,
      workspace_id: workspaceId,
      author_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity(workspaceId, 'comment_posted', `Posted a comment on a document`, {
    documentId,
    commentId: data.id,
  });

  return data as DocumentComment;
}

export async function updateDocumentComment(
  commentId: string,
  content: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  const { data: comment } = await supabase
    .from('document_comments')
    .select('author_id')
    .eq('id', commentId)
    .single();

  if (!comment) throw new Error('Comment not found');
  if (comment.author_id !== user.id) {
    throw new Error('Can only edit your own comments');
  }

  const { error } = await supabase
    .from('document_comments')
    .update({ content })
    .eq('id', commentId);

  if (error) throw error;
}

export async function deleteDocumentComment(commentId: string, workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  const { data: comment } = await supabase
    .from('document_comments')
    .select('author_id')
    .eq('id', commentId)
    .single();

  if (!comment) throw new Error('Comment not found');

  const role = await getCurrentUserRole(workspaceId);
  if (comment.author_id !== user.id && (!role || !canDeleteContent(role))) {
    throw new Error('Permission denied');
  }

  const { error } = await supabase
    .from('document_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) throw error;

  await logActivity(workspaceId, 'comment_deleted', `Deleted a comment`, {
    commentId,
  });
}
