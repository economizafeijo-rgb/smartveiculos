# SmartVeículos — ativação do Supabase remoto

Projeto alvo: `pwvayaflyamjihqqqvpk`

## O que já está preparado
- Cliente React configurado com URL e **publishable key**, que são dados públicos da aplicação.
- Esquema de banco versionado em `supabase/migrations/`, com RLS.
- Configuração de CLI em `supabase/config.toml`.
- SQL para atribuir função de proprietário a `francdenis2026@gmail.com`.
- Função `invite-user` para convite administrativo (precisa deploy).
- Interface para backup/restauração manual na ficha do Gol.

## Antes de aplicar
1. Acesse o [painel do projeto](https://supabase.com/dashboard/project/pwvayaflyamjihqqqvpk).
2. **Redefina a senha do banco**, porque ela foi compartilhada numa conversa. Guarde-a num gerenciador de senhas. Nunca coloque essa senha no GitHub.
3. Faça backup do banco atual e revise se `public.vehicles`, `public.service_records`, `public.workshops` ou outras tabelas já existem. As migrações devem ser adaptadas se a estrutura já estiver diferente.
4. Confira a lista de migrações na pasta `supabase/migrations`.

## Opção A: configurar e publicar via Supabase CLI (seu computador)
Instale o Supabase CLI conforme [documentação oficial](https://supabase.com/docs/guides/local-development/cli/getting-started).
No terminal, dentro de um clone do repositório:

```bash
git clone https://github.com/economizafeijo-rgb/smartveiculos.git
cd smartveiculos
supabase --version
supabase login
supabase link --project-ref pwvayaflyamjihqqqvpk
supabase migration list
supabase db push --dry-run
```

**Atenção:** o `supabase login` é da conta Supabase e requer um token de acesso pessoal criado na sua conta; a senha PostgreSQL não substitui o login.
O `supabase link` pode solicitar a nova senha PostgreSQL de maneira interativa.

Se o `--dry-run` corresponder ao esperado e os objetos existentes tiverem sido revisados, execute:

```bash
supabase db push
supabase functions deploy invite-user
```

Não use `supabase db reset --linked`: esse comando pode excluir dados remotos.

Como a pasta `supabase` já está configurada no repositório, não é necessário executar novamente `supabase init` nele.

## Opção B: Supabase Dashboard
Abra [SQL Editor](https://supabase.com/dashboard/project/pwvayaflyamjihqqqvpk/sql/new) e, após backup e revisão das tabelas existentes, aplique os arquivos de migração em ordem. Em seguida, configure a função Edge `invite-user` e a autenticação.

## Ativar o administrador proprietário
1. No menu [Authentication → Users](https://supabase.com/dashboard/project/pwvayaflyamjihqqqvpk/auth/users), crie/convid​e `francdenis2026@gmail.com`.
2. Defina uma senha forte e exclusiva pelo fluxo seguro do Supabase Auth; **não reutilize senhas publicadas no chat**.
3. Execute `supabase/sql/ativar-proprietario.sql` no SQL Editor somente após o usuário existir.
4. Faça login pela rota `/admin` e confirme que uma conta sem o papel de proprietário não consegue acessar dados administrativos.

## Verificação após a implantação
Execute no SQL Editor:

```sql
select to_regclass('public.vehicles') as vehicles,
       to_regclass('public.service_records') as service_records,
       to_regclass('public.fuel_fillups') as fuel_fillups,
       to_regclass('public.workshops') as workshops,
       to_regclass('public.vehicle_models') as vehicle_models;

select tablename, rowsecurity
from pg_tables
where schemaname='public' and tablename in
('vehicles','service_records','fuel_fillups','workshops','parts_stores','fleet_vehicles','unit_members','vehicle_models','user_profiles','platform_admins');
```

Confirme que todas as tabelas esperadas existem e que `rowsecurity = true`. Teste RLS com usuários reais distintos e confira que dados de um usuário não vazam para outro.

## Limitação deste envio
Esses arquivos no GitHub não criam as tabelas no servidor remoto. Somente `supabase db push` ou a aplicação das migrações pelo projeto Supabase correto fará isso. A deploy da Edge Function também é independente.
