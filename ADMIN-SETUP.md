# SmartVeículos — painel do administrador

## Implementado na branch main
- Rota `/admin` com autenticação por e-mail/senha via Supabase Auth
- Menu de Visão geral, Mecânicas, Autopeças, Veículos e Usuários
- Cadastro e exclusão de oficinas, lojas e veículos pelo administrador
- Busca, indicadores, responsividade e tratamento de erros
- Convite de usuários por e-mail via função protegida `invite-user`
- Migração com isolamento via RLS e perfis por unidade

## Configuração necessária (ainda não implantada no Supabase)
1. No projeto Supabase correto (`pwvayaflyamjihqqqvpk`), revisar e aplicar migrações em ordem: `20261101000000_smartveiculos.sql` e `20261101010000_multiunidades.sql`.
2. Criar no **Supabase Authentication > Users** a conta `francdenis2026@gmail.com`. Use convite por e-mail ou uma senha forte e exclusiva; não insira senhas em código, SQL, commits ou no chat.
3. Após o usuário existir, executar no SQL Editor, verificando que o e-mail é o pretendido:
```sql
insert into public.platform_admins(user_id)
select id from auth.users
where lower(email) = lower('francdenis2026@gmail.com')
on conflict (user_id) do nothing;
```
4. Criar `.env.local` com:
```dotenv
VITE_SUPABASE_URL=https://pwvayaflyamjihqqqvpk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```
5. Atualizar dependências e lockfile com `bun install` e verificar `bun run build` e `bun run test`.
6. Implantar `supabase/functions/invite-user` (verifique configuração de `verify_jwt`), com variáveis de ambiente gerenciadas pelo Supabase; nunca envie `service_role` para o navegador.
7. Testar em ambiente de homologação com duas contas e unidades distintas; confirmar RLS, exclusão, convite e acesso negado sem perfil.
8. Abrir a rota `/admin` e entrar.

## Estado e limitações
O SQL foi versionado, mas **não foi aplicado** ao banco remoto neste envio. A conta proprietária **não foi criada**.
A interface `/admin` é um novo painel administrativo e não substitui a rota pública `/`.
O vínculo dos operadores às unidades já possui estrutura no banco (`unit_members`), mas a interface para configurar essas permissões ainda precisa ser adicionada. Usuários sem perfil de administrador não podem abrir o painel completo.
Cadastros atuais na garagem legada continuam em `localStorage`; não houve migração automática ou exclusão de dados.
O projeto ainda exige validação de build, geração de lockfile e testes end-to-end.
