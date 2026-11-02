import { createClient } from '@supabase/supabase-js';

// URL e chave PUBLICÁVEL do projeto SmartVeículos (não são credenciais administrativas).
// Variáveis VITE_* têm precedência caso o app seja apontado a outro ambiente.
const url = import.meta.env['VITE_SUPABASE_URL'] || 'https://pwvayaflyamjihqqqvpk.supabase.co';
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || 'sb_publishable_2JRTUymW23gUbP4bzOygAA_CuCX5v9x';

// Não use senha de banco, service_role ou sb_secret_* em código do navegador.
export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
