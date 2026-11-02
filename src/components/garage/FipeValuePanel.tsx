import {useEffect,useState,type FormEvent} from 'react';
import {ArrowRight,CalendarDays,CheckCircle2,ChevronDown,ExternalLink,RefreshCw,TrendingUp} from 'lucide-react';
import {
  displayedFipe,fipeBrands,fipeModels,fipePrice,fipeYears,needsFipeRefresh,
  refreshFipe,writeFipe,type FipeKind,type FipeOption,type FipeSaved,type FipeSelection,
} from '@/lib/garage/fipe';

const optionClass='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-55';
const normalize=(s:string)=>s.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');
function currentReference(month:string):boolean {
 const now=new Date();
 const expected=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(now);
 return normalize(month)===normalize(expected);
}
const getMessage=(reason:unknown)=>reason instanceof Error?reason.message:'Não foi possível consultar a FIPE neste momento.';

type Props={vehicleId:string;kind:FipeKind;vehicleName:string;brandHint?:string;yearHint?:number|undefined;};
export function FipeValuePanel({vehicleId,kind,vehicleName,brandHint='',yearHint}:Props){
 const [saved,setSaved]=useState<FipeSaved|null>(null);
 const [editing,setEditing]=useState(false);
 const [brands,setBrands]=useState<FipeOption[]>([]);
 const [models,setModels]=useState<FipeOption[]>([]);
 const [years,setYears]=useState<FipeOption[]>([]);
 const [brandId,setBrandId]=useState('');
 const [modelId,setModelId]=useState('');
 const [yearId,setYearId]=useState('');
 const [brandsLoading,setBrandsLoading]=useState(false);
 const [modelsLoading,setModelsLoading]=useState(false);
 const [yearsLoading,setYearsLoading]=useState(false);
 const [fetching,setFetching]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');

 // Quando o proprietário abre a ficha em um mês novo, consulta novamente a API.
 // Não inventamos valor enquanto a versão do veículo não for confirmada.
 useEffect(()=>{
  if(!vehicleId){setSaved(null);return;}
  let active=true;
  const cached=displayedFipe(vehicleId);
  setSaved(cached);
  setError('');setMessage('');
  if(cached&&needsFipeRefresh(cached,new Date())){
   setFetching(true);
   void refreshFipe(vehicleId,kind,cached).then(updated=>{
    if(!active)return;
    writeFipe(vehicleId,updated);setSaved(updated);
   }).catch(e=>{if(active)setError('Não foi possível atualizar a referência automaticamente: '+getMessage(e));})
   .finally(()=>{if(active)setFetching(false);});
  }
  return()=>{active=false;};
 },[vehicleId,kind]);

 useEffect(()=>{
  if(!editing)return;
  const controller=new AbortController();
  setBrandsLoading(true);
  void fipeBrands(kind,controller.signal).then(data=>{
   setBrands(data);
   if(!brandId&&brandHint){
    const hint=normalize(brandHint);
    const selected=data.find(x=>normalize(x.name)===hint)||
      data.find(x=>normalize(x.name).includes(hint));
    if(selected)setBrandId(selected.code);
   }
  }).catch(e=>{if(!controller.signal.aborted)setError(getMessage(e));})
  .finally(()=>{if(!controller.signal.aborted)setBrandsLoading(false);});
  return()=>controller.abort();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[editing,kind]);

 useEffect(()=>{
  if(!editing||!brandId){setModels([]);return;}
  const controller=new AbortController();
  setModelsLoading(true);setModels([]);
  void fipeModels(kind,brandId,controller.signal).then(setModels)
   .catch(e=>{if(!controller.signal.aborted)setError(getMessage(e));})
   .finally(()=>{if(!controller.signal.aborted)setModelsLoading(false);});
  return()=>controller.abort();
 },[editing,kind,brandId]);

 useEffect(()=>{
  if(!editing||!brandId||!modelId){setYears([]);return;}
  const controller=new AbortController();
  setYearsLoading(true);setYears([]);
  void fipeYears(kind,brandId,modelId,controller.signal).then(data=>{
   setYears([...data].sort((a,b)=>b.name.localeCompare(a.name,'pt-BR',{numeric:true})));
  }).catch(e=>{if(!controller.signal.aborted)setError(getMessage(e));})
   .finally(()=>{if(!controller.signal.aborted)setYearsLoading(false);});
  return()=>controller.abort();
 },[editing,kind,brandId,modelId]);

 function startEditing(){
  setError('');setMessage('');
  setBrandId(saved?.selection?.brandId??'');
  setModelId(saved?.selection?.modelId??'');
  setYearId(saved?.selection?.yearId??'');
  setEditing(true);
 }
 async function save(event:FormEvent){
  event.preventDefault();
  const brand=brands.find(x=>x.code===brandId);
  const model=models.find(x=>x.code===modelId);
  const year=years.find(x=>x.code===yearId);
  if(!vehicleId||!brand||!model||!year){
   setError('Selecione a marca, a versão exata do modelo e o ano/combustível da FIPE.');
   return;
  }
  setFetching(true);setError('');setMessage('');
  const selection:FipeSelection={
   brandId:brand.code,brandName:brand.name,modelId:model.code,modelName:model.name,
   yearId:year.code,yearName:year.name,
  };
  try{
   const quote=await fipePrice(kind,selection);
   const record:FipeSaved={selection,quote,checkedAt:new Date().toISOString(),source:'api'};
   writeFipe(vehicleId,record);
   setSaved(record);setEditing(false);
   setMessage('Versão FIPE vinculada ao seu veículo. A nova referência será consultada automaticamente em cada mês, quando você abrir a ficha.');
  }catch(e){setError(getMessage(e));}
  finally{setFetching(false);}
 }
 async function refresh(){
  if(!saved||!vehicleId)return;
  setError('');setMessage('');setFetching(true);
  try{
   const updated=await refreshFipe(vehicleId,kind,saved);
   writeFipe(vehicleId,updated);setSaved(updated);
   setMessage('Valor atualizado em reais. Referência publicada: '+updated.quote.referenceMonth+'.');
  }catch(e){setError(getMessage(e));}
  finally{setFetching(false);}
 }
 const recent=saved&&currentReference(saved.quote.referenceMonth);
 return <section className="sv-fipe-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label={'Tabela FIPE de '+vehicleName}>
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#0e1b30] to-[#203a59] p-5 text-white sm:p-6">
   <div className="flex min-w-0 items-center gap-3">
    <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-orange-300 backdrop-blur-md"><TrendingUp size={23}/></span>
    <div><p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-orange-300">Cotação do seu veículo</p>
     <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Tabela FIPE <span className="text-orange-300">{kind==='carro'?'· Carro':'· Moto'}</span></h2>
    </div>
   </div>
   <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/90 backdrop-blur-md"><CalendarDays size={14}/> Referência mensal</span>
  </div>
  <div className="p-5 sm:p-6">
   {!vehicleId?<p className="text-sm text-slate-600">Ative a ficha do veículo para vincular a versão da Tabela FIPE.</p>:
   <div className="flex flex-wrap items-center justify-between gap-5">
    <div className="min-w-0 flex-1">
     <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{saved?'Valor médio de referência':'Cotação personalizada'}</p>
     <p className="mt-2 text-3xl font-black tracking-tight text-[#11223b] sm:text-4xl" aria-live="polite">{saved?.quote.price??'Valor a consultar'}</p>
     <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
      {saved?<><CalendarDays size={15} className="text-orange-600"/> {saved.quote.referenceMonth}<span className={'rounded-full px-2 py-0.5 text-[10px] font-bold '+(recent?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800')}>{recent?'Mês atual confirmado':'Referência disponível'}</span></>:
      'Selecione a versão exata para consultar o preço real.'}
     </p>
     {saved&&<p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">{saved.quote.brand} · {saved.quote.model} · {saved.quote.modelYear} · {saved.quote.fuel} · Código FIPE {saved.quote.codeFipe}</p>}
     {saved&&!recent&&<p className="mt-2 text-xs text-amber-800">O último valor confirmado é de {saved.quote.referenceMonth}. Clique em Atualizar FIPE para tentar consultar a referência mais recente.</p>}
     {saved?.source==='published-reference'&&<p className="mt-2 text-xs text-slate-500">Valor de referência pesquisado em fontes públicas em 02/11/2026; atualização em tempo real disponível pelo botão.</p>}
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">
     {saved&&<button disabled={fetching} type="button" onClick={()=>void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-orange-400 bg-[#152944] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#243d61] disabled:opacity-60"><RefreshCw size={15} className={fetching?'animate-spin':''}/> {fetching?'Consultando...':'Atualizar FIPE'}</button>}
     <button type="button" onClick={()=>editing?setEditing(false):startEditing()} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-orange-400">{saved?(editing?'Fechar seleção':'Alterar versão FIPE'):(editing?'Fechar seleção':'Configurar Tabela FIPE')}<ArrowRight size={15}/></button>
    </div>
   </div>}
   {fetching&&<p role="status" className="mt-3 text-xs font-semibold text-slate-600">Consultando a referência oficial disponível na API…</p>}
   {error&&<p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
   {message&&<p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={14} className="mr-1 inline"/>{message}</p>}
   {editing&&vehicleId&&<form onSubmit={e=>void save(e)} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
    <label className="grid gap-1.5 text-xs font-bold text-slate-700">Marca
     <select className={optionClass} aria-label="Marca FIPE" value={brandId} disabled={brandsLoading} onChange={e=>{setBrandId(e.target.value);setModelId('');setYearId('');}} required>
      <option value="">{brandsLoading?'Carregando marcas...':'Escolha a marca'}</option>
      {brands.map(b=><option key={b.code} value={b.code}>{b.name}</option>)}
     </select>
    </label>
    <label className="grid gap-1.5 text-xs font-bold text-slate-700">Modelo e versão
     <select className={optionClass} aria-label="Versão FIPE" value={modelId} disabled={!brandId||modelsLoading} onChange={e=>{setModelId(e.target.value);setYearId('');}} required>
      <option value="">{modelsLoading?'Carregando versões...':'Selecione a versão exata'}</option>
      {models.map(m=><option key={m.code} value={m.code}>{m.name}</option>)}
     </select>
    </label>
    <label className="grid gap-1.5 text-xs font-bold text-slate-700">Ano-modelo e combustível
     <select className={optionClass} aria-label="Ano e combustível FIPE" value={yearId} disabled={!modelId||yearsLoading} onChange={e=>setYearId(e.target.value)} required>
      <option value="">{yearsLoading?'Carregando anos...':'Escolha o ano e combustível'}</option>
      {years.map(y=><option key={y.code} value={y.code}>{y.name}{yearHint&&y.name.startsWith(String(yearHint))?' · Ano do seu cadastro':''}</option>)}
     </select>
    </label>
    <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
     <p className="max-w-xl text-xs leading-5 text-slate-500">Confirme a versão, motorização e combustível. Variações do mesmo modelo podem ter valores FIPE diferentes.</p>
     <button className="inline-flex items-center gap-2 rounded-xl bg-[#12233b] px-5 py-3 text-xs font-bold text-white hover:bg-[#223b5b] disabled:opacity-50" type="submit" disabled={fetching||brandsLoading||modelsLoading||yearsLoading||!yearId}>Consultar e vincular <ChevronDown size={15}/></button>
    </div>
   </form>}
   <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">
    <span>Fonte dos valores ao atualizar: API independente FIPE/Parallelum. Referência e ano são informados pela fonte consultada; atualização automática ao abrir a ficha no mês seguinte.</span>
    <a className="inline-flex items-center gap-1 font-bold text-orange-700 hover:underline" target="_blank" rel="noopener noreferrer" href="https://veiculos.fipe.org.br/">Consultar FIPE <ExternalLink size={12}/></a>
   </div>
  </div>
 </section>;
}

/** Resumo para a vitrine de veículos já cadastrados. Não faz estimativas. */
export function FipeVehicleSummary({vehicleId}:{vehicleId:string}){
 const [entry,setEntry]=useState<FipeSaved|null>(null);
 useEffect(()=>{
  const sync=()=>setEntry(displayedFipe(vehicleId));
  sync();
  const onUpdated=(e:Event)=>{
   if((e as CustomEvent<string>).detail===vehicleId)sync();
  };
  window.addEventListener('smartveiculos:fipe:updated',onUpdated);
  window.addEventListener('storage',sync);
  return()=>{window.removeEventListener('smartveiculos:fipe:updated',onUpdated);window.removeEventListener('storage',sync);};
 },[vehicleId]);
 return <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-orange-200/30 bg-[#101f33]/75 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
  <TrendingUp size={13} className="text-orange-300" aria-hidden="true"/>
  {entry?<>FIPE {entry.quote.price} · {entry.quote.referenceMonth}</>:'FIPE: configurar cotação'}
 </span>;
}
