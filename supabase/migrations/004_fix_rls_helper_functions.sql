-- Fix recursion risk in RLS helper functions by running them as SECURITY DEFINER.
-- Run after:
-- 001_initial_schema.sql
-- 002_auth_helpers.sql
-- 003_fix_client_project_rls.sql

create or replace function public.is_admin_or_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role in ('admin', 'staff')
  );
$$;

create or replace function public.is_client_for_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects pr
    join public.clients c on c.id = pr.client_id
    join public.profiles p on p.id = c.profile_id
    where pr.id = target_project_id
      and p.auth_user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin_or_staff() to authenticated, anon;
grant execute on function public.is_client_for_project(uuid) to authenticated, anon;
