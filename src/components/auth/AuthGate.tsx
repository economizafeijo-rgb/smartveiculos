import type {ReactNode} from 'react';
import {LockKeyhole,ArrowRight} from 'lucide-react';
import {usePersistentSession} from '@/components/auth/PersistentSession';

/** Protege a visualização privada; a autorização por linha permanece no RLS.
 * O provedor global define a conta antes de liberar a renderização.
 */
export function AuthGate({children,next}:{children:ReactNode;next:string}){
 const {user,ready}=usePersistentSession();
 const status=ready?(user?'signed-in':'signed-out'):'loading';
 if(status==='loading')return <div className="grid min-h-screen place-items-center bg-[#f5f7fb] text-sm font-semibold text-slate-500">Validando sua sessão...</div>;
 if(status==='signed-out')return <div className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-100 text-orange-700"><LockKeyhole size={26}/></span><h1 className="mt-5 text-2xl font-extrabold text-slate-900">Área protegida</h1><p className="mt-3 text-sm leading-7 text-slate-600">Entre com seu e-mail e senha para acessar seus veículos e registros. Cada conta possui sua área de armazenamento local.</p><a href={'/acesso?next='+encodeURIComponent(next)} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-extrabold text-slate-950">Entrar ou criar conta <ArrowRight size={18}/></a><a href="/" className="mt-4 block text-xs font-semibold text-slate-500">Voltar ao início</a></div></div>;
 return <>{children}</>;
}
