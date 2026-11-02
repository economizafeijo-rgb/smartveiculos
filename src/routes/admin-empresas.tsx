import {createFileRoute} from '@tanstack/react-router';
import {useCallback,useEffect,useState} from 'react';
import {ArrowLeft,Building2,CheckCircle2,ClipboardCheck,Clock3,ShieldCheck,XCircle} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {formatCnpj,BUSINESS_SEGMENTS} from '@/lib/business/cnpj';

export const Route=createFileRoute('/admin-empresas')({
 head:()=>({meta:[{title:'Validação de CNPJ e empresas | SmartVeículos'}]}),
 component:AdminBusinesses
});
type Business={id:string;trade_name:string;cnpj:string;segment:string;review_status:'pending'|'approved'|'rejected';owner_id:string;created_at:string;city:string;phone:string};
function AdminBusinesses(){
 const [allowed,setAllowed]=useState(false);
 const [loading,setLoading]=useState(true);
 const [companies,setCompanies]=useState<Business[]>([]);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{
  if(!supabase){setLoading(false);return;}
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user){setAllowed(false);setLoading(false);return;}
  const {data:admin,error:permissionError}=await supabase.from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(permissionError){setError(permissionError.message);setLoading(false);return;}
  if(!admin){setAllowed(false);setLoading(false);return;}
  setAllowed(true);
  const {data,error:queryError}=await supabase.from('business_accounts').select('*').order('created_at',{ascending:false}).limit(500);
  if(queryError)setError(queryError.message);else setCompanies((data??[]) as Business[]);
  setLoading(false);
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 async function decision(id:string,review_status:'approved'|'rejected'|'pending'){
  if(!supabase)return;
  if(review_status==='approved'&&!window.confirm('Confirma que a empresa foi verificada em fonte oficial e que a titularidade do solicitante foi conferida?'))return;
  setBusy(true);setError('');setNotice('');
  try{const {error}=await supabase.from('business_accounts').update({review_status}).eq('id',id);if(error)throw error;await refresh();setNotice('Situação da empresa atualizada.');}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível atualizar.');}
  finally{setBusy(false);}
 }
 return <div className="min-h-screen bg-[#f4f6fa] text-slate-900">
  <header className="border-b bg-[#0e1828] text-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><a href="/admin" className="flex items-center gap-2 font-black"><ShieldCheck className="text-orange-400"/> SmartVeículos · Admin</a><a href="/admin" className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16}/> Voltar ao painel</a></div></header>
  <main className="mx-auto max-w-6xl space-y-5 px-5 py-8"><div><p className="text-xs font-bold uppercase tracking-widest text-orange-600">Administração</p><h1 className="mt-2 text-3xl font-black">Empresas e verificação de CNPJ</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">Novos cadastros iniciam pendentes. A aprovação é manual: confira situação cadastral e comprovação de representação antes de liberar a empresa.</p></div>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
  {notice&&<p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}
  {loading?<div className="rounded-xl bg-white p-6 text-sm">Validando permissão...</div>:!allowed?<section className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><ShieldCheck className="mx-auto text-slate-400" size={38}/><h2 className="mt-4 text-xl font-bold">Acesso restrito ao administrador</h2><p className="mt-2 text-sm text-slate-500">Entre com uma conta que tenha o papel de proprietário da plataforma.</p><a href="/admin" className="mt-4 inline-block text-sm font-bold text-orange-700 underline">Entrar no painel admin</a></section>:<>
  <div className="grid gap-4 sm:grid-cols-3">{[
   ['Cadastros',companies.length],
   ['Aguardando validação',companies.filter(x=>x.review_status==='pending').length],
   ['Aprovados',companies.filter(x=>x.review_status==='approved').length]
  ].map(([title,value])=><div key={String(title)} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">{title}</p><p className="mt-3 text-3xl font-black">{value}</p></div>)}</div>
  <div className="space-y-3">{companies.length?companies.map(company=><article key={company.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-5"><div><div className="flex items-center gap-2"><Building2 className="text-orange-600" size={20}/><h2 className="text-lg font-black">{company.trade_name}</h2></div><p className="mt-2 text-sm font-semibold text-slate-600">{BUSINESS_SEGMENTS.find(s=>s.id===company.segment)?.label??company.segment}</p><p className="mt-1 text-sm text-slate-600">CNPJ: {formatCnpj(company.cnpj)}</p><p className="mt-1 text-xs text-slate-500">{company.city||'Cidade não informada'} · {company.phone||'Telefone não informado'}</p><p className="mt-1 text-xs text-slate-500">Responsável (ID): {company.owner_id}</p></div><div className="flex flex-wrap items-center gap-2"><span className={'rounded-full px-3 py-2 text-xs font-bold '+(company.review_status==='approved'?'bg-emerald-100 text-emerald-800':company.review_status==='pending'?'bg-amber-100 text-amber-800':'bg-red-100 text-red-700')}>{company.review_status==='approved'?'Aprovado':company.review_status==='pending'?'Pendente':'Rejeitado'}</span><button disabled={busy||company.review_status==='approved'} onClick={()=>void decision(company.id,'approved')} className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><CheckCircle2 size={15}/> Aprovar</button><button disabled={busy||company.review_status==='rejected'} onClick={()=>void decision(company.id,'rejected')} className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-40"><XCircle size={15}/> Rejeitar</button></div></div></article>):<div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Ainda não há empresas cadastradas.</div>}</div></>}
  </main>
 </div>;
}
