'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { logActivity } from '@/app/actions/activity';
import type { DocumentVersion, DocumentEdit } from '@/types/database';

/**
 * Creates a version snapshot when document is updated.
 * Called after updateDocument() is successful.
 */
export async function createDocumentVersion(
  documentId: string,
  title: string,
  content: string,
  changeSummary?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  // Get current version number
  const { data: latestVersion } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestVersion?.version_number || 0) + 1;

  // Create version snapshot
  const { data, error } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      version_number: nextVersion,
      title,
      content,
      created_by: user.id,
      change_summary: changeSummary,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DocumentVersion;
}

/**
 * Gets full version history for a document.
 */
export async function getDocumentVersionHistory(documentId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('document_versions')
    .select(`
      *,
      created_by_user:created_by(id, email)
    `)
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Rolls back document to a previous version.
 */
export async function rollbackToVersion(documentId: string, versionNumber: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  // Get the version to restore
  const { data: versionToRestore } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .eq('version_number', versionNumber)
    .single();

  if (!versionToRestore) throw new Error('Version not found');

  // Update the document
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      title: versionToRestore.title,
      content: versionToRestore.content,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  if (updateError) throw updateError;

  // Get document metadata for logging
  const { data: doc } = await supabase
    .from('documents')
    .select('workspace_id')
    .eq('id', documentId)
    .single();

  if (doc) {
    // Log activity
    await logActivity(
      doc.workspace_id,
      'document_restored',
      `Rolled back document to version ${versionNumber}`,
      { documentId, versionNumber }
    );

    // Create new version for the rollback
    await createDocumentVersion(
      documentId,
      versionToRestore.title,
      versionToRestore.content,
      `Restored from version ${versionNumber}`
    );
  }

  return versionToRestore;
}

/**
 * Tracks granular document edits.
 */
export async function trackDocumentEdit(
  documentId: string,
  editType: 'title_changed' | 'content_added' | 'content_removed' | 'content_replaced',
  previousValue?: string,
  newValue?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('document_edits')
    .insert({
      document_id: documentId,
      edited_by: user.id,
      edit_type: editType,
      previous_value: previousValue || null,
      new_value: newValue || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DocumentEdit;
}

/**
 * Gets edit history for a document.
 */
export async function getDocumentEditHistory(documentId: string, limit = 50) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('document_edits')
    .select(`
      *,
      editor:edited_by(id, email)
    `)
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

/**
 * Updates user's active editor presence.
 * Call this when user starts/stops editing.
 */
export async function updateActiveEditorStatus(
  documentId: string,
  isEditing: boolean,
  cursorPosition = 0
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  if (isEditing) {
    // Upsert active editor entry
    const { error } = await supabase
      .from('active_editors')
      .upsert({
        document_id: documentId,
        user_id: user.id,
        last_seen_at: new Date().toISOString(),
        cursor_position: cursorPosition,
      });

    if (error) throw error;
  } else {
    // Remove from active editors
    const { error } = await supabase
      .from('active_editors')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', user.id);

    if (error) throw error;
  }
}

/**
 * Gets current active editors for a document.
 * Use with real-time subscription for live presence.
 */
export async function getActiveEditors(documentId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('active_editors')
    .select(`
      *,
      user:user_id(id, email)
    `)
    .eq('document_id', documentId)
    .gt('last_seen_at', new Date(Date.now() - 30000).toISOString()); // Last 30 seconds

  if (error) return [];
  return data || [];
}

/**
 * Creates a comment/thread on a document.
 */
export async function createDocumentComment(
  documentId: string,
  content: string,
  lineNumber?: number
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  // Read workspace first because legacy comments schema requires workspace_id.
  const { data: doc } = await supabase
    .from('documents')
    .select('workspace_id')
    .eq('id', documentId)
    .single();

  if (!doc) throw new Error('Document not found');

  const { data, error } = await supabase
    .from('document_comments')
    .insert({
      workspace_id: doc.workspace_id,
      document_id: documentId,
      author_id: user.id,
      content,
      line_number: lineNumber || null,
    })
    .select()
    .single();

  if (error) throw error;

  if (doc) {
    await logActivity(
      doc.workspace_id,
      'document_commented',
      'Added a comment to document',
      { documentId }
    );
  }

  return data;
}

/**
 * Gets comments for a document.
 */
export async function getDocumentComments(documentId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('document_comments')
    .select(`
      *,
      author:author_id(id, email)
    `)
    .eq('document_id', documentId)
    .is('deleted_at', null)
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Marks a comment as resolved.
 */
export async function resolveDocumentComment(commentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createClient();

  const { error } = await supabase
    .from('document_comments')
    .update({ resolved: true })
    .eq('id', commentId);

  if (error) throw error;
}
