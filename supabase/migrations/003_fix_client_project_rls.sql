-- Fix client-facing RLS policies that can recurse via projects self-checks.
-- Run after 001_initial_schema.sql and 002_auth_helpers.sql.

drop policy if exists "projects_client_read_own" on public.projects;
create policy "projects_client_read_own" on public.projects
for select using (
  exists (
    select 1
    from public.clients c
    join public.profiles p on p.id = c.profile_id
    where c.id = projects.client_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "project_stages_client_read" on public.project_stages;
create policy "project_stages_client_read" on public.project_stages
for select using (
  exists (
    select 1
    from public.projects pr
    join public.clients c on c.id = pr.client_id
    join public.profiles p on p.id = c.profile_id
    where pr.id = project_stages.project_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "project_updates_client_read_visible" on public.project_updates;
create policy "project_updates_client_read_visible" on public.project_updates
for select using (
  visible_to_client
  and exists (
    select 1
    from public.projects pr
    join public.clients c on c.id = pr.client_id
    join public.profiles p on p.id = c.profile_id
    where pr.id = project_updates.project_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "project_documents_client_read_visible" on public.project_documents;
create policy "project_documents_client_read_visible" on public.project_documents
for select using (
  visible_to_client
  and exists (
    select 1
    from public.projects pr
    join public.clients c on c.id = pr.client_id
    join public.profiles p on p.id = c.profile_id
    where pr.id = project_documents.project_id
      and p.auth_user_id = auth.uid()
  )
);
