// Função privilegiada: deploy no Supabase Edge Functions, nunca no navegador.
// Requer SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no ambiente da função.
import { createClient } from 'npm:@supabase/supabase-js@2';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply(405,{error:'Método não permitido'});
 const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'');
 if(!token)return reply(401,{error:'Autenticação necessária'});
 const url=Deno.env.get('SUPABASE_URL');
 const anon=Deno.env.get('SUPABASE_ANON_KEY');
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!anon||!secret)return reply(500,{error:'Configuração de servidor incompleta'});
 const authClient=createClient(url,anon,{auth:{persistSession:false}});
 const {data:user,error:authError}=await authClient.auth.getUser(token);
 if(authError||!user.user)return reply(401,{error:'Sessão inválida'});
 const admin=createClient(url,secret,{auth:{persistSession:false}});
 const {data:allowed,error:checkError}=await admin.from('platform_admins').select('user_id').eq('user_id',user.user.id).maybeSingle();
 if(checkError)return reply(500,{error:'Falha na verificação de permissão'});
 if(!allowed)return reply(403,{error:'Apenas administradores podem convidar usuários'});
 let payload:unknown;
 try{payload=await req.json()}catch{return reply(400,{error:'JSON inválido'})}
 if(!payload||typeof payload!=='object')return reply(400,{error:'Dados inválidos'});
 const {email,fullName}=payload as {email?:unknown;fullName?:unknown};
 if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||email.length>254)return reply(400,{error:'Informe um e-mail válido'});
 if(fullName!==undefined&&(typeof fullName!=='string'||fullName.length>120))return reply(400,{error:'Nome inválido'});
 const {data:invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email.toLowerCase().trim());
 if(inviteError)return reply(400,{error:inviteError.message});
 if(invited.user){
  const {error:profileError}=await admin.from('user_profiles').upsert({user_id:invited.user.id,email:email.toLowerCase().trim(),full_name:(fullName||'') as string},{onConflict:'user_id'});
  if(profileError)return reply(500,{error:'Convite enviado, porém não foi possível salvar o perfil'});
 }
 return reply(200,{ok:true,message:'Convite enviado por e-mail'});
});
