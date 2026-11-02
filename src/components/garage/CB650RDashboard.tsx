import {DeveloperCredit} from '@/components/ui/DeveloperCredit';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { Activity, ArrowLeft, ArrowUpRight, Bike, CalendarClock, CheckCircle2, CircleAlert, ClipboardList, Cloud, Coins, Fuel, Gauge, Plus, Search, ShieldCheck, Video, Wrench } from 'lucide-react';
import { garage, useGarage, useHydrated } from '@/lib/garage/store';
import { useBikeMeasurements, saveBikeMeasurements } from '@/lib/garage/cb650r-state';
import { CB650R_NAME, CB650R_REFERENCE as SPEC, CB650R_MANUAL, CB650R_REVISIONS, CB650R_PREVENTIVE, CB650R_TECH, CB650R_LINKS, revisionDue, addMonthsToDate, nextHondaServiceKm, type Revision } from '@/lib/garage/cb650r-reference';
import { calculateFuelStats, fuelSpent, useFillups } from '@/lib/garage/fuel';
import { formatBRL, formatDate, formatKm } from '@/lib/garage/logic';
import { CloudSyncPanel } from '@/components/garage/CloudSyncPanel';
import { FipeValuePanel } from '@/components/garage/FipeValuePanel';
import { VehicleFuelLedger } from '@/components/garage/VehicleFuelLedger';
import { VehicleVideoLibrary } from '@/components/garage/VehicleVideoLibrary';
import {FIPE_FEATURED_KEYS} from '@/lib/garage/fipe';

type Tab='painel'|'revisoes'|'pneus'|'transmissao'|'abastecimentos'|'servicos'|'biblioteca'|'videos';
const TABS:{id:Tab;label:string;icon:typeof Gauge}[]=[
 {id:'painel',label:'Visão geral',icon:Gauge},{id:'revisoes',label:'Revisões Honda',icon:CalendarClock},
 {id:'pneus',label:'Pneus e freios',icon:ShieldCheck},{id:'transmissao',label:'Transmissão',icon:Activity},
 {id:'abastecimentos',label:'Abastecimentos',icon:Fuel},{id:'servicos',label:'Manutenções',icon:Wrench},
 {id:'biblioteca',label:'Biblioteca técnica',icon:Search},
 {id:'videos',label:'Vídeos e reparos',icon:Wrench},
];
const panel='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const input='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100';
const primary='inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50';
const secondary='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50';
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function parseMileage(value:string){const n=Number(value);return Number.isSafeInteger(n)&&n>=0&&n<=9999999?n:null;}
function Stat({label,value,hint}:{label:string;value:string;hint:string}){return <div className={panel+' sv-interactive-surface'}><div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-3 text-2xl font-extrabold text-slate-900">{value}</div><div className="mt-2 text-xs text-slate-500">{hint}</div></div>}
function Label({text,children}:{text:string;children:React.ReactNode}){return <label className="grid gap-1.5 text-xs font-bold text-slate-700">{text}{children}</label>}
function Status({state}:{state:'ok'|'soon'|'due'|'done'}){const v={
 ok:['Programada','bg-slate-100 text-slate-700'],
 soon:['Em breve','bg-amber-100 text-amber-800'],
 due:['Conferir histórico','bg-rose-100 text-rose-800'],
 done:['Registrada','bg-emerald-100 text-emerald-800'],
}[state];return <span className={'rounded-full px-2.5 py-1 text-xs font-bold '+v[1]}>{v[0]}</span>}
export function CB650RDashboard(){
 const hydrated=useHydrated();
 const {vehicles,records}=useGarage();
 const allFillups=useFillups();
 const m=useBikeMeasurements();
 const [tab,setTab]=useState<Tab>('painel');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [startKm,setStartKm]=useState('');
 const [startPlate,setStartPlate]=useState('');
 const [startDelivery,setStartDelivery]=useState('');
 const [odometer,setOdometer]=useState('');
 const [revising,setRevising]=useState<Revision|null>(null);
 const [allRevisions,setAllRevisions]=useState(false);
 const [revisionDate,setRevisionDate]=useState(today());
 const [revisionKm,setRevisionKm]=useState('');
 const [revisionCost,setRevisionCost]=useState('0');
 const [revisionOS,setRevisionOS]=useState('');
 const [revisionNotes,setRevisionNotes]=useState('');
 const [inspections,setInspections]=useState({frontDepthMm:'',rearDepthMm:'',chainSlackMm:'',lastChainKm:'',frontTireKm:'',rearTireKm:'',chainKitKm:'',deliveryDate:'',notes:''});
 const [inspectionsOpen,setInspectionsOpen]=useState(false);
 const [service,setService]=useState({title:CB650R_PREVENTIVE[0]?.title??'Manutenção',date:today(),km:'',cost:'0',nextKm:'',notes:''});
 const [photoError,setPhotoError]=useState(false);
 const [filter,setFilter]=useState('');
 const bike=vehicles.find(v=>v.kind==='moto'&&v.name===CB650R_NAME);
 const services=useMemo(()=>records.filter(r=>r.vehicleId===bike?.id).sort((a,b)=>b.km-a.km||b.date.localeCompare(a.date)),[records,bike?.id]);
 const fillups=useMemo(()=>allFillups.filter(f=>f.vehicleId===bike?.id).sort((a,b)=>b.km-a.km),[allFillups,bike?.id]);
 const fuelStats=useMemo(()=>calculateFuelStats(fillups).find(v=>v.fuel==='gasolina'),[fillups]);
 const completed=useMemo(()=>new Set(services.filter(s=>s.kind==='revisao').map(s=>{const found=s.description.match(/^Revisão Honda CB650R • (\d+) km/);return found?Number(found[1]):-1;})),[services]);
 const now=today();
 const milestones=CB650R_REVISIONS.map(r=>({...r,due:revisionDue(r,bike?.currentKm??0,m.deliveryDate||undefined,now),done:completed.has(r.km)}));
 const pending=milestones.filter(r=>!r.done);
 const next=pending[0];
 const inspection=(k:'frontDepthMm'|'rearDepthMm'|'chainSlackMm')=>{const v=m[k];return v===''?null:Number(v);};
 const frontDepth=inspection('frontDepthMm'),rearDepth=inspection('rearDepthMm'),chainSlack=inspection('chainSlackMm');
 const preventiveAlerts=CB650R_PREVENTIVE.map(item=>{
   const logged=services.find(s=>s.description===item.title||s.description.startsWith(item.title+' — '));
   const lastKm=item.id==='chain-care'&&m.lastChainKm!==''?Number(m.lastChainKm):logged?.km;
   const nextKm=nextHondaServiceKm(item.id,lastKm??null,item.kmInterval);
   const nextDate=item.monthInterval!==null&&logged?addMonthsToDate(logged.date,item.monthInterval):null;
   const isDue=Boolean(bike&&(nextKm!==null&&bike.currentKm>=nextKm||nextDate&&nextDate<=now));
   const isSoon=Boolean(bike&&(nextKm!==null&&nextKm-bike.currentKm<=1000||nextDate&&nextDate>now&&(Date.parse(nextDate+'T00:00:00Z')-Date.parse(now+'T00:00:00Z'))<=30*86400000));
   const status:'ok'|'soon'|'due'=isDue?'due':isSoon?'soon':'ok';
   return {item,nextKm,nextDate,logged,lastKm,status};
 });
 const danger=(frontDepth!==null&&frontDepth<=SPEC.frontMinMm)||(rearDepth!==null&&rearDepth<=SPEC.rearMinMm)||(chainSlack!==null&&chainSlack>SPEC.chainDoNotRide);
 function notify(message:string){setError('');setNotice(message);}
 function fail(message:string){setNotice('');setError(message);}
 function activate(e:FormEvent){e.preventDefault();if(bike)return;const km=parseMileage(startKm);if(km===null)return fail('Informe a quilometragem real da motocicleta.');
  if(startDelivery&&!/^\d{4}-\d{2}-\d{2}$/.test(startDelivery))return fail('Data de entrega inválida.');
  try{garage.addVehicle({kind:'moto',name:CB650R_NAME,plate:startPlate.trim().toUpperCase(),currentKm:km});if(startDelivery)saveBikeMeasurements({deliveryDate:startDelivery});notify('Sua CB650R foi cadastrada neste navegador.');}catch(e){fail(e instanceof Error?e.message:'Falha ao cadastrar.');}}
 function updateKm(e:FormEvent){e.preventDefault();if(!bike)return;const km=parseMileage(odometer);if(km===null||km<bike.currentKm)return fail('A nova leitura não pode ser inferior ao odômetro atual.');garage.setKm(bike.id,km);setOdometer('');notify('Odômetro atualizado.');}
 function openRevision(r:Revision){setRevising(r);setRevisionDate(today());setRevisionKm('');setRevisionCost('0');setRevisionOS('');setRevisionNotes('');setError('');}
 function saveRevision(e:FormEvent){e.preventDefault();if(!bike||!revising)return;const km=parseMileage(revisionKm),cost=Number(revisionCost);
  if(km===null||!Number.isFinite(cost)||cost<0||cost>10000000||!revisionDate)return fail('Revise a data, a quilometragem e o custo da revisão.');
  if(completed.has(revising.km))return fail('Esta revisão já foi registrada. Confira o histórico antes de adicionar outra.');
  const desc=('Revisão Honda CB650R • '+revising.km+' km'+(revisionOS.trim()?' | OS '+revisionOS.trim():'')+(revisionNotes.trim()?' | '+revisionNotes.trim():'')).slice(0,300);
  try{garage.addRecord(bike.id,{kind:'revisao',date:revisionDate,km,description:desc,cost,nextKm:null});setRevising(null);notify('Revisão registrada como realizada conforme os dados informados. Guarde a ordem de serviço da concessionária.');}catch(e){fail(e instanceof Error?e.message:'Falha ao registrar revisão.');}
 }
 function startInspection(){setInspections({...m});setInspectionsOpen(true);}
 function saveInspection(e:FormEvent){e.preventDefault();
  for(const k of ['frontDepthMm','rearDepthMm','chainSlackMm'] as const){const v=inspections[k];if(v!==''&&(!Number.isFinite(Number(v))||Number(v)<0||Number(v)>100))return fail('Confira as medições em milímetros.');}
  for(const k of ['lastChainKm','frontTireKm','rearTireKm','chainKitKm'] as const){const v=inspections[k];if(v!==''&&parseMileage(v)===null)return fail('Confira as quilometragens registradas.');}
  try{saveBikeMeasurements(inspections);setInspectionsOpen(false);notify('Medições salvas. Os alertas utilizam os limites do manual Honda.');}catch(e){fail(e instanceof Error?e.message:'Não foi possível salvar.');}
 }
 function saveService(e:FormEvent){e.preventDefault();if(!bike)return;const km=parseMileage(service.km),cost=Number(service.cost),nextKm=service.nextKm?parseMileage(service.nextKm):null;
  if(km===null||!service.date||!Number.isFinite(cost)||cost<0||cost>10000000||(service.nextKm&&nextKm===null)||(nextKm!==null&&km>=nextKm))return fail('Verifique data, hodômetro, custo e próxima quilometragem.');
  const entry=CB650R_PREVENTIVE.find(x=>x.title===service.title);
  const description=(service.title+(service.notes.trim()?' — '+service.notes.trim():'')).slice(0,300);
  try{garage.addRecord(bike.id,{kind:entry?.type??'manutencao',description,date:service.date,km,cost,nextKm});setService({title:service.title,date:today(),km:'',cost:'0',nextKm:'',notes:''});notify('Serviço adicionado ao histórico.');}catch(e){fail(e instanceof Error?e.message:'Erro ao salvar o serviço.');}
 }
 const totalSpent=services.reduce((sum,s)=>sum+s.cost,0)+fuelSpent(fillups);
 if(!hydrated)return <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">Carregando sua CB650R...</div>;
 return <div className="min-h-screen bg-[#f3f5fa] text-slate-900">
  <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-7">
    <Link to="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-orange-400"><Bike/></span><span className="text-base font-extrabold">Smart<span className="text-orange-500">Veículos</span><small className="block text-xs font-normal text-slate-500">Minha garagem premium</small></span></Link>
    <div className="flex gap-2"><Link to="/" className={secondary}><ArrowLeft size={15}/> Garagem</Link><Link to="/gol-g6" className={secondary+' hidden sm:inline-flex'}>Gol G6</Link></div>
  </div></header>
  <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7">
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
      <Link key={pagina} to="/garagem" search={{pagina,veiculo:bike?.id??'cb650r-2024'}}
       className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white backdrop-blur-xl transition-colors hover:border-orange-300 hover:bg-orange-500/25"><Icon size={15}/>{label}<ArrowUpRight size={12} className="text-orange-300"/></Link>
     )}
    </div>
   </nav>

    <section className="sv-dashboard-hero relative isolate overflow-hidden rounded-3xl bg-[#101925] text-white shadow-xl"><div className="absolute -left-10 top-0 size-80 rounded-full bg-orange-500/10 blur-3xl"/><div className="relative grid lg:grid-cols-[1fr_0.95fr]">
       <div className="px-6 py-9 sm:px-10 sm:py-12"><span className="sv-intro-item sv-intro-item--1 inline-flex rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-orange-300">Neo Sports Café · Minha motocicleta</span><h1 className="sv-intro-item sv-intro-item--2 mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">Honda <span className="text-orange-400">CB650R</span></h1><p className="sv-intro-item sv-intro-item--3 mt-2 text-lg font-medium text-slate-200">2024 · Vermelha · 649 cc · quatro cilindros</p><p className="sv-intro-item sv-intro-item--4 mt-5 max-w-lg text-sm leading-7 text-slate-300">Uma central exclusiva para suas revisões, pneus, corrente, custos, manutenção, combustível e histórico técnico.</p><div className="sv-intro-item sv-intro-item--5 mt-6 flex flex-wrap gap-2">{['88,4 cv','15,4 litros','6 marchas','Manual oficial Honda'].map(v=><span key={v} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">{v}</span>)}</div></div>
       <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-slate-600 to-slate-900">{photoError?<div className="absolute inset-0 grid place-items-center"><Bike className="text-white/50" size={110}/></div>:<img src={SPEC.photo} alt="Fotografia ilustrativa de Honda CB650R 2024 vermelha; não é a moto cadastrada" onError={()=>setPhotoError(true)} className="sv-dashboard-photo absolute inset-0 h-full w-full object-cover" loading="eager"/>}<a href={SPEC.photoLink} target="_blank" rel="noopener noreferrer" className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 px-5 pb-4 pt-12 text-xs text-white/90 underline underline-offset-2">{SPEC.photoCredit}</a></div>
     </div></section>
    <nav aria-label="Seções da moto" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{TABS.map(t=><button type="button" key={t.id} onClick={()=>{setTab(t.id);setError('');setNotice('')}} className={'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition '+(tab===t.id?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100')}><t.icon size={17}/>{t.label}</button>)}</nav>
    {tab==='painel'&&<FipeValuePanel vehicleId={FIPE_FEATURED_KEYS.cb650r} kind="moto" vehicleName="Honda CB650R" brandHint="Honda" yearHint={2024}/>}
    {error&&<div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><CircleAlert size={18}/>{error}</div>}
    {notice&&<div role="status" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={18}/>{notice}</div>}
    {!bike&&tab!=='biblioteca'&&<form onSubmit={activate} className={panel+' border-orange-200'}>
      <h2 className="text-lg font-bold">Ative a ficha da sua CB650R</h2><p className="mt-1 text-sm text-slate-500">Informe seus dados reais. Nenhuma quilometragem, revisão ou data será presumida.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Label text="Hodômetro atual (km)"><input className={input} required min="0" max="9999999" type="number" value={startKm} onChange={e=>setStartKm(e.target.value)}/></Label>
        <Label text="Placa (opcional)"><input className={input} maxLength={10} value={startPlate} onChange={e=>setStartPlate(e.target.value)}/></Label>
        <Label text="Data da entrega (opcional)"><input className={input} type="date" value={startDelivery} onChange={e=>setStartDelivery(e.target.value)}/></Label>
        <button className={primary+' self-end'}><Plus size={16}/> Cadastrar</button>
      </div>
    </form>}
    {tab==='painel'&&<div className="sv-tab-content space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
       <Stat label="Odômetro" value={bike?formatKm(bike.currentKm):'Não informado'} hint="Leitura real da sua moto"/>
       <Stat label="Próxima revisão sem registro" value={bike&&next?formatKm(next.km):'—'} hint={bike&&next?(next.due.date?'Até '+formatDate(next.due.date):'Informe a data da entrega'):'Ative a ficha para acompanhar'}/>
       <Stat label="Consumo médio" value={fuelStats?fuelStats.kmPerLiter.toFixed(2)+' km/l':'—'} hint="Cálculo real por dois tanques cheios"/>
       <Stat label="Total registrado" value={formatBRL(totalSpent)} hint="Manutenção + abastecimentos registrados"/>
      </div>
      {danger&&<div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm font-semibold text-red-800"><CircleAlert className="mr-2 inline" size={18}/> Atenção: ao menos uma medição de pneu ou corrente atingiu limite crítico. Não pilote sem inspeção adequada.</div>}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
       <section className={panel}><h2 className="flex items-center gap-2 text-lg font-bold"><Gauge className="text-orange-500"/> Seu veículo e odômetro</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{[['Motor',SPEC.engine],['Pneus','120/70 ZR17 · 180/55 ZR17'],['Combustível','Gasolina'],['Placa',bike?.plate||'Não informada']].map(([label,value])=><div key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}</div>{bike&&<form onSubmit={updateKm} className="mt-6 flex gap-2"><input aria-label="Atualizar odômetro" className={input} required type="number" min={bike.currentKm} max="9999999" placeholder="Novo km" value={odometer} onChange={e=>setOdometer(e.target.value)}/><button className={primary}>Atualizar km</button></form>}
       </section>
       <section className={panel}><h2 className="flex items-center gap-2 text-lg font-bold"><CalendarClock className="text-orange-500"/> Situação das revisões</h2><p className="mt-2 text-sm text-slate-500">Sem registro não significa que o serviço não foi feito. Confira ordens de serviço antigas.</p>{next&&bike?<div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><div><p className="font-bold">{next.title} · {formatKm(next.km)}</p><p className="mt-1 text-xs text-slate-500">{next.due.date?'Prazo: '+formatDate(next.due.date):'Data de entrega não informada'}</p></div><Status state={next.due.state}/></div>:<p className="mt-4 text-sm text-slate-500">Cadastre seu odômetro para ver as próximas revisões.</p>}<button className={secondary+' mt-4'} onClick={()=>setTab('revisoes')}>Abrir calendário Honda</button></section>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">{[
        ['Pneus dianteiro / traseiro',frontDepth===null&&rearDepth===null?'Não medidos':[(frontDepth??'—')+' mm',(rearDepth??'—')+' mm'].join(' / '),'Limites: 1,5 / 2,0 mm'],
        ['Corrente / relação',chainSlack===null?'Não medida':chainSlack+' mm','Folga ideal 25–35 mm · acima de 50 mm: não pilotar'],
        ['Última lubrificação',m.lastChainKm?formatKm(Number(m.lastChainKm)):'Não informada','Inspecionar e lubrificar a cada 1.000 km'],
      ].map(([label,value,hint])=><div className={panel} key={label}><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-3 text-lg font-extrabold">{value}</p><p className="mt-2 text-xs text-slate-500">{hint}</p></div>)}</div>
      <div className="grid gap-4 sm:grid-cols-2"><button className={secondary+' justify-between p-5'} onClick={()=>{setTab('pneus');startInspection();}}>Registrar inspeção de pneus <ArrowUpRight size={16}/></button><button className={secondary+' justify-between p-5'} onClick={()=>{setTab('transmissao');startInspection();}}>Registrar inspeção da corrente <ArrowUpRight size={16}/></button></div>
      <section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Plano preventivo inteligente</h2><p className="mt-1 text-sm text-slate-500">Previsões apenas quando existe histórico real. Sem registro, consulte o manual ou sua concessionária.</p></div><button onClick={()=>setTab('servicos')} className={secondary}>Registrar serviço</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{preventiveAlerts.map(({item,nextKm,nextDate,logged,lastKm,status})=><div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-orange-700">{item.group}</p><p className="mt-1 text-sm font-bold">{item.title}</p><p className="mt-2 text-xs text-slate-600">{item.details}</p><div className="mt-3 text-xs font-semibold">{item.conditionBased?'Troca por condição e inspeção':nextKm!==null?'Próximo: '+formatKm(nextKm):item.id==='chain-care'&&!lastKm?'Informe a última lubrificação':logged?'Próximo prazo'+(nextDate?': '+formatDate(nextDate):' por condição'):'Histórico de serviço não informado'}</div>{nextDate&&<p className="mt-1 text-xs text-slate-500">Prazo temporal: {formatDate(nextDate)}</p>}{logged||lastKm!==undefined?<div className="mt-2"><Status state={status}/></div>:null}</div>)}</div></section>
    </div>}
    {tab==='revisoes'&&<section className={panel+' sv-tab-content'}>
       <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Livro digital de revisões Honda</h2><p className="mt-1 text-sm text-slate-500">Prazos calculados desde a entrega da moto — por km ou por meses, o que acontecer primeiro.</p></div><a className={secondary} href={CB650R_MANUAL} target="_blank" rel="noopener noreferrer">Manual oficial <ArrowUpRight size={15}/></a></div>
       <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-orange-50 p-4"><Label text="Data de entrega / início da garantia"><input className={input} type="date" value={m.deliveryDate} onChange={e=>{try{saveBikeMeasurements({deliveryDate:e.target.value})}catch{fail('Não foi possível salvar a data.')}}}/></Label><p className="max-w-md text-xs text-slate-600">Se você não sabe a data, deixe em branco. O sistema não presumirá atraso por tempo.</p></div>
       <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(allRevisions?milestones:milestones.slice(0,9)).map(r=><div key={r.km} className={'rounded-xl border p-4 '+(r.done?'border-emerald-200 bg-emerald-50/40':'border-slate-200 bg-white')}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold">{r.title}</h3><Status state={r.done?'done':r.due.state}/></div>
          <p className="mt-2 text-2xl font-extrabold">{formatKm(r.km)}</p><p className="mt-1 text-xs text-slate-500">Ou {r.months} meses da entrega</p>
          {r.due.date&&<p className="mt-2 text-xs font-semibold text-slate-700">Prazo: {formatDate(r.due.date)}</p>}
          {r.index<=2&&<p className="mt-2 text-xs text-orange-700">Mão de obra gratuita dentro das condições Honda</p>}
          {!r.done?<button disabled={!bike} type="button" className={secondary+' mt-4 w-full'} onClick={()=>openRevision(r)}>Registrar revisão realizada</button>:<p className="mt-4 text-xs font-bold text-emerald-800">Revisão informada pelo proprietário</p>}
         </div>)}</div>
       <button type="button" className={secondary+' mt-5'} onClick={()=>setAllRevisions(v=>!v)}>{allRevisions?'Mostrar primeiras 9 revisões':'Ver todas as '+milestones.length+' revisões'}</button>
       <p className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">O registro digital é pessoal e não substitui o carimbo, a assinatura e os comprovantes exigidos pela Honda para garantia. As revisões anteriores não são consideradas feitas automaticamente. Consulte sua concessionária para recuperar as ordens de serviço.</p>
      </section>}
    {(tab==='pneus'||tab==='transmissao')&&<div className="sv-tab-content grid gap-5 lg:grid-cols-[1fr_0.9fr]"><section className={panel}>
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">{tab==='pneus'?'Pneus, rodas e freios':'Corrente, coroa e pinhão'}</h2><button className={primary} onClick={startInspection}><Plus size={15}/> Registrar inspeção</button></div>
      {tab==='pneus'?<div className="mt-5 grid gap-3 sm:grid-cols-2">{[
       {name:'Pneu dianteiro',spec:SPEC.frontTire,psi:SPEC.frontPsi,min:SPEC.frontMinMm,depth:frontDepth},
       {name:'Pneu traseiro',spec:SPEC.rearTire,psi:SPEC.rearPsi,min:SPEC.rearMinMm,depth:rearDepth},
      ].map(t=><div key={t.name} className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="font-extrabold">{t.name}</p><p className="mt-2 text-xs text-slate-500">{t.spec}</p><p className="mt-4 text-2xl font-extrabold">{t.depth===null?'—':t.depth.toFixed(1)+' mm'}</p><p className="mt-1 text-xs text-slate-600">Limite mínimo: {t.min.toFixed(1)} mm · Pressão a frio: {t.psi} psi</p><p className={'mt-3 text-xs font-bold '+(t.depth!==null&&t.depth<=t.min?'text-red-600':'text-slate-500')}>{t.depth===null?'Medição pendente':t.depth<=t.min?'Troca necessária conforme manual':'Acima do limite mínimo; conferir TWI e danos'}</p></div>)}</div>:<div className="mt-5 space-y-3"><p className="text-sm text-slate-600">Inspecione e lubrifique a cada <b>1.000 km</b>, com inspeção adicional sob uso severo. O kit de transmissão não possui quilometragem fixa de troca.</p><div className="grid gap-3 sm:grid-cols-2"><Stat label="Folga registrada" value={chainSlack===null?'—':chainSlack+' mm'} hint="Ideal: 25 a 35 mm"/><Stat label="Última lubrificação" value={m.lastChainKm?formatKm(Number(m.lastChainKm)):'—'} hint="A cada 1.000 km"/></div><p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><b>Segurança:</b> não pilote com folga acima de 50 mm. Corrente, coroa e pinhão com desgaste ou dano devem ser substituídos em conjunto.</p></div>}
      </section><section className={panel}><h3 className="text-lg font-bold">Critérios do manual Honda</h3><div className="mt-5 space-y-4 text-sm text-slate-600">{(tab==='pneus'?[
       ['Quando trocar','TWI aparente, sulcos no limite, bolhas, cortes, deformação ou dano lateral. Não há quilometragem fixa de troca.'],
       ['Pressão a frio','36 psi dianteiro e 42 psi traseiro, conforme manual da versão brasileira.'],
       ['Freios','Inspeção de pastilhas a cada 6.000 km; fluido DOT 4 a cada 2 anos.'],
      ]:[
       ['Padrão original','Corrente 525 de 118 elos · pinhão 15 dentes · coroa 42 dentes.'],
       ['Desgaste','Dentes deformados, elos travados, retentores ausentes e ajuste fora da faixa exigem avaliação.'],
       ['Troca do kit','Substituir corrente, coroa e pinhão em conjunto quando a inspeção indicar desgaste excessivo.'],
      ]).map(([head,desc])=><div key={head}><p className="font-bold text-slate-900">{head}</p><p className="mt-1 leading-6">{desc}</p></div>)}</div><a href={CB650R_MANUAL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-700 underline">Consultar manual Honda <ArrowUpRight size={15}/></a></section></div>}
    {tab==='abastecimentos'&&<VehicleFuelLedger vehicleId={bike?.id??''} vehicleName={CB650R_NAME} currentKm={bike?.currentKm??null} kind="moto"/>}
    {tab==='videos'&&<VehicleVideoLibrary vehicle={{kind:'moto',name:CB650R_NAME,modelYear:2024,modelKey:'cb650r-2024'}}/>}
    {tab==='servicos'&&<div className="sv-tab-content grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
       <section className={panel}><h2 className="text-lg font-extrabold">Registrar manutenção</h2><form onSubmit={saveService} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label text="Serviço"><select className={input} value={service.title} onChange={e=>setService(s=>({...s,title:e.target.value}))}>{CB650R_PREVENTIVE.map(item=><option key={item.id} value={item.title}>{item.title}</option>)}</select></Label></div>
        <Label text="Data do serviço"><input required type="date" className={input} value={service.date} onChange={e=>setService(s=>({...s,date:e.target.value}))}/></Label>
        <Label text="Hodômetro (km)"><input required type="number" min="0" max="9999999" className={input} value={service.km} onChange={e=>setService(s=>({...s,km:e.target.value}))}/></Label>
        <Label text="Valor pago (R$)"><input required type="number" min="0" max="10000000" step="0.01" className={input} value={service.cost} onChange={e=>setService(s=>({...s,cost:e.target.value}))}/></Label>
        <Label text="Próximo km (opcional)"><input type="number" min="0" max="9999999" className={input} value={service.nextKm} onChange={e=>setService(s=>({...s,nextKm:e.target.value}))}/></Label>
        <div className="sm:col-span-2"><Label text="Peças, oficina, nota fiscal ou observações"><textarea rows={3} maxLength={240} className={input} value={service.notes} onChange={e=>setService(s=>({...s,notes:e.target.value}))}/></Label></div>
        <button disabled={!bike} className={primary+' sm:col-span-2'}><Plus size={16}/> Salvar manutenção</button>
       </form></section><section className={panel}><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Histórico de serviços</h2><span className="text-xs text-slate-500">{services.length} registros</span></div>
       {services.length?<div className="mt-4 max-h-[650px] space-y-3 overflow-y-auto">{services.map(s=><div className="rounded-xl border border-slate-200 p-4" key={s.id}><div className="flex items-start justify-between gap-2"><div><p className="font-bold">{s.description}</p><p className="mt-2 text-xs text-slate-500">{formatDate(s.date)} · {formatKm(s.km)}</p></div><strong className="shrink-0">{formatBRL(s.cost)}</strong></div><div className="mt-3 flex justify-between">{s.nextKm!==null&&<p className="text-xs font-semibold text-orange-700">Próximo: {formatKm(s.nextKm)}</p>}<button onClick={()=>{if(window.confirm('Excluir este serviço?'))garage.removeRecord(s.id);}} className="ml-auto text-xs font-semibold text-red-600">Excluir</button></div></div>)}</div>:<p className="mt-4 text-sm text-slate-500">Nenhum serviço cadastrado. Inclua seus comprovantes anteriores manualmente.</p>}</section></div>}
    {tab==='biblioteca'&&<div className="sv-tab-content space-y-5">
      <section className={panel}><h2 className="text-lg font-extrabold">Ficha técnica Honda CB650R 2024</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
        ['Motor',SPEC.engine],['Potência',SPEC.power],['Torque',SPEC.torque],['Câmbio',SPEC.gearbox],['Óleo recomendado',SPEC.engineOil],['Óleo com filtro',SPEC.oilWithFilter+' litros'],['Tanque',SPEC.tankLiters+' litros'],['Bateria',SPEC.battery],['Corrente e kit',SPEC.chain+' · '+SPEC.sprockets]
       ].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}</div></section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{CB650R_TECH.filter(t=>(t.title+t.description+t.tag).toLowerCase().includes(filter.toLowerCase())).map(t=><article className={panel} key={t.title}>{t.image?<img className="mb-4 h-40 w-full rounded-xl bg-slate-100 object-cover" src={t.image} loading="lazy" alt={'Imagem de referência: '+t.title}/>:<div className="mb-4 grid h-28 place-items-center rounded-xl bg-slate-100"><Wrench size={36} className="text-slate-400"/></div>}<p className="text-xs font-bold uppercase tracking-wider text-orange-600">{t.tag}</p><h3 className="mt-2 text-lg font-bold">{t.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{t.description}</p><a className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-700" href={t.link} target="_blank" rel="noopener noreferrer">Manual / referência <ArrowUpRight size={15}/></a></article>)}</div>
      <section className={panel}><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-extrabold">Fontes oficiais e documentação</h2><div className="relative"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input className={input+' pl-9'} value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrar sistemas"/></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{CB650R_LINKS.map(x=><a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-xl border p-4 text-sm font-semibold hover:border-orange-300 hover:bg-orange-50">{x.title}<ArrowUpRight size={17}/></a>)}</div><p className="mt-4 text-xs text-slate-500">Fotografias de referência e produtos podem apresentar acabamentos diferentes. Confirme peças pelo chassi e a cobertura de garantia com a Honda.</p></section>
     </div>}
    {revising&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" role="presentation"><form onSubmit={saveRevision} role="dialog" aria-modal="true" aria-label="Registrar revisão Honda" className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 shadow-xl"><div><h2 className="text-xl font-extrabold">Registrar {revising.title}</h2><p className="text-sm text-slate-500">Agendada em {formatKm(revising.km)} ou {revising.months} meses da entrega</p></div><div className="grid gap-3 sm:grid-cols-2"><Label text="Data real"><input required type="date" className={input} value={revisionDate} onChange={e=>setRevisionDate(e.target.value)}/></Label><Label text="Km no dia"><input required type="number" min="0" max="9999999" className={input} value={revisionKm} onChange={e=>setRevisionKm(e.target.value)}/></Label><Label text="Custo (R$)"><input type="number" min="0" max="10000000" step="0.01" required className={input} value={revisionCost} onChange={e=>setRevisionCost(e.target.value)}/></Label><Label text="Nº ordem de serviço"><input className={input} maxLength={60} value={revisionOS} onChange={e=>setRevisionOS(e.target.value)}/></Label></div><Label text="Oficina e observações"><textarea className={input} rows={2} maxLength={120} value={revisionNotes} onChange={e=>setRevisionNotes(e.target.value)}/></Label><div className="flex gap-3"><button className={primary} disabled={!bike}>Salvar revisão</button><button type="button" className={secondary} onClick={()=>setRevising(null)}>Cancelar</button></div></form></div>}
    {inspectionsOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4"><form onSubmit={saveInspection} role="dialog" aria-modal="true" aria-label="Registrar inspeção CB650R" className="w-full max-w-xl space-y-4 rounded-3xl bg-white p-6 shadow-xl"><h2 className="text-xl font-extrabold">Medições e inspeções da CB650R</h2><div className="grid gap-3 sm:grid-cols-2">{([
      ['frontDepthMm','Sulco dianteiro (mm)'],['rearDepthMm','Sulco traseiro (mm)'],['chainSlackMm','Folga da corrente (mm)'],['lastChainKm','Última lubrificação (km)'],
      ['frontTireKm','Pneu dianteiro instalado (km)'],['rearTireKm','Pneu traseiro instalado (km)'],['chainKitKm','Kit relação instalado (km)']
    ] as const).map(([key,label])=><Label key={key} text={label}><input type="number" min="0" step={key.endsWith('Mm')?'0.1':'1'} className={input} value={inspections[key]} onChange={e=>setInspections(s=>({...s,[key]:e.target.value}))}/></Label>)}</div><p className="text-xs text-slate-500">Deixe em branco campos não medidos. Use paquímetro/medidor adequado e apoio profissional em inspeções de segurança.</p><div className="flex gap-3"><button className={primary}>Salvar medições</button><button type="button" className={secondary} onClick={()=>setInspectionsOpen(false)}>Cancelar</button></div></form></div>}
    <CloudSyncPanel bikeProfile />
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t py-5 text-xs text-slate-500"><span>SmartVeículos · Honda CB650R 2024 · Registros locais; backup manual disponível após login. Alertas não substituem diagnóstico profissional ou comprovantes da Honda.</span><DeveloperCredit compact /></footer>
  </main>
 </div>;
}
