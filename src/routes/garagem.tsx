import {DeveloperCredit} from '@/components/ui/DeveloperCredit';
import {createFileRoute,Link} from '@tanstack/react-router';
import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {
 ArrowRight,Bike,CarFront,Check,ChevronDown,ClipboardList,Cloud,Coins,
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
import type {Vehicle,RecordKind,ServiceRecord} from '@/lib/garage/types';

export const Route=createFileRoute('/garagem')({
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
 photo:string;photocredit:string;source:'perfil'|'local';
};
const photoGarage='https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1800&auto=format&fit=crop&q=85';
const fallbackCar='https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&auto=format&fit=crop&q=80';
const fallbackBike='https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&auto=format&fit=crop&q=80';

function toProfile(p:CloudVehicle,local:Vehicle|undefined):PortalVehicle{
 const isGol=p.model_key==='gol-g6-selecao-2014';
 const isCb=p.model_key==='cb650r-2024';
 return {
  id:p.id,modelKey:p.model_key,kind:p.kind,name:p.display_name,
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
  <div className="absolute inset-0 bg-gradient-to-b from-[#111a2e]/10 via-[#101828]/40 to-[#07101f]/95"/>
  {!failed&&<img className="sv-card-photo absolute inset-0 h-full w-full object-cover object-center" src={vehicle.photo} onError={()=>setFailed(true)} alt={'Imagem ilustrativa do veículo '+vehicle.name} loading={index<2?'eager':'lazy'}/>}
  <div className="absolute inset-0 bg-gradient-to-t from-[#07101f] via-transparent to-[#07101f]/50"/>
  {failed&&<Icon size={100} className="absolute right-8 top-16 text-white/15"/>}
  <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
   <div className="flex items-center justify-between gap-3">
    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-white backdrop-blur"><Icon size={15}/>{vehicle.kind==='carro'?'Meu carro':'Minha moto'}</span>
    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 backdrop-blur">Ficha cadastrada</span>
   </div>
   <div>
    <h3 className="text-2xl font-black tracking-tight text-white drop-shadow sm:text-[29px]">{vehicle.name}</h3>
    <p className="mt-1 text-sm font-medium text-white/80">{vehicle.subtitle}</p>
    <div className="mt-4 flex flex-wrap gap-2">
     <Spec icon={<Gauge size={14}/>}>{vehicle.km!==null?formatKm(vehicle.km):'KM a informar'}</Spec>
     {vehicle.plate&&<Spec icon={<CarFront size={14}/>}>{vehicle.plate}</Spec>}
    </div>
    <div className="mt-5 flex items-center justify-between gap-3">
     <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#111827] shadow-lg transition group-hover:bg-orange-400">
      {vehicle.url?'Abrir painel completo':'Gerenciar veículo'}<ArrowRight size={17}/>
     </span>
     <span className="max-w-32 text-right text-[10px] leading-4 text-white/60">{vehicle.photocredit}</span>
    </div>
   </div>
  </div>
 </>;
 const cls='sv-vehicle-card sv-card-load sv-card-load--'+(index%4)+' group relative block h-[285px] w-full overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#263a56] to-[#121e2f] text-left shadow-[0_10px_35px_-15px_rgba(7,16,31,.5)] transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 sm:h-[300px] md:h-[clamp(235px,39dvh,300px)]';
 return url?<Link className={cls} to={url}>{inner}</Link>
  :<button type="button" onClick={onSelect} className={cls}>{inner}</button>;
}
function OwnerGarage(){
 const hydrated=useHydrated();
 const {vehicles,records}=useGarage();
 const [profiles,setProfiles]=useState<CloudVehicle[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [isAdmin,setIsAdmin]=useState(false);
 const [userEmail,setUserEmail]=useState('');
 const [managerOpen,setManagerOpen]=useState(false);
 const [selectedId,setSelectedId]=useState<string|null>(null);
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
  window.setTimeout(()=>document.getElementById('gestao-local')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
 };
 return <div className="min-h-screen bg-[#edf1f6] text-slate-900">
  <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur">
   <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-7">
    <div className="flex items-center gap-3"><span className="sv-logo-mark grid size-10 place-items-center rounded-xl bg-[#121d30] text-orange-400"><CarFront size={21}/></span><div><p className="text-base font-black leading-5">Smart<span className="text-orange-600">Veículos</span></p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Área do proprietário</p></div></div>
    <div className="flex flex-wrap items-center gap-2">
     <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"><Home size={15}/> <span className="hidden sm:inline">Início</span></Link>
     <a href="/meus-atendimentos" className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900 hover:bg-orange-100"><Wrench size={15}/> Meus atendimentos</a>
     {isAdmin&&<a href="/admin" className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900 hover:bg-orange-100"><ShieldCheck size={15}/> Administração</a>}
     <button type="button" onClick={()=>void logout()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#111e30] px-3 py-2 text-xs font-bold text-white hover:bg-[#24354e]"><LogOut size={15}/> Sair</button>
    </div>
   </div>
  </header>
  <main className="mx-auto max-w-7xl space-y-5 px-4 pb-10 pt-5 sm:px-7">
   <section className="sv-garage-hero relative isolate overflow-hidden rounded-[24px] bg-[#121e30] text-white shadow-xl">
    <div className="sv-garage-backdrop absolute inset-0 bg-cover bg-[center_43%] opacity-70" style={{backgroundImage:'url("'+photoGarage+'")'}} aria-hidden="true"/>
    <div className="absolute inset-0 bg-gradient-to-r from-[#0d182a] via-[#111e31]/95 to-[#111e31]/30" aria-hidden="true"/>
    <div className="relative flex min-h-[205px] flex-col justify-center gap-4 px-6 py-7 sm:px-9 lg:min-h-[clamp(165px,25dvh,216px)]">
     <div><span className="sv-intro-item sv-intro-item--1 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-orange-300"><ShieldCheck size={13}/> Sua garagem digital</span><h1 className="sv-intro-item sv-intro-item--2 mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Bem-vindo à sua <span className="text-orange-400">garagem.</span></h1><p className="sv-intro-item sv-intro-item--3 mt-2 max-w-lg text-sm leading-6 text-slate-200">Escolha seu veículo para acompanhar revisões, abastecimentos e manutenção em um painel exclusivo.</p></div>
     <div className="sv-intro-item sv-intro-item--4 flex flex-wrap items-center gap-2">
      <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">{entries.length} {entries.length===1?'veículo':'veículos'} na garagem</span>
      {needsKm>0&&<span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">{needsKm} {needsKm===1?'leitura pendente':'leituras pendentes'} de km</span>}
     </div>
    </div>
   </section>
   <div className="flex flex-wrap items-end justify-between gap-3">
    <div><p className="text-[11px] font-extrabold uppercase tracking-[.19em] text-orange-700">Meu espaço</p><h2 className="mt-1 text-2xl font-black tracking-tight text-[#111d30]">Escolha seu veículo</h2></div>
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm"><LockKeyhole size={14}/> Acesso individual e protegido</span>
   </div>
   {error&&<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button className="font-bold underline" onClick={()=>{setLoading(true);setLoadToken(n=>n+1)}}>Tentar novamente</button></div>}
   {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
   {(!hydrated||loading)&&<div aria-label="Carregando veículos" className="grid gap-4 md:grid-cols-2">{[0,1].map(i=><div key={i} className="h-[285px] animate-pulse rounded-[22px] bg-slate-200 sm:h-[300px]"/>)}</div>}
   {hydrated&&!loading&&entries.length>0&&<div className="grid gap-4 md:grid-cols-2">{entries.map((v,i)=><VehicleCard key={v.id} vehicle={v} index={i} onSelect={()=>openLocal(v.modelKey)}/>)}</div>}
   {hydrated&&!loading&&!entries.length&&<section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12"><div className="mx-auto grid size-14 place-items-center rounded-xl bg-orange-50 text-orange-600"><CarFront size={28}/></div><h3 className="mt-5 text-xl font-black">Sua garagem ainda está vazia</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Cadastre seu primeiro veículo para ter acesso às suas informações. Nenhuma quilometragem será presumida.</p><button onClick={()=>setVehicleDialog({open:true})} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-slate-950"><Plus size={16}/> Adicionar veículo</button></section>}
   {hydrated&&!loading&&entries.length>0&&<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
     <div className="flex items-center gap-2"><Check className="shrink-0 text-emerald-600" size={17}/><span>Seus modelos estão organizados por veículo. Histórico, consumo e revisões ficam nas fichas individuais.</span></div>
     <button type="button" onClick={()=>setManagerOpen(true)} className="inline-flex items-center gap-1.5 font-bold text-orange-700 hover:underline"><Settings2 size={15}/> Mais opções da garagem</button>
   </div>}
   <section id="gestao-local" className="sv-interactive-surface rounded-2xl border border-slate-200 bg-white shadow-sm">
    <button type="button" aria-expanded={managerOpen} onClick={()=>setManagerOpen(v=>!v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6">
     <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><SlidersHorizontal size={19}/></span><div><h3 className="text-sm font-extrabold">Gerenciar registros e outros veículos</h3><p className="mt-1 text-xs text-slate-500">Adicionar veículo, consultar históricos locais e importar dados antigos</p></div></div>
     <ChevronDown size={19} className={'shrink-0 text-slate-500 transition-transform '+(managerOpen?'rotate-180':'')}/>
    </button>
    {managerOpen&&<div className="sv-accordion-body border-t border-slate-100 p-5 sm:p-6">
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
   </section>
   <footer className="flex flex-wrap items-center justify-between gap-2 py-2 text-[11px] text-slate-500"><span>SmartVeículos · Espaço exclusivo do proprietário</span><span>{userEmail?'Conta: '+userEmail:'Seus dados estão protegidos por login'}</span><DeveloperCredit compact /></footer>
  </main>
  <VehicleDialog open={vehicleDialog.open} vehicle={vehicleDialog.vehicle} onOpenChange={open=>setVehicleDialog(v=>({...v,open}))} onSaved={id=>{setSelectedId(id);setManagerOpen(true)}}/>
  {selected&&<RecordDialog open={recordDialog.open} vehicle={selected} record={recordDialog.record} defaultKind={recordDialog.defaultKind} onOpenChange={open=>setRecordDialog(v=>({...v,open}))}/>}
 </div>;
}
