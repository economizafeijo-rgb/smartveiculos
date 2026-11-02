import {DeveloperCredit} from '@/components/ui/DeveloperCredit';
import {createFileRoute,Link,useNavigate} from '@tanstack/react-router';
import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {
 ArrowRight,Bike,CarFront,Check,Fuel,ChevronDown,ClipboardList,Cloud,Coins,
 Gauge,Home,LockKeyhole,LogOut,Plus,Settings2,ShieldCheck,SlidersHorizontal,Wrench,
} from 'lucide-react';
import {AuthGate} from '@/components/auth/AuthGate';
import {supabase} from '@/lib/supabase/client';
import {garage,useGarage,useHydrated} from '@/lib/garage/store';
import {importLegacyFillups} from '@/lib/garage/fuel';
import {GOL} from '@/lib/garage/gol-reference';
import {CB650R_NAME,CB650R_REFERENCE} from '@/lib/garage/cb650r-reference';
import {formatBRL,formatKm,sortRecords,totalCost,upcomingServices} from '@/lib/garage/logic';
import {AlertsPanel} from '@/components/garage/AlertsPanel';
import {OdometerCard} from '@/components/garage/OdometerCard';
import {RecordDialog} from '@/components/garage/RecordDialog';
import {RecordList} from '@/components/garage/RecordList';
import {VehicleDialog} from '@/components/garage/VehicleDialog';
import {FipeValuePanel,FipeVehicleSummary} from '@/components/garage/FipeValuePanel';
import {VehicleFuelLedger} from '@/components/garage/VehicleFuelLedger';
import {VehicleVideoLibrary} from '@/components/garage/VehicleVideoLibrary';
import {VehicleMaintenanceLedger} from '@/components/garage/VehicleMaintenanceLedger';
import {Video,CalendarClock,BookOpen,ArrowUpRight} from 'lucide-react';
import {FIPE_FEATURED_KEYS} from '@/lib/garage/fipe';
import type {Vehicle,RecordKind,ServiceRecord} from '@/lib/garage/types';

const garagePages=['inicio','abastecimentos','revisoes','videos','fipe','registros'] as const;
type GaragePage=(typeof garagePages)[number];
function validPage(value:unknown):value is GaragePage{
 return typeof value==='string'&&garagePages.some(page=>page===value);
}
const shortcuts=[
 {id:'abastecimentos',label:'Abastecimentos',detail:'Gastos, consumo e histórico',icon:Fuel},
 {id:'revisoes',label:'Revisões',detail:'Plano e histórico da montadora',icon:CalendarClock},
 {id:'fipe',label:'Tabela FIPE',detail:'Cotação em reais por veículo',icon:Coins},
 {id:'videos',label:'Vídeos e reparos',detail:'Tutoriais para carro e moto',icon:Video},
 {id:'registros',label:'Registros',detail:'Serviços, quilometragem e peças',icon:ClipboardList},
] as const;
const sectionInfo:Record<Exclude<GaragePage,'inicio'>,{label:string;description:string}>={
 abastecimentos:{label:'Controle de abastecimentos',description:'Registre o preço por litro e acompanhe despesas por semana, mês e ano.'},
 revisoes:{label:'Revisões e manutenção',description:'Plano da montadora, próximas verificações e livro digital de serviços realizados.'},
 fipe:{label:'Tabela FIPE',description:'Consulte e atualize o valor de referência em reais de cada veículo.'},
 videos:{label:'Vídeos de manutenção e reparos',description:'Pesquise tutoriais de serviços e defeitos comuns do modelo cadastrado.'},
 registros:{label:'Registros da garagem',description:'Gerencie quilometragem, alertas, peças e histórico individual.'},
};

export const Route=createFileRoute('/garagem')({
 validateSearch:(search:Record<string,unknown>):{pagina?:GaragePage|undefined;veiculo?:string|undefined}=>({
  pagina:validPage(search['pagina'])?search['pagina']:undefined,
  veiculo:typeof search['veiculo']==='string'&&search['veiculo'].length<120?search['veiculo']:undefined,
 }),
 head:()=>({meta:[
  {title:'Minha Garagem | SmartVeículos'},
  {name:'description',content:'Acesse seus veículos com fichas individuais de revisões, manutenção, consumo e histórico.'}
 ]}),
 component:()=> <AuthGate next="/garagem"><OwnerGarage/></AuthGate>
});

type CloudVehicle={
 id:string;model_key:string;owner_id:string;kind:'carro'|'moto';brand:string;
 display_name:string;model_year:number|null;color:string|null;plate:string|null;
 odometer_km:number|null;
};
type PortalVehicle={
 id:string;modelKey:string;kind:'carro'|'moto';name:string;subtitle:string;
 plate:string|null;km:number|null;url:'/gol-g6'|'/cb650r'|null;
 fipeKey:string;brand:string;modelYear:number|null;localVehicleId:string|null;
 photo:string;photocredit:string;source:'perfil'|'local';
};
const photoGarage='https://images.unsplash.com/photo-1727893153491-392fd2d1c721?auto=format&fit=crop&w=1800&q=85';
const fallbackCar='https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&auto=format&fit=crop&q=80';
const fallbackBike='https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&auto=format&fit=crop&q=80';

function toProfile(p:CloudVehicle,local:Vehicle|undefined):PortalVehicle{
 const isGol=p.model_key==='gol-g6-selecao-2014';
 const isCb=p.model_key==='cb650r-2024';
 return {
  id:p.id,modelKey:p.model_key,kind:p.kind,name:p.display_name,
  fipeKey:isGol?FIPE_FEATURED_KEYS.gol:isCb?FIPE_FEATURED_KEYS.cb650r:(local?.id??p.id),brand:p.brand,modelYear:p.model_year,
  localVehicleId:local?.id??null,
  subtitle:isGol?'2014 · 1.6 Flex · Prata':isCb?'2024 · Vermelha · 649 cm³ · 4 cilindros':[
    p.model_year?p.model_year.toString():'',p.color??''
  ].filter(Boolean).join(' · '),
  plate:local?.plate||p.plate||null,
  km:local?.currentKm??p.odometer_km,
  url:isGol?'/gol-g6':isCb?'/cb650r':null,
  photo:isGol?GOL.photo:isCb?CB650R_REFERENCE.photo:p.kind==='carro'?fallbackCar:fallbackBike,
  photocredit:isGol?'Imagem ilustrativa de Gol 2014':isCb?'Imagem ilustrativa da CB650R vermelha':'Foto ilustrativa',
  source:'perfil',
 };
}
function fromLocal(v:Vehicle):PortalVehicle{
 const isGol=v.name===GOL.name;
 const isCb=v.name===CB650R_NAME;
 return {
  id:v.id,modelKey:'local:'+v.id,kind:v.kind,name:v.name,
  fipeKey:isGol?FIPE_FEATURED_KEYS.gol:isCb?FIPE_FEATURED_KEYS.cb650r:v.id,brand:isGol?'VW':isCb?'Honda':v.name.split(' ')[0]??'',
  localVehicleId:v.id,
  modelYear:Number(v.name.match(/(?:19|20)\d{2}/)?.[0])|| (isGol?2014:isCb?2024:null),
  subtitle:isCb?'2024 · Vermelha · 649 cm³':v.kind==='carro'?'Automóvel · Meu veículo':'Motocicleta · Meu veículo',
  plate:v.plate||null,km:v.currentKm,
  url:isGol?'/gol-g6':isCb?'/cb650r':null,
  photo:isGol?GOL.photo:isCb?CB650R_REFERENCE.photo:v.kind==='carro'?fallbackCar:fallbackBike,
  photocredit:'Fotografia ilustrativa',source:'local'
 };
}
function matchLocal(p:CloudVehicle,v:Vehicle):boolean{
 if(p.model_key==='gol-g6-selecao-2014')return v.kind==='carro'&&v.name===GOL.name;
 if(p.model_key==='cb650r-2024')return v.kind==='moto'&&v.name===CB650R_NAME;
 return p.kind===v.kind&&p.display_name===v.name;
}
function Spec({icon,children}:{icon:ReactNode;children:ReactNode}){
 return <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-slate-900/40 px-2.5 py-1.5 text-xs text-white/90 backdrop-blur">{icon}{children}</span>;
}
function VehicleCard({vehicle,index,onSelect}:{vehicle:PortalVehicle;index:number;onSelect:()=>void}){
 const [failed,setFailed]=useState(false);
 const Icon=vehicle.kind==='carro'?CarFront:Bike;
 const url=vehicle.url;
 const inner=<>
  {!failed&&<img className="sv-card-photo absolute inset-0 h-full w-full object-cover object-center" src={vehicle.photo} onError={()=>setFailed(true)} alt={'Imagem ilustrativa do veículo '+vehicle.name} loading={index<2?'eager':'lazy'}/>}
  <div className="sv-garage-card-scrim absolute inset-0" aria-hidden="true"/>
  {failed&&<Icon size={100} className="absolute right-8 top-16 text-white/15"/>}
  <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
   <div className="flex items-center justify-between gap-3">
    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-white backdrop-blur"><Icon size={15}/>{vehicle.kind==='carro'?'Meu carro':'Minha moto'}</span>
    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 backdrop-blur">Ficha cadastrada</span>
   </div>
   <div>
    <h3 className="text-xl font-black tracking-tight text-white drop-shadow sm:text-[clamp(1.25rem,1.8vw,1.7rem)]">{vehicle.name}</h3>
    <p className="mt-1 text-xs font-medium text-white/85 sm:text-sm">{vehicle.subtitle}</p>
    <div className="mt-2 flex flex-wrap gap-2">
     <Spec icon={<Gauge size={14}/>}>{vehicle.km!==null?formatKm(vehicle.km):'KM a informar'}</Spec>
     {vehicle.plate&&<Spec icon={<CarFront size={14}/>}>{vehicle.plate}</Spec>}
    </div>
    <div className="mt-2"><FipeVehicleSummary vehicleId={vehicle.fipeKey}/></div>
    <div className="mt-3 flex items-center justify-between gap-3">
     <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#111827] shadow-lg transition group-hover:bg-orange-400">
      {vehicle.url?'Abrir painel completo':'Gerenciar veículo'}<ArrowRight size={17}/>
     </span>
     <span className="max-w-32 text-right text-[10px] leading-4 text-white/60">{vehicle.photocredit}</span>
    </div>
   </div>
  </div>
 </>;
 const cls='sv-vehicle-card sv-garage-vehicle-card sv-card-load sv-card-load--'+(index%4)+' group relative block h-full min-h-[240px] w-full overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-[#263a56] to-[#121e2f] text-left shadow-[0_10px_35px_-15px_rgba(7,16,31,.5)] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500';
 return url?<Link className={cls} to={url}>{inner}</Link>
  :<button type="button" onClick={onSelect} className={cls}>{inner}</button>;
}
function OwnerGarage(){
 const hydrated=useHydrated();
 const navigate=useNavigate();
 const {pagina:rawPage,veiculo:requestedVehicle}=Route.useSearch();
 const pagina=rawPage??'inicio';
 const {vehicles,records}=useGarage();
 const [profiles,setProfiles]=useState<CloudVehicle[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [isAdmin,setIsAdmin]=useState(false);
 const [userEmail,setUserEmail]=useState('');
 const [managerOpen,setManagerOpen]=useState(true);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [fipeEntryId,setFipeEntryId]=useState<string|null>(null);

 const [vehicleDialog,setVehicleDialog]=useState<{open:boolean;vehicle?:Vehicle}>({open:false});
 const [recordDialog,setRecordDialog]=useState<{open:boolean;record?:ServiceRecord;defaultKind?:RecordKind}>({open:false});
 const [loadToken,setLoadToken]=useState(0);
 useEffect(()=>{
  if(!supabase){setLoading(false);setError('Conexão com a garagem digital indisponível.');return;}
  let active=true;
  const client=supabase;
  const read=async()=>{
   try{
    const {data:auth,error:authError}=await client.auth.getUser();
    if(authError||!auth.user)throw new Error('Sessão expirada. Faça login novamente.');
    const uid=auth.user.id;
    const [ownerVehicles,admin]=await Promise.all([
     client.from('owner_vehicle_cards').select('id,model_key,owner_id,kind,brand,display_name,model_year,color,plate,odometer_km').eq('owner_id',uid).order('created_at',{ascending:true}),
     client.from('platform_admins').select('user_id').eq('user_id',uid).maybeSingle()
    ]);
    if(!active)return;
    if(ownerVehicles.error)throw ownerVehicles.error;
    setProfiles((ownerVehicles.data??[]) as CloudVehicle[]);
    setUserEmail(auth.user.email??'');
    setIsAdmin(!admin.error&&Boolean(admin.data));
    setError('');
   }catch(e){if(active){setError(e instanceof Error?e.message:'Não foi possível carregar os veículos.');setIsAdmin(false);}}
   finally{if(active)setLoading(false);}
  };
  void read();
  return()=>{active=false;};
 },[loadToken]);
 const entries=useMemo(()=>{
  const result:PortalVehicle[]=profiles.map(p=>toProfile(p,vehicles.find(v=>matchLocal(p,v))));
  for(const v of vehicles){
   if(!profiles.some(p=>matchLocal(p,v)))result.push(fromLocal(v));
  }
  return result;
 },[profiles,vehicles]);
 const selected=vehicles.find(v=>v.id===selectedId)??vehicles[0];
 const requestedEntry=requestedVehicle?entries.find(v=>v.id===requestedVehicle||v.localVehicleId===requestedVehicle||v.modelKey===requestedVehicle):undefined;
 const fipeEntry=requestedVehicle?requestedEntry:(entries.find(v=>v.id===fipeEntryId)??entries[0]);
 const activeLocal=fipeEntry?.localVehicleId?vehicles.find(v=>v.id===fipeEntry.localVehicleId):undefined;
 const vehicleRecords=useMemo(()=>selected?sortRecords(records.filter(r=>r.vehicleId===selected.id)):[],[selected?.id,records]);
 const alerts=useMemo(()=>selected?upcomingServices(vehicleRecords,selected.currentKm):[],[vehicleRecords,selected?.currentKm]);
  const needsKm=entries.filter(v=>v.km===null).length;
 const onImportLegacy=()=>{
  if(!window.confirm('Importar os dados da garagem antiga deste navegador para a conta atual? Faça isso somente se os veículos forem seus.'))return;
  try{
   const result=garage.importLegacy();
   const fuel=importLegacyFillups();
   setNotice('Importados: '+result.vehiclesAdded+' veículos, '+result.recordsAdded+' serviços e '+fuel+' abastecimentos.');
   setError('');
  }catch(e){setNotice('');setError(e instanceof Error?e.message:'Não foi possível importar.');}
 };
 const logout=async()=>{
  if(!supabase)return;
  const {error:signOutError}=await supabase.auth.signOut();
  if(signOutError){setError(signOutError.message);return;}
  window.location.assign('/');
 };
 const openLocal=(id:string)=>{
  if(!id.startsWith('local:')){
   setNotice('Para acessar a manutenção desse modelo, abra sua ficha dedicada.');
   return;
  }
  setSelectedId(id.replace(/^local:/,''));
  setManagerOpen(true);
  // O histórico da garagem está em uma página própria para evitar telas infinitas.
 };
 return <div className={'sv-owner-garage sv-theme-surface sv-owner-garage--multipage text-slate-900'+(managerOpen?' sv-owner-garage--managing':'')}>
  <header className="sv-garage-header shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
   <div className="sv-garage-topline mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6">
    <div className="flex shrink-0 items-center gap-2.5"><span className="sv-logo-mark grid size-9 place-items-center rounded-xl bg-[#121d30] text-orange-400"><CarFront size={18}/></span><div><p className="text-[15px] font-black leading-4">Smart<span className="text-orange-600">Veículos</span></p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.14em] text-slate-500">Área do proprietário</p></div></div>
    <nav aria-label="Navegação da garagem" className="sv-garage-nav flex min-w-0 items-center justify-end gap-1.5">
     <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"><Home size={14}/> Início</Link>
     <a href="/meus-atendimentos" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-bold text-orange-900 hover:bg-orange-100"><Wrench size={14}/> Meus atendimentos</a>
     {isAdmin&&<a href="/admin" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-bold text-orange-900 hover:bg-orange-100"><ShieldCheck size={14}/> Administração</a>}
     <button type="button" onClick={()=>void logout()} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#111e30] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#24354e]"><LogOut size={14}/> Sair</button>
    </nav>
   </div>
  </header>
  <main className="sv-garage-main mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col gap-4 px-4 py-5 sm:px-6">
   <nav aria-label="Menu de serviços do cliente" className="sv-garage-services-nav flex flex-wrap items-center gap-2">
    <Link to="/garagem" search={{pagina:'inicio'}} aria-current={pagina==='inicio'?'page':undefined}
     className={'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition '+(pagina==='inicio'?'border-orange-400 bg-[#142941] text-white':'border-slate-200 bg-white text-slate-800 hover:border-orange-300')}>
     <Home size={15}/> Painel principal
    </Link>
    {shortcuts.map(item=>{
     const Icon=item.icon;
     return <Link key={item.id} to="/garagem" search={{pagina:item.id,veiculo:fipeEntry?.id}} aria-current={pagina===item.id?'page':undefined}
      className={'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition '+(pagina===item.id?'border-orange-400 bg-[#142941] text-white':'border-slate-200 bg-white text-slate-800 hover:border-orange-300 hover:bg-orange-50')}>
      <Icon size={15}/>{item.label}
     </Link>;
    })}
   </nav>

   {pagina==='inicio'&&<section className="sv-garage-hero relative isolate shrink-0 overflow-hidden rounded-[20px] bg-[#101e33] text-white shadow-lg">
    <div className="sv-garage-backdrop absolute inset-0 bg-cover bg-center" style={{backgroundImage:'url("'+photoGarage+'")'}} aria-hidden="true"/>
    <div className="sv-garage-hero-scrim absolute inset-0" aria-hidden="true"/>
    <div className="sv-garage-hero-content relative z-10 grid min-h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-7">
     <div className="min-w-0">
      <span className="sv-intro-item sv-intro-item--1 inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-orange-200"><ShieldCheck size={12}/> Sua garagem digital</span>
      <h1 className="sv-intro-item sv-intro-item--2 mt-2 font-black tracking-tight text-white">Bem-vindo à sua <span className="text-orange-400">garagem.</span></h1>
      <p className="sv-intro-item sv-intro-item--3 mt-1.5 max-w-[510px] text-xs leading-5 text-slate-100">Escolha seu veículo para acompanhar revisões, abastecimentos e manutenção em um painel exclusivo.</p>
     </div>
     <div className="sv-garage-stats grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-white/20 bg-[#0b1e36]/65 px-3 py-2.5 backdrop-blur-md">
       <p className="text-[10px] font-semibold text-slate-200">Meus veículos</p>
       <strong className="mt-1 block text-2xl font-black leading-none text-white">{entries.length}</strong>
      </div>
      <div className="rounded-xl border border-white/20 bg-[#0b1e36]/65 px-3 py-2.5 backdrop-blur-md">
       <p className="text-[10px] font-semibold text-slate-200">KM a informar</p>
       <strong className="mt-1 block text-2xl font-black leading-none text-white">{needsKm}</strong>
      </div>
     </div>
    </div>
   </section>}
   {pagina==='inicio'&&<section className="sv-garage-quick-access shrink-0 space-y-3" aria-label="Serviços disponíveis">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div><p className="text-[10px] font-black uppercase tracking-[.17em] text-orange-700">Tudo em um só lugar</p>
      <h2 className="mt-1 text-lg font-black text-[#12233c] sm:text-xl">Acesso rápido aos serviços</h2></div>
     <p className="text-xs font-medium text-slate-500">Selecione uma ferramenta para abrir sua própria página.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     {shortcuts.map(item=>{
      const Icon=item.icon;
      return <Link key={item.id} to="/garagem" search={{pagina:item.id,veiculo:fipeEntry?.id}}
       className="group flex min-w-0 items-center gap-4 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_10px_24px_-19px_rgba(14,32,57,.75)] backdrop-blur-lg transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">
       <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-orange-200 bg-[#122943] text-orange-300"><Icon size={22}/></span>
       <span className="min-w-0 flex-1"><strong className="block text-sm font-black text-[#13253e]">{item.label}</strong>
        <span className="mt-1 block text-xs leading-4 text-slate-600">{item.detail}</span></span>
       <ArrowRight size={18} className="shrink-0 text-orange-600 transition-transform group-hover:translate-x-1"/>
      </Link>;
     })}
     <a href="/meus-atendimentos" className="group flex min-w-0 items-center gap-4 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_10px_24px_-19px_rgba(14,32,57,.75)] backdrop-blur-lg transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-white">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-orange-200 bg-[#122943] text-orange-300"><Wrench size={22}/></span>
      <span className="min-w-0 flex-1"><strong className="block text-sm font-black text-[#13253e]">Meus atendimentos</strong><span className="mt-1 block text-xs leading-4 text-slate-600">Acompanhar serviços solicitados</span></span>
      <ArrowUpRight size={18} className="shrink-0 text-orange-600"/>
     </a>
    </div>
   </section>}
   {pagina!=='inicio'&&<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/25 bg-gradient-to-r from-[#11253e] via-[#1b3857] to-[#274569] p-5 text-white shadow-sm sm:p-6">
    <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-orange-300">SmartVeículos · Área do cliente</p>
     <h1 className="mt-2 text-2xl font-black tracking-tight text-white">{sectionInfo[pagina].label}</h1>
     <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-200">{sectionInfo[pagina].description}</p>
    </div>
    <Link to="/garagem" search={{pagina:'inicio'}} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-xs font-bold text-white hover:bg-white/20"><Home size={15}/> Voltar à garagem</Link>
   </div>}
   {pagina!=='inicio'&&hydrated&&!loading&&entries.length>0&&<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
    <label className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-black text-slate-700">Veículo selecionado
     <select aria-label="Selecionar veículo para esta página" value={fipeEntry?.id??''} onChange={e=>{
      setFipeEntryId(e.target.value);
      void navigate({to:'/garagem',search:{pagina,veiculo:e.target.value}});
     }} className="max-w-[280px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-orange-400">
      {entries.map(v=><option key={v.id} value={v.id}>{v.kind==='carro'?'Carro':'Moto'} · {v.name}</option>)}
     </select></label>
    {fipeEntry?.url&&<Link to={fipeEntry.url} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange-700 hover:underline">Ficha técnica completa <ArrowUpRight size={15}/></Link>}
   </div>}
   {pagina==='inicio'&&<div className="sv-garage-heading flex shrink-0 flex-wrap items-center justify-between gap-2">
    <div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-orange-700">Meu espaço</p><h2 className="mt-0.5 text-[21px] font-black leading-tight tracking-tight text-[#111d30]">Escolha seu veículo</h2></div>
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm"><LockKeyhole size={13}/> Acesso individual e protegido</span>
   </div>}
   {error&&<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button className="font-bold underline" onClick={()=>{setLoading(true);setLoadToken(n=>n+1)}}>Tentar novamente</button></div>}
   {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
   {pagina==='inicio'&&(!hydrated||loading)&&<div aria-label="Carregando veículos" className="sv-garage-vehicle-grid grid min-h-0 flex-1 gap-3 md:grid-cols-2">{[0,1].map(i=><div key={i} className="sv-garage-skeleton min-h-[230px] animate-pulse rounded-[20px] bg-slate-200"/>)}</div>}
   {pagina==='inicio'&&hydrated&&!loading&&entries.length>0&&<div className="sv-garage-vehicle-grid grid min-h-0 flex-1 gap-3 md:grid-cols-2">{entries.map((v,i)=><VehicleCard key={v.id} vehicle={v} index={i} onSelect={()=>openLocal(v.modelKey)}/>)}</div>}
   {pagina==='inicio'&&hydrated&&!loading&&!entries.length&&<section className="sv-garage-empty flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8"><div className="mx-auto grid size-14 place-items-center rounded-xl bg-orange-50 text-orange-600"><CarFront size={28}/></div><h3 className="mt-5 text-xl font-black">Sua garagem ainda está vazia</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Cadastre seu primeiro veículo para ter acesso às suas informações. Nenhuma quilometragem será presumida.</p><button onClick={()=>setVehicleDialog({open:true})} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-slate-950"><Plus size={16}/> Adicionar veículo</button></section>}
   {pagina!=='inicio'&&requestedVehicle&&hydrated&&!loading&&entries.length>0&&!fipeEntry&&
    <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
     Este veículo não está disponível na sua garagem. Nenhum vídeo ou registro de outro carro ou moto será exibido no lugar dele.
     <Link to="/garagem" search={{pagina:'inicio'}} className="ml-2 font-black underline">Escolher veículo</Link>
    </section>}
   {pagina!=='inicio'&&!loading&&hydrated&&entries.length===0&&<section className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center text-sm text-orange-950">
    Cadastre seu primeiro veículo para acessar os serviços personalizados.
    <button type="button" onClick={()=>setVehicleDialog({open:true})} className="ml-2 font-black underline">Cadastrar veículo</button>
   </section>}
   {pagina==='fipe'&&hydrated&&!loading&&fipeEntry&&<FipeValuePanel key={fipeEntry.fipeKey} vehicleId={fipeEntry.fipeKey} kind={fipeEntry.kind} vehicleName={fipeEntry.name} brandHint={fipeEntry.brand} yearHint={fipeEntry.modelYear??undefined}/>}
   {pagina==='abastecimentos'&&hydrated&&!loading&&fipeEntry&&<VehicleFuelLedger key={'fuel:'+fipeEntry.id} vehicleId={activeLocal?.id??''} vehicleName={fipeEntry.name} currentKm={activeLocal?.currentKm??fipeEntry.km??null} kind={fipeEntry.kind}/>}
   {pagina==='revisoes'&&hydrated&&!loading&&fipeEntry&&<VehicleMaintenanceLedger key={'maintenance:'+fipeEntry.id} vehicle={{kind:fipeEntry.kind,name:fipeEntry.name,modelYear:fipeEntry.modelYear,modelKey:fipeEntry.modelKey}} vehicleId={activeLocal?.id??''} currentKm={activeLocal?.currentKm??fipeEntry.km??null}/>}
   {pagina==='videos'&&hydrated&&!loading&&fipeEntry&&<VehicleVideoLibrary key={'videos:'+fipeEntry.id} vehicle={{kind:fipeEntry.kind,name:fipeEntry.name,modelYear:fipeEntry.modelYear,modelKey:fipeEntry.modelKey}}/>}
   {pagina==='registros'&&<section id="gestao-local" className="sv-garage-manager sv-interactive-surface shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm">
    <button type="button" aria-expanded={managerOpen} onClick={()=>setManagerOpen(v=>!v)} className="sv-garage-manager-toggle flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left sm:px-5">
     <div className="flex items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700"><SlidersHorizontal size={17}/></span><div><h3 className="text-sm font-extrabold">Gerenciar registros e outros veículos</h3><p className="mt-0.5 text-[11px] leading-4 text-slate-500">Adicionar veículos, consultar registros e importar dados anteriores</p></div></div>
     <ChevronDown size={19} className={'shrink-0 text-slate-500 transition-transform '+(managerOpen?'rotate-180':'')}/>
    </button>
    {managerOpen&&<div className="sv-garage-manager-body sv-accordion-body overflow-y-auto border-t border-slate-100 p-4 sm:p-5">
      <div className="flex flex-wrap gap-2">
       <button onClick={()=>setVehicleDialog({open:true})} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-slate-950"><Plus size={15}/> Adicionar veículo</button>
       <button onClick={onImportLegacy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><Cloud size={15}/> Importar garagem anterior</button>
      </div>
      {vehicles.length>0&&<>
       <div className="mt-5 flex flex-wrap gap-2">{vehicles.map(v=><button key={v.id} onClick={()=>setSelectedId(v.id)} className={'rounded-full border px-4 py-2 text-xs font-bold '+(v.id===selected?.id?'border-slate-900 bg-slate-900 text-white':'bg-white text-slate-600 hover:bg-slate-50')}>{v.kind==='carro'?'Carro':'Moto'} · {v.name}</button>)}</div>
       {selected&&<div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
         <div className="space-y-4"><OdometerCard key={selected.id} vehicle={selected} total={totalCost(vehicleRecords)} count={vehicleRecords.length} onEdit={()=>setVehicleDialog({open:true,vehicle:selected})}/><AlertsPanel items={alerts} onQuickAdd={kind=>setRecordDialog({open:true,defaultKind:kind})}/><button onClick={()=>setRecordDialog({open:true})} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111e30] px-4 py-3 text-sm font-bold text-white"><Plus size={16}/> Registrar manutenção</button></div>
         <RecordList key={selected.id} records={vehicleRecords} onEdit={record=>setRecordDialog({open:true,record})}/>
       </div>}
      </>}
      {vehicles.length===0&&<p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">As fichas do Gol e da CB650R estão prontas para uso. Informe o km real dentro de cada painel para iniciar o histórico. Os controles gerais deste navegador aparecerão aqui quando existirem registros locais.</p>}
      <p className="mt-5 text-xs text-slate-400">Dados pessoais são isolados por conta. Fotografias dos veículos são ilustrativas e não representam suas unidades reais.</p>
    </div>}
   </section>}
   <footer className="sv-garage-footer flex shrink-0 flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500"><span>SmartVeículos · Espaço do proprietário</span><span className="max-w-[210px] truncate">{userEmail?'Conta: '+userEmail:'Dados protegidos por login'}</span><DeveloperCredit compact /></footer>
  </main>
  <VehicleDialog open={vehicleDialog.open} vehicle={vehicleDialog.vehicle} onOpenChange={open=>setVehicleDialog(v=>({...v,open}))} onSaved={id=>{setSelectedId(id);setManagerOpen(true)}}/>
  {selected&&<RecordDialog open={recordDialog.open} vehicle={selected} record={recordDialog.record} defaultKind={recordDialog.defaultKind} onOpenChange={open=>setRecordDialog(v=>({...v,open}))}/>}
 </div>;
}
