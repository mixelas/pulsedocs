-- PulseDocs functions, triggers, and RLS policies

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_workspace_member(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = _workspace_id
      and wm.user_id = _user_id
  );
$$;

create or replace function public.workspace_role(_workspace_id uuid, _user_id uuid)
returns public.workspace_role
language sql
stable
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = _workspace_id
    and wm.user_id = _user_id
  limit 1;
$$;

create or replace function public.can_manage_workspace(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
as $$
  select public.workspace_role(_workspace_id, _user_id) in ('owner', 'admin');
$$;

create or replace function public.can_create_channel(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
as $$
  select public.workspace_role(_workspace_id, _user_id) in ('owner', 'admin', 'member');
$$;

create or replace function public.can_manage_documents(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
as $$
  select public.workspace_role(_workspace_id, _user_id) in ('owner', 'admin', 'member');
$$;

create or replace function public.can_delete_content(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
as $$
  select public.workspace_role(_workspace_id, _user_id) in ('owner', 'admin');
$$;

drop trigger if exists trg_workspaces_updated_at on public.workspaces;
create trigger trg_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists trg_channels_updated_at on public.channels;
create trigger trg_channels_updated_at
before update on public.channels
for each row execute function public.set_updated_at();

drop trigger if exists trg_messages_updated_at on public.messages;
create trigger trg_messages_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

drop trigger if exists trg_document_folders_updated_at on public.document_folders;
create trigger trg_document_folders_updated_at
before update on public.document_folders
for each row execute function public.set_updated_at();

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_document_comments_updated_at on public.document_comments;
create trigger trg_document_comments_updated_at
before update on public.document_comments
for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.document_folders enable row level security;
alter table public.documents enable row level security;
alter table public.document_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.workspace_invitations enable row level security;

-- workspaces
drop policy if exists "workspace_select_member" on public.workspaces;
create policy "workspace_select_member"
on public.workspaces for select
to authenticated
using (public.is_workspace_member(id, auth.uid()));

drop policy if exists "workspace_insert_owner" on public.workspaces;
create policy "workspace_insert_owner"
on public.workspaces for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "workspace_update_admin" on public.workspaces;
create policy "workspace_update_admin"
on public.workspaces for update
to authenticated
using (public.can_manage_workspace(id, auth.uid()))
with check (public.can_manage_workspace(id, auth.uid()));

drop policy if exists "workspace_delete_owner" on public.workspaces;
create policy "workspace_delete_owner"
on public.workspaces for delete
to authenticated
using (public.workspace_role(id, auth.uid()) = 'owner');

-- workspace_members
drop policy if exists "members_select_member" on public.workspace_members;
create policy "members_select_member"
on public.workspace_members for select
to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "members_insert_admin" on public.workspace_members;
create policy "members_insert_admin"
on public.workspace_members for insert
to authenticated
with check (public.can_manage_workspace(workspace_id, auth.uid()));

drop policy if exists "members_update_admin" on public.workspace_members;
create policy "members_update_admin"
on public.workspace_members for update
to authenticated
using (public.can_manage_workspace(workspace_id, auth.uid()))
with check (public.can_manage_workspace(workspace_id, auth.uid()));

drop policy if exists "members_delete_admin_or_self" on public.workspace_members;
create policy "members_delete_admin_or_self"
on public.workspace_members for delete
to authenticated
using (
  public.can_manage_workspace(workspace_id, auth.uid())
  or user_id = auth.uid()
);

-- channels
drop policy if exists "channels_select_member" on public.channels;
create policy "channels_select_member"
on public.channels for select
to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "channels_insert_creator" on public.channels;
create policy "channels_insert_creator"
on public.channels for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_create_channel(workspace_id, auth.uid())
);

drop policy if exists "channels_update_admin" on public.channels;
create policy "channels_update_admin"
on public.channels for update
to authenticated
using (public.can_manage_workspace(workspace_id, auth.uid()))
with check (public.can_manage_workspace(workspace_id, auth.uid()));

drop policy if exists "channels_delete_admin" on public.channels;
create policy "channels_delete_admin"
on public.channels for delete
to authenticated
using (public.can_manage_workspace(workspace_id, auth.uid()));

-- messages
drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member"
on public.messages for select
to authenticated
using (
  deleted_at is null
  and public.is_workspace_member(workspace_id, auth.uid())
);

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_workspace_member(workspace_id, auth.uid())
);

drop policy if exists "messages_update_own_or_admin" on public.messages;
create policy "messages_update_own_or_admin"
on public.messages for update
to authenticated
using (
  sender_id = auth.uid()
  or public.can_delete_content(workspace_id, auth.uid())
)
with check (
  sender_id = auth.uid()
  or public.can_delete_content(workspace_id, auth.uid())
);

drop policy if exists "messages_delete_own_or_admin" on public.messages;
create policy "messages_delete_own_or_admin"
on public.messages for delete
to authenticated
using (
  sender_id = auth.uid()
  or public.can_delete_content(workspace_id, auth.uid())
);

-- document_folders
drop policy if exists "folders_select_member" on public.document_folders;
create policy "folders_select_member"
on public.document_folders for select
to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "folders_insert_member" on public.document_folders;
create policy "folders_insert_member"
on public.document_folders for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_documents(workspace_id, auth.uid())
);

drop policy if exists "folders_update_member" on public.document_folders;
create policy "folders_update_member"
on public.document_folders for update
to authenticated
using (public.can_manage_documents(workspace_id, auth.uid()))
with check (public.can_manage_documents(workspace_id, auth.uid()));

drop policy if exists "folders_delete_admin" on public.document_folders;
create policy "folders_delete_admin"
on public.document_folders for delete
to authenticated
using (public.can_delete_content(workspace_id, auth.uid()));

-- documents
drop policy if exists "documents_select_member" on public.documents;
create policy "documents_select_member"
on public.documents for select
to authenticated
using (
  deleted_at is null
  and public.is_workspace_member(workspace_id, auth.uid())
);

drop policy if exists "documents_insert_member" on public.documents;
create policy "documents_insert_member"
on public.documents for insert
to authenticated
with check (
  created_by = auth.uid()
  and updated_by = auth.uid()
  and public.can_manage_documents(workspace_id, auth.uid())
);

drop policy if exists "documents_update_member" on public.documents;
create policy "documents_update_member"
on public.documents for update
to authenticated
using (public.can_manage_documents(workspace_id, auth.uid()))
with check (
  public.can_manage_documents(workspace_id, auth.uid())
  and updated_by = auth.uid()
);

drop policy if exists "documents_delete_admin" on public.documents;
create policy "documents_delete_admin"
on public.documents for delete
to authenticated
using (public.can_delete_content(workspace_id, auth.uid()));

-- document_comments
drop policy if exists "comments_select_member" on public.document_comments;
create policy "comments_select_member"
on public.document_comments for select
to authenticated
using (
  deleted_at is null
  and public.is_workspace_member(workspace_id, auth.uid())
);

drop policy if exists "comments_insert_member" on public.document_comments;
create policy "comments_insert_member"
on public.document_comments for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.is_workspace_member(workspace_id, auth.uid())
);

drop policy if exists "comments_update_own_or_admin" on public.document_comments;
create policy "comments_update_own_or_admin"
on public.document_comments for update
to authenticated
using (
  author_id = auth.uid()
  or public.can_delete_content(workspace_id, auth.uid())
)
with check (
  author_id = auth.uid()
  or public.can_delete_content(workspace_id, auth.uid())
);

drop policy if exists "comments_delete_own_or_admin" on public.document_comments;
create policy "comments_delete_own_or_admin"
on public.document_comments for delete
to authenticated
using (
  author_id = auth.uid()
  or public.can_delete_content(workspace_id, auth.uid())
);

-- notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin"
on public.notifications for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id, auth.uid())
);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- activity_logs
drop policy if exists "activity_select_member" on public.activity_logs;
create policy "activity_select_member"
on public.activity_logs for select
to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "activity_insert_member" on public.activity_logs;
create policy "activity_insert_member"
on public.activity_logs for insert
to authenticated
with check (public.is_workspace_member(workspace_id, auth.uid()));

-- workspace_invitations
drop policy if exists "invites_select_admin" on public.workspace_invitations;
create policy "invites_select_admin"
on public.workspace_invitations for select
to authenticated
using (public.can_manage_workspace(workspace_id, auth.uid()));

drop policy if exists "invites_insert_admin" on public.workspace_invitations;
create policy "invites_insert_admin"
on public.workspace_invitations for insert
to authenticated
with check (
  invited_by = auth.uid()
  and public.can_manage_workspace(workspace_id, auth.uid())
);

drop policy if exists "invites_update_admin" on public.workspace_invitations;
create policy "invites_update_admin"
on public.workspace_invitations for update
to authenticated
using (public.can_manage_workspace(workspace_id, auth.uid()))
with check (public.can_manage_workspace(workspace_id, auth.uid()));

drop policy if exists "invites_delete_admin" on public.workspace_invitations;
create policy "invites_delete_admin"
on public.workspace_invitations for delete
to authenticated
using (public.can_manage_workspace(workspace_id, auth.uid()));
