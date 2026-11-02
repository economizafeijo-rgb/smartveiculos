-- Execute SOMENTE depois de criar/convidar o usuário no Supabase Auth.
-- Confirme o e-mail no painel Auth > Users antes de executar.
-- Esta consulta não cria usuário nem armazena senha.
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower('francdenis2026@gmail.com')
  limit 1;

  if v_user_id is null then
    raise exception 'Proprietário não encontrado em auth.users. Crie ou convide o usuário pelo painel Supabase Auth.';
  end if;

  insert into public.platform_admins(user_id)
  values(v_user_id)
  on conflict (user_id) do nothing;
end $$;

-- Conferência: deve retornar uma linha com o e-mail e o UUID correto.
select u.id as user_id, u.email
from public.platform_admins a
join auth.users u on u.id=a.user_id
where lower(u.email)=lower('francdenis2026@gmail.com');
