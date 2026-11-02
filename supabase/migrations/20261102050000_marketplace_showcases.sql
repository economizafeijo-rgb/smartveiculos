-- SmartVeículos: vitrine pública de produtos e serviços, separada do estoque privado.
-- Não contém CPF, cadastro de clientes, custo, estoque interno ou histórico de OS.
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_accounts(id) on delete cascade,
  kind text not null check(kind in ('product','service')),
  title text not null check(length(btrim(title)) between 3 and 150),
  category text not null default 'Outros' check(length(category) between 2 and 80),
  description text not null default '' check(length(description)<=3500),
  brand text not null default '' check(length(brand)<=80),
  reference_code text not null default '' check(length(reference_code)<=80),
  compatibility text not null default '' check(length(compatibility)<=400),
  image_url text not null default '' check(image_url='' or (length(image_url)<=1200 and image_url ~* '^https://[^[:space:]]+$')),
  price numeric(12,2) check(price>=0 and price<=100000000),
  price_mode text not null default 'fixed' check(price_mode in ('fixed','starting_at','quote')),
  availability text not null default 'available' check(availability in ('available','on_request','out_of_stock')),
  is_published boolean not null default false,
  is_approved boolean not null default false,
  business_name text not null default '' check(length(business_name)<=120),
  business_city text not null default '' check(length(business_city)<=80),
  contact_phone text not null default '' check(length(contact_phone)<=25),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_valid_price check(
    (price_mode='quote' and price is null)
    or (price_mode in ('fixed','starting_at') and price is not null)
  )
);
create index if not exists marketplace_public_idx
  on public.marketplace_listings(kind,created_at desc) where is_published and is_approved;
create index if not exists marketplace_company_idx
  on public.marketplace_listings(business_id,created_at desc);

-- Invoker trigger: a empresa validada é autoridade sobre aprovação e identificação;
-- o lojista não consegue atribuir a si mesmo o selo de aprovação.
create or replace function public.marketplace_sync_business_fields()
returns trigger
language plpgsql
security invoker
set search_path=public,pg_temp
as $$
declare owner_business record;
begin
 select b.review_status,b.trade_name,b.city,b.phone
   into owner_business
 from public.business_accounts b where b.id=new.business_id;
 if not found then
   raise exception 'Empresa inexistente ou sem permissão para publicar';
 end if;
 new.is_approved := (owner_business.review_status='approved');
 new.business_name := owner_business.trade_name;
 new.business_city := owner_business.city;
 new.contact_phone := owner_business.phone;
 new.updated_at := now();
 return new;
end $$;
drop trigger if exists marketplace_validate_business on public.marketplace_listings;
create trigger marketplace_validate_business
before insert or update on public.marketplace_listings
for each row execute function public.marketplace_sync_business_fields();

-- Após aprovação/reprovação, sincronizar as ofertas existentes automaticamente.
create or replace function public.marketplace_approval_change()
returns trigger
language plpgsql
security invoker
set search_path=public,pg_temp
as $$
begin
 update public.marketplace_listings
 set is_approved=(new.review_status='approved'),
     business_name=new.trade_name,business_city=new.city,contact_phone=new.phone
 where business_id=new.id;
 return new;
end $$;
drop trigger if exists marketplace_approval_sync on public.business_accounts;
create trigger marketplace_approval_sync
after update of review_status,trade_name,city,phone on public.business_accounts
for each row execute function public.marketplace_approval_change();

alter table public.marketplace_listings enable row level security;
revoke all on public.marketplace_listings from public,anon,authenticated;
grant select on public.marketplace_listings to anon,authenticated;
grant insert,update,delete on public.marketplace_listings to authenticated;

create policy "public approved published listings" on public.marketplace_listings
for select to anon,authenticated
using (is_published and is_approved);

create policy "seller reads own listings" on public.marketplace_listings
for select to authenticated
using (exists(select 1 from public.business_accounts b
 where b.id=business_id and b.owner_id=(select auth.uid())));

create policy "seller inserts own listings" on public.marketplace_listings
for insert to authenticated
with check (exists(select 1 from public.business_accounts b
 where b.id=business_id and b.owner_id=(select auth.uid())));

create policy "seller updates own listings" on public.marketplace_listings
for update to authenticated
using (exists(select 1 from public.business_accounts b
 where b.id=business_id and b.owner_id=(select auth.uid())))
with check (exists(select 1 from public.business_accounts b
 where b.id=business_id and b.owner_id=(select auth.uid())));

create policy "seller removes own listings" on public.marketplace_listings
for delete to authenticated
using (exists(select 1 from public.business_accounts b
 where b.id=business_id and b.owner_id=(select auth.uid())));

-- Admin approval triggers must be able to synchronize products of the business.
create policy "platform admin can review listings" on public.marketplace_listings
for select to authenticated using (public.is_platform_admin());
create policy "platform admin syncs listing approvals" on public.marketplace_listings
for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

comment on table public.marketplace_listings is
 'Somente ofertas aprovadas/publicadas ficam públicas. Estoque e clientes permanecem privados.';
