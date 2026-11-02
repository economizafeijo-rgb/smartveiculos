import {useMemo,useState,type FormEvent} from 'react';
import {servicesForRevision} from '@/lib/garage/manufacturer-service-guide';
import {readRevisionChecks,writeRevisionChecks} from '@/lib/garage/revision-checks';
import {
 ArrowUpRight,BookOpen,CalendarClock,CheckCircle2,ChevronDown,ChevronUp,
 ClipboardCheck,ClipboardList,Gauge,PenLine,Plus,Save,Search,ShieldCheck,Trash2,Wrench
} from 'lucide-react';
import {garage,useGarage} from '@/lib/garage/store';
import {formatBRL,formatDate,formatKm} from '@/lib/garage/logic';
import {recordInputSchema,type RecordInput,type ServiceRecord} from '@/lib/garage/types';
import {
 maintenancePlan,nextServiceDate,revisionDescription,
 revisionsAroundOdometer,nextRevisionsForOdometer
} from '@/lib/garage/manual-maintenance';
import {CB650R_NAME} from '@/lib/garage/cb650r-reference';
import {GOL} from '@/lib/garage/gol-reference';
import {
 buildMaintenanceDescription,itemForVehicle,maintenanceItems,MAINTENANCE_GROUPS,
 maintenanceTotals,parseMaintenanceDescription
} from '@/lib/garage/maintenance-catalog';
import type {VideoVehicle} from '@/lib/garage/video-guides';

type Props={vehicle:VideoVehicle;vehicleId:string;currentKm?:number|null;deliveryDate?:string};
type Mode='servico'|'revisao';
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const input='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100';
const label='grid min-w-0 gap-1.5 text-xs font-bold text-slate-700';
const parseMoney=(s:string)=>Number(s.trim().replace(',','.'));
const dateValid=(s:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const d=new Date(s+'T00:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s;
};
const maxStr=(value:string,count:number)=>value.trim().slice(0,count);
const extractCost=(text:string)=>{const n=parseMoney(text);return Number.isFinite(n)&&n>=0?n:0;};
function initialForm(kind:'carro'|'moto',current:number|null){
 return {
  itemId:'oil',date:today(),km:current===null?'':String(current),
  partBrand:'',partCode:'',quantity:'',workshop:'',invoice:'',notes:'',
  partsCost:'0',laborCost:'0',nextKm:''
 };
}
export function VehicleMaintenanceLedger({vehicle,vehicleId,currentKm=null,deliveryDate}:Props){
 const {vehicles,records}=useGarage();
 const local=vehicles.find(v=>v.id===vehicleId);
 const effectiveKm=local?.currentKm??currentKm;
 const own=useMemo(()=>records.filter(r=>r.vehicleId===vehicleId)
  .sort((a,b)=>b.date.localeCompare(a.date)||b.km-a.km),[records,vehicleId]);
 const plan=maintenancePlan(vehicle);
 const items=useMemo(()=>maintenanceItems(vehicle.kind),[vehicle.kind]);
 const [kmDraft,setKmDraft]=useState(currentKm===null?'':String(currentKm));
 const [kmEditing,setKmEditing]=useState(false);
 const [expanded,setExpanded]=useState(false);
 const [guideKm,setGuideKm]=useState<number|null>(null);
 const [checkedTasks,setCheckedTasks]=useState<string[]>([]);
 const [mode,setMode]=useState<Mode|null>(null);
 const [milestone,setMilestone]=useState<number|null>(null);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [form,setForm]=useState(()=>initialForm(vehicle.kind,effectiveKm));
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('todos');
 const [year,setYear]=useState('todos');
 const [showAll,setShowAll]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const reviewEntries=plan?revisionsAroundOdometer(plan,vehicle,own,effectiveKm,expanded):[];
 const guide=guideKm===null?null:servicesForRevision(vehicle,guideKm);
 const checkedCount=guide?guide.items.filter(x=>checkedTasks.includes(x.id)).length:0;
 const nextReview=plan?nextRevisionsForOdometer(plan,vehicle,own,effectiveKm):null;
 const lastReview=own.filter(x=>x.kind==='revisao').sort((a,b)=>b.date.localeCompare(a.date))[0];
 const totals=maintenanceTotals(own);
 const overall=own.reduce((sum,x)=>sum+x.cost,0);
 const years=[...new Set(own.map(r=>r.date.slice(0,4)))].sort((a,b)=>b.localeCompare(a));
 const filtered=own.filter(r=>{
  const term=search.toLocaleLowerCase('pt-BR').trim();
  return (category==='todos'||r.kind===category)
   &&(year==='todos'||r.date.startsWith(year))
   &&(!term||[r.description,r.date,String(r.km)].some(x=>x.toLocaleLowerCase('pt-BR').includes(term)));
 });
 const visible=showAll?filtered:filtered.slice(0,6);
 const chosen=itemForVehicle(vehicle.kind,form.itemId)??items[0];
 const parts=parseMoney(form.partsCost),labor=parseMoney(form.laborCost);
 const total=Number.isFinite(parts)&&Number.isFinite(labor)?parts+labor:null;
 const currentId=vehicleId;
 function reset(){
  setMode(null);setMilestone(null);setEditingId(null);
  setForm(initialForm(vehicle.kind,effectiveKm));setError('');
 }
 function startService(itemId='oil'){
  setForm({...initialForm(vehicle.kind,effectiveKm),itemId});
  setMode('servico');setMilestone(null);setEditingId(null);setError('');setNotice('');
 }
 function openGuide(km:number){
  if(guideKm===km){setGuideKm(null);return;}
  setGuideKm(km);setCheckedTasks(readRevisionChecks(vehicleId,km));
 }
 function toggleGuideTask(id:string){
  if(guideKm===null)return;
  const next=checkedTasks.includes(id)?checkedTasks.filter(item=>item!==id):[...checkedTasks,id];
  setCheckedTasks(next);writeRevisionChecks(vehicleId,guideKm,next);
 }
 function startReview(km:number){
  setForm(initialForm(vehicle.kind,effectiveKm));setMode('revisao');setMilestone(km);
  setEditingId(null);setError('');setNotice('');
 }
 function edit(record:ServiceRecord){
  const fields=parseMaintenanceDescription(record.description);
  const item=items.find(x=>x.label===fields['Serviço']);
  if(!item)return;
  setForm({
   itemId:item.id,date:record.date,km:String(record.km),
   partBrand:fields['Marca']??'',partCode:fields['Peça']??'',quantity:fields['Qtde']??'',
   workshop:fields['Oficina']??'',invoice:fields['OS/NF']??'',
   notes:fields['Obs']??'',partsCost:fields['Peças R$']??String(record.cost),
   laborCost:fields['MO R$']??'0',nextKm:record.nextKm===null?'':String(record.nextKm)
  });
  setEditingId(record.id);setMode('servico');setMilestone(null);setError('');setNotice('');
 }
 function saveKm(e:FormEvent){
  e.preventDefault();setError('');setNotice('');
  const value=Number(kmDraft);
  if(!kmDraft.trim()||!Number.isSafeInteger(value)||value<0||value>9_999_999){
   setError('Informe a quilometragem verdadeira do painel, entre 0 e 9.999.999 km.');return;
  }
  if(local&&value<local.currentKm&&!window.confirm('A nova quilometragem é menor que a atual. Confirma que esta é uma correção do odômetro? Os registros antigos serão mantidos.'))return;
  try{
   if(local)garage.setKm(local.id,value);
   else{
    // Perfis pré-cadastrados precisam de uma ficha local para registrar dados.
    const name=vehicle.modelKey==='gol-g6-selecao-2014'?GOL.name:
      vehicle.modelKey==='cb650r-2024'?CB650R_NAME:vehicle.name;
    garage.addVehicle({kind:vehicle.kind,name,plate:'',currentKm:value});
   }
   setKmEditing(false);setNotice('Quilometragem atualizada. O cronograma agora considera '+formatKm(value)+'. Nenhuma revisão antiga foi marcada como feita.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a quilometragem.');}
 }
 function saveService(e:FormEvent){
  e.preventDefault();setError('');setNotice('');
  if(!currentId){setError('Informe e salve primeiro a quilometragem atual para ativar a ficha do veículo.');return;}
  const realKm=Number(form.km),next=form.nextKm.trim()===''?null:Number(form.nextKm);
  if(!dateValid(form.date)||form.date>today()||!form.km.trim()||!Number.isSafeInteger(realKm)||realKm<0||realKm>9_999_999){
   setError('Confira a data real (não futura) e a quilometragem registrada no serviço.');return;
  }
  if(total===null||parts<0||labor<0||parts>10_000_000||labor>10_000_000){
   setError('Informe custos válidos em reais. Use vírgula ou ponto decimal.');return;
  }
  if(next!==null&&(!Number.isSafeInteger(next)||next<=realKm||next>9_999_999)){
   setError('O próximo lembrete precisa ser uma quilometragem maior que a do serviço.');return;
  }
  const item=chosen;
  if(mode==='servico'&&!item){setError('Selecione o serviço realizado.');return;}
  const description=mode==='revisao'
   ?(milestone===null||milestone===0?'Revisão registrada':revisionDescription(vehicle,milestone))
     +(form.invoice.trim()?' | OS '+maxStr(form.invoice,30):'')
     +(form.notes.trim()?' — '+maxStr(form.notes,130):'')
   :buildMaintenanceDescription({
    item:item!,partBrand:maxStr(form.partBrand,42),partCode:maxStr(form.partCode,32),
    quantity:maxStr(form.quantity,15),workshop:maxStr(form.workshop,50),
    invoice:maxStr(form.invoice,30),notes:maxStr(form.notes,120),
    partsCost:form.partsCost.trim(),laborCost:form.laborCost.trim(),
   });
  if(description.length>300){setError('As informações ultrapassam 300 caracteres. Reduza as observações ou os campos de identificação.');return;}
  const parsed=recordInputSchema.safeParse({
   kind:mode==='revisao'?'revisao':item?.kind??'manutencao',
   date:form.date,km:realKm,cost:Math.round(total*100)/100,
   description,nextKm:next
  });
  if(!parsed.success){setError(parsed.error.issues[0]?.message??'Dados inválidos.');return;}
  if(mode==='revisao'&&milestone!==null&&own.some(r=>r.kind==='revisao'&&r.description.startsWith(revisionDescription(vehicle,milestone)))){
   setError('Essa revisão já foi registrada. Consulte o histórico antes de duplicar.');return;
  }
  try{
   if(editingId)garage.updateRecord(editingId,parsed.data);
   else garage.addRecord(currentId,parsed.data);
   const action=editingId?'atualizado':'salvo';
   reset();setNotice('Serviço '+action+' no histórico do '+(vehicle.kind==='carro'?'carro':'moto')+'. O valor gasto foi registrado.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar o serviço.');}
 }
 function deleteRecord(record:ServiceRecord){
  if(!window.confirm('Excluir permanentemente este registro de '+formatDate(record.date)+'?'))return;
  try{garage.removeRecord(record.id);setNotice('Registro excluído.');setError('');if(editingId===record.id)reset();}
  catch(e){setError(e instanceof Error?e.message:'Erro ao excluir registro.');}
 }
 const quick=vehicle.kind==='carro'?['oil','oil-filter','air-filter','tires','brake-pads','spark','injectors']:
  ['oil','oil-filter','chain-care','chain-kit','front-tire','front-pads','spark'];
 return <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
  <header className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-[#11243d] to-[#284868] px-5 py-5 text-white sm:px-6">
   <div className="flex items-center gap-3">
    <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/25 bg-white/10 text-orange-300 backdrop-blur-lg"><ClipboardCheck size={23}/></span>
    <div><p className="text-[10px] font-black uppercase tracking-[.17em] text-orange-300">Revisões e manutenção · {vehicle.kind==='carro'?'Automóvel':'Motocicleta'}</p>
     <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Livro digital de serviços</h2>
     <p className="mt-1 text-xs text-slate-200">{vehicle.name}</p>
    </div>
   </div>
   <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">{own.length} serviços registrados</span>
  </header>
  <div className="space-y-5 p-4 sm:p-6">
   {notice&&<p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><CheckCircle2 size={16} className="shrink-0"/>{notice}</p>}
   {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}
   <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-center gap-3">
     <span className="grid size-10 place-items-center rounded-xl bg-[#122942] text-orange-300"><Gauge size={20}/></span>
     <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Quilometragem real</p>
      <strong className="mt-1 block text-xl font-black text-[#13253e]">{effectiveKm===null?'Não informada':formatKm(effectiveKm)}</strong>
     </div>
    </div>
    <button type="button" onClick={()=>{setKmEditing(v=>!v);setKmDraft(effectiveKm===null?'':String(effectiveKm));setError('')}}
     className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-xs font-black text-orange-800 hover:bg-orange-50"><PenLine size={15}/>{local?'Ajustar quilometragem':'Informar KM / ativar ficha'}</button>
    {kmEditing&&<form onSubmit={saveKm} className="flex w-full flex-wrap items-end gap-3 border-t border-slate-200 pt-4">
     <label className={label+' min-w-[170px] flex-1'}>KM atual do painel
      <input autoFocus type="number" min="0" max="9999999" step="1" className={input} value={kmDraft} onChange={e=>setKmDraft(e.target.value)} placeholder="Ex.: 178500" required/>
     </label>
     <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#132943] px-4 py-3 text-xs font-black text-white"><Save size={15}/> Salvar quilometragem</button>
     <p className="w-full text-[11px] leading-5 text-slate-500">Veículos usados podem começar com qualquer KM real, inclusive acima de 300 mil. Atualizar o odômetro não cria revisões fictícias e não altera o histórico.</p>
    </form>}
   </div>
   <div className="grid gap-3 sm:grid-cols-3">
    <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-bold text-slate-500">Gasto total em manutenção</p><p className="mt-2 text-xl font-black text-[#152740]">{formatBRL(overall)}</p></div>
    <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-bold text-slate-500">Serviços realizados</p><p className="mt-2 text-xl font-black text-[#152740]">{own.length}</p></div>
    <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-bold text-slate-500">Próximo marco a consultar</p><p className="mt-2 text-xl font-black text-[#152740]">{nextReview?formatKm(nextReview.revision.km):'—'}</p></div>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-[#fff8ed] p-4">
    <div><h3 className="text-sm font-black text-slate-900">Registrar manutenção realizada</h3><p className="mt-1 text-xs leading-5 text-slate-600">Óleo, filtros, pneus, freios, ignição, peças, transmissão e muito mais.</p></div>
    <button type="button" onClick={()=>mode==='servico'?reset():startService()}
     className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-slate-950 hover:bg-orange-400"><Plus size={17}/>{mode==='servico'?'Fechar formulário':'Novo serviço'}</button>
    <div className="flex w-full flex-wrap gap-2 border-t border-orange-200/75 pt-3">
     {quick.map(id=>{const item=itemForVehicle(vehicle.kind,id);return item?<button key={id} type="button" onClick={()=>startService(id)}
      className="rounded-full border border-orange-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-800 hover:border-orange-400 hover:bg-orange-50">{item.label}</button>:null;})}
    </div>
   </div>
   {mode!==null&&<form onSubmit={saveService} className="space-y-4 rounded-2xl border border-orange-200 bg-orange-50/55 p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black text-[#142743]">{mode==='revisao'?'Registrar revisão concluída':'Detalhes do serviço realizado'}</h3>
     <button type="button" onClick={reset} className="text-xs font-bold text-slate-600 hover:text-orange-700">Cancelar</button></div>
    {mode==='servico'&&<label className={label}>Peça ou tipo de manutenção
     <select className={input} value={form.itemId} onChange={e=>setForm(v=>({...v,itemId:e.target.value}))} required>
      {MAINTENANCE_GROUPS.map(group=><optgroup key={group} label={group}>
       {items.filter(x=>x.group===group).map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
      </optgroup>)}
     </select>
     {chosen?.advice&&<span className="text-[11px] font-normal text-amber-800">{chosen.advice}</span>}
    </label>}
    {mode==='revisao'&&<p className="rounded-xl border border-orange-200 bg-white p-3 text-xs text-slate-700">Marco do manual: <strong>{milestone===0?'Revisão personalizada':formatKm(milestone??0)}</strong>. Só registre se a revisão foi realmente realizada.</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
     <label className={label}>Data do serviço<input type="date" max={today()} required className={input} value={form.date} onChange={e=>setForm(v=>({...v,date:e.target.value}))}/></label>
     <label className={label}>KM no momento do serviço<input type="number" min="0" max="9999999" step="1" required className={input} value={form.km} onChange={e=>setForm(v=>({...v,km:e.target.value}))} placeholder="Ex.: 165000"/></label>
     <label className={label}>Valor das peças (R$)<input inputMode="decimal" className={input} value={form.partsCost} onChange={e=>setForm(v=>({...v,partsCost:e.target.value}))} placeholder="Ex.: 180,00"/></label>
     <label className={label}>Mão de obra (R$)<input inputMode="decimal" className={input} value={form.laborCost} onChange={e=>setForm(v=>({...v,laborCost:e.target.value}))} placeholder="Ex.: 120,00"/></label>
     {mode==='servico'&&<>
      <label className={label}>Marca / fabricante<input maxLength={42} className={input} value={form.partBrand} onChange={e=>setForm(v=>({...v,partBrand:e.target.value}))} placeholder="Ex.: Bosch, NGK, Motul"/></label>
      <label className={label}>Código da peça<input maxLength={32} className={input} value={form.partCode} onChange={e=>setForm(v=>({...v,partCode:e.target.value}))} placeholder="Referência ou modelo"/></label>
      <label className={label}>Quantidade / medida<input maxLength={15} className={input} value={form.quantity} onChange={e=>setForm(v=>({...v,quantity:e.target.value}))} placeholder="Ex.: 4 L, 2 un." /></label>
      <label className={label}>Oficina / mecânico<input maxLength={50} className={input} value={form.workshop} onChange={e=>setForm(v=>({...v,workshop:e.target.value}))} placeholder="Ex.: oficina autorizada"/></label>
     </>}
     <label className={label}>Ordem de serviço / nota fiscal<input maxLength={30} className={input} value={form.invoice} onChange={e=>setForm(v=>({...v,invoice:e.target.value}))} placeholder="Número do comprovante"/></label>
     {mode==='servico'&&<label className={label}>Próximo lembrete (km, opcional)<input type="number" min="1" max="9999999" step="1" className={input} value={form.nextKm} onChange={e=>setForm(v=>({...v,nextKm:e.target.value}))} placeholder="Definido pelo manual"/></label>}
     <label className={label+' sm:col-span-2 lg:col-span-4'}>Observações e peças utilizadas
      <textarea rows={2} maxLength={120} className={input} value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))} placeholder="Sintoma, diagnóstico, peças substituídas e serviços executados"/>
     </label>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-orange-200 pt-3">
     <div><p className="text-[11px] font-bold text-slate-600">Total calculado</p><p className="text-xl font-black text-orange-800">{total===null?'Confira os valores':formatBRL(total)}</p></div>
     <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#122842] px-5 py-3 text-xs font-black text-white hover:bg-[#223e62]"><Save size={16}/>{editingId?'Salvar alterações':'Salvar no histórico'}</button>
    </div>
   </form>}
   {plan?<div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div><h3 className="text-base font-black text-slate-900">Cronograma por quilometragem e prazo</h3>
      <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500">{plan.notes}</p></div>
     <a href={plan.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:underline"><BookOpen size={15}/>{plan.sourceLabel}<ArrowUpRight size={14}/></a>
    </div>
    {effectiveKm!==null&&effectiveKm>0&&<p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">Cronograma adaptado a <strong>{formatKm(effectiveKm)}</strong>. Marcos anteriores sem registros não aparecem como concluídos nem como serviços obrigatoriamente atrasados. Consulte o histórico anterior do veículo.</p>}
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
     <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">Próxima revisão a conferir</p><p className="mt-1 text-lg font-black text-slate-900">{nextReview?formatKm(nextReview.revision.km):'—'}</p></div>
     <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">Última revisão registrada</p><p className="mt-1 text-lg font-black text-slate-900">{lastReview?formatDate(lastReview.date):'Não informada'}</p></div>
     <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">Referência por data</p><p className="mt-1 text-lg font-black text-slate-900">{deliveryDate&&nextReview?formatDate(nextServiceDate(deliveryDate,nextReview.revision.months)??''):'Depende da entrega'}</p><p className="text-[10px] text-slate-500">O prazo depende da data de entrega e do histórico.</p></div>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
     <h4 className="text-sm font-black text-slate-900">Marcos relevantes para esta quilometragem</h4>
     <button type="button" onClick={()=>setExpanded(v=>!v)} className="inline-flex items-center gap-1.5 text-xs font-black text-orange-700 hover:underline">{expanded?'Ver marcos próximos':'Ver mais marcos'}{expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{reviewEntries.map(({revision,completed,remainingKm})=>{
     const past=remainingKm!==null&&remainingKm<0;
     return <article key={revision.km} className={'rounded-xl border p-3 '+(completed?'border-emerald-200 bg-emerald-50':'border-slate-200 bg-[#f8fafc]')}>
      <div className="flex flex-wrap items-center justify-between gap-1"><p className="text-xs font-black text-slate-900">{revision.label}</p><span className={'rounded-full px-2 py-1 text-[10px] font-extrabold '+(completed?'bg-emerald-100 text-emerald-800':past?'bg-slate-200 text-slate-700':'bg-orange-100 text-orange-800')}>{completed?'Registrada':past?'Histórico a conferir':'Programada'}</span></div>
      <p className="mt-2 text-lg font-black text-[#142741]">{formatKm(revision.km)}</p>
      <p className="mt-1 text-[11px] text-slate-500">{revision.months} meses de referência desde a entrega</p>
      <button type="button" onClick={()=>openGuide(revision.km)} aria-expanded={guideKm===revision.km}
       className={'mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-extrabold transition-colors '+(guideKm===revision.km?'bg-[#122842] text-white':'border border-[#b9cde4] bg-white text-[#152c48] hover:border-orange-400 hover:bg-orange-50')}>
       <BookOpen size={13}/> O que a montadora recomenda {guideKm===revision.km?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
      </button>
      {!completed&&<button type="button" onClick={()=>startReview(revision.km)} className="mt-2 w-full rounded-lg border border-orange-200 bg-white px-2 py-2 text-[11px] font-bold text-orange-800 hover:bg-orange-50"><Plus size={12} className="mr-1 inline"/>Registrar revisão realizada</button>}
     </article>;
    })}</div>
    {guide&&<section id="revision-manual-detail" aria-label={'Recomendações da montadora aos '+guideKm+' km'}
     className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc]">
     <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-[#152c47] p-4 text-white sm:p-5">
      <div className="max-w-3xl">
       <p className="text-[10px] font-black uppercase tracking-[.17em] text-orange-300">Guia de manutenção pesquisado • {guide.manufacturer}</p>
       <h4 className="mt-1 text-lg font-black text-white">Revisão de {formatKm(guide.revisionKm)}: o que conferir?</h4>
       <p className="mt-1 text-xs leading-5 text-slate-200">{guide.model} · {guide.level==='especifico'?'Informações da tabela oficial para este modelo e ano':'Orientações gerais; lista exata ainda não confirmada pelo chassi'}</p>
      </div>
      <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
       onClick={()=>setGuideKm(null)}>Fechar <ChevronUp size={14}/></button>
     </header>
     <div className="space-y-4 p-4 sm:p-5">
      <div className={'rounded-xl border p-3 text-xs leading-6 '+(guide.level==='especifico'?'border-blue-200 bg-blue-50 text-blue-900':'border-amber-300 bg-amber-50 text-amber-950')}>
       <strong>{guide.level==='especifico'?'Manual específico confirmado. ':'Orientações gerais — confirmação necessária. '}</strong>{guide.notice}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div><h5 className="text-sm font-black text-slate-900">Lista de serviços e verificações</h5>
        <p className="mt-1 text-[11px] leading-5 text-slate-600">{guide.items.length} orientações · {checkedCount} conferidas neste navegador. Conferir não é o mesmo que executar.</p></div>
       <a href={guide.source} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-50">
        <BookOpen size={15}/> Consultar fonte da montadora <ArrowUpRight size={13}/>
       </a>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
       {guide.items.map(item=><label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-orange-300">
        <input type="checkbox" className="mt-1.5 size-4 shrink-0 accent-orange-600"
         aria-label={'Conferido pelo cliente: '+item.title}
         checked={checkedTasks.includes(item.id)}
         disabled={!vehicleId}
         onChange={()=>toggleGuideTask(item.id)}/>
        <span className="min-w-0 flex-1">
         <span className="flex flex-wrap items-center gap-2">
          <strong className="text-xs font-black text-slate-900">{item.title}</strong>
          <span className={'rounded-full px-2 py-0.5 text-[10px] font-extrabold '+(item.action==='trocar'?'bg-orange-100 text-orange-900':item.action==='ajustar'?'bg-sky-100 text-sky-900':item.action==='condicional'?'bg-amber-100 text-amber-900':'bg-slate-100 text-slate-700')}>
           {item.action==='trocar'?'Substituição':item.action==='ajustar'?'Verificar/ajustar':item.action==='condicional'?'Se necessário':'Inspeção'}
          </span>
         </span>
         <span className="mt-1 block text-[11px] font-bold text-slate-600">{item.interval} · {item.page}</span>
         <span className="mt-1 block text-xs leading-5 text-slate-600">{item.why}</span>
        </span>
       </label>)}
      </div>
      {guide.timeItems.length>0&&<div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
       <h5 className="text-sm font-black text-blue-900">Atenção aos prazos por tempo — mesmo rodando pouco</h5>
       <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {guide.timeItems.map(item=><div key={item.id} className="rounded-lg border border-blue-100 bg-white p-3">
         <p className="text-xs font-black text-slate-900">{item.title}</p>
         <p className="mt-1 text-xs font-bold text-orange-800">{item.interval}</p>
         <p className="mt-1 text-[11px] leading-5 text-slate-600">{item.why}</p>
        </div>)}
       </div>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
       <p className="max-w-xl text-[11px] leading-5 text-slate-600">A marcação apenas acompanha sua conferência. Ela não altera a quilometragem, não conclui uma revisão e não substitui nota fiscal ou carimbo. A revisão só será considerada realizada depois do registro no livro digital.</p>
       <button type="button" onClick={()=>startReview(guide.revisionKm)}
        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-[#15283e] hover:bg-orange-400">
        <Plus size={15}/> Registrar revisão realmente realizada
       </button>
      </div>
     </div>
    </section>}
   </div>:<p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">Para este modelo ainda não há um plano de fábrica verificado. Você pode registrar serviços reais normalmente, sem prazos inventados.</p>}
   <section className="overflow-hidden rounded-2xl border border-slate-200">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-[#f8fafc] px-4 py-3">
     <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><ClipboardList size={17} className="text-orange-600"/> Histórico de revisões, trocas e reparos</h3>
     <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-700">{filtered.length} registros</span>
    </div>
    <div className="grid gap-2 border-b p-3 sm:grid-cols-[1fr_auto_auto]">
     <label className="relative"><span className="sr-only">Pesquisar manutenção</span><Search size={15} className="absolute left-3 top-3 text-slate-500"/><input placeholder="Buscar peça, serviço ou oficina" value={search} onChange={e=>setSearch(e.target.value)} className={input+' pl-9'}/></label>
     <label className="text-xs font-semibold text-slate-700">Categoria
      <select className={input} value={category} onChange={e=>setCategory(e.target.value)}><option value="todos">Todos os serviços</option><option value="oleo">Óleo</option><option value="peca">Peças</option><option value="manutencao">Manutenções</option><option value="revisao">Revisões</option></select>
     </label>
     <label className="text-xs font-semibold text-slate-700">Ano
      <select className={input} value={year} onChange={e=>setYear(e.target.value)}><option value="todos">Todos os anos</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
     </label>
    </div>
    {visible.length?<div className="divide-y divide-slate-100">{visible.map(record=>{
     const fields=parseMaintenanceDescription(record.description);
     const canEdit=Boolean(fields['Serviço']);
     return <article key={record.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
       <p className="text-xs font-black text-slate-900">{fields['Serviço']??(record.kind==='revisao'?'Revisão':record.description)}</p>
       <p className="mt-1 text-[11px] font-semibold text-slate-500">{formatDate(record.date)} · {formatKm(record.km)} · {record.kind==='revisao'?'Revisão':record.kind==='oleo'?'Óleo':record.kind==='peca'?'Peças':'Manutenção'}</p>
       {fields['Serviço']&&<p className="mt-2 break-words text-[11px] leading-5 text-slate-600">{record.description}</p>}
       {record.nextKm!==null&&<p className="mt-1 text-[11px] font-bold text-orange-700">Lembrete definido: {formatKm(record.nextKm)}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
       <strong className="text-sm font-black text-slate-900">{formatBRL(record.cost)}</strong>
       {canEdit&&<button type="button" onClick={()=>edit(record)} aria-label={'Editar '+record.description.slice(0,50)} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"><PenLine size={15}/></button>}
       <button type="button" onClick={()=>deleteRecord(record)} aria-label={'Excluir registro de '+formatDate(record.date)} className="rounded-lg border border-red-100 p-2 text-red-700 hover:bg-red-50"><Trash2 size={15}/></button>
      </div>
     </article>;
    })}</div>:<p className="p-6 text-center text-sm text-slate-600">Nenhum serviço registrado para este veículo ou filtro.</p>}
    {filtered.length>6&&<button type="button" onClick={()=>setShowAll(v=>!v)} className="w-full border-t bg-slate-50 p-3 text-xs font-extrabold text-orange-700">{showAll?'Mostrar apenas os recentes':'Ver histórico completo ('+filtered.length+')'}</button>}
   </section>
   {totals.length>0&&<div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
    <h3 className="text-sm font-black text-slate-900">Despesas com manutenção por ano</h3>
    <div className="mt-3 flex flex-wrap gap-2">{totals.map(t=><span key={t.year} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"><strong className="block text-slate-700">{t.year}</strong><span className="mt-1 block font-black text-slate-900">{formatBRL(t.total)}</span><span className="text-slate-500">{t.count} serviços</span></span>)}</div>
   </div>}
   <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck size={16} className="mt-0.5 shrink-0"/> Os registros são separados por veículo e salvos no histórico local protegido da conta. O backup em nuvem permanece manual. Cronogramas são referências: confirme peças, prazo e procedimentos no manual da montadora e por chassi.</p>
  </div>
 </section>;
}
