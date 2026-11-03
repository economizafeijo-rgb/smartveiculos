import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {useLocation} from '@tanstack/react-router';
import type {User} from '@supabase/supabase-js';
import {ArrowLeft,LogOut,ShieldCheck,UserRound,X} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {setGarageAccount} from '@/lib/garage/store';
import {setFuelAccount} from '@/lib/garage/fuel';
import {setBikeAccount} from '@/lib/garage/cb650r-state';
import {clearReturnNavigation,rememberPrivateRoute,returnToPanel} from '@/lib/auth/navigation';
import {
 AlertDialog,AlertDialogContent,AlertDialogDescription,
 AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,
 AlertDialogTrigger
} from '@/components/ui/alert-dialog';

type AuthSession={user:User|null;ready:boolean};
const SessionContext=createContext<AuthSession>({user:null,ready:false});

export function usePersistentSession():AuthSession{return useContext(SessionContext);}

/** Supabase persistSession mantém a sessão mesmo ao sair de /garagem para /.
 * A navegação jamais invoca signOut. Só a confirmação explícita do usuário
 * encerra a sessão deste navegador.
 */
export function PersistentSessionProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [ready,setReady]=useState(false);
 const location=useLocation();
 useEffect(()=>{
  if(!supabase){setReady(true);return;}
  const client=supabase;
  let active=true;
  let epoch=0;
  const {data:listener}=client.auth.onAuthStateChange((event,session)=>{
   if(!active)return;
   epoch++;
   setUser(session?.user??null);
   setReady(true);
   if(event==='SIGNED_OUT'){
    setGarageAccount(null);setFuelAccount(null);setBikeAccount(null);
    clearReturnNavigation();
   }
  });
  const startingEpoch=epoch;
  void client.auth.getSession().then(({data,error})=>{
   if(!active||epoch!==startingEpoch)return;
   // A falha ao consultar a sessão não equivale a uma ordem de logout.
   if(!error)setUser(data.session?.user??null);
   setReady(true);
  }).catch(()=>{if(active&&epoch===startingEpoch)setReady(true);});
  return()=>{active=false;listener.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!user?.id)return;
  // A última área pertence a esta conta, nunca a outra pessoa.
  rememberPrivateRoute(user.id,location.pathname+(typeof window!=='undefined'?window.location.search:''));
 },[user?.id,location.pathname,location.search]);
 return <SessionContext.Provider value={{user,ready}}>{children}</SessionContext.Provider>;
}

export function ReturnToPanelLink({className}:{className?:string}){
 const {user}=usePersistentSession();
 if(!user)return null;
 return <a href={returnToPanel(user.id)} className={className??'sv-session-return'}>
  <ArrowLeft size={16} aria-hidden="true"/> Voltar ao meu painel
 </a>;
}

export function ConfirmSignOut({className}:{className?:string}){
 const {user}=usePersistentSession();
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 if(!user)return null;
 async function signOut(){
  if(!supabase||busy)return;
  setBusy(true);setError('');
  try{
   const {error:failure}=await supabase.auth.signOut({scope:'local'});
   if(failure){setError('Não foi possível encerrar sua sessão. '+failure.message);return;}
   setOpen(false);
   // Encerra a sessão SOMENTE após a confirmação e resposta positiva do servidor.
   window.location.replace('/');
  }catch{
   setError('Não foi possível encerrar a sessão. Verifique a conexão e tente novamente.');
  }finally{setBusy(false);}
 }
 return <AlertDialog open={open} onOpenChange={next=>{if(!busy){setOpen(next);if(next)setError('');}}}>
  <AlertDialogTrigger asChild>
   <button type="button" className={className??'sv-session-exit'} aria-label="Sair da conta e encerrar sessão">
    <LogOut size={16} aria-hidden="true"/> Sair
   </button>
  </AlertDialogTrigger>
  <AlertDialogContent className="sv-signout-confirm w-[min(94vw,440px)] gap-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl">
   <AlertDialogHeader className="border-b border-slate-100 bg-[#f7f9fc] px-6 pb-5 pt-6 text-left">
    <div className="mb-3 grid size-12 place-items-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-700">
     <LogOut size={23} aria-hidden="true"/>
    </div>
    <AlertDialogTitle className="text-xl font-black tracking-tight text-[#142a46]">Deseja sair da sua conta?</AlertDialogTitle>
    <AlertDialogDescription className="pt-1 text-sm leading-6 text-slate-600">
     Sua sessão será encerrada neste dispositivo. Para acessar novamente seus veículos, pedidos e serviços, será necessário entrar com sua conta.
    </AlertDialogDescription>
   </AlertDialogHeader>
   <div className="space-y-4 px-6 py-5">
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
     <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#183453] text-orange-300"><UserRound size={19}/></span>
     <span className="min-w-0"><strong className="block text-xs font-black text-slate-900">Conta conectada</strong>
      <span className="block truncate text-xs text-slate-600">{user.email??'Usuário autenticado'}</span></span>
    </div>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600">
     <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-700"/> Nenhum dado cadastrado será excluído ao sair.
    </p>
    {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}
   </div>
   <AlertDialogFooter className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:space-x-0">
    <button type="button" disabled={busy} onClick={()=>setOpen(false)}
     className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
     <X size={15}/> Continuar conectado
    </button>
    <button type="button" disabled={busy} onClick={()=>void signOut()}
     className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#192d47] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#284967] disabled:opacity-60">
     <LogOut size={15}/> {busy?'Encerrando sessão…':'Sim, sair da conta'}
    </button>
   </AlertDialogFooter>
  </AlertDialogContent>
 </AlertDialog>;
}

/** Controles persistentes em TODAS as páginas (homepage, garagem, empresas,
 * veículo, atendimentos, admin e telas intermediárias) enquanto autenticado.
 */
export function GlobalSessionActions(){
 const {user,ready}=usePersistentSession();
 const location=useLocation();
 if(!ready||!user)return null;
 const isPublic=location.pathname==='/'||location.pathname==='/demonstracao'||location.pathname==='/vitrines'||location.pathname==='/acesso';
 return <nav className="sv-session-dock" aria-label="Sua sessão autenticada">
  <span className="sv-session-identity" title={user.email??'Conta conectada'}>
   <span className="sv-session-status" aria-hidden="true"/><span className="sv-session-label">Conectado</span>
  </span>
  {isPublic&&<ReturnToPanelLink/>}
  <ConfirmSignOut/>
 </nav>;
}
