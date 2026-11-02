import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {ArrowRight,Bike,CalendarDays,CarFront,Check,ClipboardList,Copy,MessageCircle,Plus,RefreshCw,Search,ShieldCheck,Users,Wrench} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {ServiceCaseDetail,STATUS_LABELS,SERVICE_TYPES,localDate,type ServiceCase} from './ServiceCaseDetail';

type Client={id:string;business_id:string;full_name:string;email:string;phone:string;street_address:string;city:string;state:string;postal_code:string};
type Vehicle={id:string;business_id:string;client_id:string;vehicle_type:'carro'|'moto';brand:string;model:string;model_year:number|null;plate:string;notes:string};
type View='clients'|'vehicles'|'services';
const input='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100';
const label='grid gap-1.5 text-xs font-bold text-slate-700';
const button='inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-extrabold text-slate-900 disabled:opacity-50';
export function BusinessServicesPanel({businessId,businessName,approved}:{
 businessId:string;businessName:string;approved:boolean;
}){
 const [view,setView]=useState<View>('services');
 const [clients,setClients]=useState<Client[]>([]);
 const [vehicles,setVehicles]=useState<Vehicle[]>([]);
 const [cases,setCases]=useState<ServiceCase[]>([]);
 const [selected,setSelected]=useState('');
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [clientForm,setClientForm]=useState({full_name:'',email:'',phone:'',street_address:'',city:'',state:'',postal_code:''});
 const [vehicleForm,setVehicleForm]=useState({client_id:'',vehicle_type:'carro' as Vehicle['vehicle_type'],brand:'',model:'',model_year:'',plate:'',notes:''});
 const [serviceForm,setServiceForm]=useState({client_id:'',vehicle_id:'',title:'',description:'',service_type:'manutencao',scheduled_at:''});
 const [search,setSearch]=useState('');
 const refresh=useCallback(async()=>{
  if(!supabase)return;
  const [c,v,o]=await Promise.all([
   supabase.from('business_clients').select('*').eq('business_id',businessId).order('created_at',{ascending:false}).limit(500),
   supabase.from('business_client_vehicles').select('*').eq('business_id',businessId).order('created_at',{ascending:false}).limit(500),
   supabase.from('service_cases').select('*').eq('business_id',businessId).order('created_at',{ascending:false}).limit(500)
  ]);
  if(c.error||v.error||o.error){setError(c.error?.message||v.error?.message||o.error?.message||'Erro ao carregar informações empresariais.');return;}
  setClients((c.data??[]) as Client[]);
  setVehicles((v.data??[]) as Vehicle[]);
  setCases((o.data??[]) as ServiceCase[]);
 },[businessId]);
 useEffect(()=>{void refresh();},[refresh]);
 const current=cases.find(c=>c.id===selected);
 const filteredCases=cases.filter(c=>(c.title+' '+c.description+' '+(clients.find(x=>x.id===c.client_id)?.full_name??'')).toLowerCase().includes(search.toLowerCase()));
 const relevantVehicles=vehicles.filter(v=>v.client_id===serviceForm.client_id);
 async function addClient(e:FormEvent){
  e.preventDefault();if(!supabase)return;
  setSaving(true);setError('');setMessage('');
  try{
   const {error}=await supabase.from('business_clients').insert({business_id:businessId,...clientForm,email:clientForm.email.trim().toLowerCase(),full_name:clientForm.full_name.trim()});
   if(error)throw error;
   setClientForm({full_name:'',email:'',phone:'',street_address:'',city:'',state:'',postal_code:''});
   await refresh();setMessage('Cliente cadastrado na base exclusiva de '+businessName+'.');
  }catch(err){setError(err instanceof Error?err.message:'Erro ao salvar cliente.');}finally{setSaving(false);}
 }
 async function addVehicle(e:FormEvent){
  e.preventDefault();if(!supabase)return;
  if(!vehicleForm.client_id)return setError('Selecione o proprietário do veículo.');
  const modelYear=vehicleForm.model_year.trim()?Number(vehicleForm.model_year):null;
  if(modelYear!==null&&(!Number.isInteger(modelYear)||modelYear<1950||modelYear>2100))return setError('Ano do veículo inválido.');
  setSaving(true);setError('');setMessage('');
  try{
   const {error}=await supabase.from('business_client_vehicles').insert({
    ...vehicleForm,business_id:businessId,model_year:modelYear,plate:vehicleForm.plate.toUpperCase().trim()
   });
   if(error)throw error;
   setVehicleForm({client_id:'',vehicle_type:'carro',brand:'',model:'',model_year:'',plate:'',notes:''});
   await refresh();setMessage('Veículo vinculado ao cliente.');
  }catch(err){setError(err instanceof Error?err.message:'Falha ao cadastrar veículo.');}finally{setSaving(false);}
 }
 async function addCase(e:FormEvent){
  e.preventDefault();if(!supabase)return;
  const customer=clients.find(c=>c.id===serviceForm.client_id);
  if(!customer)return setError('Cadastre e selecione um cliente primeiro.');
  if(serviceForm.vehicle_id&&!vehicles.some(v=>v.id===serviceForm.vehicle_id&&v.client_id===customer.id))return setError('O veículo não pertence ao cliente selecionado.');
  const planned=serviceForm.scheduled_at?new Date(serviceForm.scheduled_at):null;
  if(planned&&Number.isNaN(planned.getTime()))return setError('Data de agendamento inválida.');
  setSaving(true);setError('');setMessage('');
  try{
   const {data,error}=await supabase.from('service_cases').insert({
    business_id:businessId,client_id:customer.id,
    vehicle_id:serviceForm.vehicle_id||null,customer_email:customer.email.trim().toLowerCase(),
    title:serviceForm.title.trim(),description:serviceForm.description.trim(),
    service_type:serviceForm.service_type,
    scheduled_at:planned?planned.toISOString():null,
    customer_visible:Boolean(approved&&customer.email.trim())
   }).select('id').single();
   if(error)throw error;
   await supabase.from('service_case_events').insert({business_id:businessId,case_id:data.id,status:'recebido',note:'Atendimento registrado.',visible_to_customer:true});
   setServiceForm({client_id:'',vehicle_id:'',title:'',description:'',service_type:'manutencao',scheduled_at:''});
   await refresh();setSelected(data.id);setMessage('Atendimento criado. Adicione peças, serviços e etapas no painel.');
  }catch(err){setError(err instanceof Error?err.message:'Erro ao registrar atendimento.');}finally{setSaving(false);}
 }
 async function toggleAccess(service:ServiceCase){
  if(!supabase)return;
  const newAccess=!service.customer_visible;
  if(newAccess&&!approved)return setError('A empresa precisa estar aprovada para liberar o painel ao cliente.');
  if(newAccess&&!service.customer_email)return setError('Informe um e-mail válido no cadastro do cliente antes de liberar o acesso.');
  setSaving(true);setError('');setMessage('');
  try{
   const {error}=await supabase.from('service_cases').update({customer_visible:newAccess,updated_at:new Date().toISOString()}).eq('business_id',businessId).eq('id',service.id);
   if(error)throw error;
   await refresh();setMessage(newAccess?'Acesso do cliente habilitado.':'Acesso do cliente revogado.');
  }catch(err){setError(err instanceof Error?err.message:'Não foi possível alterar o acesso.');}finally{setSaving(false);}
 }
 async function copyClientLink(){
  try{await navigator.clipboard.writeText(window.location.origin+'/meus-atendimentos');setMessage('Link copiado! O cliente deve entrar com o e-mail cadastrado.');}
  catch{setError('Não foi possível copiar automaticamente. O endereço de acesso é /meus-atendimentos.');}
 }
 return <div className="space-y-4">
  <div className="rounded-2xl bg-[#142238] p-5 text-white">
   <div className="flex flex-wrap items-center justify-between gap-4">
    <div><p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-300">Assistência e atendimento</p>
     <h2 className="mt-1 text-2xl font-black">Serviços, clientes e veículos</h2>
     <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300">Autopeças também realizam revisões, manutenção e troca de componentes. Organize a prestação de serviços com a mesma conta da loja.</p></div>
    <button onClick={()=>void copyClientLink()} className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10"><Copy size={16}/> Copiar acesso do cliente</button>
   </div>
  </div>
  <div className="grid gap-3 sm:grid-cols-3">{[
    ['Clientes',clients.length,Users],
    ['Veículos',vehicles.length,CarFront],
    ['Atendimentos',cases.length,Wrench]
   ].map(([title,value,Icon])=>{const Comp=Icon as typeof Users;return <div key={String(title)} className="flex items-center gap-3 rounded-xl border bg-white p-4"><Comp size={20} className="text-orange-600"/><div><p className="text-[11px] font-semibold text-slate-500">{String(title)}</p><p className="text-2xl font-black">{String(value)}</p></div></div>})}</div>
  {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
  {message&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
  <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2">
   {([
    ['services','Atendimentos',ClipboardList],['clients','Clientes',Users],['vehicles','Veículos',Bike]
   ] as const).map(([id,text,Icon])=><button key={id} type="button" onClick={()=>{setView(id);setSelected('');}} className={'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold '+(view===id?'bg-orange-500 text-slate-950':'text-slate-600 hover:bg-slate-50')}><Icon size={16}/>{text}</button>)}
   <button className="ml-auto flex items-center gap-1 px-2 text-xs font-bold text-slate-600" type="button" onClick={()=>void refresh()}><RefreshCw size={14}/> Atualizar</button>
  </div>
  {view==='clients'&&<div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
   <form onSubmit={addClient} className="grid content-start gap-3 rounded-2xl border bg-white p-5">
    <h3 className="text-lg font-black">Cadastrar cliente</h3>
    <label className={label}>Nome completo<input required minLength={2} maxLength={120} className={input} value={clientForm.full_name} onChange={e=>setClientForm(x=>({...x,full_name:e.target.value}))}/></label>
    <label className={label}>E-mail do cliente (para acesso online)<input type="email" maxLength={254} className={input} value={clientForm.email} onChange={e=>setClientForm(x=>({...x,email:e.target.value}))}/></label>
    <label className={label}>Telefone<input type="tel" maxLength={30} className={input} value={clientForm.phone} onChange={e=>setClientForm(x=>({...x,phone:e.target.value}))}/></label>
    <label className={label}>Endereço<input maxLength={250} className={input} value={clientForm.street_address} onChange={e=>setClientForm(x=>({...x,street_address:e.target.value}))}/></label>
    <div className="grid grid-cols-3 gap-2">
     <label className={label}>Cidade<input className={input} maxLength={100} value={clientForm.city} onChange={e=>setClientForm(x=>({...x,city:e.target.value}))}/></label>
     <label className={label}>UF<input className={input} maxLength={60} value={clientForm.state} onChange={e=>setClientForm(x=>({...x,state:e.target.value}))}/></label>
     <label className={label}>CEP<input className={input} maxLength={20} value={clientForm.postal_code} onChange={e=>setClientForm(x=>({...x,postal_code:e.target.value}))}/></label>
    </div>
    <button disabled={saving} className={button}><Plus size={16}/> Salvar cliente</button>
   </form>
   <section className="rounded-2xl border bg-white p-5"><h3 className="text-lg font-black">Clientes cadastrados</h3>
    <div className="mt-4 max-h-[530px] space-y-2 overflow-y-auto">{clients.length?clients.map(c=><div key={c.id} className="rounded-xl border p-3"><p className="font-bold">{c.full_name}</p><p className="mt-1 text-xs text-slate-600">{c.email||'E-mail não informado'} · {c.phone||'Sem telefone'}</p><p className="mt-1 text-xs text-slate-500">{[c.street_address,c.city,c.state].filter(Boolean).join(' · ')||'Sem endereço'}</p></div>):<p className="text-sm text-slate-500">Nenhum cliente cadastrado nesta empresa.</p>}</div>
   </section>
  </div>}
  {view==='vehicles'&&<div className="grid gap-4 lg:grid-cols-2">
   <form onSubmit={addVehicle} className="grid content-start gap-3 rounded-2xl border bg-white p-5">
    <h3 className="text-lg font-black">Veículo do cliente</h3>
    <label className={label}>Proprietário<select required className={input} value={vehicleForm.client_id} onChange={e=>setVehicleForm(x=>({...x,client_id:e.target.value}))}><option value="">Selecione</option>{clients.map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}</select></label>
    <label className={label}>Tipo<select className={input} value={vehicleForm.vehicle_type} onChange={e=>setVehicleForm(x=>({...x,vehicle_type:e.target.value as Vehicle['vehicle_type']}))}><option value="carro">Carro</option><option value="moto">Moto</option></select></label>
    <div className="grid grid-cols-2 gap-2"><label className={label}>Marca<input className={input} maxLength={80} value={vehicleForm.brand} onChange={e=>setVehicleForm(x=>({...x,brand:e.target.value}))}/></label><label className={label}>Modelo<input required minLength={2} maxLength={120} className={input} value={vehicleForm.model} onChange={e=>setVehicleForm(x=>({...x,model:e.target.value}))}/></label></div>
    <div className="grid grid-cols-2 gap-2"><label className={label}>Ano<input type="number" min="1950" max="2100" className={input} value={vehicleForm.model_year} onChange={e=>setVehicleForm(x=>({...x,model_year:e.target.value}))}/></label><label className={label}>Placa<input maxLength={12} className={input} value={vehicleForm.plate} onChange={e=>setVehicleForm(x=>({...x,plate:e.target.value.toUpperCase()}))}/></label></div>
    <button disabled={saving||!clients.length} className={button}><Plus size={16}/> Vincular veículo</button>
   </form>
   <section className="rounded-2xl border bg-white p-5"><h3 className="text-lg font-black">Veículos registrados</h3>
    <div className="mt-4 max-h-[530px] space-y-2 overflow-y-auto">{vehicles.length?vehicles.map(v=><div key={v.id} className="flex items-start gap-3 rounded-xl border p-3">{v.vehicle_type==='moto'?<Bike size={20} className="text-orange-600"/>:<CarFront size={20} className="text-orange-600"/>}<div><p className="font-bold">{v.brand} {v.model} {v.model_year??''}</p><p className="text-xs text-slate-500">{clients.find(c=>c.id===v.client_id)?.full_name??'Cliente'} · {v.plate||'Sem placa'}</p></div></div>):<p className="text-sm text-slate-500">Nenhum veículo registrado.</p>}</div>
   </section>
  </div>}
  {view==='services'&&<div className="space-y-4">
   <form onSubmit={addCase} className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2">
    <div className="sm:col-span-2"><h3 className="text-lg font-black">Novo atendimento / assistência</h3><p className="mt-1 text-xs text-slate-500">Revisões, trocas de peças, manutenção e outros serviços realizados pela loja ou oficina.</p></div>
    <label className={label}>Cliente<select required className={input} value={serviceForm.client_id} onChange={e=>setServiceForm(x=>({...x,client_id:e.target.value,vehicle_id:''}))}><option value="">Selecione o cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}</select></label>
    <label className={label}>Veículo<select className={input} value={serviceForm.vehicle_id} onChange={e=>setServiceForm(x=>({...x,vehicle_id:e.target.value}))}><option value="">Sem veículo definido</option>{relevantVehicles.map(v=><option key={v.id} value={v.id}>{v.brand} {v.model} {v.plate}</option>)}</select></label>
    <label className={label}>Tipo de serviço<select className={input} value={serviceForm.service_type} onChange={e=>setServiceForm(x=>({...x,service_type:e.target.value}))}>{Object.entries(SERVICE_TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
    <label className={label}>Data do atendimento (previsão)<input type="datetime-local" className={input} value={serviceForm.scheduled_at} onChange={e=>setServiceForm(x=>({...x,scheduled_at:e.target.value}))}/></label>
    <label className={label+' sm:col-span-2'}>Descrição / título<input required minLength={3} maxLength={160} className={input} placeholder="Ex.: Revisão geral e troca de pastilhas" value={serviceForm.title} onChange={e=>setServiceForm(x=>({...x,title:e.target.value}))}/></label>
    <label className={label+' sm:col-span-2'}>Observações<textarea rows={2} maxLength={2000} className={input} value={serviceForm.description} onChange={e=>setServiceForm(x=>({...x,description:e.target.value}))}/></label>
    <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3"><p className="max-w-md text-xs text-slate-500">O cliente verá o atendimento somente com e-mail correspondente e empresa aprovada. Acesso pode ser revogado.</p><button disabled={saving||!clients.length} className={button}><Plus size={16}/> Criar atendimento</button></div>
   </form>
   <div className="grid items-start gap-4 lg:grid-cols-[minmax(230px,0.36fr)_minmax(0,0.64fr)]">
    <section className="rounded-2xl border bg-white p-4"><h3 className="font-black">Atendimentos</h3>
     <div className="relative mt-3"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input aria-label="Pesquisar atendimentos" className={input+' pl-9'} placeholder="Buscar por serviço ou cliente..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
     <div className="mt-3 max-h-[650px] space-y-2 overflow-y-auto">{filteredCases.length?filteredCases.map(c=><button key={c.id} type="button" onClick={()=>setSelected(c.id)} className={'w-full rounded-xl border p-3 text-left '+(c.id===selected?'border-orange-400 bg-orange-50':'border-slate-200 hover:bg-slate-50')}>
      <p className="text-sm font-bold">{c.title}</p><p className="mt-1 text-xs text-slate-500">{clients.find(v=>v.id===c.client_id)?.full_name??'Cliente'} · {localDate(c.created_at)}</p>
      <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-orange-800">{STATUS_LABELS[c.status]}</span><span className={'rounded-full px-2 py-1 text-[10px] font-bold '+(c.customer_visible?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-600')}>{c.customer_visible?'Cliente conectado':'Interno'}</span></div>
     </button>):<p className="text-sm text-slate-500">Sem atendimentos.</p>}</div>
    </section>
    {current?<div className="space-y-3">
     <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-3">
      <div><p className="text-xs font-bold">Painel de assistência online</p><p className="text-[11px] text-slate-500">{current.customer_email||'Cliente sem e-mail vinculado'}</p></div>
      <button type="button" disabled={saving} onClick={()=>void toggleAccess(current)} className={'rounded-xl px-3 py-2 text-xs font-bold '+(current.customer_visible?'border border-red-200 text-red-700':'bg-emerald-100 text-emerald-900')}>
       {current.customer_visible?'Revogar acesso':'Liberar acesso ao cliente'}
      </button>
     </div>
     <ServiceCaseDetail key={current.id} service={current} isOwner onChanged={refresh}/>
    </div>:<div className="rounded-2xl border bg-white p-8 text-center"><MessageCircle size={33} className="mx-auto text-orange-500"/><h3 className="mt-3 font-bold">Selecione um atendimento</h3><p className="mt-2 text-sm text-slate-500">Visualize orçamento de peças e mão de obra, comunicações, andamento do serviço e entrega programada.</p></div>}
   </div>
  </div>}
  <p className="text-[11px] text-slate-500"><ShieldCheck size={13} className="mr-1 inline"/> Informações pertencem à empresa {businessName}. Clientes só acessam seus atendimentos autorizados após autenticação.</p>
 </div>;
}
