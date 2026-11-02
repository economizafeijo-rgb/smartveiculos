-- SmartVeículos: onboarding de empresas por CNPJ numérico/alfanumérico.
-- A verificação do DV NÃO confirma cadastro ativo nem representação legal.
create or replace function public.valid_cnpj(value text)
returns boolean language plpgsql immutable strict security invoker
set search_path = ''
as $$
declare
  first_weights integer[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  second_weights integer[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  i integer; total integer := 0; remainder integer; first_digit integer; second_digit integer;
begin
  if value !~ '^[A-Z0-9]{12}[0-9]{2}$' or value ~ '^([0-9])\1{13}$' then return false; end if;
  for i in 1..12 loop
    total := total + (ascii(substr(value,i,1))-48)*first_weights[i];
  end loop;
  remainder := total % 11;
  first_digit := case when remainder < 2 then 0 else 11-remainder end;
  total := 0;
  for i in 1..12 loop
    total := total + (ascii(substr(value,i,1))-48)*second_weights[i];
  end loop;
  total := total + first_digit*second_weights[13];
  remainder := total % 11;
  second_digit := case when remainder < 2 then 0 else 11-remainder end;
  return substring(value from 13 for 2) = (first_digit::text||second_digit::text);
end $$;
revoke all on function public.valid_cnpj(text) from public;
grant execute on function public.valid_cnpj(text) to authenticated;

create table if not exists public.business_accounts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 cnpj text not null check (public.valid_cnpj(cnpj)),
 trade_name text not null check (length(trim(trade_name)) between 3 and 120),
 segment text not null check (segment in ('parts_cars','parts_bikes','workshop')),
 city text not null default '',
 phone text not null default '',
 review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 unique(cnpj,segment)
);
create index if not exists business_accounts_owner_idx on public.business_accounts(owner_id);
alter table public.business_accounts enable row level security;
create policy "business owners view" on public.business_accounts for select to authenticated
 using(owner_id=(select auth.uid()) or public.is_platform_admin());
create policy "business owners register as pending" on public.business_accounts for insert to authenticated
 with check(owner_id=(select auth.uid()) and review_status='pending');
create policy "platform admins approve" on public.business_accounts for update to authenticated
 using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy "platform admins delete" on public.business_accounts for delete to authenticated
 using(public.is_platform_admin());
revoke all on public.business_accounts from anon;
grant select,insert,update,delete on public.business_accounts to authenticated;

create table if not exists public.parts_inventory (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.business_accounts(id) on delete cascade,
 sku text not null check(length(trim(sku)) between 1 and 80),
 name text not null check(length(trim(name)) between 2 and 150),
 application text not null default '',
 quantity integer not null default 0 check(quantity between 0 and 1000000),
 price numeric(12,2) not null default 0 check(price>=0 and price<=100000000),
 created_at timestamptz not null default now(),
 unique(business_id,sku)
);
create index if not exists parts_inventory_business_idx on public.parts_inventory(business_id);
alter table public.parts_inventory enable row level security;
create policy "parts owner view" on public.parts_inventory for select to authenticated using(
 exists(select 1 from public.business_accounts b where b.id=business_id and
 b.owner_id=(select auth.uid()) and b.segment in ('parts_cars','parts_bikes'))
 or public.is_platform_admin());
create policy "parts owner insert" on public.parts_inventory for insert to authenticated with check(
 exists(select 1 from public.business_accounts b where b.id=business_id and
 b.owner_id=(select auth.uid()) and b.segment in ('parts_cars','parts_bikes')));
create policy "parts owner update" on public.parts_inventory for update to authenticated using(
 exists(select 1 from public.business_accounts b where b.id=business_id and
 b.owner_id=(select auth.uid()) and b.segment in ('parts_cars','parts_bikes')))
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()) and b.segment in ('parts_cars','parts_bikes')));
create policy "parts owner delete" on public.parts_inventory for delete to authenticated using(
 exists(select 1 from public.business_accounts b where b.id=business_id and
 b.owner_id=(select auth.uid()) and b.segment in ('parts_cars','parts_bikes')));
revoke all on public.parts_inventory from anon;
grant select,insert,update,delete on public.parts_inventory to authenticated;

create table if not exists public.work_orders (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.business_accounts(id) on delete cascade,
 customer_name text not null check(length(trim(customer_name)) between 2 and 120),
 vehicle_label text not null default '',
 service_description text not null check(length(trim(service_description)) between 3 and 1000),
 status text not null default 'aberta' check(status in ('aberta','em_andamento','concluida')),
 quoted_price numeric(12,2) not null default 0 check(quoted_price>=0 and quoted_price<=100000000),
 created_at timestamptz not null default now()
);
create index if not exists work_orders_business_idx on public.work_orders(business_id);
alter table public.work_orders enable row level security;
create policy "workshop owner view" on public.work_orders for select to authenticated using(
 exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()) and b.segment='workshop')
 or public.is_platform_admin());
create policy "workshop owner insert" on public.work_orders for insert to authenticated with check(
 exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()) and b.segment='workshop'));
create policy "workshop owner update" on public.work_orders for update to authenticated using(
 exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()) and b.segment='workshop'))
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()) and b.segment='workshop'));
create policy "workshop owner delete" on public.work_orders for delete to authenticated using(
 exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()) and b.segment='workshop'));
revoke all on public.work_orders from anon;
grant select,insert,update,delete on public.work_orders to authenticated;
