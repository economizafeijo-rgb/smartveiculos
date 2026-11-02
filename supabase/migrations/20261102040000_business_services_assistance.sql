-- SmartVeículos: atendimento de lojas de peças e oficinas em um banco multiempresa.
-- Cada estabelecimento possui dados próprios, isolados por business_id e RLS.
-- Não divulgar números/endereços dos clientes fora do perfil empresarial.
create table public.business_clients (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.business_accounts(id) on delete cascade,
 full_name text not null check(length(trim(full_name)) between 2 and 120),
 email text not null default '' check(length(email)<=254),
 phone text not null default '' check(length(phone)<=30),
 street_address text not null default '' check(length(street_address)<=250),
 city text not null default '' check(length(city)<=100),
 state text not null default '' check(length(state)<=60),
 postal_code text not null default '' check(length(postal_code)<=20),
 created_at timestamptz not null default now(),
 unique(business_id,id)
);
create index business_clients_company_idx on public.business_clients(business_id,full_name);
create index business_clients_email_idx on public.business_clients(business_id,lower(email));

create table public.business_client_vehicles (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.business_accounts(id) on delete cascade,
 client_id uuid not null,
 vehicle_type text not null check(vehicle_type in ('carro','moto')),
 brand text not null default '' check(length(brand)<=80),
 model text not null check(length(trim(model)) between 2 and 120),
 model_year integer check(model_year between 1950 and 2100),
 plate text not null default '' check(length(plate)<=12),
 notes text not null default '' check(length(notes)<=500),
 created_at timestamptz not null default now(),
 unique(business_id,id),
 foreign key(business_id,client_id) references public.business_clients(business_id,id) on delete cascade
);
create index business_client_vehicles_company_idx on public.business_client_vehicles(business_id,client_id);

create table public.service_cases (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.business_accounts(id) on delete cascade,
 client_id uuid not null,
 vehicle_id uuid,
 customer_email text not null default '' check(length(customer_email)<=254),
 title text not null check(length(trim(title)) between 3 and 160),
 description text not null default '' check(length(description)<=2000),
 status text not null default 'recebido'
  check(status in ('recebido','diagnostico','aguardando_aprovacao','em_execucao','testes','pronto_entrega','entregue','cancelado')),
 service_type text not null default 'manutencao'
  check(service_type in ('revisao','manutencao','troca_pecas','assistencia','instalacao','outro')),
 scheduled_at timestamptz,
 delivery_scheduled_at timestamptz,
 delivery_method text check(delivery_method in ('retirada','entrega_local','transportadora')),
 customer_visible boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(business_id,id),
 foreign key(business_id,client_id) references public.business_clients(business_id,id) on delete restrict,
 foreign key(business_id,vehicle_id) references public.business_client_vehicles(business_id,id) on delete set null (vehicle_id)
);
create index service_cases_company_idx on public.service_cases(business_id,created_at desc);
create index service_cases_customer_email_idx on public.service_cases(lower(customer_email)) where customer_visible;

create table public.service_case_items (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 case_id uuid not null,
 item_type text not null check(item_type in ('peca','servico')),
 description text not null check(length(trim(description)) between 2 and 180),
 quantity numeric(10,2) not null default 1 check(quantity>0 and quantity<=100000),
 unit_price numeric(12,2) not null default 0 check(unit_price>=0 and unit_price<=100000000),
 created_at timestamptz not null default now(),
 foreign key(business_id,case_id) references public.service_cases(business_id,id) on delete cascade
);
create index service_case_items_case_idx on public.service_case_items(case_id);

create table public.service_case_events (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 case_id uuid not null,
 status text not null check(status in ('recebido','diagnostico','aguardando_aprovacao','em_execucao','testes','pronto_entrega','entregue','cancelado')),
 note text not null default '' check(length(note)<=1200),
 visible_to_customer boolean not null default true,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(business_id,case_id) references public.service_cases(business_id,id) on delete cascade
);
create index service_case_events_case_idx on public.service_case_events(case_id,created_at);

create table public.service_case_messages (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 case_id uuid not null,
 sender_id uuid not null default auth.uid() references auth.users(id),
 body text not null check(length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now(),
 foreign key(business_id,case_id) references public.service_cases(business_id,id) on delete cascade
);
create index service_case_messages_case_idx on public.service_case_messages(case_id,created_at);

-- Evitar RLS de leitura pública acidental, inclusive em mudanças de defaults Supabase.
alter table public.business_clients enable row level security;
alter table public.business_client_vehicles enable row level security;
alter table public.service_cases enable row level security;
alter table public.service_case_items enable row level security;
alter table public.service_case_events enable row level security;
alter table public.service_case_messages enable row level security;

revoke all on public.business_clients,public.business_client_vehicles,public.service_cases,
 public.service_case_items,public.service_case_events,public.service_case_messages from public,anon;
grant select,insert,update,delete on public.business_clients,public.business_client_vehicles,
 public.service_cases,public.service_case_items to authenticated;
grant select,insert on public.service_case_events,public.service_case_messages to authenticated;

-- Empresa: proprietário autêntico, sem confundir o CNPJ com permissão.
create policy "company clients view" on public.business_clients for select to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "company clients insert" on public.business_clients for insert to authenticated
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "company clients update" on public.business_clients for update to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "company clients delete" on public.business_clients for delete to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));

create policy "company vehicles view" on public.business_client_vehicles for select to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "company vehicles insert" on public.business_client_vehicles for insert to authenticated
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "company vehicles update" on public.business_client_vehicles for update to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "company vehicles delete" on public.business_client_vehicles for delete to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));

-- Cliente: apenas caso publicado pela empresa aprovada, para e-mail autenticado.
-- Autenticação não fornece o direito de listar o cadastro interno dos clientes.
create policy "case company or invited customer view" on public.service_cases for select to authenticated
 using(
  exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()))
  or (
   customer_visible and length(trim(customer_email))>3
   and lower(customer_email)=lower(coalesce((select auth.jwt()->>'email'),''))
   and exists(select 1 from public.business_accounts b where b.id=business_id and b.review_status='approved')
  )
 );
create policy "case company insert" on public.service_cases for insert to authenticated
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "case company update" on public.service_cases for update to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "case company delete" on public.service_cases for delete to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));

-- Itens: cliente com acesso à OS pode ver os valores; só empresa altera.
create policy "case items authorized view" on public.service_case_items for select to authenticated
 using(exists(select 1 from public.service_cases sc where sc.id=case_id and sc.business_id=business_id));
create policy "case items company insert" on public.service_case_items for insert to authenticated
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()))
  and exists(select 1 from public.service_cases sc where sc.id=case_id and sc.business_id=business_id));
create policy "case items company update" on public.service_case_items for update to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid()))
  and exists(select 1 from public.service_cases sc where sc.id=case_id and sc.business_id=business_id));
create policy "case items company delete" on public.service_case_items for delete to authenticated
 using(exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));

-- Eventos append-only: visíveis ao cliente se marcados como públicos.
create policy "case events authorized view" on public.service_case_events for select to authenticated
 using(
  (exists(select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())))
  or (visible_to_customer and exists(select 1 from public.service_cases sc where sc.id=case_id and sc.business_id=business_id))
 );
create policy "case events company insert" on public.service_case_events for insert to authenticated
 with check(created_by=(select auth.uid()) and exists(
  select 1 from public.business_accounts b where b.id=business_id and b.owner_id=(select auth.uid())));

-- Chat: cliente pode escrever apenas no próprio caso liberado pela empresa aprovada.
-- A função EXISTS avalia service_cases com RLS do usuário atual.
create policy "case messages authorized view" on public.service_case_messages for select to authenticated
 using(exists(select 1 from public.service_cases sc where sc.id=case_id and sc.business_id=business_id));
create policy "case messages participant insert" on public.service_case_messages for insert to authenticated
 with check(sender_id=(select auth.uid()) and exists(
  select 1 from public.service_cases sc where sc.id=case_id and sc.business_id=business_id
   and (exists(select 1 from public.business_accounts b where b.id=sc.business_id and b.owner_id=(select auth.uid()))
    or (sc.customer_visible and lower(sc.customer_email)=lower(coalesce((select auth.jwt()->>'email'),'')) 
     and exists(select 1 from public.business_accounts b where b.id=sc.business_id and b.review_status='approved')))
 ));
-- Sem políticas UPDATE/DELETE de mensagens/eventos para garantir histórico append-only.

-- Realtime Postgres Changes: inscrições recebem linhas apenas segundo as políticas RLS.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='service_cases') then
   alter publication supabase_realtime add table public.service_cases;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='service_case_events') then
   alter publication supabase_realtime add table public.service_case_events;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='service_case_messages') then
   alter publication supabase_realtime add table public.service_case_messages;
  end if;
 end if;
end $$;
