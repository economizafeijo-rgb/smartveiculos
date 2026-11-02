import {createFileRoute} from '@tanstack/react-router';
import {useCallback,useEffect,useMemo,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,Building2,CheckCircle2,ClipboardList,Clock3,LayoutDashboard,LogOut,Package,Plus,Search,ShieldCheck,Store,Trash2,Wrench} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {AuthGate} from '@/components/auth/AuthGate';
import {BUSINESS_SEGMENTS,cleanCnpj,formatCnpj,isBusinessSegment,validateCnpj,type BusinessSegment} from '@/lib/business/cnpj';

export const Route=createFileRoute('/negocio')({
 validateSearch:(search:Record<string,unknown>)=>({
  segment:typeof search['segment']==='string'&&isBusinessSegment(search['segment'])?search['segment'] as BusinessSegment:undefined
 }),
 head:()=>({meta:[{title:'Gestão de empresas — SmartVeículos'}]}),
 component:BusinessAccess
});
type Account={id:string;trade_name:string;cnpj:string;segment:BusinessSegment;review_status:'pending'|'approved'|'rejected';owner_id:string;city:string;phone:string};
type Stock={id:string;sku:string;name:string;application:string;quantity:number;price:number;created_at:string};
type Order={id:string;customer_name:string;vehicle_label:string;service_description:string;status:'aberta'|'em_andamento'|'concluida';quoted_price:number;created_at:string};
const input='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100';
const btn='inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50';
const panel='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const currency=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
function BusinessAccess(){const q=Route.useSearch();return <AuthGate next={'/negocio'+(q.segment?'?segment='+q.segment:'')}><BusinessPage segmentFilter={q.segment}/></AuthGate>}
function BusinessPage({segmentFilter}:{segmentFilter:BusinessSegment|undefined}){
 const [accountId,setAccountId]=useState('');
 const [userId,setUserId]=useState('');
 const [email,setEmail]=useState('');
 const [accounts,setAccounts]=useState<Account[]>([]);
 const [stock,setStock]=useState<Stock[]>([]);
 const [orders,setOrders]=useState<Order[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [query,setQuery]=useState('');
 const [company,setCompany]=useState({trade_name:'',cnpj:'',city:'',phone:'',segment:segmentFilter??'parts_cars' as BusinessSegment});
 const [part,setPart]=useState({sku:'',name:'',application:'',quantity:'0',price:'0'});
 const [order,setOrder]=useState({customer_name:'',vehicle_label:'',service_description:'',quoted_price:'0'});
 const [tab,setTab]=useState<'overview'|'records'>('overview');
 const active=accounts.find(a=>a.id===accountId);
 const kind=active?.segment??segmentFilter;
 const isWorkshop=kind==='workshop';
 const visibleStock=stock.filter(s=>(s.name+' '+s.sku+' '+s.application).toLowerCase().includes(query.toLowerCase()));
 const visibleOrders=orders.filter(s=>(s.customer_name+' '+s.vehicle_label+' '+s.service_description).toLowerCase().includes(query.toLowerCase()));
 const filtered=accounts.filter(x=>!segmentFilter||x.segment===segmentFilter);
 const fetchAccounts=useCallback(async()=>{
  if(!supabase)return;
  setLoading(true);
  const {data:auth,error:authError}=await supabase.auth.getUser();
  if(authError||!auth.user){setLoading(false);return;}
  setUserId(auth.user.id);setEmail(auth.user.email??'');
  const {data,error:dbError}=await supabase.from('business_accounts').select('*').eq('owner_id',auth.user.id).order('created_at',{ascending:false});
  if(dbError)setError(dbError.message);
  else setAccounts((data??[]) as Account[]);
  setLoading(false);
 },[]);
 useEffect(()=>{void fetchAccounts();},[fetchAccounts]);
 useEffect(()=>{
  if(!active||!supabase){setStock([]);setOrders([]);return;}
  let mounted=true;
  void Promise.all([
    supabase.from('parts_inventory').select('*').eq('business_id',active.id).order('created_at',{ascending:false}).limit(500),
    supabase.from('work_orders').select('*').eq('business_id',active.id).order('created_at',{ascending:false}).limit(500)
  ]).then(([parts,work])=>{
   if(!mounted)return;
   if(parts.error||work.error)setError(parts.error?.message||work.error?.message||'Erro ao carregar dados.');
   else {setStock((parts.data??[]) as Stock[]);setOrders((work.data??[]) as Order[]);setError('');}
  });
  return()=>{mounted=false;};
 },[active?.id]);
 useEffect(()=>{
  if(active&&active.id!==accountId)return;
  if(!filtered.some(x=>x.id===accountId))setAccountId(filtered[0]?.id??'');
 },[accounts,accountId,segmentFilter]);
 const refreshData=async()=>{
  if(!active||!supabase)return;
  const [p,o]=await Promise.all([
   supabase.from('parts_inventory').select('*').eq('business_id',active.id).order('created_at',{ascending:false}).limit(500),
   supabase.from('work_orders').select('*').eq('business_id',active.id).order('created_at',{ascending:false}).limit(500)
  ]);
  if(p.error||o.error)throw p.error??o.error;
  setStock((p.data??[]) as Stock[]);setOrders((o.data??[]) as Order[]);
 };
 async function registerCompany(e:FormEvent){
  e.preventDefault();if(!supabase||!userId)return;setError('');setMessage('');
  if(!validateCnpj(company.cnpj))return setError('CNPJ inválido: os dígitos verificadores não conferem.');
  setBusy(true);
  try{
   const {data,error:err}=await supabase.from('business_accounts').insert({
    owner_id:userId,cnpj:cleanCnpj(company.cnpj),trade_name:company.trade_name.trim(),segment:company.segment,
    city:company.city.trim(),phone:company.phone.trim()
   }).select().single();
   if(err)throw new Error(err.code==='23505'?'Esse CNPJ já possui cadastro neste segmento. Solicite análise de titularidade ao administrador.':err.message);
   setAccounts(a=>[data as Account,...a]);setAccountId(data.id);
   setMessage('Empresa cadastrada! A situação ficou PENDENTE até a verificação do responsável pelo SmartVeículos.');
  }catch(e){setError(e instanceof Error?e.message:'Falha ao cadastrar empresa.');}
  finally{setBusy(false);}
 }
 async function savePart(e:FormEvent){
  e.preventDefault();if(!supabase||!active)return;setBusy(true);setError('');setMessage('');
  try{
   const quantity=Number(part.quantity),price=Number(part.price);
   if(!Number.isSafeInteger(quantity)||quantity<0||!Number.isFinite(price)||price<0)throw Error('Quantidade ou preço inválido.');
   const {error}=await supabase.from('parts_inventory').insert({business_id:active.id,sku:part.sku.trim().toUpperCase(),name:part.name.trim(),application:part.application.trim(),quantity,price});
   if(error)throw Error(error.code==='23505'?'Já existe uma peça com esse SKU na sua loja.':error.message);
   setPart({sku:'',name:'',application:'',quantity:'0',price:'0'});await refreshData();setMessage('Peça adicionada ao estoque.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setBusy(false);}
 }
 async function saveOrder(e:FormEvent){
  e.preventDefault();if(!supabase||!active)return;setBusy(true);setError('');setMessage('');
  try{
   const price=Number(order.quoted_price);if(!Number.isFinite(price)||price<0)throw Error('Valor inválido.');
   const {error}=await supabase.from('work_orders').insert({...order,business_id:active.id,quoted_price:price});
   if(error)throw error;setOrder({customer_name:'',vehicle_label:'',service_description:'',quoted_price:'0'});await refreshData();setMessage('Ordem de serviço criada.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setBusy(false);}
 }
 async function changeOrder(id:string,status:Order['status']){
  if(!supabase)return;setBusy(true);setError('');
  try{const {error}=await supabase.from('work_orders').update({status}).eq('id',id);if(error)throw error;await refreshData();}catch(e){setError(e instanceof Error?e.message:'Erro ao alterar OS.');}finally{setBusy(false);}
 }
 async function adjustStock(id:string,delta:number){
  if(!supabase||!active)return;
  const item=stock.find(x=>x.id===id);
  if(!item)return;
  const quantity=item.quantity+delta;
  if(quantity<0)return setError('O estoque não pode ficar negativo.');
  setBusy(true);setError('');
  try{
   const {data,error}=await supabase.from('parts_inventory').update({quantity}).eq('id',id).eq('business_id',active.id).eq('quantity',item.quantity).select('id');
   if(error)throw error;
   if(!data?.length)throw Error('O estoque mudou em outra sessão. Atualize e tente novamente.');
   await refreshData();setMessage('Quantidade atualizada.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível atualizar o estoque.');}
  finally{setBusy(false);}
 }
 async function removeItem(table:'parts_inventory'|'work_orders',id:string){
  if(!supabase||!window.confirm('Tem certeza que deseja excluir este registro?'))return;
  setBusy(true);setError('');
  try{const {error}=await supabase.from(table).delete().eq('id',id);if(error)throw error;await refreshData();}catch(e){setError(e instanceof Error?e.message:'Erro ao excluir.');}finally{setBusy(false);}
 }
 const heading=BUSINESS_SEGMENTS.find(x=>x.id===kind)?.label??'Área empresarial';
 const totalParts=stock.reduce((sum,p)=>sum+p.quantity,0);
 const valueParts=stock.reduce((sum,p)=>sum+p.quantity*p.price,0);
 return <div className="min-h-screen bg-[#f4f6fa] text-slate-900">
  <header className="border-b border-slate-800 bg-[#0f1a2b] text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4"><a href="/" className="flex items-center gap-2 text-lg font-extrabold"><span className="grid size-10 place-items-center rounded-xl bg-orange-500 text-slate-900"><Store/></span>Smart<span className="text-orange-400">Veículos</span></a><div className="flex flex-wrap items-center gap-3"><a href="/" className="text-xs font-bold text-slate-300">Portal</a><a href="/garagem" className="text-xs font-bold text-slate-300">Minha garagem</a><span className="hidden text-xs text-slate-400 sm:block">{email}</span><button onClick={async()=>{await supabase?.auth.signOut();window.location.assign('/');}} className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold"><LogOut size={15}/> Sair</button></div></div></header>
  <main className="mx-auto max-w-7xl space-y-5 px-5 py-8">
   <div className="rounded-3xl bg-[#142238] p-6 text-white sm:p-8"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Gestão empresarial</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{heading}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">Seu espaço de trabalho para gerenciar {isWorkshop?'atendimentos e ordens de serviço':'catálogo, produtos e estoque de peças'} com dados isolados por empresa.</p></div><div className="grid size-14 place-items-center rounded-2xl bg-orange-500/15 text-orange-400">{isWorkshop?<Wrench size={29}/>:<Package size={29}/>}</div></div></div>
   {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
   {message&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}
   {loading?<div className={panel}>Carregando seu cadastro...</div>:!filtered.length?<div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><section className={panel}><h2 className="text-xl font-extrabold">Cadastre sua empresa</h2><p className="mt-3 text-sm leading-7 text-slate-600">O acesso empresarial depende de CNPJ com dígitos válidos. Uma análise posterior confirma a titularidade e a situação cadastral.</p><div className="mt-6 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">Validar o cálculo do CNPJ não equivale a confirmar a existência ou regularidade da empresa na Receita Federal.</div></section>
      <form className={panel+' grid gap-4 sm:grid-cols-2'} onSubmit={registerCompany}>
       <label className="grid gap-1.5 text-xs font-bold sm:col-span-2">Nome fantasia<input required minLength={3} maxLength={120} className={input} value={company.trade_name} onChange={e=>setCompany(c=>({...c,trade_name:e.target.value}))}/></label>
       <label className="grid gap-1.5 text-xs font-bold sm:col-span-2">Segmento<select className={input} value={company.segment} onChange={e=>setCompany(c=>({...c,segment:e.target.value as BusinessSegment}))}>{BUSINESS_SEGMENTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
       <label className="grid gap-1.5 text-xs font-bold sm:col-span-2">CNPJ com dígitos verificadores<input required maxLength={20} className={input} placeholder="00.000.000/0000-00" value={company.cnpj} onChange={e=>setCompany(c=>({...c,cnpj:e.target.value.toUpperCase()}))}/>{company.cnpj&&<span className={'font-semibold '+(validateCnpj(company.cnpj)?'text-emerald-700':'text-orange-700')}>{validateCnpj(company.cnpj)?'CNPJ matematicamente válido':'CNPJ inválido ou incompleto'}</span>}</label>
       <label className="grid gap-1.5 text-xs font-bold">Cidade<input className={input} maxLength={80} value={company.city} onChange={e=>setCompany(c=>({...c,city:e.target.value}))}/></label><label className="grid gap-1.5 text-xs font-bold">Telefone<input className={input} maxLength={25} value={company.phone} onChange={e=>setCompany(c=>({...c,phone:e.target.value}))}/></label>
       <button className={btn+' bg-orange-500 text-slate-900 sm:col-span-2'} disabled={busy||!validateCnpj(company.cnpj)}>Cadastrar empresa <ArrowRight size={16}/></button>
      </form></div>:
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{filtered.map(a=><button key={a.id} onClick={()=>{setAccountId(a.id);setTab('overview');}} className={'rounded-xl px-4 py-2 text-xs font-bold '+(a.id===active?.id?'bg-slate-900 text-white':'border bg-white text-slate-700')}>{a.trade_name}</button>)}</div><a href="/acesso?mode=register" className="text-xs font-bold text-orange-700 underline">Criar outra conta</a></div>
      {active&&<><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><p className="text-lg font-black">{active.trade_name}</p><p className="mt-1 text-xs text-slate-500">CNPJ {formatCnpj(active.cnpj)} · {active.city||'Cidade não informada'}</p></div><span className={'rounded-full px-3 py-2 text-xs font-black '+(active.review_status==='approved'?'bg-emerald-100 text-emerald-800':active.review_status==='rejected'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-900')}>{active.review_status==='approved'?'Empresa aprovada':active.review_status==='pending'?'Validação empresarial pendente':'Cadastro não aprovado'}</span></div>
      {active.review_status!=='approved'&&<div className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900"><ShieldCheck className="shrink-0" size={20}/><p>Você pode organizar seus dados internos. A aprovação pelo administrador será necessária antes de habilitar presença comercial pública ou confirmar a titularidade da empresa.</p></div>}
      <div className="grid gap-4 sm:grid-cols-3"><div className={panel}><p className="text-xs font-bold uppercase text-slate-500">{isWorkshop?'Ordens de serviço':'Produtos cadastrados'}</p><p className="mt-3 text-3xl font-black">{isWorkshop?orders.length:stock.length}</p></div><div className={panel}><p className="text-xs font-bold uppercase text-slate-500">{isWorkshop?'OS abertas':'Itens em estoque'}</p><p className="mt-3 text-3xl font-black">{isWorkshop?orders.filter(o=>o.status==='aberta').length:totalParts}</p></div><div className={panel}><p className="text-xs font-bold uppercase text-slate-500">{isWorkshop?'Valor orçado':'Valor de tabela em estoque'}</p><p className="mt-3 text-2xl font-black">{currency(isWorkshop?orders.reduce((sum,o)=>sum+Number(o.quoted_price),0):valueParts)}</p></div></div>
      <div className="flex gap-1 rounded-xl border bg-white p-1.5"><button onClick={()=>setTab('overview')} className={'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold '+(tab==='overview'?'bg-slate-900 text-white':'text-slate-600')}><LayoutDashboard size={16}/> {isWorkshop?'Nova ordem':'Nova peça'}</button><button onClick={()=>setTab('records')} className={'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold '+(tab==='records'?'bg-slate-900 text-white':'text-slate-600')}><ClipboardList size={16}/> {isWorkshop?'Acompanhamento de OS':'Estoque'}</button></div>
      {tab==='overview'&&(isWorkshop?<section className={panel}><h2 className="text-xl font-black">Nova ordem de serviço</h2><form onSubmit={saveOrder} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold">Cliente<input required minLength={2} maxLength={120} className={input} value={order.customer_name} onChange={e=>setOrder(v=>({...v,customer_name:e.target.value}))}/></label><label className="grid gap-1.5 text-xs font-bold">Veículo<input maxLength={120} className={input} value={order.vehicle_label} onChange={e=>setOrder(v=>({...v,vehicle_label:e.target.value}))}/></label><label className="grid gap-1.5 text-xs font-bold sm:col-span-2">Serviço solicitado<textarea required minLength={3} maxLength={1000} rows={3} className={input} value={order.service_description} onChange={e=>setOrder(v=>({...v,service_description:e.target.value}))}/></label><label className="grid gap-1.5 text-xs font-bold">Valor orçado (R$)<input required type="number" step="0.01" min="0" className={input} value={order.quoted_price} onChange={e=>setOrder(v=>({...v,quoted_price:e.target.value}))}/></label><button disabled={busy} className={btn+' self-end bg-orange-500 text-slate-900'}><Plus size={16}/> Criar ordem</button></form></section>:<section className={panel}><h2 className="text-xl font-black">Cadastrar peça no estoque</h2><form onSubmit={savePart} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold">Código / SKU<input className={input} required maxLength={80} value={part.sku} onChange={e=>setPart(v=>({...v,sku:e.target.value}))}/></label><label className="grid gap-1.5 text-xs font-bold">Nome da peça<input className={input} required minLength={2} maxLength={150} value={part.name} onChange={e=>setPart(v=>({...v,name:e.target.value}))}/></label><label className="grid gap-1.5 text-xs font-bold sm:col-span-2">Aplicação / modelos compatíveis<input className={input} maxLength={300} placeholder="Ex.: Honda CB650R 2024" value={part.application} onChange={e=>setPart(v=>({...v,application:e.target.value}))}/></label><label className="grid gap-1.5 text-xs font-bold">Quantidade<input type="number" min="0" required className={input} value={part.quantity} onChange={e=>setPart(v=>({...v,quantity:e.target.value}))}/></label><label className="grid gap-1.5 text-xs font-bold">Preço (R$)<input type="number" min="0" step="0.01" required className={input} value={part.price} onChange={e=>setPart(v=>({...v,price:e.target.value}))}/></label><button disabled={busy} className={btn+' bg-orange-500 text-slate-900 sm:col-span-2'}><Plus size={16}/> Adicionar ao estoque</button></form></section>)}
      {tab==='records'&&<section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">{isWorkshop?'Ordens de serviço':'Estoque de autopeças'}</h2><p className="mt-1 text-xs text-slate-500">Registros isolados por empresa e protegidos por permissões no banco</p></div><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input aria-label="Filtrar registros" className={input+' pl-9'} placeholder="Pesquisar..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
      <div className="mt-5 space-y-3">{isWorkshop?(visibleOrders.length?visibleOrders.map(o=><div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-bold">{o.customer_name} · {o.vehicle_label||'Veículo não informado'}</p><p className="mt-1 max-w-lg text-sm text-slate-600">{o.service_description}</p><p className="mt-2 text-xs font-semibold">{currency(o.quoted_price)}</p></div><div className="flex gap-2"><select aria-label="Status da OS" disabled={busy} value={o.status} onChange={e=>void changeOrder(o.id,e.target.value as Order['status'])} className={input}><option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluída</option></select><button aria-label="Excluir OS" disabled={busy} onClick={()=>void removeItem('work_orders',o.id)} className="rounded-lg border p-3 text-red-600"><Trash2 size={16}/></button></div></div>):<p className="text-sm text-slate-500">Nenhuma OS encontrada.</p>):(visibleStock.length?visibleStock.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-bold">{p.name} <span className="text-xs text-slate-500">({p.sku})</span></p><p className="mt-1 text-sm text-slate-600">{p.application||'Sem aplicação informada'}</p><p className="mt-2 text-xs font-semibold">{p.quantity} unidades · {currency(p.price)}</p></div><div className="flex items-center gap-2"><button aria-label="Diminuir estoque" disabled={busy||p.quantity===0} onClick={()=>void adjustStock(p.id,-1)} className="rounded-lg border px-3 py-2 text-sm font-black">−</button><span className="min-w-6 text-center text-sm font-extrabold">{p.quantity}</span><button aria-label="Aumentar estoque" disabled={busy} onClick={()=>void adjustStock(p.id,1)} className="rounded-lg border px-3 py-2 text-sm font-black">+</button><button aria-label="Excluir peça" disabled={busy} onClick={()=>void removeItem('parts_inventory',p.id)} className="rounded-lg border p-3 text-red-600"><Trash2 size={16}/></button></div></div>):<p className="text-sm text-slate-500">Nenhuma peça encontrada.</p>)}</div></section>}
     </>}
    </>
   }
  </main>
 </div>;
}
