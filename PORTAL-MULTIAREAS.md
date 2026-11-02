# SmartVeículos — Portal multiáreas (02/11/2026)

## O novo fluxo

**Homepage pública:** `/` é um portal visual de entrada por público, com fotografias reais ilustrativas da Unsplash e design responsivo.

- **Autopeças de carros:** `/acesso?segment=parts_cars` → `/negocio?segment=parts_cars`
- **Autopeças de motos:** `/acesso?segment=parts_bikes` → `/negocio?segment=parts_bikes`
- **Oficinas mecânicas:** `/acesso?segment=workshop` → `/negocio?segment=workshop`
- **Proprietário / cliente:** `/acesso?next=%2Fgaragem` → `/garagem`
- **Modelos particulares:** `/gol-g6` e `/cb650r`, atrás de autenticação
- **Administrador geral:** `/admin`
- **Aprovação de empresas:** `/admin-empresas`, acessível só a administradores na tabela `platform_admins`

## Autenticação e empresas

O acesso de todas as categorias utiliza **Supabase Auth com e-mail e senha**. Empresas também precisam informar o CNPJ para identificar o estabelecimento, tanto no cadastro quanto na entrada da área específica. O CNPJ selecionado só direciona a unidade da sessão; a autenticação e a autorização reais continuam sendo feitas pelo Supabase Auth e pelas políticas RLS.

Cadastro empresarial precisa de:
- Nome fantasia
- CNPJ (14 posições), numérico tradicional ou alfanumérico 2026
- E-mail e senha do responsável (confirmação de e-mail conforme configuração Auth)
- Cidade e telefone opcionais

**Dígitos verificadores**: implementação conforme método módulo 11 da Receita Federal com valor ASCII do caractere menos 48 (ex.: A = 17), pesos 5..2/9..2 e 6..2/9..2. O cálculo foi testado no frontend e no banco usando o exemplo oficial `12.ABC.345/01DE-35`. O CNPJ numérico continua válido.

A validação dos dígitos **não consulta a Receita Federal** e **não comprova** situação cadastral nem legitimidade do solicitante. Por isso novos registros entram com `review_status='pending'`. O administrador aprova manualmente após verificação externa da situação da empresa e do vínculo do responsável; não existe publicação de loja pública antes disso.

## Sistemas por área

- **Autopeças carros e motos:** cadastro de peças por SKU, aplicação, quantidade, preço; listagem, busca, ajuste de estoque com controle básico de conflito, exclusão; indicadores de produtos, unidades e valor de estoque.
- **Oficinas:** abertura de ordens de serviço com cliente, veículo, descrição e orçamento; transição de status aberta / em andamento / concluída, listagem e exclusão.
- **Proprietários:** garagem individual, Gol G6 prata e CB650R 2024, consumo, revisões e manutenção. A antiga página `/` foi preservada em `/garagem` com proteção por login.
- **Administração:** análise das empresas cadastradas, aprovação e rejeição, sem expor o gerenciamento a contas comuns.

## Supabase

Migration: `supabase/migrations/20261102020000_business_portal.sql`
Tabelas:
- `business_accounts` — empresas, segmento, CNPJ e status de revisão
- `parts_inventory` — estoque por empresa
- `work_orders` — ordens de serviço por oficina

Cada tabela tem Row Level Security; os titulares consultam os próprios registros. Usuários comuns não conseguem aprovar empresas, alterar a titularidade de uma empresa existente nem ver pedidos/estoques de outras empresas. Administradores podem inspecionar cadastros.

A migração foi **aplicada** no projeto `pwvayaflyamjihqqqvpk`. A função `valid_cnpj` foi validada em SQL com CNPJ numérico e alfanumérico.

## Dados locais e migração da garagem

Os registros do navegador da garagem pessoal, abastecimentos e ficha CB650R agora são **segmentados por UID de usuário do Supabase**. A área de garagem oferece botão **Importar minha garagem anterior**, mediante confirmação, para recuperar voluntariamente os dados antigos da chave sem login. Não há transferência automática de dados anteriores para outra conta. A seção de backup manual em nuvem permanece.

A migração da ficha CB650R antiga de inspeções (sem conta) pode exigir recadastro manual; não inventar medições, datas ou histórico.

## Segurança e operação

1. Configure o **Site URL** e os **Redirect URLs** do Supabase Auth para o domínio publicado e suas rotas de autenticação. Certifique-se de que envio e confirmação por e-mail funcionam.
2. Configure SMTP de produção antes de abrir cadastros publicamente.
3. Habilite proteção contra senhas comprometidas em **Authentication > Security / Attack Protection** quando disponível no plano.
4. Audite os avisos de funções `SECURITY DEFINER` geradas em migrações anteriores; essas funções são intencionalmente usadas em RLS e precisam de revisão por segurança.
5. CNPJ matematicamente válido não substitui consulta cadastral e prova de representação da empresa.
6. Reforce verificações de propriedade e papéis de colaboradores antes de adicionar funcionários externos; este lançamento é para proprietário titular e administrador geral.
7. Dados do cliente devem ter política de privacidade, termos, retenção e fluxos LGPD antes de lançamento comercial.
8. Fotografias reais na homepage são ilustrativas e não representam os veículos cadastrados; fonte: Unsplash. O uso de imagens deve respeitar direitos de marcas e pessoas identificáveis.

## Validação

O GitHub Actions executa instalação de dependências, TypeScript, testes unitários e build de produção ao atualizar `main`.

**Atenção:** um build aprovado no GitHub não confirma que o projeto foi **publicado no Lovable**. A prévia anterior do Lovable apresentou build malsucedido/desatualizado. A conexão e publicação nesse serviço precisam ser verificadas separadamente.

Fontes:
- Receita Federal CNPJ 2026: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico
- Manual DV oficial: https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/cnpj/cnpj-alfanumerico.pdf
- Supabase Auth: https://supabase.com/docs/guides/auth/passwords
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Licença Unsplash: https://unsplash.com/license
