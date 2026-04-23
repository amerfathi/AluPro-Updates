-- Ultra Frame Initial Schema
-- Run in Supabase SQL Editor or via migration tooling.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'staff', 'client');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  full_name text not null,
  email text not null,
  phone text,
  role public.user_role not null default 'client',
  preferred_language text not null default 'ar' check (preferred_language in ('ar', 'en')),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text,
  phone text not null,
  email text not null,
  lead_type text not null check (lead_type in ('quote', 'field_visit', 'contact', 'maintenance')),
  service_type text,
  project_type text,
  city text,
  address text,
  notes text,
  preferred_contact_method text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.lead_attachments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_name text,
  billing_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  project_name text not null,
  slug text not null unique,
  project_type text not null,
  service_type text not null,
  location_city text,
  location_address text,
  status text not null default 'planning',
  overall_progress integer not null default 0,
  contract_value numeric(14,2),
  start_date date,
  expected_completion_date date,
  actual_completion_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_key text not null,
  stage_label_ar text not null,
  stage_label_en text not null,
  status text not null default 'pending',
  progress_percent integer not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete set null,
  title text not null,
  description text not null,
  visible_to_client boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_type text not null,
  title text not null,
  file_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  visible_to_client boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  quote_number text not null unique,
  status text not null default 'draft',
  currency text not null default 'SAR',
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  item_name text not null,
  item_description text,
  quantity numeric(12,2) not null,
  unit text not null,
  unit_price numeric(14,2) not null,
  total_price numeric(14,2) not null
);

create table if not exists public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  subject text not null,
  issue_type text not null,
  priority text not null default 'medium',
  description text not null,
  status text not null default 'open',
  preferred_contact_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.maintenance_tickets(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  title_en text not null,
  category text not null,
  summary_ar text not null,
  summary_en text not null,
  location text,
  completion_year integer,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  portfolio_project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  file_path text not null,
  alt_ar text,
  alt_en text,
  sort_order integer not null default 0,
  is_before boolean not null default false,
  is_after boolean not null default false
);

create table if not exists public.technical_library_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null,
  slug text not null unique,
  title_ar text not null,
  title_en text not null,
  summary_ar text not null,
  summary_en text not null,
  specs_json jsonb not null default '{}'::jsonb,
  download_file_path text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  channel text not null,
  message_body text not null,
  sent_status text not null default 'queued',
  sent_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin_or_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_user_id = auth.uid() and p.role in ('admin', 'staff')
  );
$$;

create or replace function public.is_client_for_project(target_project_id uuid)
returns boolean
language sql
stable
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

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_attachments enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_stages enable row level security;
alter table public.project_updates enable row level security;
alter table public.project_documents enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.maintenance_tickets enable row level security;
alter table public.maintenance_attachments enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.technical_library_entries enable row level security;
alter table public.notifications_log enable row level security;
alter table public.site_settings enable row level security;

-- profiles
create policy "profiles_self_read" on public.profiles
for select using (auth.uid() = auth_user_id);

create policy "profiles_admin_staff_manage" on public.profiles
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

-- leads and attachments
create policy "leads_public_insert" on public.leads
for insert with check (true);

create policy "leads_staff_manage" on public.leads
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "lead_attachments_staff_manage" on public.lead_attachments
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

-- clients
create policy "clients_staff_manage" on public.clients
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "clients_client_read_own" on public.clients
for select using (
  exists (
    select 1 from public.profiles p where p.id = profile_id and p.auth_user_id = auth.uid()
  )
);

-- projects family
create policy "projects_staff_manage" on public.projects
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "projects_client_read_own" on public.projects
for select using (public.is_client_for_project(id));

create policy "project_stages_staff_manage" on public.project_stages
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "project_stages_client_read" on public.project_stages
for select using (public.is_client_for_project(project_id));

create policy "project_updates_staff_manage" on public.project_updates
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "project_updates_client_read_visible" on public.project_updates
for select using (visible_to_client and public.is_client_for_project(project_id));

create policy "project_documents_staff_manage" on public.project_documents
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "project_documents_client_read_visible" on public.project_documents
for select using (visible_to_client and public.is_client_for_project(project_id));

-- quotes
create policy "quotes_staff_manage" on public.quotes
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "quote_items_staff_manage" on public.quote_items
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

-- maintenance
create policy "maintenance_public_insert" on public.maintenance_tickets
for insert with check (true);

create policy "maintenance_staff_manage" on public.maintenance_tickets
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "maintenance_client_read_own" on public.maintenance_tickets
for select using (
  client_id is not null and exists (
    select 1
    from public.clients c
    join public.profiles p on p.id = c.profile_id
    where c.id = client_id and p.auth_user_id = auth.uid()
  )
);

create policy "maintenance_attachments_staff_manage" on public.maintenance_attachments
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "maintenance_attachments_client_read" on public.maintenance_attachments
for select using (
  exists (
    select 1 from public.maintenance_tickets mt
    where mt.id = ticket_id and (
      public.is_admin_or_staff() or
      (mt.client_id is not null and exists (
        select 1
        from public.clients c
        join public.profiles p on p.id = c.profile_id
        where c.id = mt.client_id and p.auth_user_id = auth.uid()
      ))
    )
  )
);

-- cms
create policy "portfolio_public_read_published" on public.portfolio_projects
for select using (published = true or public.is_admin_or_staff());

create policy "portfolio_staff_manage" on public.portfolio_projects
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "portfolio_images_public_read" on public.portfolio_images
for select using (
  exists (
    select 1 from public.portfolio_projects pp
    where pp.id = portfolio_project_id and (pp.published = true or public.is_admin_or_staff())
  )
);

create policy "portfolio_images_staff_manage" on public.portfolio_images
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "technical_public_read_published" on public.technical_library_entries
for select using (published = true or public.is_admin_or_staff());

create policy "technical_staff_manage" on public.technical_library_entries
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

-- system tables
create policy "notifications_staff_manage" on public.notifications_log
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "settings_staff_manage" on public.site_settings
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

-- Storage buckets (run with service role / dashboard if restricted)
insert into storage.buckets (id, name, public)
values
  ('lead-attachments', 'lead-attachments', false),
  ('field-visit-attachments', 'field-visit-attachments', false),
  ('project-documents', 'project-documents', false),
  ('maintenance-uploads', 'maintenance-uploads', false),
  ('portfolio-images', 'portfolio-images', true),
  ('technical-library-files', 'technical-library-files', true),
  ('proposal-pdfs', 'proposal-pdfs', false)
on conflict (id) do nothing;

