-- PulseDocs development seed data
-- Run after creating at least one auth user and replace placeholders.

with me as (
  select 'af5664cd-c384-4aa2-89b3-f7f8a7ccc471'::uuid as uid
), ws as (
  insert into public.workspaces (name, slug, description, created_by)
  select 'PulseDocs Demo', 'pulsedocs-demo', 'Demo workspace for development', uid
  from me
  returning id
)
insert into public.workspace_members (workspace_id, user_id, role)
select ws.id, me.uid, 'owner'::public.workspace_role
from ws, me
on conflict (workspace_id, user_id) do nothing;

with ws as (
  select id from public.workspaces where slug = 'pulsedocs-demo' limit 1
), me as (
  select 'af5664cd-c384-4aa2-89b3-f7f8a7ccc471'::uuid as uid
)
insert into public.channels (workspace_id, name, description, created_by)
select ws.id, c.name, c.description, me.uid
from ws, me,
  (values
    ('general', 'Company-wide discussions'),
    ('announcements', 'Important updates only'),
    ('engineering', 'Technical discussions'),
    ('help', 'Ask for help and support')
  ) as c(name, description)
on conflict (workspace_id, name) do nothing;

with ws as (
  select id from public.workspaces where slug = 'pulsedocs-demo' limit 1
), me as (
  select 'af5664cd-c384-4aa2-89b3-f7f8a7ccc471'::uuid as uid
), folder as (
  insert into public.document_folders (workspace_id, name, created_by)
  select ws.id, 'Onboarding', me.uid
  from ws, me
  on conflict (workspace_id, parent_folder_id, name) do nothing
  returning id, workspace_id
), folder_fallback as (
  select id, workspace_id from folder
  union all
  select df.id, df.workspace_id
  from public.document_folders df
  join ws on ws.id = df.workspace_id
  where df.name = 'Onboarding'
  limit 1
)
insert into public.documents (workspace_id, folder_id, title, content, created_by, updated_by)
select
  ff.workspace_id,
  ff.id,
  'Welcome to PulseDocs',
  '# Welcome to PulseDocs\n\nThis is your team workspace.\n\n## Getting started\n- Introduce yourself in #general\n- Read the onboarding docs\n- Share your first update',
  me.uid,
  me.uid
from folder_fallback ff, me
on conflict do nothing;
