# SmartVeículos — modernização
A página inicial ganhou um painel de indicadores responsivo, mantendo a garagem existente e seus dados locais.

## Supabase (pendente de ativação)
A migração em `supabase/migrations/20261101000000_smartveiculos.sql` prepara as tabelas `vehicles` e `service_records`, com isolamento por usuário via RLS. **Não foi executada** no banco remoto. Antes de executar, confira se já existem tabelas com os mesmos nomes no projeto.

O aplicativo **continua usando localStorage**. A migração de registros existentes, autenticação e CRUD na nuvem ainda precisam de implementação e testes completos antes de trocar o armazenamento.

Nunca inclua senhas PostgreSQL nem chaves `service_role` no frontend ou no GitHub. Use apenas a publishable key nas variáveis `VITE_`.
