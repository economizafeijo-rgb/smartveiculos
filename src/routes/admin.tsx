import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Building2, CarFront, ChevronRight, CircleUserRound, LayoutDashboard, LogOut, Package, Plus, RefreshCw, Search, ShieldCheck, Users, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export const Route = createFileRoute('/admin')({ component: AdminPage });
type Section = 'visao'|'oficinas'|'autopecas'|'veiculos'|'usuarios';
type Item = { id:string; name?:string; city?:string; phone?:string; plate?:string; current_km?:number; workshop_id?:string|null; full_name?:string; email?:string; user_id?:string; role?:string };
const tabs: { id:Section; label:string; icon:typeof LayoutDashboard }[] = [
  {id:'visao',label:'Visão geral',icon:LayoutDashboard},{id:'oficinas',label:'Mecânicas',icon:Wrench},
  {id:'autopecas',label:'Autopeças',icon:Package},{id:'veiculos',label:'Veículos',icon:CarFront},{id:'usuarios',label:'Usuários',icon:Users}
];
const config = {
 oficinas:{table:'workshops',label:'Mecânica',plural:'Mecânicas',icon:Wrench},
 autopecas:{table:'parts_stores',label:'Autopeças',plural:'Autopeças',icon:Package},
 veiculos:{table:'fleet_vehicles',label:'Veículo',plural:'Veículos',icon:CarFront},
 usuarios:{table:'user_profiles',label:'Usuário',plural:'Usuários',icon:Users}
} as const;
const field='rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
function AdminPage() {
 const [section,setSection]=useState<Section>('visao');
 const [account,setAccount]=useState<string|null>(null);
 const [checked,setChecked]=useState(false);
 const [owner,setOwner]=useState(false);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [inviteEmail,setInviteEmail]=useState('');
 const [inviteName,setInviteName]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [rows,setRows]=useState<Record<string,Item[]>>({workshops:[],parts_stores:[],fleet_vehicles:[],user_profiles:[]});
 const [search,setSearch]=useState('');
 const [openForm,setOpenForm]=useState(false);
 const [form,setForm]=useState({name:'',city:'',phone:'',plate:'',current_km:'0',workshop_id:''});
 const refresh=useCallback(async()=>{
  if(!supabase) return;
  const {data:userData,error:authError}=await supabase.auth.getUser();
  if(authError || !userData.user){setAccount(null);setOwner(false);setChecked(true);return;}
  setAccount(userData.user.email||'Usuário');
  const {data:admin,error:adminError}=await supabase.from('platform_admins').select('user_id').eq('user_id',userData.user.id).maybeSingle();
  if(adminError){setError('Não foi possível verificar o acesso de administrador: '+adminError.message);setOwner(false);setChecked(true);return;}
  setOwner(Boolean(admin));
  if(admin){
   const tables=['workshops','parts_stores','fleet_vehicles','user_profiles'] as const;
   const results=await Promise.all(tables.map(table=>supabase!.from(table).select('*').order('created_at',{ascending:false}).limit(500)));
   const failed=results.find(r=>r.error);
   if(failed?.error) setError('Erro ao consultar os registros: '+failed.error.message);
   else {
    const next:Record<string,Item[]>={};
    tables.forEach((t,i)=>next[t]=(results[i]?.data||[]) as Item[]);
    setRows(next);setError('');
   }
  }
  setChecked(true);
 },[]);
 useEffect(()=>{void refresh(); if(!supabase)return;const {data}=supabase.auth.onAuthStateChange(()=>{void refresh();});return()=>data.subscription.unsubscribe();},[refresh]);
 const signIn=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);setError('');const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);setPassword('');if(error)setError(error.message);else void refresh();};
 const invite=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);setError('');setNotice('');const {data,error}=await supabase.functions.invoke('invite-user',{body:{email:inviteEmail,fullName:inviteName}});setBusy(false);if(error||data?.error)setError(data?.error||error?.message||'Não foi possível convidar');else{setNotice('Convite enviado para '+inviteEmail);setInviteEmail('');setInviteName('');void refresh();}};
 const create=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase||section==='visao'||section==='usuarios')return;setBusy(true);setError('');setNotice('');
  const {error}=section==='veiculos'
   ? await supabase.from('fleet_vehicles').insert({name:form.name,plate:form.plate.toUpperCase(),current_km:Number(form.current_km),workshop_id:form.workshop_id||null})
   : section==='oficinas'
   ? await supabase.from('workshops').insert({name:form.name,city:form.city,phone:form.phone})
   : await supabase.from('parts_stores').insert({name:form.name,city:form.city,phone:form.phone});
  setBusy(false);
  if(error)setError(error.message);else{setOpenForm(false);setForm({name:'',city:'',phone:'',plate:'',current_km:'0',workshop_id:''});setNotice('Cadastro realizado com sucesso.');void refresh();}
 };
 const remove=async(id:string)=>{if(!supabase||section==='visao'||section==='usuarios')return;if(!window.confirm('Excluir este registro? Esta ação não pode ser desfeita.'))return;
  const {error}=await supabase.from(config[section].table).delete().eq('id',id);
  if(error)setError(error.message);else void refresh();
 };
 const current=section==='visao'?[]:rows[config[section].table]||[];
 const filtered=useMemo(()=>current.filter(x=>[x.name,x.city,x.plate,x.full_name,x.email].some(v=>v?.toLowerCase().includes(search.toLowerCase()))),[current,search]);
 if(!supabase)return <div className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="max-w-md rounded-3xl bg-white p-8 shadow-lg"><ShieldCheck className="mb-4 text-blue-600"/><h1 className="text-xl font-bold">Configure o Supabase</h1><p className="mt-3 text-slate-600">Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY e instale @supabase/supabase-js para ativar o painel.</p></div></div>;
 if(!checked)return <div className="min-h-screen grid place-items-center text-slate-600">Carregando painel seguro…</div>;
 if(!account)return <main className="min-h-screen grid place-items-center bg-[#f0f4f9] p-5"><form onSubmit={signIn} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><Wrench/></div><h1 className="text-2xl font-bold tracking-tight">SmartVeículos</h1><p className="mb-7 mt-1 text-slate-500">Acesso administrativo seguro</p><label className="mb-1 block text-sm font-medium">E-mail</label><input className={field+' mb-4 w-full'} type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/><label className="mb-1 block text-sm font-medium">Senha</label><input className={field+' mb-5 w-full'} type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy?'Entrando…':'Entrar no painel'}</button></form></main>;
 if(!owner)return <div className="min-h-screen grid place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-3xl bg-white p-8 shadow"><ShieldCheck className="mb-4 text-amber-500"/><h1 className="text-xl font-bold">Acesso restrito</h1><p className="mt-3 text-slate-600">A conta {account} não está cadastrada como administradora da plataforma. Solicite a ativação ao responsável pelo Supabase.</p>{error&&<p className="mt-3 text-red-600">{error}</p>}<button className="mt-5 text-blue-700 underline" onClick={()=>void supabase?.auth.signOut()}>Sair</button></section></div>;
 return <div className="min-h-screen bg-[#f4f7fb] text-slate-900 lg:flex">
  <aside className="border-b border-slate-200 bg-[#0d172b] text-slate-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0">
   <div className="flex items-center gap-3 px-6 py-6"><div className="grid size-11 place-items-center rounded-xl bg-blue-500 text-white"><Wrench/></div><div><div className="font-extrabold tracking-tight text-white">SmartVeículos</div><div className="text-xs text-slate-400">Gestão inteligente</div></div></div>
   <div className="px-6 pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Administração</div>
   <nav aria-label="Administração" className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">{tabs.map(t=><button key={t.id} onClick={()=>{setSection(t.id);setOpenForm(false);setSearch('');setError('');setNotice('')}} className={'flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition '+(section===t.id?'bg-blue-600 text-white':'text-slate-300 hover:bg-white/10')}><t.icon size={18}/>{t.label}</button>)}<a href="/admin-empresas" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-orange-200 hover:bg-white/10"><Building2 size={18}/> Aprovar empresas e CNPJ</a></nav>
   <div className="mt-auto hidden border-t border-white/10 px-5 py-5 lg:block"><div className="truncate text-xs text-slate-300">{account}</div><div className="mt-1 text-xs text-blue-300">Administrador geral</div><button className="mt-4 flex items-center gap-2 text-sm text-slate-300 hover:text-white" onClick={()=>void supabase?.auth.signOut()}><LogOut size={16}/> Encerrar sessão</button></div>
  </aside>
  <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
   <header className="mb-8 flex flex-wrap items-center justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600">Central de gestão</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{section==='visao'?'Visão geral':config[section].plural}</h1><p className="mt-1 text-sm text-slate-500">Gerencie sua operação com segurança e organização.</p></div><div className="flex gap-2"><a href="/" className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">Portal</a><button onClick={()=>void refresh()} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"><RefreshCw size={16}/> Atualizar</button>{section!=='visao'&&section!=='usuarios'&&<button onClick={()=>setOpenForm(x=>!x)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16}/> Novo cadastro</button>}</div></header>
   {error&&<p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
   {notice&&<p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}
   {section==='visao'?<><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{label:'Mecânicas',value:(rows['workshops']||[]).length,icon:Building2,tab:'oficinas'},{label:'Autopeças',value:(rows['parts_stores']||[]).length,icon:Package,tab:'autopecas'},{label:'Veículos',value:(rows['fleet_vehicles']||[]).length,icon:CarFront,tab:'veiculos'},{label:'Usuários',value:(rows['user_profiles']||[]).length,icon:Users,tab:'usuarios'}].map(k=><button key={k.label} onClick={()=>setSection(k.tab as Section)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"><div className="flex justify-between"><span className="text-sm font-medium text-slate-500">{k.label}</span><k.icon className="text-blue-600" size={21}/></div><div className="mt-5 text-3xl font-bold">{k.value}</div><div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">Ver registros <ChevronRight size={14}/></div></button>)}</div><section className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex items-center gap-3"><Activity className="text-blue-600"/><h2 className="text-lg font-semibold">Central operacional</h2></div><p className="mt-2 text-sm leading-7 text-slate-500">Acompanhe suas unidades, cadastre veículos e organize os cadastros de mecânicas e autopeças. Cada registro é armazenado no Supabase com permissões verificadas pelo banco de dados.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{[{t:'oficinas',l:'Gerenciar mecânicas'},{t:'autopecas',l:'Gerenciar autopeças'},{t:'veiculos',l:'Gerenciar veículos'}].map(x=><button key={x.t} onClick={()=>setSection(x.t as Section)} className="rounded-xl border border-slate-200 p-4 text-left text-sm font-semibold hover:border-blue-400 hover:bg-blue-50">{x.l} <ChevronRight className="float-right" size={16}/></button>)}</div></section></>:
   <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    {section==='usuarios'&&<form onSubmit={invite} className="mb-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-[1fr_1fr_auto]"><label className="grid gap-1 text-xs font-semibold">Nome do usuário<input className={field} maxLength={120} value={inviteName} onChange={e=>setInviteName(e.target.value)} placeholder="Nome completo"/></label><label className="grid gap-1 text-xs font-semibold">E-mail para convite<input type="email" required className={field} value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="usuario@empresa.com"/></label><button disabled={busy} className="self-end rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?'Enviando…':'Convidar usuário'}</button><p className="text-xs text-blue-800 sm:col-span-3">O usuário define seu próprio acesso pelo convite. Requer implantação da função protegida invite-user no Supabase.</p></form>}
    {openForm&&section!=='usuarios'&&<form onSubmit={create} className="mb-6 grid gap-4 rounded-xl border bg-slate-50 p-5 sm:grid-cols-2"><h2 className="sm:col-span-2 font-bold">Novo cadastro</h2><label className="grid gap-1 text-xs font-semibold">Nome<input className={field} required maxLength={120} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></label>{section==='veiculos'?<><label className="grid gap-1 text-xs font-semibold">Placa<input className={field} maxLength={10} value={form.plate} onChange={e=>setForm(f=>({...f,plate:e.target.value}))}/></label><label className="grid gap-1 text-xs font-semibold">Quilometragem<input className={field} type="number" min="0" max="9999999" value={form.current_km} onChange={e=>setForm(f=>({...f,current_km:e.target.value}))}/></label><label className="grid gap-1 text-xs font-semibold">Mecânica vinculada<select className={field} value={form.workshop_id} onChange={e=>setForm(f=>({...f,workshop_id:e.target.value}))}><option value="">Sem vínculo</option>{(rows['workshops']||[]).map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label></>:<><label className="grid gap-1 text-xs font-semibold">Cidade<input className={field} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></label><label className="grid gap-1 text-xs font-semibold">Telefone<input className={field} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></label></>}<div className="sm:col-span-2 flex gap-3"><button disabled={busy} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Salvar cadastro</button><button type="button" onClick={()=>setOpenForm(false)} className="rounded-xl border bg-white px-5 py-2.5 text-sm">Cancelar</button></div></form>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Registros cadastrados <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{filtered.length}</span></h2><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar registro" className={field+' w-full pl-9 sm:w-64'}/></div></div>
    {!filtered.length?<div className="py-16 text-center"><CircleUserRound className="mx-auto mb-3 text-slate-300" size={40}/><h3 className="font-semibold">Nenhum registro encontrado</h3><p className="mt-1 text-sm text-slate-500">Cadastre um novo item ou altere a busca.</p></div>:<div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Nome</th><th className="p-3">Informações</th><th className="p-3 text-right">Ações</th></tr></thead><tbody>{filtered.map(v=><tr key={v.id||v.user_id} className="border-b last:border-0"><td className="p-3 font-semibold">{v.name||v.full_name||v.email||'Sem nome'}</td><td className="p-3 text-slate-500">{section==='veiculos'?((v.plate||'Sem placa')+' · '+(v.current_km||0).toLocaleString('pt-BR')+' km'):section==='usuarios'?(v.email||'—'):((v.city||'Cidade não informada')+(v.phone?' · '+v.phone:''))}</td><td className="p-3 text-right">{section!=='usuarios'&&<button className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50" onClick={()=>void remove(v.id)}>Excluir</button>}</td></tr>)}</tbody></table></div>}
   </section>}
  <footer className="mt-9 flex items-center justify-between border-t pt-5 text-xs text-slate-400"><span>SmartVeículos · Gestão de operações</span><button className="lg:hidden" onClick={()=>void supabase?.auth.signOut()}>Sair da conta</button><span className="hidden lg:inline">Acesso administrativo protegido</span></footer>
  </main></div>;
}
