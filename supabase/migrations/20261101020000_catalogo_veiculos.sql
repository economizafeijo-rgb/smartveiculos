-- Catálogo global de referência. Não cria veículos fictícios na garagem do usuário.
-- Aplicar após 20261101010000_multiunidades.sql, mediante revisão.
create table if not exists public.vehicle_models (
 id bigint generated always as identity primary key,
 kind text not null check(kind in ('carro','moto')),
 brand text not null check(length(trim(brand)) between 2 and 60),
 model text not null check(length(trim(model)) between 2 and 120),
 model_year integer check(model_year between 1950 and 2100),
 engine text,
 featured boolean not null default false,
 created_at timestamptz not null default now(),
 unique(kind,brand,model,model_year)
);
create unique index if not exists vehicle_models_no_year_uidx on public.vehicle_models(kind,brand,model) where model_year is null;
alter table public.vehicle_models enable row level security;
create policy "catalogo leitura publica" on public.vehicle_models for select to anon, authenticated using(true);
create policy "catalogo escrita somente administrador" on public.vehicle_models for all to authenticated
 using(public.is_platform_admin()) with check(public.is_platform_admin());
grant select on public.vehicle_models to anon,authenticated;
grant insert,update,delete on public.vehicle_models to authenticated;

insert into public.vehicle_models(kind,brand,model,model_year,engine,featured) values
('carro','Volkswagen','Gol G6 Seleção 1.6',2014,'EA111 VHT 1.6 8V',true),
('carro','Volkswagen','Gol',null,null,false),
('carro','Volkswagen','Voyage',null,null,false),
('carro','Volkswagen','Fox',null,null,false),
('carro','Volkswagen','Polo',null,null,false),
('carro','Fiat','Uno',null,null,false),
('carro','Fiat','Palio',null,null,false),
('carro','Fiat','Argo',null,null,false),
('carro','Fiat','Mobi',null,null,false),
('carro','Fiat','Strada',null,null,false),
('carro','Chevrolet','Onix',null,null,false),
('carro','Chevrolet','Prisma',null,null,false),
('carro','Chevrolet','Corsa',null,null,false),
('carro','Chevrolet','Celta',null,null,false),
('carro','Chevrolet','Tracker',null,null,false),
('carro','Hyundai','HB20',null,null,false),
('carro','Hyundai','Creta',null,null,false),
('carro','Toyota','Corolla',null,null,false),
('carro','Toyota','Etios',null,null,false),
('carro','Toyota','Yaris',null,null,false),
('carro','Toyota','Hilux',null,null,false),
('carro','Honda','Civic',null,null,false),
('carro','Honda','Fit',null,null,false),
('carro','Honda','City',null,null,false),
('carro','Honda','HR-V',null,null,false),
('carro','Renault','Sandero',null,null,false),
('carro','Renault','Logan',null,null,false),
('carro','Renault','Kwid',null,null,false),
('carro','Renault','Duster',null,null,false),
('carro','Ford','Ka',null,null,false),
('carro','Ford','Fiesta',null,null,false),
('carro','Ford','EcoSport',null,null,false),
('moto','Honda','CG 160',null,null,false),
('moto','Honda','Biz 125',null,null,false),
('moto','Honda','Pop 110i',null,null,false),
('moto','Honda','NXR Bros 160',null,null,false),
('moto','Honda','XRE 300',null,null,false),
('moto','Yamaha','Factor 150',null,null,false),
('moto','Yamaha','Fazer 150',null,null,false),
('moto','Yamaha','FZ25',null,null,false),
('moto','Yamaha','Lander 250',null,null,false),
('moto','Yamaha','NMax 160',null,null,false),
('moto','Bajaj','Dominar 160',null,null,false),
('moto','Bajaj','Dominar 200',null,null,false),
('moto','Bajaj','Dominar 400',null,null,false),
('moto','Suzuki','Yes 125',null,null,false),
('moto','Suzuki','Intruder 125',null,null,false),
('moto','Suzuki','GSX-S',null,null,false)
on conflict do nothing;
