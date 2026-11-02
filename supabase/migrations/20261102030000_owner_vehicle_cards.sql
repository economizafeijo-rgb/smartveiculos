-- Fichas pessoais em destaque. Quilometragem desconhecida permanece NULL.
-- Os dois registros iniciais pertencem exclusivamente à conta do proprietário.
create table if not exists public.owner_vehicle_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  model_key text not null check(length(trim(model_key)) between 2 and 80),
  kind text not null check(kind in ('carro','moto')),
  display_name text not null check(length(trim(display_name)) between 3 and 120),
  brand text not null check(length(trim(brand)) between 2 and 60),
  model_year integer check(model_year between 1950 and 2100),
  color text,
  plate text,
  odometer_km integer check(odometer_km between 0 and 9999999),
  created_at timestamptz not null default now(),
  unique(owner_id,model_key)
);
create index if not exists owner_vehicle_cards_owner_idx on public.owner_vehicle_cards(owner_id);
alter table public.owner_vehicle_cards enable row level security;
revoke all on table public.owner_vehicle_cards from public,anon;
grant select,insert,update,delete on table public.owner_vehicle_cards to authenticated;
create policy "owner_vehicle_cards_select" on public.owner_vehicle_cards
  for select to authenticated using(owner_id=(select auth.uid()));
create policy "owner_vehicle_cards_insert" on public.owner_vehicle_cards
  for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "owner_vehicle_cards_update" on public.owner_vehicle_cards
  for update to authenticated using(owner_id=(select auth.uid()))
  with check(owner_id=(select auth.uid()));
create policy "owner_vehicle_cards_delete" on public.owner_vehicle_cards
  for delete to authenticated using(owner_id=(select auth.uid()));

-- Registro solicitado pelo proprietário: modelos reais, sem inventar placa, cor da moto ou km.
insert into public.owner_vehicle_cards(owner_id,model_key,kind,display_name,brand,model_year,color)
select u.id, m.model_key, m.kind, m.display_name, m.brand, m.model_year,m.color
from auth.users u
cross join (values
 ('gol-g6-selecao-2014','carro','Gol G6 Seleção 1.6','Volkswagen',2014,'Prata'),
 ('cb650r-2024','moto','Honda CB650R','Honda',2024,null)
) as m(model_key,kind,display_name,brand,model_year,color)
where lower(u.email)=lower('francdenis2026@gmail.com')
on conflict(owner_id,model_key) do nothing;
