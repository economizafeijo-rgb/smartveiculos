-- SmartVeículos: painel multiunidades. Aplicar somente após revisão no SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.platform_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.workshops (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 2 and 120),
 city text not null default '',
 phone text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.parts_stores (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 2 and 120),
 city text not null default '',
 phone text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.fleet_vehicles (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 2 and 120),
 plate text not null default '',
 current_km integer not null default 0 check(current_km between 0 and 9999999),
 workshop_id uuid references public.workshops(id) on delete set null,
 created_at timestamptz not null default now()
);
create table if not exists public.user_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 email text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.unit_members (
 user_id uuid not null references auth.users(id) on delete cascade,
 workshop_id uuid references public.workshops(id) on delete cascade,
 parts_store_id uuid references public.parts_stores(id) on delete cascade,
 role text not null check(role in ('gestor','operador','consulta')),
 created_at timestamptz not null default now(),
 primary key (user_id,role,created_at),
 check ((workshop_id is not null)::int + (parts_store_id is not null)::int = 1)
);
create unique index if not exists unit_members_workshop_unique on public.unit_members(user_id,workshop_id) where workshop_id is not null;
create unique index if not exists unit_members_store_unique on public.unit_members(user_id,parts_store_id) where parts_store_id is not null;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.platform_admins where user_id = (select auth.uid()))
$$;
create or replace function public.can_access_workshop(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select public.is_platform_admin() or exists(
 select 1 from public.unit_members where user_id=(select auth.uid()) and workshop_id=target)
$$;
create or replace function public.can_access_parts_store(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select public.is_platform_admin() or exists(
 select 1 from public.unit_members where user_id=(select auth.uid()) and parts_store_id=target)
$$;
revoke all on function public.is_platform_admin() from public, anon;
revoke all on function public.can_access_workshop(uuid) from public, anon;
revoke all on function public.can_access_parts_store(uuid) from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.can_access_workshop(uuid) to authenticated;
grant execute on function public.can_access_parts_store(uuid) to authenticated;

alter table public.platform_admins enable row level security;
alter table public.workshops enable row level security;
alter table public.parts_stores enable row level security;
alter table public.fleet_vehicles enable row level security;
alter table public.user_profiles enable row level security;
alter table public.unit_members enable row level security;

create policy "admins see own designation" on public.platform_admins for select to authenticated using(user_id=(select auth.uid()));
create policy "workshops scoped read" on public.workshops for select to authenticated using(public.can_access_workshop(id));
create policy "workshops platform write" on public.workshops for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy "stores scoped read" on public.parts_stores for select to authenticated using(public.can_access_parts_store(id));
create policy "stores platform write" on public.parts_stores for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy "vehicles scoped read" on public.fleet_vehicles for select to authenticated using(public.is_platform_admin() or public.can_access_workshop(workshop_id));
create policy "vehicles platform write" on public.fleet_vehicles for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy "members scoped read" on public.unit_members for select to authenticated using(public.is_platform_admin() or user_id=(select auth.uid()));
create policy "members platform write" on public.unit_members for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy "profiles read" on public.user_profiles for select to authenticated using(public.is_platform_admin() or user_id=(select auth.uid()));
create policy "profiles platform write" on public.user_profiles for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());

grant select,insert,update,delete on public.workshops,public.parts_stores,public.fleet_vehicles,public.unit_members,public.user_profiles to authenticated;
grant select on public.platform_admins to authenticated;

-- Bootstrap proprietário: primeiro crie o usuário pelo Supabase Auth, depois execute:
-- insert into public.platform_admins(user_id)
-- select id from auth.users where lower(email)=lower('francdenis2026@gmail.com')
-- on conflict (user_id) do nothing;
-- Nunca armazene senhas em migrations, tabelas públicas ou repositórios.
