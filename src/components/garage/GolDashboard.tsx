import {DeveloperCredit} from '@/components/ui/DeveloperCredit';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight, CalendarClock, CarFront, CheckCircle2, CircleAlert, ClipboardList, Coins, Fuel, Gauge, Info, PackageSearch, Plus, Search, Video, Wrench } from 'lucide-react';
import { calculateFuelStats, fuelSpent, useFillups, type FuelKind } from '@/lib/garage/fuel';
import { garage, useGarage, useHydrated } from '@/lib/garage/store';
import { formatBRL, formatKm, formatDate } from '@/lib/garage/logic';
import { GOL, GOL_PROBLEMS, IMPORTANT_LINKS, MAINTENANCE_PRESETS } from '@/lib/garage/gol-reference';
import { CloudSyncPanel } from '@/components/garage/CloudSyncPanel';
import { FipeValuePanel } from '@/components/garage/FipeValuePanel';
import { VehicleFuelLedger } from '@/components/garage/VehicleFuelLedger';
import { VehicleVideoLibrary } from '@/components/garage/VehicleVideoLibrary';
import { VehicleMaintenanceLedger } from '@/components/garage/VehicleMaintenanceLedger';
import {FIPE_FEATURED_KEYS} from '@/lib/garage/fipe';

type Tab='painel'|'abastecimentos'|'manutencoes'|'diagnosticos'|'revisoes'|'videos';
const tabs:{id:Tab;label:string;icon:typeof Gauge}[]=[
 {id:'painel',label:'Visão geral',icon:Gauge},{id:'abastecimentos',label:'Abastecimentos',icon:Fuel},
 {id:'manutencoes',label:'Manutenções',icon:Wrench},{id:'diagnosticos',label:'Diagnósticos e peças',icon:PackageSearch},
 {id:'revisoes',label:'Plano VW',icon:CheckCircle2},{id:'videos',label:'Vídeos e reparos',icon:Info},
];
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const field='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const btn='inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition';
const box='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
type Maintenance={name:string;date:string;km:string;cost:string;nextKm:string;notes:string};
const newMaintenance=():Maintenance=>({name:'Troca de óleo do motor',date:today(),km:'',cost:'',nextKm:'',notes:''});
const statCard=(label:string,value:string,detail:string)=> <div className={box+' sv-interactive-surface'}><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-3 text-2xl font-extrabold text-slate-900">{value}</div><div className="mt-1 text-xs text-slate-500">{detail}</div></div>;
export function GolDashboard(){
 const hydrated=useHydrated();
 const {vehicles,records}=useGarage();
 const allFillups=useFillups();
 const [tab,setTab]=useState<Tab>('painel');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [plate,setPlate]=useState('');
 const [photoError,setPhotoError]=useState(false);
 const [startKm,setStartKm]=useState('');
 const [odometer,setOdometer]=useState('');
 const [maintenance,setMaintenance]=useState<Maintenance>(newMaintenance);
 const [query,setQuery]=useState('');
 const [system,setSystem]=useState('Todos');
 const vehicle=vehicles.find(v=>v.name===GOL.name);
 const logs=useMemo(()=>records.filter(r=>r.vehicleId===vehicle?.id).sort((a,b)=>b.date.localeCompare(a.date)||b.km-a.km),[records,vehicle?.id]);
 const fills=useMemo(()=>allFillups.filter(f=>f.vehicleId===vehicle?.id).sort((a,b)=>b.km-a.km),[allFillups,vehicle?.id]);
 const averages=useMemo(()=>calculateFuelStats(fills),[fills]);
 const value=(kind:FuelKind)=>averages.find(a=>a.fuel===kind);
 const warnings=useMemo(()=>{
  const latest=new Map<string,typeof logs[number]>();
  for(const item of logs){
   const name=item.description.split(' — ')[0] ?? '';
   if(!latest.has(name)||item.km>latest.get(name)!.km)latest.set(name,item);
  }
  return [...latest.values()].filter(x=>vehicle&&x.nextKm!==null&&x.nextKm-vehicle.currentKm<=1000)
   .sort((a,b)=>(a.nextKm||0)-(b.nextKm||0));
 },[logs,vehicle]);
 const notify=(msg:string)=>{setError('');setNotice(msg);};
 const activate=(event:FormEvent)=>{event.preventDefault();const km=Number(startKm);
  if(!Number.isSafeInteger(km)||km<0||km>9999999){setError('Informe a quilometragem real do veículo.');return;}
  if(vehicle)return;
  garage.addVehicle({kind:'carro',name:GOL.name,plate:plate.trim().toUpperCase(),currentKm:km});
  notify('Ficha do seu Gol prata ativada neste navegador.');
 };
 const saveOdometer=(event:FormEvent)=>{event.preventDefault();if(!vehicle)return;const km=Number(odometer);
  if(!Number.isSafeInteger(km)||km<vehicle.currentKm||km>9999999){setError('O novo odômetro não pode ser inferior ao atual.');return;}
  garage.setKm(vehicle.id,km);setOdometer('');notify('Odômetro atualizado com sucesso.');
 };
 const saveMaintenance=(event:FormEvent)=>{event.preventDefault();if(!vehicle)return;
  const km=Number(maintenance.km),cost=Number(maintenance.cost),next=maintenance.nextKm?Number(maintenance.nextKm):null;
  if(!Number.isSafeInteger(km)||km<0||km>9999999||!Number.isFinite(cost)||cost<0||cost>10000000||
   !/^\d{4}-\d{2}-\d{2}$/.test(maintenance.date)|| (next!==null&&(!Number.isSafeInteger(next)||next<=km))){
   setError('Verifique os valores de km, custo, data e próxima troca.');return;
  }
  const type=maintenance.name==='Troca de óleo do motor'?'oleo':maintenance.name==='Revisão geral'?'revisao':'manutencao';
  const description=maintenance.name+(maintenance.notes.trim()?' — '+maintenance.notes.trim():'');
  if(description.length>300){setError('A descrição deve ter no máximo 300 caracteres.');return;}
  garage.addRecord(vehicle.id,{kind:type,description,km,date:maintenance.date,cost,nextKm:next});
  setMaintenance({...newMaintenance(),km:String(Math.max(km,vehicle.currentKm))});notify('Manutenção registrada no histórico.');
 };
 const systems=['Todos',...new Set(GOL_PROBLEMS.map(x=>x.system))];
 const problems=GOL_PROBLEMS.filter(x=>(system==='Todos'||x.system===system)&&[x.system,x.name,x.symptoms].join(' ').toLowerCase().includes(query.toLowerCase()));
 if(!hydrated)return <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">Carregando a garagem...</div>;
 return <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
  <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-7">
   <Link to="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white"><Wrench/></span><span className="font-extrabold">Smart<span className="text-blue-600">Veículos</span><small className="block text-xs font-normal text-slate-500">Garagem inteligente</small></span></Link>
   <div className="flex gap-2"><Link to="/" className={btn+' border border-slate-200 bg-white hover:bg-slate-50'}><ArrowLeft size={15}/> Voltar</Link><a className={btn+' bg-slate-900 text-white hover:bg-slate-700'} href="/admin">Admin</a></div>
  </div></header>
  <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7 lg:py-8">
   <nav aria-label="Acesso direto às páginas de serviços" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/25 bg-gradient-to-r from-[#11243e] to-[#254766] p-3 text-white shadow-sm sm:p-4">
    <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-orange-300">Sua garagem organizada</p><p className="mt-1 text-xs font-semibold text-slate-100">Cada serviço agora tem uma página própria.</p></div>
    <div className="flex flex-wrap gap-2">
     {([
      ['abastecimentos','Abastecimentos',Fuel],
      ['revisoes','Revisões',CalendarClock],
      ['fipe','Tabela FIPE',Coins],
      ['videos','Vídeos',Video],
      ['registros','Registros',ClipboardList],
     ] as const).map(([pagina,label,Icon])=>
      <Link key={pagina} to="/garagem" search={{pagina,veiculo:vehicle?.id??'gol-g6-selecao-2014'}}
       className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white backdrop-blur-xl transition-colors hover:border-orange-300 hover:bg-orange-500/25"><Icon size={15}/>{label}<ArrowUpRight size={12} className="text-orange-300"/></Link>
     )}
    </div>
   </nav>

   <section className="sv-dashboard-hero relative isolate overflow-hidden rounded-3xl bg-[#10213b] shadow-xl">
    <div className="absolute -left-20 top-0 size-96 rounded-full bg-blue-700/20 blur-3xl"/>
    <div className="relative grid lg:grid-cols-[1fr_0.9fr]">
     <div className="px-6 py-9 text-white sm:px-10 sm:py-12">
      <span className="sv-intro-item sv-intro-item--1 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-200">Minha garagem • Perfil técnico</span>
      <h1 className="sv-intro-item sv-intro-item--2 mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">Gol G6 <span className="text-amber-300">Seleção</span></h1>
      <p className="sv-intro-item sv-intro-item--3 mt-2 text-lg text-slate-200">2014 · 1.6 8V Flex · Prata</p>
      <p className="sv-intro-item sv-intro-item--4 mt-5 max-w-lg text-sm leading-relaxed text-slate-300">Ficha completa para acompanhar o seu carro, abastecimentos, economia, revisões, peças e diagnósticos desde o motor até o sistema elétrico.</p>
      <div className="sv-intro-item sv-intro-item--5 mt-6 flex flex-wrap gap-2">{['Motor EA111 VHT','104 cv (etanol)','Tanque 55 L','Gasolina / Etanol'].map(t=><span key={t} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">{t}</span>)}</div>
     </div>
     <div className="relative min-h-64 overflow-hidden bg-slate-600">{photoError?<div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-slate-400 to-slate-700"><CarFront size={96} className="text-white/65"/><p className="absolute bottom-16 text-xs font-semibold text-white/90">Gol G6 · Prata · imagem indisponível</p></div>:<img src={GOL.photo} onError={()=>setPhotoError(true)} alt="Fotografia ilustrativa de Volkswagen Gol 2014 prata; não é foto do carro do usuário" className="sv-dashboard-photo absolute inset-0 h-full w-full object-cover" loading="eager"/>}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 px-5 pb-4 pt-12 text-xs text-white"><a href={GOL.photoSource} rel="noopener noreferrer" target="_blank" className="underline underline-offset-2">{GOL.photoCredit}</a></div></div>
    </div>
   </section>
   <nav aria-label="Áreas do Gol" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
    {tabs.map(item=><button key={item.id} type="button" onClick={()=>{setTab(item.id);setError('');setNotice('')}} className={'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold '+(item.id===tab?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100')}><item.icon size={17}/>{item.label}</button>)}
   </nav>
   {tab==='painel'&&<FipeValuePanel vehicleId={FIPE_FEATURED_KEYS.gol} kind="carro" vehicleName="Gol G6 Seleção 1.6" brandHint="VW" yearHint={2014}/>}
   {error&&<div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><CircleAlert size={18}/>{error}</div>}
   {notice&&<div role="status" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={18}/>{notice}</div>}
   {!vehicle&&tab!=='diagnosticos'&&<form onSubmit={activate} className={box+' space-y-4 border-amber-200'}>
    <div><h2 className="font-bold">Ative a ficha do seu Gol prata</h2><p className="mt-1 text-sm text-slate-600">Informe a quilometragem real. Nenhum valor é inventado. Os dados serão armazenados neste navegador até a sincronização em nuvem ser ativada.</p></div>
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-medium">Placa (opcional)<input className={field+' mt-1'} maxLength={10} value={plate} onChange={e=>setPlate(e.target.value)}/></label><label className="text-sm font-medium">Odômetro atual (km)<input className={field+' mt-1'} type="number" required min="0" max="9999999" value={startKm} onChange={e=>setStartKm(e.target.value)}/></label><button className={btn+' self-end bg-blue-600 text-white hover:bg-blue-700'}><Plus size={16}/> Ativar ficha</button></div>
   </form>}
   {tab==='painel'&&<div className="sv-tab-content space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
     {statCard('Odômetro atual',vehicle?formatKm(vehicle.currentKm):'A cadastrar','Atualização manual pelo proprietário')}
     {statCard('Gasolina · média real',value('gasolina')?value('gasolina')!.kmPerLiter.toFixed(2)+' km/l':'—', 'Tanques completos consecutivos')}
     {statCard('Etanol · média real',value('etanol')?value('etanol')!.kmPerLiter.toFixed(2)+' km/l':'—', 'Tanques completos consecutivos')}
     {statCard('Gasto registrado',formatBRL(fuelSpent(fills)+logs.reduce((sum,r)=>sum+r.cost,0)),'Combustível + manutenções locais')}
    </div>
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
     <section className={box}><div className="flex items-center gap-2"><Gauge className="text-blue-600"/><h2 className="text-lg font-bold">Odômetro e informações</h2></div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-500">Veículo</span><p className="mt-1 font-bold">Gol G6 Seleção 1.6</p></div><div><span className="text-slate-500">Cor</span><p className="mt-1 font-bold">Prata metálico</p></div><div><span className="text-slate-500">Ano</span><p className="mt-1 font-bold">2014</p></div><div><span className="text-slate-500">Placa</span><p className="mt-1 font-bold">{vehicle?.plate||'Não informada'}</p></div></div>
      {vehicle&&<form onSubmit={saveOdometer} className="mt-6 flex flex-wrap gap-2"><input aria-label="Novo odômetro" className={field+' flex-1'} type="number" min={vehicle.currentKm} max="9999999" required placeholder="Novo odômetro (km)" value={odometer} onChange={e=>setOdometer(e.target.value)}/><button className={btn+' bg-blue-600 text-white hover:bg-blue-700'}>Atualizar km</button></form>}
     </section>
     <section className={box}><div className="flex items-center gap-2"><CircleAlert className="text-amber-500"/><h2 className="text-lg font-bold">Próximas manutenções</h2></div>
      {!vehicle?<p className="mt-6 text-sm text-slate-500">Ative a ficha e registre os serviços para visualizar os alertas.</p>:warnings.length?warnings.map(w=><div key={w.id} className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="font-semibold">{w.description.split(' — ')[0]}</div><p className="mt-1 text-sm text-amber-900">{(w.nextKm||0)<=vehicle.currentKm?'Atingiu a quilometragem programada':'Faltam '+formatKm((w.nextKm||0)-vehicle.currentKm)}</p></div>):<p className="mt-6 text-sm text-slate-500">Nenhum lembrete programado. Cadastre a próxima quilometragem durante uma manutenção.</p>}
      <button onClick={()=>setTab('manutencoes')} className={btn+' mt-5 border border-slate-200 hover:bg-slate-50'}><Plus size={16}/> Registrar manutenção</button>
     </section>
    </div>
    <section className={box}><h2 className="text-lg font-bold">Referência de consumo do modelo</h2><p className="mt-1 text-sm text-slate-500">Valores de referência para a versão manual. O consumo real depende do uso e do estado do veículo.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-2">Combustível</th><th>Cidade</th><th>Estrada</th></tr></thead><tbody><tr className="border-b"><td className="py-3 font-semibold">Gasolina</td><td>10,7 km/l</td><td>13,7 km/l</td></tr><tr><td className="py-3 font-semibold">Etanol</td><td>7,3 km/l</td><td>9,4 km/l</td></tr></tbody></table></div></section>
   </div>}
   {tab==='abastecimentos'&&<VehicleFuelLedger vehicleId={vehicle?.id??''} vehicleName={GOL.name} currentKm={vehicle?.currentKm??null} kind="carro"/>}
   {tab==='revisoes'&&<VehicleMaintenanceLedger vehicle={{kind:'carro',name:GOL.name,modelYear:2014,modelKey:'gol-g6-selecao-2014'}} vehicleId={vehicle?.id??''} currentKm={vehicle?.currentKm??null}/>}
   {tab==='videos'&&<VehicleVideoLibrary vehicle={{kind:'carro',name:GOL.name,modelYear:2014,modelKey:'gol-g6-selecao-2014'}}/>}
   {tab==='manutencoes'&&<div className="sv-tab-content grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
    <section className={box}><h2 className="text-lg font-bold">Registrar serviço</h2><p className="mt-1 text-sm text-slate-500">Óleo, filtros, correia dentada, peças e revisões.</p><form onSubmit={saveMaintenance} className="mt-5 grid gap-4 sm:grid-cols-2">
     <label className="text-sm font-semibold sm:col-span-2">Serviço<select className={field+' mt-1'} value={maintenance.name} onChange={e=>setMaintenance(m=>({...m,name:e.target.value}))}>{MAINTENANCE_PRESETS.map(s=><option key={s}>{s}</option>)}</select></label>
     <label className="text-sm font-semibold">Data<input required type="date" className={field+' mt-1'} value={maintenance.date} onChange={e=>setMaintenance(m=>({...m,date:e.target.value}))}/></label>
     <label className="text-sm font-semibold">Odômetro (km)<input required min="0" max="9999999" type="number" className={field+' mt-1'} value={maintenance.km} onChange={e=>setMaintenance(m=>({...m,km:e.target.value}))}/></label>
     <label className="text-sm font-semibold">Custo total (R$)<input min="0" max="10000000" step="0.01" type="number" required className={field+' mt-1'} value={maintenance.cost} onChange={e=>setMaintenance(m=>({...m,cost:e.target.value}))}/></label>
     <label className="text-sm font-semibold">Próxima troca (km)<input min="0" max="9999999" type="number" className={field+' mt-1'} value={maintenance.nextKm} onChange={e=>setMaintenance(m=>({...m,nextKm:e.target.value}))}/></label>
     <label className="text-sm font-semibold sm:col-span-2">Notas / peças (opcional)<textarea maxLength={250} rows={3} className={field+' mt-1'} value={maintenance.notes} onChange={e=>setMaintenance(m=>({...m,notes:e.target.value}))} placeholder="Marca, especificação, número da peça, oficina…"/></label>
     <button disabled={!vehicle} className={btn+' bg-blue-600 text-white disabled:opacity-50 sm:col-span-2'}><Plus size={16}/> Salvar manutenção</button>
    </form><p className="mt-4 text-xs text-slate-500">Não são sugeridos intervalos genéricos: confira o manual e o histórico do veículo para definir a próxima troca com segurança.</p></section>
    <section className={box}><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Histórico de manutenção</h2><span className="text-xs text-slate-500">{logs.length} registros</span></div>
     {!logs.length?<p className="mt-5 text-sm text-slate-500">Nenhum serviço registrado. Inclua serviços antigos com as datas e km reais.</p>:<div className="mt-4 max-h-[600px] space-y-3 overflow-y-auto">{logs.map(r=><div key={r.id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{r.description.split(' — ')[0]}</p><p className="mt-1 text-xs text-slate-500">{formatDate(r.date)} · {formatKm(r.km)}</p></div><strong>{formatBRL(r.cost)}</strong></div>{r.description.includes(' — ')&&<p className="mt-2 text-sm text-slate-600">{r.description.split(' — ').slice(1).join(' — ')}</p>}{r.nextKm!==null&&<p className="mt-2 text-xs font-semibold text-blue-700">Próxima troca prevista: {formatKm(r.nextKm)}</p>}</div>)}</div>}
    </section>
   </div>}
   {tab==='diagnosticos'&&<section className="sv-tab-content space-y-5"><div className={box}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Biblioteca técnica e diagnósticos</h2><p className="mt-1 text-sm text-slate-500">Pontos de inspeção possíveis; não indicam que seu Gol apresenta esses problemas.</p></div><div className="relative"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input className={field+' pl-9'} placeholder="Buscar sintoma ou peça" value={query} onChange={e=>setQuery(e.target.value)}/></div></div><div className="mt-4 flex flex-wrap gap-2">{systems.map(s=><button key={s} className={'rounded-full px-3 py-1.5 text-xs font-semibold '+(system===s?'bg-blue-600 text-white':'bg-slate-100 text-slate-700')} onClick={()=>setSystem(s)}>{s}</button>)}</div></div>
    <div className="grid gap-4 md:grid-cols-2">{problems.map(p=><article key={p.id} className={box+' overflow-hidden'}><div className="flex gap-4">{p.image?<img loading="lazy" className="size-28 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain" src={p.image} alt={p.imageAlt}/>:<div className="grid size-28 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><PackageSearch size={30}/></div>}<div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{p.system}</p><h3 className="mt-1 text-base font-extrabold">{p.name}</h3><p className="mt-2 text-xs text-slate-500">Orientação: {p.severity}</p></div></div><div className="mt-4 space-y-3 text-sm"><div><p className="font-bold">Sintomas a investigar</p><p className="mt-1 text-slate-600">{p.symptoms}</p></div><div><p className="font-bold">Como verificar</p><p className="mt-1 text-slate-600">{p.checks}</p></div><div><p className="font-bold">Possível solução</p><p className="mt-1 text-slate-600">{p.solution}</p></div></div><a href={p.source} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">Consultar referência <ArrowUpRight size={14}/></a></article>)}</div>{!problems.length&&<p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Nenhum item encontrado com esses filtros.</p>}
    <div className={box}><h2 className="font-bold">Fontes e consultas úteis</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{IMPORTANT_LINKS.map(x=><a key={x.url} className="flex items-center justify-between rounded-xl border p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50" href={x.url} target="_blank" rel="noopener noreferrer">{x.label}<ArrowUpRight size={16}/></a>)}</div><p className="mt-4 text-xs text-slate-500">Confirme compatibilidade de peças pelo chassi. Segurança: freios, direção, superaquecimento e correia exigem avaliação técnica adequada.</p></div>
   </section>}
   <CloudSyncPanel />
   <footer className="flex flex-col gap-1 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>SmartVeículos · Perfil Gol G6 Seleção 1.6 · Prata</span><span>Dados do proprietário salvos localmente neste navegador, não sincronizados na nuvem.</span><DeveloperCredit compact /></footer>
  </main>
 </div>;
}
