# SmartVeículos — corrigir e-mail de confirmação (Supabase Auth)

Projeto: `pwvayaflyamjihqqqvpk`
Aplicativo público: `https://smartveiculos.lovable.app`

## Diagnóstico confirmado em 02/11/2026

Registros do Auth mostraram uma verificação de link que terminou com **redirect_to=http://localhost:3000**. Este é o endereço padrão de desenvolvimento, não o site publicado. Nesse caso o usuário pode ser autenticado no Supabase e, mesmo assim, ser levado a uma página inacessível.

A conta administrativa `francdenis2026@gmail.com` foi verificada no banco: **email_confirmed_at preenchido**, com um login registrado. Não é necessário forçar nova confirmação dessa conta; se necessário, use o login com senha ou o fluxo de recuperação.

## Configuração obrigatória no Supabase Dashboard

Acesse:
https://supabase.com/dashboard/project/pwvayaflyamjihqqqvpk/auth/url-configuration

Em **Authentication > URL Configuration**:

**Site URL**
```
https://smartveiculos.lovable.app
```

**Redirect URLs** (adicionar, uma por linha, sem apagar URLs legítimas de desenvolvimento):
```
https://smartveiculos.lovable.app/confirmar-email
https://smartveiculos.lovable.app/redefinir-senha
https://smartveiculos.lovable.app/acesso
https://smartveiculos.lovable.app
```

Salve. Não é possível alterar este campo usando migrations SQL do PostgreSQL; ele pertence à configuração do GoTrue/Auth do projeto Supabase.

## Verifique os templates do e-mail

Abra:
https://supabase.com/dashboard/project/pwvayaflyamjihqqqvpk/auth/templates

- **Confirm sign up**: link deve usar `{{ .ConfirmationURL }}`; não usar um link hardcoded de localhost nem usar `{{ .SiteURL }}` como se fosse um link de confirmação.
- **Reset password**: link também deve usar `{{ .ConfirmationURL }}`.
- Se o template for personalizado com `{{ .SiteURL }}`, considere `{{ .RedirectTo }}` conforme a documentação oficial para suportar os links customizados enviados pelo app.
- Confira SMTP e limites de envio para testes e produção; o serviço embutido é restrito e não é adequado para envio massivo.

Documentação:
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/testing-auth-flows

## Ajustes implementados no SmartVeículos

- `/acesso`: `signUp` agora inclui `emailRedirectTo` explícito para `https://smartveiculos.lovable.app/confirmar-email`.
- `/acesso`: `resend({type:'signup'})` disponibilizado quando e-mail estiver pendente.
- `/acesso`: mensagens legíveis para e-mail não confirmado, senha incorreta e limite de envios.
- `/confirmar-email`: valida sessão após redirecionamento, exibe sucesso ou erro, oferece reenvio; suporta template customizado com `token_hash`.
- `/acesso`: recuperação da senha envia `redirectTo` para `/redefinir-senha`.
- `/redefinir-senha`: form para atualizar a senha após usar link de recuperação.
- `VITE_APP_URL=https://smartveiculos.lovable.app` no arquivo `.env.example`, com fallback para o mesmo domínio.

## Como testar

1. Confirme que a versão com `/confirmar-email` e `/redefinir-senha` foi publicada no Lovable, não apenas compilada no GitHub.
2. **Conta já confirmada:** vá a `https://smartveiculos.lovable.app/acesso`, faça login com e-mail/senha; evite criar nova conta.
3. **Senha desconhecida:** clique em **Esqueci minha senha**, solicite novo link e redefina a senha no endereço `/redefinir-senha`.
4. **Conta de teste não confirmada:** cadastre um e-mail de teste que você controla, clique no e-mail novo (não um link antigo), confirme que abre `/confirmar-email` no domínio do app e tente fazer login.
5. Confira `auth.users.email_confirmed_at` e `last_sign_in_at` no dashboard; não use senha real nos logs.
6. Teste as rotas `/garagem`, `/cb650r` e `/admin` com papéis de acesso corretos.

Atenção: links antigos podem ter `redirect_to=localhost:3000` incorporado e podem ser de uso único. Um novo e-mail só terá o destino correto depois de atualizar as configurações do projeto e publicar o frontend.

## Limites de acesso deste ambiente

O conector Supabase deste projeto pode consultar o Auth via SQL e logs, mas **não oferece ação para editar a URL Configuration do Auth**. Essa alteração precisa ser efetuada no dashboard com a permissão do proprietário; não confunda atualização de código com configuração remota já aplicada.
