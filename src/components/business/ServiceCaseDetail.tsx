import {useCallback,useEffect,useMemo,useState,type FormEvent} from 'react';
import {CalendarClock,CheckCircle2,ClipboardCheck,MessageCircle,PackageCheck,Plus,RefreshCw,Send,Truck,Wrench} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';

export type ServiceStatus='recebido'|'diagnostico'|'aguardando_aprovacao'|'em_execucao'|'testes'|'pronto_entrega'|'entregue'|'cancelado';
export type ServiceCase={
 id:string;business_id:string;client_id:string;vehicle_id:string|null;
 title:string;description:string;status:ServiceStatus;service_type:string;
 customer_email:string;customer_visible:boolean;scheduled_at:string|null;
 delivery_scheduled_at:string|null;delivery_method:'retirada'|'entrega_local'|'transportadora'|null;
 created_at:string;
};
type Item={id:string;item_type:'peca'|'servico';description:string;quantity:number;unit_price:number};
type Event={id:string;status:ServiceStatus;note:string;created_at:string};
type Message={id:string;sender_id:string;body:string;created_at:string};
export const STATUS_LABELS:Record<ServiceStatus,string>={
 recebido:'Recebido',diagnostico:'Diagnóstico',aguardando_aprovacao:'Aguardando aprovação',
 em_execucao:'Em execução',testes:'Testes',pronto_entrega:'Pronto para entrega',
 entregue:'Entregue',cancelado:'Cancelado'
};
export const SERVICE_TYPES={
 revisao:'Revisão',manutencao:'Manutenção',troca_pecas:'Troca de peças',
 assistencia:'Assistência',instalacao:'Instalação',outro:'Outro'
};
export const brl=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
export const localDate=(d:string|null)=>d?new Date(d).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'A definir';
const input='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export function ServiceCaseDetail({service,onChanged,isOwner=false}:{
 service:ServiceCase;onChanged?:()=>void;isOwner?:boolean;
}){
 const [items,setItems]=useState<Item[]>([]);
 const [events,setEvents]=useState<Event[]>([]);
 const [messages,setMessages]=useState<Message[]>([]);
 const [text,setText]=useState('');
 const [part,setPart]=useState({item_type:'peca' as Item['item_type'],description:'',quantity:'1',unit_price:'0'});
 const [status,setStatus]=useState<ServiceStatus>(service.status);
 const [statusNote,setStatusNote]=useState('');
 const [delivery,setDelivery]=useState({method:service.delivery_method??'retirada',at:service.delivery_scheduled_at?new Date(service.delivery_scheduled_at).toISOString().slice(0,16):''});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [myId,setMyId]=useState('');
 const [lastUpdate,setLastUpdate]=useState('');
 const refresh=useCallback(async()=>{
  if(!supabase)return;
  const [p,e,m]=await Promise.all([
   supabase.from('service_case_items').select('id,item_type,description,quantity,unit_price').eq('case_id',service.id).order('created_at',{ascending:true}).limit(200),
   supabase.from('service_case_events').select('id,status,note,created_at').eq('case_id',service.id).order('created_at',{ascending:true}).limit(200),
   supabase.from('service_case_messages').select('id,sender_id,body,created_at').eq('case_id',service.id).order('created_at',{ascending:true}).limit(300)
  ]);
  if(p.error||e.error||m.error){setError(p.error?.message||e.error?.message||m.error?.message||'Erro ao carregar atendimento.');return;}
  setItems((p.data??[]) as Item[]);setEvents((e.data??[]) as Event[]);setMessages((m.data??[]) as Message[]);
  setLastUpdate(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));
 },[service.id]);
 useEffect(()=>{
  let mounted=true;
  void supabase?.auth.getUser().then(({data})=>{if(mounted)setMyId(data.user?.id??'');});
  void refresh();
  const channel=supabase?.channel('service-'+service.id);
  if(channel){
   for(const table of ['service_case_items','service_case_events','service_case_messages','service_cases'] as const){
    channel.on('postgres_changes',{event:'*',schema:'public',table,filter:table==='service_cases'?'id=eq.'+service.id:'case_id=eq.'+service.id},()=>{
     void refresh();if(table==='service_cases')onChanged?.();
    });
   }
   channel.subscribe();
  }
  return()=>{mounted=false;if(channel)void supabase?.removeChannel(channel);};
 },[service.id,refresh,onChanged]);
 const cost=useMemo(()=>{
  const pieces=items.filter(x=>x.item_type==='peca').reduce((n,x)=>n+x.quantity*Number(x.unit_price),0);
  const labor=items.filter(x=>x.item_type==='servico').reduce((n,x)=>n+x.quantity*Number(x.unit_price),0);
  return {pieces,labor,total:pieces+labor};
 },[items]);
 async function addItem(e:FormEvent){
  e.preventDefault();if(!supabase||!isOwner)return;
  const qty=Number(part.quantity),price=Number(part.unit_price);
  if(!Number.isFinite(qty)||qty<=0||!Number.isFinite(price)||price<0)return setError('Informe quantidade e preço válidos.');
  setBusy(true);setError('');
  try{
   const {error}=await supabase.from('service_case_items').insert({
    business_id:service.business_id,case_id:service.id,item_type:part.item_type,
    description:part.description.trim(),quantity:qty,unit_price:price
   });
   if(error)throw error;
   setPart({item_type:'peca',description:'',quantity:'1',unit_price:'0'});
   await refresh();
  }catch(err){setError(err instanceof Error?err.message:'Não foi possível adicionar o item.');}finally{setBusy(false);}
 }
 async function changeStatus(e:FormEvent){
  e.preventDefault();if(!supabase||!isOwner)return;
  setBusy(true);setError('');
  try{
   const {error}=await supabase.from('service_cases').update({status,updated_at:new Date().toISOString()}).eq('id',service.id).eq('business_id',service.business_id);
   if(error)throw error;
   const {error:eventError}=await supabase.from('service_case_events').insert({
    business_id:service.business_id,case_id:service.id,status,note:statusNote.trim(),visible_to_customer:true
   });
   if(eventError)throw eventError;
   setStatusNote('');await refresh();onChanged?.();
  }catch(err){setError(err instanceof Error?err.message:'Falha ao atualizar a etapa.');}finally{setBusy(false);}
 }
 async function saveDelivery(e:FormEvent){
  e.preventDefault();if(!supabase||!isOwner)return;
  const date=delivery.at?new Date(delivery.at):null;
  if(date&&Number.isNaN(date.getTime()))return setError('Data de entrega inválida.');
  setBusy(true);setError('');
  try{
   const {error}=await supabase.from('service_cases').update({
    delivery_method:delivery.method,delivery_scheduled_at:date?date.toISOString():null,
    updated_at:new Date().toISOString()
   }).eq('id',service.id).eq('business_id',service.business_id);
   if(error)throw error;
   onChanged?.();
  }catch(err){setError(err instanceof Error?err.message:'Não foi possível programar a entrega.');}finally{setBusy(false);}
 }
 async function sendMessage(e:FormEvent){
  e.preventDefault();if(!supabase||!text.trim())return;
  setBusy(true);setError('');
  try{
   const {data:auth,error:authError}=await supabase.auth.getUser();
   if(authError||!auth.user)throw new Error('Faça login para enviar mensagens.');
   const {error}=await supabase.from('service_case_messages').insert({
    business_id:service.business_id,case_id:service.id,sender_id:auth.user.id,body:text.trim()
   });
   if(error)throw error;
   setText('');await refresh();
  }catch(err){setError(err instanceof Error?err.message:'Falha ao enviar mensagem.');}finally{setBusy(false);}
 }
 return <div className="space-y-4">
  <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
   <div><span className="text-xs font-extrabold uppercase text-orange-700">{SERVICE_TYPES[service.service_type as keyof typeof SERVICE_TYPES]??'Atendimento'}</span>
    <h3 className="mt-1 text-xl font-black">{service.title}</h3>
    <p className="mt-1 text-sm text-slate-600">{service.description||'Sem observações adicionais.'}</p>
    <p className="mt-2 text-xs text-slate-500">Aberto em {localDate(service.created_at)}</p></div>
   <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white">{STATUS_LABELS[service.status]}</span>
  </div>
  {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
  <div className="grid gap-3 sm:grid-cols-3">
   <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Peças</p><p className="mt-2 text-xl font-black">{brl(cost.pieces)}</p></div>
   <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Serviços</p><p className="mt-2 text-xl font-black">{brl(cost.labor)}</p></div>
   <div className="rounded-xl border border-orange-200 bg-orange-50 p-4"><p className="text-xs text-orange-800">Orçamento informado</p><p className="mt-2 text-xl font-black text-slate-900">{brl(cost.total)}</p></div>
  </div>
  <section className="rounded-2xl border bg-white p-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="flex items-center gap-2 font-black"><ClipboardCheck className="text-orange-600" size={18}/> Itens do orçamento</h4><span className="text-xs text-slate-500">{items.length} itens</span></div>
   <div className="mt-3 divide-y">{items.length?items.map(item=><div key={item.id} className="flex justify-between gap-3 py-2 text-sm">
     <span><span className="mr-2 rounded bg-slate-100 px-1.5 py-1 text-[10px] font-bold uppercase">{item.item_type==='peca'?'Peça':'Serviço'}</span>{item.description}<span className="ml-2 text-slate-500">× {item.quantity}</span></span>
     <strong className="shrink-0">{brl(item.quantity*Number(item.unit_price))}</strong></div>):<p className="py-2 text-xs text-slate-500">Nenhuma peça ou serviço detalhado no orçamento.</p>}</div>
   {isOwner&&<form onSubmit={addItem} className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-[110px_1fr_85px_105px_auto]">
    <select aria-label="Tipo de item" className={input} value={part.item_type} onChange={e=>setPart(v=>({...v,item_type:e.target.value as Item['item_type']}))}><option value="peca">Peça</option><option value="servico">Serviço</option></select>
    <input className={input} required minLength={2} maxLength={180} placeholder="Descrição do item" aria-label="Descrição do item" value={part.description} onChange={e=>setPart(v=>({...v,description:e.target.value}))}/>
    <input className={input} required type="number" min="0.01" step="0.01" aria-label="Quantidade" value={part.quantity} onChange={e=>setPart(v=>({...v,quantity:e.target.value}))}/>
    <input className={input} required type="number" min="0" step="0.01" aria-label="Preço unitário" value={part.unit_price} onChange={e=>setPart(v=>({...v,unit_price:e.target.value}))}/>
    <button disabled={busy} className="flex items-center justify-center gap-1 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-slate-900"><Plus size={14}/> Adicionar</button>
   </form>}
  </section>
  <div className="grid gap-4 lg:grid-cols-2">
   <section className="rounded-2xl border bg-white p-4">
    <h4 className="flex items-center gap-2 font-black"><CalendarClock size={18} className="text-orange-600"/> Etapas e agendamento</h4>
    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs leading-6 text-slate-700">
     <p>Serviço previsto: <strong>{localDate(service.scheduled_at)}</strong></p>
     <p>Modalidade: <strong>{service.delivery_method==='retirada'?'Retirada no local':service.delivery_method==='entrega_local'?'Entrega local':service.delivery_method==='transportadora'?'Transportadora':'A definir'}</strong></p>
     <p>Entrega programada: <strong>{localDate(service.delivery_scheduled_at)}</strong></p>
    </div>
    {isOwner&&<form onSubmit={changeStatus} className="mt-3 space-y-2">
     <select aria-label="Etapa do atendimento" value={status} onChange={e=>setStatus(e.target.value as ServiceStatus)} className={input}>
      {Object.entries(STATUS_LABELS).map(([v,label])=><option key={v} value={v}>{label}</option>)}
     </select>
     <input className={input} value={statusNote} maxLength={1200} onChange={e=>setStatusNote(e.target.value)} placeholder="Atualização para o cliente (opcional)"/>
     <button disabled={busy} className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white">Registrar atualização</button>
    </form>}
    <div className="mt-4 space-y-3 border-l-2 border-orange-200 pl-4">{events.length?events.map(v=><div key={v.id}>
     <p className="text-xs font-bold text-slate-800"><CheckCircle2 size={12} className="mr-1 inline text-orange-600"/>{STATUS_LABELS[v.status]}</p>
     {v.note&&<p className="mt-0.5 text-xs text-slate-600">{v.note}</p>}
     <p className="mt-0.5 text-[11px] text-slate-400">{localDate(v.created_at)}</p></div>):<p className="text-xs text-slate-500">Aguardando a primeira atualização.</p>}</div>
   </section>
   <section className="rounded-2xl border bg-white p-4">
    <h4 className="flex items-center gap-2 font-black"><Truck size={18} className="text-orange-600"/> Entrega e retirada</h4>
    {isOwner?<form onSubmit={saveDelivery} className="mt-3 space-y-3">
      <label className="block text-xs font-bold text-slate-600">Modalidade<select className={'mt-1 '+input} value={delivery.method} onChange={e=>setDelivery(v=>({...v,method:e.target.value as typeof v.method}))}><option value="retirada">Retirada na loja/oficina</option><option value="entrega_local">Entrega local</option><option value="transportadora">Transportadora</option></select></label>
      <label className="block text-xs font-bold text-slate-600">Data e horário previstos<input type="datetime-local" className={'mt-1 '+input} value={delivery.at} onChange={e=>setDelivery(v=>({...v,at:e.target.value}))}/></label>
      <button disabled={busy} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-800">Salvar programação</button>
    </form>:<p className="mt-3 text-xs leading-6 text-slate-600">A entrega exibida é um planejamento informado pela empresa; não representa pagamento ou rastreamento de transportadora.</p>}
    <div className="mt-4 rounded-xl bg-orange-50 p-3 text-xs leading-6 text-orange-900">
     <PackageCheck size={16} className="mr-1 inline"/> Checkout de retirada/entrega programada. <strong>Pagamento online ainda não disponível.</strong>
    </div>
   </section>
  </div>
  <section className="rounded-2xl border bg-white p-4">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h4 className="flex items-center gap-2 font-black"><MessageCircle className="text-orange-600" size={18}/> Chat do atendimento</h4>
    <button type="button" onClick={()=>void refresh()} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600"><RefreshCw size={13}/> Atualizar {lastUpdate&&'· '+lastUpdate}</button>
   </div>
   <div aria-label="Mensagens do atendimento" className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
    {messages.length?messages.map(m=><div key={m.id} className={'flex '+(m.sender_id===myId?'justify-end':'justify-start')}>
      <div className={'max-w-[85%] rounded-2xl px-3 py-2 text-sm '+(m.sender_id===myId?'bg-orange-100 text-slate-900':'bg-white text-slate-800 shadow-sm')}>
       <p className="whitespace-pre-wrap break-words">{m.body}</p><p className="mt-1 text-[10px] text-slate-500">{localDate(m.created_at)}</p>
      </div></div>):<p className="text-center text-xs text-slate-500">Nenhuma mensagem neste atendimento.</p>}
   </div>
   <form onSubmit={sendMessage} className="mt-3 flex gap-2">
    <input className={input} maxLength={2000} required value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva sua mensagem ao atendimento..." aria-label="Nova mensagem"/>
    <button disabled={busy||!text.trim()} className="flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-slate-900 disabled:opacity-40"><Send size={16}/> Enviar</button>
   </form>
   <p className="mt-2 text-[11px] text-slate-500">Mensagens vinculadas à conta; atualizações recebidas pela conexão em tempo real quando disponível.</p>
  </section>
 </div>;
}
