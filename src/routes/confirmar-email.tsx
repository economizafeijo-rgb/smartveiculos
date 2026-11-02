import {createFileRoute} from '@tanstack/react-router';
import {useEffect,useState,type FormEvent} from 'react';
import {AlertTriangle,ArrowRight,CheckCircle2,MailCheck,RefreshCw,ShieldCheck} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {authRedirectUrl} from '@/lib/supabase/auth-redirects';

export const Route=createFileRoute('/confirmar-email')({
 head:()=>({meta:[{title:'Confirmação de e-mail | SmartVeículos'}]}),
 component:ConfirmEmail
});
type Status='loading'|'confirmed'|'error'|'unverified';
function authErrorMessage(reason:string){
 if(/otp_expired|expired|invalid|access_denied|token/i.test(reason)){
  return 'O link de confirmação expirou, já foi utilizado ou não é mais válido. Se sua conta já estiver confirmada, entre normalmente. Caso contrário, solicite um novo e-mail.';
 }
 return reason||'Não foi possível validar este link. Solicite um novo e-mail se sua conta ainda não estiver confirmada.';
}
function ConfirmEmail(){
 const [status,setStatus]=useState<Status>('loading');
 const [message,setMessage]=useState('');
 const [email,setEmail]=useState('');
 const [busy,setBusy]=useState(false);
 const [sent,setSent]=useState(false);
 useEffect(()=>{
  if(!supabase){setStatus('error');setMessage('Serviço de login indisponível.');return;}
  let active=true;
  const client=supabase;
  const check=async()=>{
   try{
    const hash=new URLSearchParams(window.location.hash.slice(1));
    const query=new URLSearchParams(window.location.search);
    const error=hash.get('error_description')||query.get('error_description')||hash.get('error_code')||query.get('error_code');
    if(error){if(active){setStatus('error');setMessage(authErrorMessage(error));}return;}
    // Compatibilidade com templates customizados usando TokenHash.
    const tokenHash=query.get('token_hash');
    const tokenType=query.get('type');
    if(tokenHash && (tokenType==='email'||tokenType==='signup')){
      const {error:verifyError}=await client.auth.verifyOtp({
       token_hash:tokenHash,
       type:tokenType
      });
      if(verifyError)throw verifyError;
      window.history.replaceState(null,'','/confirmar-email');
    }
    // Supabase JS com detectSessionInUrl consome a sessão do callback hash.
    const {data,error:userError}=await client.auth.getUser();
    if(!active)return;
    if(userError && !/auth session missing/i.test(userError.message))throw userError;
    if(data.user?.email_confirmed_at){
      setStatus('confirmed');
      setMessage('Seu endereço de e-mail está confirmado! Você já pode acessar seus veículos com a conta cadastrada.');
    }else if(data.user){
      setStatus('unverified');
      setMessage('Sua sessão foi identificada, mas o e-mail ainda está aguardando confirmação. Solicite um novo envio.');
    }else{
      setStatus('unverified');
      setMessage('Este link não forneceu uma sessão ativa. Se você já confirmou o cadastro, use a opção Entrar. Caso contrário, solicite um novo e-mail.');
    }
   }catch(e){
    if(active){setStatus('error');setMessage(authErrorMessage(e instanceof Error?e.message:''));}
   }
  };
  void check();
  return()=>{active=false;};
 },[]);
 async function resend(event:FormEvent){
  event.preventDefault();if(!supabase)return;
  setBusy(true);setSent(false);
  try{
   const {error}=await supabase.auth.resend({
    type:'signup',email:email.trim().toLowerCase(),
    options:{emailRedirectTo:authRedirectUrl('/confirmar-email')}
   });
   if(error)throw error;
   setSent(true);setMessage('Se este endereço estiver aguardando confirmação, você receberá um novo link. Confira também a pasta de spam.');
  }catch(e){setStatus('error');setMessage(e instanceof Error?e.message:'Não foi possível reenviar o e-mail.');}
  finally{setBusy(false);}
 }
 return <main className="grid min-h-screen place-items-center bg-[#f3f6fa] p-5">
  <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl sm:p-10">
   <a href="/" className="mb-8 inline-flex items-center gap-2 text-xl font-black text-slate-900"><ShieldCheck className="text-orange-500"/> Smart<span className="text-orange-600">Veículos</span></a>
   <div className={'mx-auto grid size-16 place-items-center rounded-2xl '+(status==='confirmed'?'bg-emerald-50 text-emerald-600':status==='error'?'bg-amber-50 text-amber-700':'bg-orange-50 text-orange-600')}>
    {status==='confirmed'?<CheckCircle2 size={30}/>:status==='error'?<AlertTriangle size={30}/>:<MailCheck size={30}/>}
   </div>
   <h1 className="mt-5 text-2xl font-black text-slate-900">{status==='loading'?'Verificando confirmação...':status==='confirmed'?'E-mail confirmado!':status==='error'?'Não foi possível confirmar':'Verifique sua confirmação'}</h1>
   <p role="status" className="mt-3 text-sm leading-7 text-slate-600">{message||'Validando o link recebido por e-mail.'}</p>
   <a href="/acesso" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-extrabold text-slate-950 hover:bg-orange-400">Entrar no SmartVeículos <ArrowRight size={17}/></a>
   {status!=='confirmed'&&status!=='loading'&&<form onSubmit={resend} className="mt-7 border-t border-slate-100 pt-6">
     <p className="mb-3 text-left text-sm font-bold text-slate-800">Não recebeu ou perdeu o link?</p>
     <label className="block text-left text-xs font-bold text-slate-600">E-mail cadastrado<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400"/></label>
     <button disabled={busy} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40"><RefreshCw size={17}/>{busy?'Enviando...':'Reenviar confirmação'}</button>
     {sent&&<p className="mt-3 text-xs text-emerald-700">Solicitação de reenvio registrada.</p>}
   </form>}
   <p className="mt-5 text-xs leading-6 text-slate-500">O link pode ser utilizado apenas uma vez. Não compartilhe o endereço completo do link nem códigos de autenticação.</p>
  </section>
 </main>;
}
