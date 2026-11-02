import { useEffect,useState,type ReactNode } from 'react';
import { LockKeyhole,ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {setGarageAccount} from '@/lib/garage/store';
import {setFuelAccount} from '@/lib/garage/fuel';
import {setBikeAccount} from '@/lib/garage/cb650r-state';

function switchAccount(id:string|null){
 setGarageAccount(id);setFuelAccount(id);setBikeAccount(id);
}
/** Protege as páginas privadas. A autorização de cada linha permanece no RLS do Supabase. */
export function AuthGate({children,next}:{children:ReactNode;next:string}){
 const [status,setStatus]=useState<'loading'|'signed-in'|'signed-out'>('loading');
 useEffect(()=>{
  let active=true;
  if(!supabase){setStatus('signed-out');return;}
  const client=supabase;
  const {data:listener}=client.auth.onAuthStateChange((event,session)=>{
   if(!active)return;
   if(event==='SIGNED_OUT'){switchAccount(null);setStatus('signed-out');}
   else if(event==='SIGNED_IN'&&session?.user){switchAccount(session.user.id);setStatus('signed-in');}
  });
  void client.auth.getUser().then(({data,error})=>{
   if(!active)return;
   if(!error&&data.user){switchAccount(data.user.id);setStatus('signed-in');}
   else {switchAccount(null);setStatus('signed-out');}
  }).catch(()=>{if(active){switchAccount(null);setStatus('signed-out');}});
  return ()=>{active=false;listener.subscription.unsubscribe();};
 },[]);
 if(status==='loading')return <div className="grid min-h-screen place-items-center bg-[#f5f7fb] text-sm font-semibold text-slate-500">Validando sua sessão...</div>;
 if(status==='signed-out')return <div className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-100 text-orange-700"><LockKeyhole size={26}/></span><h1 className="mt-5 text-2xl font-extrabold text-slate-900">Área protegida</h1><p className="mt-3 text-sm leading-7 text-slate-600">Entre com seu e-mail e senha para acessar seus veículos e registros. Cada conta possui sua área de armazenamento local.</p><a href={'/acesso?next='+encodeURIComponent(next)} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-extrabold text-slate-950">Entrar ou criar conta <ArrowRight size={18}/></a><a href="/" className="mt-4 block text-xs font-semibold text-slate-500">Voltar ao início</a></div></div>;
 return <>{children}</>;
}
