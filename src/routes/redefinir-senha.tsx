import {createFileRoute} from '@tanstack/react-router';
import {useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,KeyRound,LockKeyhole,ShieldCheck} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';

export const Route=createFileRoute('/redefinir-senha')({
 head:()=>({meta:[{title:'Redefinir senha | SmartVeículos'}]}),
 component:ResetPassword
});
function ResetPassword(){
 const [available,setAvailable]=useState(false);
 const [loading,setLoading]=useState(true);
 const [password,setPassword]=useState('');
 const [repeat,setRepeat]=useState('');
 const [saving,setSaving]=useState(false);
 const [done,setDone]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{
  if(!supabase){setMessage('Serviço de autenticação indisponível.');setLoading(false);return;}
  let active=true;
  const errors=new URLSearchParams(window.location.hash.slice(1));
  if(errors.get('error')||errors.get('error_code')){
   setMessage('Link expirado ou inválido. Solicite outra recuperação pela página Entrar.');
   setLoading(false);return;
  }
  const client=supabase;
  const {data:listener}=client.auth.onAuthStateChange((_event,session)=>{
   if(active&&session){setAvailable(true);setLoading(false);}
  });
  void client.auth.getSession().then(({data,error})=>{
   if(!active)return;
   setAvailable(Boolean(data.session));
   setLoading(false);
   if(error)setMessage(error.message);
   else if(!data.session)setMessage('O link não criou uma sessão válida. Solicite um novo e-mail de recuperação.');
  }).catch(()=>{
   if(active){setLoading(false);setMessage('Não foi possível validar a recuperação.');}
  });
  return ()=>{active=false;listener.subscription.unsubscribe();};
 },[]);
 async function submit(e:FormEvent){
  e.preventDefault();if(!supabase||!available)return;
  setMessage('');
  if(password.length<6){setMessage('A senha deve ter pelo menos 6 caracteres.');return;}
  if(password!==repeat){setMessage('As duas senhas não são iguais.');return;}
  setSaving(true);
  try{
   const {error}=await supabase.auth.updateUser({password});
   if(error)throw error;
   setDone(true);setPassword('');setRepeat('');
   setMessage('Senha atualizada com sucesso. Você já pode entrar na plataforma.');
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível redefinir a senha.');}
  finally{setSaving(false);}
 }
 return <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
  <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
   <a href="/" className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="text-orange-600"/> SmartVeículos</a>
   <div className="mt-8 grid size-14 place-items-center rounded-2xl bg-orange-50 text-orange-600">{done?<CheckCircle2 size={28}/>:<KeyRound size={28}/>}</div>
   <h1 className="mt-5 text-2xl font-black text-slate-900">{done?'Senha redefinida':'Crie sua nova senha'}</h1>
   {message&&<p role="status" className={'mt-4 rounded-xl p-3 text-sm '+(done?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-900')}>{message}</p>}
   {loading?<p className="mt-5 text-sm text-slate-500">Validando link...</p>:available&&!done?<form onSubmit={submit} className="mt-6 space-y-4">
    <label className="block text-sm font-bold text-slate-700">Nova senha<input required autoComplete="new-password" type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-orange-500"/></label>
    <label className="block text-sm font-bold text-slate-700">Repita a nova senha<input required autoComplete="new-password" type="password" minLength={6} value={repeat} onChange={e=>setRepeat(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-orange-500"/></label>
    <button disabled={saving} className="w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{saving?'Salvando...':'Salvar nova senha'}</button>
   </form>:null}
   <a href="/acesso" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-700 underline"><LockKeyhole size={16}/> Ir para login</a>
   <p className="mt-5 text-xs leading-6 text-slate-500">Nunca compartilhe links de recuperação ou sua senha com terceiros.</p>
  </section>
 </main>;
}
