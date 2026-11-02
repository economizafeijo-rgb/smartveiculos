-- Identificação clara da empresa no painel do cliente, sem abrir acesso à tabela
-- business_accounts ou ao cadastro interno de outros lojistas.
alter table public.service_cases
 add column business_name text not null default '' check(length(business_name)<=120);
