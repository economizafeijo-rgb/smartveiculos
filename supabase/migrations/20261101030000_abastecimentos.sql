-- Abastecimentos pessoais (necessita schema de vehicles da migração inicial).
-- Apresenta arquitetura de nuvem; não altera automaticamente os dados em localStorage.
create table if not exists public.fuel_fillups (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 vehicle_id uuid not null,
 fill_date date not null,
 odometer_km integer not null check(odometer_km between 0 and 9999999),
 fuel text not null check(fuel in ('gasolina','etanol')),
 liters numeric(9,3) not null check(liters>0 and liters<=200),
 price_per_liter numeric(9,3) not null check(price_per_liter>0 and price_per_liter<=100),
 full_tank boolean not null default true,
 created_at timestamptz not null default now(),
 foreign key (vehicle_id,owner_id) references public.vehicles(id,owner_id) on delete cascade,
 unique(owner_id,vehicle_id,odometer_km)
);
create index if not exists fuel_fillups_owner_vehicle_date on public.fuel_fillups(owner_id,vehicle_id,fill_date desc);
alter table public.fuel_fillups enable row level security;
create policy "fillups owner select" on public.fuel_fillups
 for select to authenticated using (owner_id=(select auth.uid()));
create policy "fillups owner insert" on public.fuel_fillups
 for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "fillups owner update" on public.fuel_fillups
 for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "fillups owner delete" on public.fuel_fillups
 for delete to authenticated using (owner_id=(select auth.uid()));
grant select,insert,update,delete on public.fuel_fillups to authenticated;
