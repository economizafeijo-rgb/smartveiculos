import {createFileRoute} from '@tanstack/react-router';
import {useCallback,useEffect,useState} from 'react';
import {ArrowLeft,BellRing,CarFront,CheckCircle2,MessageCircle,RefreshCw,ShieldCheck} from 'lucide-react';
import {AuthGate} from '@/components/auth/AuthGate';
import {supabase} from '@/lib/supabase/client';
import {ServiceCaseDetail,STATUS_LABELS,localDate,type ServiceCase} from '@/components/business/ServiceCaseDetail';
import {DeveloperCredit} from '@/components/ui/DeveloperCredit';

export const Route=createFileRoute('/meus-atendimentos')({
 head:()=>({meta:[
  {title:'Meus atendimentos | SmartVeículos'},
  {name:'description',content:'Veja seus serviços, peças, orçamentos, atualizações e mensagens com a empresa.'}
 ]}),
 component:()=> <AuthGate next="/meus-atendimentos"><CustomerServices/></AuthGate>
});

function CustomerServices(){
 const [services,setServices]=useState<ServiceCase[]>([]);
 const [selected,setSelected]=useState('');
 const [loading,setLoading]=useState(true);
 const [email,setEmail]=useState('');
 const [error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('Serviço indisponível.');setLoading(false);return;}
  try{
   const {data:auth,error:authError}=await supabase.auth.getUser();
   if(authError||!auth.user?.email)throw new Error('Entre com seu e-mail confirmado para consultar os serviços.');
   const verified=auth.user.email.toLowerCase().trim();
   setEmail(verified);
   const {data,error:dbError}=await supabase.from('service_cases').select('*')
    .eq('customer_email',verified).eq('customer_visible',true)
    .order('created_at',{ascending:false}).limit(200);
   if(dbError)throw dbError;
   const rows=(data??[]) as ServiceCase[];
   setServices(rows);
   setSelected(old=>rows.find(x=>x.id===old)?old:rows[0]?.id??'');
   setError('');
  }catch(err){setError(err instanceof Error?err.message:'Não foi possível carregar seus atendimentos.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  void load();
  const ch=supabase?.channel('customer-services').on('postgres_changes',{
   event:'*',schema:'public',table:'service_cases'
  },()=>{void load();});
  ch?.subscribe();
  return()=>{if(ch)void supabase?.removeChannel(ch);};
 },[load]);
 const chosen=services.find(c=>c.id===selected);
 return <div className="sv-theme-surface sv-service-shell min-h-screen bg-[#f4f6fa] text-slate-900">
  <header className="border-b bg-[#111d30] text-white">
   <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
    <a href="/" className="flex items-center gap-2 text-base font-black"><CarFront size={22} className="text-orange-400"/> Smart<span className="text-orange-400">Veículos</span></a>
    <a href="/garagem" className="inline-flex items-center gap-2 text-xs font-bold text-slate-200"><ArrowLeft size={16}/> Minha garagem</a>
   </div>
  </header>
  <main className="mx-auto max-w-6xl space-y-5 px-5 py-7">
   <section className="rounded-3xl bg-[#142238] p-6 text-white sm:p-8">
    <p className="text-xs font-extrabold uppercase tracking-widest text-orange-300">Acompanhamento individual</p>
    <h1 className="mt-2 text-3xl font-black">Meus atendimentos</h1>
    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">Acompanhe os valores de peças e serviços, a etapa atual, a data prevista para entrega e converse com a loja ou oficina pelo mesmo painel.</p>
    <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold"><ShieldCheck size={15}/> Acesso: {email||'Conta autenticada'}</p>
   </section>
   {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
   {loading?<div className="rounded-xl border bg-white p-5 text-sm">Verificando seus atendimentos...</div>:
    services.length===0?<section className="rounded-2xl border bg-white p-8 text-center">
     <BellRing size={37} className="mx-auto text-orange-500"/>
     <h2 className="mt-4 text-xl font-black">Ainda não há atendimentos liberados</h2>
     <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">A empresa precisa cadastrar o serviço, associá-lo a este e-mail e liberar o acompanhamento. Sua conta deve usar o mesmo endereço cadastrado pela empresa.</p>
     <button onClick={()=>void load()} className="mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold"><RefreshCw size={15}/> Verificar novamente</button>
    </section>:<div className="grid items-start gap-4 lg:grid-cols-[minmax(230px,.32fr)_minmax(0,.68fr)]">
     <section className="rounded-2xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-black">Seus serviços</h2><span className="text-xs text-slate-500">{services.length}</span></div>
      <div className="mt-4 space-y-2">{services.map(c=><button type="button" key={c.id} onClick={()=>setSelected(c.id)}
       className={'w-full rounded-xl border p-3 text-left '+(c.id===selected?'border-orange-400 bg-orange-50':'border-slate-200 hover:bg-slate-50')}>
       <p className="font-bold">{c.title}</p>
       <p className="mt-1 text-xs text-slate-500">{localDate(c.created_at)}</p>
       <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-800"><CheckCircle2 size={13}/>{STATUS_LABELS[c.status]}</p>
      </button>)}</div>
     </section>
     <div>{chosen?<ServiceCaseDetail key={chosen.id} service={chosen} onChanged={load}/>:<div className="rounded-2xl border bg-white p-8 text-center text-sm">Selecione um atendimento.</div>}</div>
    </div>}
   <p className="flex items-center gap-2 text-xs text-slate-500"><MessageCircle size={15}/> Mensagens são visíveis apenas às pessoas autorizadas a acessar o atendimento.</p>
  </main>
  <footer className="border-t bg-white px-5 py-5 text-center"><DeveloperCredit compact/></footer>
 </div>;
}
