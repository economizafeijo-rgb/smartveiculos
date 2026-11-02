-- CB650R 2024: perfil de inspeção em nuvem, isolado por proprietário.
-- Depende da migração 20261101000000_smartveiculos.
create table if not exists public.motorcycle_profiles (
 vehicle_id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 profile_kind text not null default 'honda_cb650r_2024' check(profile_kind='honda_cb650r_2024'),
 profile_data jsonb not null default '{}'::jsonb check(jsonb_typeof(profile_data)='object' and pg_column_size(profile_data)<=12000),
 updated_at timestamptz not null default now(),
 foreign key(vehicle_id,owner_id) references public.vehicles(id,owner_id) on delete cascade
);
create index if not exists motorcycle_profiles_owner on public.motorcycle_profiles(owner_id);
alter table public.motorcycle_profiles enable row level security;
create policy "motorcycle_profiles_owner_select" on public.motorcycle_profiles
 for select to authenticated using(owner_id=(select auth.uid()));
create policy "motorcycle_profiles_owner_insert" on public.motorcycle_profiles
 for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "motorcycle_profiles_owner_update" on public.motorcycle_profiles
 for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "motorcycle_profiles_owner_delete" on public.motorcycle_profiles
 for delete to authenticated using(owner_id=(select auth.uid()));
revoke all on public.motorcycle_profiles from anon;
grant select,insert,update,delete on public.motorcycle_profiles to authenticated;
-- Registro de MODELO, não de moto pessoal (não inventar placa, km nem proprietários).
insert into public.vehicle_models(kind,brand,model,model_year,engine,featured)
select 'moto','Honda','CB650R',2024,'649 cm³ · DOHC · 4 cilindros · gasolina',true
where not exists (
 select 1 from public.vehicle_models where kind='moto' and brand='Honda' and model='CB650R' and model_year=2024
);
