-- Review existing tables before applying to a remote database.
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('carro','moto')),
  name varchar(60) not null check (length(trim(name)) > 0),
  plate varchar(10) not null default '',
  current_km integer not null default 0 check (current_km between 0 and 9999999),
  created_at timestamptz not null default now(),
  unique(id,owner_id)
);
create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id uuid not null,
  kind text not null check (kind in ('oleo','revisao','peca','manutencao')),
  service_date date not null,
  km integer not null check (km between 0 and 9999999),
  description varchar(300) not null default '',
  cost numeric(12,2) not null default 0 check (cost between 0 and 10000000),
  next_km integer check (next_km between 0 and 9999999),
  check (next_km is null or next_km > km),
  foreign key (vehicle_id,owner_id) references public.vehicles(id,owner_id) on delete cascade
);
create index if not exists idx_vehicles_owner on public.vehicles(owner_id);
create index if not exists idx_service_records_owner_vehicle on public.service_records(owner_id,vehicle_id,service_date desc);
alter table public.vehicles enable row level security;
alter table public.service_records enable row level security;
create policy "vehicles_select_own" on public.vehicles for select to authenticated using ((select auth.uid())=owner_id);
create policy "vehicles_insert_own" on public.vehicles for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "vehicles_update_own" on public.vehicles for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "vehicles_delete_own" on public.vehicles for delete to authenticated using ((select auth.uid())=owner_id);
create policy "records_select_own" on public.service_records for select to authenticated using ((select auth.uid())=owner_id);
create policy "records_insert_own" on public.service_records for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "records_update_own" on public.service_records for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "records_delete_own" on public.service_records for delete to authenticated using ((select auth.uid())=owner_id);
revoke all on public.vehicles,public.service_records from anon;
grant select,insert,update,delete on public.vehicles,public.service_records to authenticated;
