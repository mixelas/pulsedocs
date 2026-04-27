-- Phase 6a: collaborative editing foundations

-- Document versions table
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_summary TEXT,
  UNIQUE (document_id, version_number)
);

-- Document edits table
CREATE TABLE IF NOT EXISTS public.document_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('title_changed', 'content_added', 'content_removed', 'content_replaced')),
  previous_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active editors table
CREATE TABLE IF NOT EXISTS public.active_editors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cursor_position INT DEFAULT 0,
  UNIQUE (document_id, user_id)
);

-- Extend existing Phase 1 comments table for collaborative threads
ALTER TABLE public.document_comments
  ADD COLUMN IF NOT EXISTS line_number INT,
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doc_versions_document ON public.document_versions(document_id, version_number);
CREATE INDEX IF NOT EXISTS idx_doc_versions_created_by ON public.document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_doc_edits_document ON public.document_edits(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_edits_user ON public.document_edits(edited_by);
CREATE INDEX IF NOT EXISTS idx_doc_edits_created ON public.document_edits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_editors_document ON public.active_editors(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_comments_resolved ON public.document_comments(document_id, resolved, created_at DESC);

-- Enable RLS for new collaborative tables
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_editors ENABLE ROW LEVEL SECURITY;

-- RLS for document_versions
DROP POLICY IF EXISTS "view_doc_versions" ON public.document_versions;
CREATE POLICY "view_doc_versions" ON public.document_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_versions.document_id
      AND d.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "insert_doc_versions" ON public.document_versions;
CREATE POLICY "insert_doc_versions" ON public.document_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_versions.document_id
      AND d.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
  )
);

-- RLS for document_edits
DROP POLICY IF EXISTS "view_doc_edits" ON public.document_edits;
CREATE POLICY "view_doc_edits" ON public.document_edits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_edits.document_id
      AND d.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "insert_doc_edits" ON public.document_edits;
CREATE POLICY "insert_doc_edits" ON public.document_edits FOR INSERT
WITH CHECK (
  edited_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_edits.document_id
      AND d.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
  )
);

-- RLS for active_editors
DROP POLICY IF EXISTS "view_active_editors" ON public.active_editors;
CREATE POLICY "view_active_editors" ON public.active_editors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = active_editors.document_id
      AND d.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "insert_active_editors" ON public.active_editors;
CREATE POLICY "insert_active_editors" ON public.active_editors FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = active_editors.document_id
      AND d.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "update_active_editors" ON public.active_editors;
CREATE POLICY "update_active_editors" ON public.active_editors FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
