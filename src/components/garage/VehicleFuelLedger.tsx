import {useMemo,useState,type FormEvent} from 'react';
import {BarChart3,CalendarDays,CheckCircle2,ChevronLeft,ChevronRight,Droplets,Fuel,PenLine,Plus,Save,Search,Trash2,TrendingUp} from 'lucide-react';
import {
 addFillup,calculateFuelStats,removeFillup,updateFillup,useFillups,type Fillup,type FuelKind
} from '@/lib/garage/fuel';
import {
 fuelCost,groupFuel,toFuelLiters,toFuelMoney,totalFuel,type FuelPeriod
} from '@/lib/garage/fuel-analytics';
import {garage} from '@/lib/garage/store';

type Props={vehicleId:string;vehicleName:string;currentKm?:number|null;kind:'carro'|'moto'};
type Draft={date:string;km:string;liters:string;price:string;fuel:FuelKind;fullTank:boolean};
const formInput='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const money=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const qty=(value:number,places=2)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:places}).format(value);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const fresh=(kind:'carro'|'moto'):Draft=>({date:today(),km:'',liters:'',price:'',fuel:kind==='moto'?'gasolina':'gasolina',fullTank:true});
const label='grid gap-1.5 text-xs font-extrabold text-slate-600';
const PAGE_SIZE=6;

export function VehicleFuelLedger({vehicleId,vehicleName,currentKm,kind}:Props){
 const all=useFillups();
 const records=useMemo(()=>all.filter(x=>x.vehicleId===vehicleId).sort((a,b)=>b.date.localeCompare(a.date)||b.km-a.km),[all,vehicleId]);
 const [form,setForm]=useState<Draft>(()=>fresh(kind));
 const [editId,setEditId]=useState<string|null>(null);
 const [open,setOpen]=useState(false);
 const [period,setPeriod]=useState<FuelPeriod>('month');
 const [year,setYear]=useState('all');
 const [term,setTerm]=useState('');
 const [page,setPage]=useState(0);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [confirmDelete,setConfirmDelete]=useState<string|null>(null);
 const years=useMemo(()=>[...new Set(records.map(x=>x.date.slice(0,4)))].sort((a,b)=>b.localeCompare(a)),[records]);
 const visible=useMemo(()=>records.filter(x=>{
  if(period!=='year'&&year!=='all'&&!x.date.startsWith(year))return false;
  const needle=term.trim().toLowerCase();
  return !needle||[x.date,x.fuel,qty(x.liters),qty(x.pricePerLiter),x.km.toString()].some(v=>v.toLowerCase().includes(needle));
 }),[records,year,period,term]);
 const sums=useMemo(()=>totalFuel(visible),[visible]);
 const overall=useMemo(()=>totalFuel(records),[records]);
 const bucketRows=useMemo(()=>groupFuel(visible,period),[visible,period]);
 const maxBar=Math.max(1,...bucketRows.map(x=>x.spent));
 const currentSlice=visible.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
 const maxPage=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
 const consumption=useMemo(()=>calculateFuelStats(records),[records]);
 const liters=toFuelLiters(form.liters),price=toFuelMoney(form.price);
 const preview=liters!==null&&price!==null?fuelCost({liters,pricePerLiter:price}):null;

 function clearFeedback(){setNotice('');setError('');}
 function reset(){setEditId(null);setForm(fresh(kind));setOpen(false);clearFeedback();}
 function edit(row:Fillup){
  setEditId(row.id);
  setForm({date:row.date,km:String(row.km),liters:String(row.liters),
   price:String(row.pricePerLiter),fuel:row.fuel,fullTank:row.fullTank});
  clearFeedback();setOpen(true);
 }
 function submit(e:FormEvent){
  e.preventDefault();clearFeedback();
  const odometer=Number(form.km);
  if(!vehicleId){setError('Cadastre e ative primeiro a ficha do veículo.');return;}
  if(!form.km.trim()||!Number.isSafeInteger(odometer)||odometer<0||odometer>9999999){
   setError('Informe a quilometragem real registrada no abastecimento.');return;
  }
  if(liters===null||price===null){setError('Informe litros e preço por litro válidos (ex.: 32,5 litros e R$ 5,89).');return;}
  try{
   const input={vehicleId,date:form.date,km:odometer,liters,pricePerLiter:price,
    fuel:form.fuel,fullTank:form.fullTank};
   if(editId)updateFillup(editId,input);
   else addFillup(input);
   if(currentKm!==null&&currentKm!==undefined&&odometer>currentKm){
    garage.setKm(vehicleId,odometer);
   }
   setNotice(editId?'Abastecimento atualizado no histórico.':'Abastecimento salvo! Valor total calculado automaticamente.');
   setForm(fresh(kind));setEditId(null);setOpen(false);setPage(0);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar o abastecimento.');}
 }
 function remove(id:string){
  try{removeFillup(id);setConfirmDelete(null);setNotice('Abastecimento excluído do histórico.');setError('');setPage(0);}
  catch(e){setError(e instanceof Error?e.message:'Erro ao excluir registro.');}
 }
 function setRange(next:FuelPeriod){setPeriod(next);setPage(0);}
 function changeYear(next:string){setYear(next);setPage(0);}
 return <section className="sv-fuel-ledger overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
  <header className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#10223c] via-[#183456] to-[#243c5e] px-5 py-5 text-white sm:px-6">
   <div className="flex min-w-0 items-center gap-3">
    <span className="grid size-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-orange-300 backdrop-blur-xl"><Fuel size={21}/></span>
    <div><p className="text-[10px] font-black uppercase tracking-[.17em] text-orange-300">Financeiro • Abastecimentos</p>
     <h2 className="mt-1 text-lg font-black sm:text-xl">Controle de combustível</h2>
     <p className="mt-1 text-xs text-slate-300">{vehicleName} · Histórico de semanas, meses e anos</p>
    </div>
   </div>
   <button onClick={()=>{clearFeedback();if(open&&!editId){setOpen(false);}else{setEditId(null);setForm(fresh(kind));setOpen(true);}}}
    disabled={!vehicleId} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-[#101b31] hover:bg-orange-400 disabled:opacity-45">
    <Plus size={16}/>{open&&!editId?'Fechar':'Novo abastecimento'}
   </button>
  </header>
  <div className="space-y-4 p-4 sm:p-6">
   {notice&&<p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><CheckCircle2 size={16}/>{notice}</p>}
   {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}
   {!vehicleId&&<p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Ative o registro local do veículo antes de lançar abastecimentos. Seus dados já registrados não serão apagados.</p>}
   {open&&vehicleId&&<form onSubmit={submit} className="grid gap-3 rounded-2xl border border-orange-200 bg-orange-50/65 p-4 sm:grid-cols-2 lg:grid-cols-6">
    <div className="flex items-center justify-between sm:col-span-2 lg:col-span-6"><h3 className="text-sm font-black text-slate-900">{editId?'Corrigir abastecimento':'Registrar abastecimento'}</h3><button type="button" onClick={reset} className="text-xs font-bold text-slate-600 hover:text-slate-900">Cancelar</button></div>
    <label className={label+' lg:col-span-2'}>Data<input type="date" required className={formInput} value={form.date} onChange={e=>setForm(d=>({...d,date:e.target.value}))}/></label>
    <label className={label+' lg:col-span-2'}>Odômetro (km)<input type="number" min="0" max="9999999" step="1" required className={formInput} value={form.km} onChange={e=>setForm(d=>({...d,km:e.target.value}))}/></label>
    <label className={label+' lg:col-span-2'}>Combustível<select className={formInput} value={form.fuel} onChange={e=>setForm(d=>({...d,fuel:e.target.value as FuelKind}))}><option value="gasolina">Gasolina</option>{kind==='carro'&&<option value="etanol">Etanol</option>}</select></label>
    <label className={label+' lg:col-span-2'}>Litros abastecidos<input inputMode="decimal" required className={formInput} value={form.liters} onChange={e=>setForm(d=>({...d,liters:e.target.value}))} placeholder="Ex.: 35,75"/></label>
    <label className={label+' lg:col-span-2'}>Preço por litro (R$)<input inputMode="decimal" required className={formInput} value={form.price} onChange={e=>setForm(d=>({...d,price:e.target.value}))} placeholder="Ex.: 5,89"/></label>
    <div className="flex items-end lg:col-span-2"><div className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total automático</span><strong className="block text-lg font-black text-orange-700">{preview!==null?money(preview):'R$ —'}</strong></div></div>
    <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 lg:col-span-6">
     <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={form.fullTank} onChange={e=>setForm(d=>({...d,fullTank:e.target.checked}))}/> Tanque cheio (para consumo médio)</label>
     <button className="inline-flex items-center gap-2 rounded-xl bg-[#10223c] px-5 py-3 text-xs font-black text-white hover:bg-[#223e61]"><Save size={15}/>{editId?'Salvar alterações':'Salvar abastecimento'}</button>
    </div>
   </form>}
   <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
    {[
     {label:'Gasto total registrado',value:money(overall.spent),hint:records.length+' abastecimentos'},
     {label:'Litros abastecidos',value:qty(overall.liters)+' L',hint:'Desde o primeiro registro'},
     {label:'Média paga por litro',value:overall.liters?money(overall.averagePrice):'—',hint:'Média ponderada'},
     {label:'Período selecionado',value:money(sums.spent),hint:qty(sums.liters)+' L · '+sums.count+' registros'}
    ].map(c=><div key={c.label} className="rounded-2xl border border-slate-200 bg-[#f7f9fc] p-4"><p className="text-[11px] font-bold text-slate-500">{c.label}</p><p className="mt-2 text-xl font-black tracking-tight text-[#12253f]">{c.value}</p><p className="mt-1 text-[11px] text-slate-500">{c.hint}</p></div>)}
   </div>
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
     {([['week','Semanas'],['month','Meses'],['year','Anos']] as const).map(([v,label])=><button type="button" key={v} aria-pressed={period===v} onClick={()=>setRange(v)} className={'rounded-lg px-3 py-2 text-xs font-black '+(period===v?'bg-[#172a44] text-white shadow-sm':'text-slate-600 hover:bg-white')}>{label}</button>)}
    </div>
    <div className="flex flex-wrap gap-2">
     {period!=='year'&&<label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600"><CalendarDays size={15}/> Ano<select aria-label="Filtrar ano" value={year} onChange={e=>changeYear(e.target.value)} className={formInput+' !w-auto'}><option value="all">Todos</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></label>}
     <label className="relative"><span className="sr-only">Buscar abastecimento</span><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input className={formInput+' !w-44 !pl-9'} placeholder="Buscar registro" value={term} onChange={e=>{setTerm(e.target.value);setPage(0);}}/></label>
    </div>
   </div>
   <div className="grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
    <section className="min-w-0 rounded-2xl border border-slate-200 p-4">
     <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><BarChart3 size={18} className="text-orange-600"/> Despesas por {period==='week'?'semana':period==='month'?'mês':'ano'}</h3>
     {bucketRows.length?<div className="mt-4 max-h-[310px] space-y-3 overflow-y-auto pr-1">{bucketRows.map(g=><div key={g.key}><div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className="font-bold capitalize text-slate-700">{g.label}</span><strong className="text-slate-900">{money(g.spent)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#fbbf24]" style={{width:String(Math.max(3,g.spent/maxBar*100))+'%'}}/></div><p className="mt-1 text-[10px] text-slate-500">{qty(g.liters)} L · {g.count} abastecimentos</p></div>)}</div>:<div className="grid min-h-36 place-items-center text-center text-sm text-slate-500">Sem abastecimentos neste período.</div>}
    </section>
    <section className="min-w-0 rounded-2xl border border-slate-200 p-4">
     <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><TrendingUp size={18} className="text-orange-600"/> Consumo e combustíveis</h3>
     <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {(['gasolina','etanol'] as const).filter(f=>kind==='carro'||f==='gasolina').map(f=>{
       const items=visible.filter(x=>x.fuel===f),amount=totalFuel(items);
       const avg=consumption.find(x=>x.fuel===f);
       return <div key={f} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold capitalize text-slate-700">{f}</p>
        <p className="mt-2 text-xl font-black text-slate-900">{money(amount.spent)}</p>
        <p className="mt-1 text-[11px] text-slate-600">{qty(amount.liters)} L · {amount.count} registros</p>
        <p className="mt-2 text-xs font-bold text-orange-700">{avg?qty(avg.kmPerLiter)+' km/L':'Consumo ainda não calculável'}</p>
       </div>;
      })}
     </div>
     <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><Droplets size={15} className="mt-0.5 shrink-0 text-blue-600"/> O consumo médio exige dois abastecimentos consecutivos com tanque cheio e o mesmo combustível. Os valores em R$ somam litros × preço por litro em cada registro.</p>
    </section>
   </div>
   <section className="overflow-hidden rounded-2xl border border-slate-200">
    <div className="flex items-center justify-between gap-2 border-b bg-[#f8fafc] px-4 py-3"><h3 className="text-sm font-black text-slate-900">Histórico de abastecimentos</h3><span className="text-xs font-semibold text-slate-500">{visible.length} registros</span></div>
    {currentSlice.length?<div className="divide-y divide-slate-100">{currentSlice.map(row=><article key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600"><Fuel size={16}/></span><div><p className="text-xs font-black capitalize text-slate-900">{row.fuel} · {new Date(row.date+'T12:00:00').toLocaleDateString('pt-BR')}</p><p className="mt-1 text-[11px] text-slate-600">{qty(row.liters)} L × {money(row.pricePerLiter)}/L · {qty(row.km,0)} km{row.fullTank?' · tanque cheio':''}</p></div></div>
      <div className="flex items-center gap-3"><strong className="text-sm font-black text-slate-900">{money(fuelCost(row))}</strong><button type="button" onClick={()=>edit(row)} aria-label={'Editar abastecimento '+row.date} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><PenLine size={15}/></button>
       {confirmDelete===row.id?<span className="inline-flex items-center gap-1"><button type="button" onClick={()=>remove(row.id)} className="rounded-lg bg-red-600 px-2 py-2 text-[10px] font-bold text-white">Confirmar</button><button type="button" onClick={()=>setConfirmDelete(null)} className="rounded-lg border px-2 py-2 text-[10px] font-bold">Cancelar</button></span>:<button type="button" onClick={()=>setConfirmDelete(row.id)} aria-label={'Excluir abastecimento '+row.date} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"><Trash2 size={15}/></button>}
      </div>
     </article>)}</div>:<p className="p-8 text-center text-sm text-slate-500">Nenhum abastecimento encontrado. Use “Novo abastecimento” para iniciar seu controle.</p>}
    {visible.length>PAGE_SIZE&&<div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600"><span>Página {Math.min(page+1,maxPage)} de {maxPage}</span><button type="button" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} className="rounded-lg border bg-white p-1.5 disabled:opacity-30"><ChevronLeft size={16}/></button><button type="button" onClick={()=>setPage(p=>Math.min(maxPage-1,p+1))} disabled={page>=maxPage-1} className="rounded-lg border bg-white p-1.5 disabled:opacity-30"><ChevronRight size={16}/></button></div>}
   </section>
   <p className="text-[11px] leading-5 text-slate-500">Os dados são gravados no histórico local desta conta. Para mantê-los também no Supabase, utilize o backup em nuvem da ficha do veículo.</p>
  </div>
 </section>;
}
