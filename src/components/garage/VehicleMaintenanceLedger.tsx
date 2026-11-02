import {useMemo,useState,type FormEvent} from 'react';
import {ArrowUpRight,BookOpen,CalendarClock,CheckCircle2,ClipboardCheck,Plus,Save,ShieldCheck,Wrench} from 'lucide-react';
import {garage,useGarage} from '@/lib/garage/store';
import {formatBRL,formatDate,formatKm} from '@/lib/garage/logic';
import {
 latestManualDate,maintenancePlan,nextServiceDate,revisionDescription,
 upcomingManualRevisions
} from '@/lib/garage/manual-maintenance';
import type {VideoVehicle} from '@/lib/garage/video-guides';

type Props={vehicle:VideoVehicle;vehicleId:string;currentKm?:number|null;deliveryDate?:string};
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const input='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100';
export function VehicleMaintenanceLedger({vehicle,vehicleId,currentKm=null,deliveryDate}:Props){
 const {records}=useGarage();
 const own=useMemo(()=>records.filter(r=>r.vehicleId===vehicleId).sort((a,b)=>b.date.localeCompare(a.date)||b.km-a.km),[records,vehicleId]);
 const plan=maintenancePlan(vehicle);
 const revisions=plan?upcomingManualRevisions(plan,vehicle,own,currentKm):[];
 const relevant=useMemo(()=>{
  if(currentKm===null)return revisions.slice(0,8);
  const next=revisions.findIndex(x=>!x.completed&&x.revision.km>=currentKm);
  const index=next<0?Math.max(0,revisions.length-6):Math.max(0,next-2);
  return revisions.slice(index,index+8);
 },[revisions,currentKm]);
 const latest=latestManualDate(own);
 const [expanded,setExpanded]=useState(false);
 const [selectedKm,setSelectedKm]=useState<number|null>(null);
 const [date,setDate]=useState(today());
 const [km,setKm]=useState('');
 const [cost,setCost]=useState('0');
 const [order,setOrder]=useState('');
 const [notes,setNotes]=useState('');
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const done=own.filter(x=>x.kind==='revisao').length;
 const available=expanded?revisions:relevant;
 const upcoming=revisions.find(x=>!x.completed&&(currentKm===null||x.revision.km>=currentKm))??revisions.find(x=>!x.completed);
 function start(milestone:number){
  setMessage('');setError('');setSelectedKm(milestone);
  setDate(today());setKm(currentKm===null?'':String(currentKm));setCost('0');setOrder('');setNotes('');
 }
 function save(e:FormEvent){
  e.preventDefault();
  const realKm=Number(km),amount=Number(cost);
  if(!vehicleId){setError('Ative a ficha local do veículo antes de registrar a revisão.');return;}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isSafeInteger(realKm)||
    realKm<0||realKm>9999999||!Number.isFinite(amount)||amount<0||amount>1e7){
   setError('Verifique data, quilometragem real e custo da revisão.');return;
  }
  const description=(selectedKm===null?'Revisão registrada':revisionDescription(vehicle,selectedKm))+
   (order.trim()?' | OS '+order.trim():'')+(notes.trim()?' — '+notes.trim():'');
  if(description.length>300){setError('Reduza as observações da revisão.');return;}
  if(selectedKm!==null&&revisions.find(x=>x.revision.km===selectedKm)?.completed){
   setError('Este marco já possui uma revisão registrada. Consulte o histórico antes de duplicar.');return;
  }
  try{
   garage.addRecord(vehicleId,{kind:'revisao',date,km:realKm,cost:amount,description,nextKm:null});
   setSelectedKm(null);setMessage('Revisão registrada com data, quilometragem e custo reais. Guarde o comprovante físico.');setError('');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar a revisão.');}
 }
 return <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
  <header className="flex flex-wrap items-center justify-between gap-4 bg-[#11243d] px-5 py-5 text-white sm:px-6">
   <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl border border-white/25 bg-white/10 text-orange-300 backdrop-blur-lg"><ClipboardCheck size={23}/></span>
    <div><p className="text-[10px] font-black uppercase tracking-[.17em] text-orange-300">Revisões • Histórico de manutenção</p><h2 className="mt-1 text-xl font-black">Livro digital de revisões</h2><p className="mt-1 text-xs text-slate-300">{vehicle.name}</p></div>
   </div>
   <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-slate-100">{done} revisões registradas</span>
  </header>
  <div className="space-y-4 p-4 sm:p-6">
   {message&&<p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><CheckCircle2 size={15}/>{message}</p>}
   {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}
   {plan?<div className="flex flex-wrap justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
    <div className="max-w-2xl"><p className="text-xs font-black text-orange-950">Plano de manutenção {plan.maker} · {plan.model}</p><p className="mt-1 text-xs leading-5 text-orange-950/85">{plan.notes}</p></div>
    <a href={plan.source} target="_blank" rel="noopener noreferrer" className="inline-flex h-fit shrink-0 items-center gap-2 rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs font-black text-orange-800 hover:bg-orange-100"><BookOpen size={15}/>{plan.sourceLabel}<ArrowUpRight size={14}/></a>
   </div>:<p className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-900">O cronograma de fábrica deste modelo ainda não foi validado por manual e versão. Registre serviços reais abaixo; não serão criados prazos genéricos que possam estar incorretos.</p>}
   {plan&&<div className="grid gap-2 sm:grid-cols-3">
    <div className="rounded-xl border bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">Próximo marco a conferir</p><p className="mt-1 text-lg font-black text-slate-900">{upcoming?formatKm(upcoming.revision.km):'—'}</p><p className="mt-1 text-[11px] text-slate-500">Não considera revisões sem comprovante</p></div>
    <div className="rounded-xl border bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">Última revisão informada</p><p className="mt-1 text-lg font-black text-slate-900">{latest?formatDate(latest):'Sem registros'}</p></div>
    <div className="rounded-xl border bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">Próxima referência de data</p><p className="mt-1 text-lg font-black text-slate-900">{vehicle.kind==='moto'&&deliveryDate&&upcoming?formatDate(nextServiceDate(deliveryDate,upcoming.revision.months)??'') :vehicle.kind==='carro'&&latest?formatDate(nextServiceDate(latest,6)??''):'Não informada'}</p><p className="mt-1 text-[11px] text-slate-500">Estimativa; confirme no manual</p></div>
   </div>}
   {plan&&<div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black text-slate-900">Cronograma por quilometragem e prazo</h3><button type="button" onClick={()=>setExpanded(v=>!v)} className="text-xs font-black text-orange-700 hover:underline">{expanded?'Ver marcos próximos':'Ver todos os marcos'}</button></div>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{available.map(({revision,completed,remainingKm})=><article key={revision.km} className={'rounded-xl border p-3 '+(completed?'border-emerald-200 bg-emerald-50/55':'border-slate-200 bg-[#f8fafc]')}>
     <div className="flex flex-wrap items-center justify-between gap-1"><p className="text-xs font-black text-slate-800">{revision.label}</p><span className={'rounded-full px-2 py-1 text-[10px] font-black '+(completed?'bg-emerald-100 text-emerald-800':remainingKm!==null&&remainingKm<=0?'bg-amber-100 text-amber-900':'bg-slate-200 text-slate-700')}>{completed?'Registrada':remainingKm!==null&&remainingKm<=0?'Conferir histórico':'A conferir'}</span></div>
     <p className="mt-2 text-lg font-black text-slate-900">{formatKm(revision.km)}</p><p className="mt-1 text-[11px] text-slate-600">Ou {revision.months} meses desde a entrega{vehicle.kind==='carro'?' (referência)': ''}</p>
     {!completed&&<button type="button" onClick={()=>start(revision.km)} disabled={!vehicleId} className="mt-3 w-full rounded-lg border border-orange-200 bg-white px-2 py-2 text-xs font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-40"><Plus size={13} className="mr-1 inline"/> Registrar revisão feita</button>}
    </article>)}</div>
   </div>}
   {!plan&&<button type="button" onClick={()=>start(0)} disabled={!vehicleId} className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2 text-xs font-bold text-orange-800 disabled:opacity-50"><Plus size={15}/> Registrar revisão realizada</button>}
   {selectedKm!==null&&<form onSubmit={save} className="grid gap-3 rounded-xl border border-orange-200 bg-orange-50/65 p-4 sm:grid-cols-2 lg:grid-cols-4">
    <h3 className="text-sm font-black text-slate-900 sm:col-span-2 lg:col-span-4">Registrar revisão já realizada {selectedKm>0?'· '+formatKm(selectedKm):''}</h3>
    <label className="grid gap-1 text-xs font-bold text-slate-700">Data real<input type="date" required className={input} value={date} onChange={e=>setDate(e.target.value)}/></label>
    <label className="grid gap-1 text-xs font-bold text-slate-700">Odômetro real (km)<input type="number" required min="0" max="9999999" className={input} value={km} onChange={e=>setKm(e.target.value)}/></label>
    <label className="grid gap-1 text-xs font-bold text-slate-700">Custo total (R$)<input type="number" required min="0" step="0.01" className={input} value={cost} onChange={e=>setCost(e.target.value)}/></label>
    <label className="grid gap-1 text-xs font-bold text-slate-700">Ordem de serviço (opcional)<input className={input} value={order} maxLength={50} onChange={e=>setOrder(e.target.value)}/></label>
    <label className="grid gap-1 text-xs font-bold text-slate-700 sm:col-span-2 lg:col-span-4">Serviços realizados / comprovante<input className={input} value={notes} maxLength={130} onChange={e=>setNotes(e.target.value)} placeholder="Ex.: troca óleo, filtro, inspeções, oficina"/></label>
    <div className="flex flex-wrap justify-end gap-2 sm:col-span-2 lg:col-span-4"><button type="button" onClick={()=>setSelectedKm(null)} className="rounded-xl border bg-white px-4 py-2.5 text-xs font-bold">Cancelar</button><button className="inline-flex items-center gap-2 rounded-xl bg-[#12243d] px-4 py-2.5 text-xs font-bold text-white"><Save size={15}/> Salvar revisão</button></div>
   </form>}
   <div className="rounded-xl border border-slate-200">
    <h3 className="border-b bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">Histórico real de serviços</h3>
    {own.length?<div className="max-h-72 divide-y overflow-auto">{own.slice(0,30).map(r=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-xs font-bold text-slate-900">{r.description}</p><p className="mt-1 text-[11px] text-slate-600">{formatDate(r.date)} · {formatKm(r.km)} · {r.kind==='revisao'?'Revisão':'Manutenção'}</p></div><strong className="text-sm text-slate-900">{formatBRL(r.cost)}</strong></div>)}</div>:<p className="p-5 text-sm text-slate-500">Nenhuma revisão ou manutenção registrada. Não marcamos nenhuma etapa como concluída automaticamente.</p>}
   </div>
   <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0"/> O livro digital não substitui carimbos de concessionária, nota fiscal ou diagnóstico técnico. Os dados são pessoais e precisam ser confirmados pelo proprietário.</p>
  </div>
 </section>;
}
