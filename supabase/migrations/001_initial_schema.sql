-- PulseDocs initial schema
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  logo_url text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.workspace_role as enum ('owner', 'admin', 'member', 'guest');

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 50),
  description text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  content text not null check (char_length(content) between 1 and 5000),
  reply_to_message_id uuid references public.messages(id) on delete set null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.document_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  parent_folder_id uuid references public.document_folders(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, parent_folder_id, name)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  folder_id uuid references public.document_folders(id) on delete set null,
  title text not null check (char_length(title) between 1 and 180),
  content text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.document_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  content text not null check (char_length(content) between 1 and 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create type public.notification_type as enum (
  'workspace_invite',
  'message_mention',
  'message_reply',
  'document_comment',
  'document_mention',
  'system'
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  target_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'member',
  invited_by uuid not null references auth.users(id) on delete restrict,
  token text not null unique,
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);
create index if not exists idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index if not exists idx_channels_workspace_id on public.channels(workspace_id);
create index if not exists idx_messages_channel_id_created_at on public.messages(channel_id, created_at desc);
create index if not exists idx_messages_workspace_id on public.messages(workspace_id);
create index if not exists idx_documents_workspace_id on public.documents(workspace_id);
create index if not exists idx_documents_folder_id on public.documents(folder_id);
create index if not exists idx_document_comments_document_id on public.document_comments(document_id);
create index if not exists idx_notifications_user_id_created_at on public.notifications(user_id, created_at desc);
create index if not exists idx_activity_logs_workspace_id_created_at on public.activity_logs(workspace_id, created_at desc);

alter table public.messages
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(content, ''))
  ) stored;

alter table public.documents
  add column if not exists search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B')
  ) stored;

create index if not exists idx_messages_search_vector on public.messages using gin(search_vector);
create index if not exists idx_documents_search_vector on public.documents using gin(search_vector);
