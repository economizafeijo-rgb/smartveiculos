import {createFileRoute,Link} from '@tanstack/react-router';
import {useMemo,useState} from 'react';
import {
 ArrowLeft,ArrowRight,ArrowUpRight,BadgeCheck,Bike,BookOpen,CalendarClock,
 CarFront,CheckCircle2,ClipboardList,Eye,Fuel,Gauge,LockKeyhole,
 Package,Play,Search,ShieldCheck,Store,TrendingUp,Video,Wrench,
 type LucideIcon
} from 'lucide-react';
import {
 DEMO_AREAS,DEMO_PERSONAS,DEMO_STOCK,DEMO_ORDERS,DEMO_VEHICLES,
 DEMO_FUEL,DEMO_SERVICES,formatDemoBRL,demoFuelTotal,
 demoStockValue,demoOpenOrders,isDemoArea,
 type DemoArea,type DemoVehicle,type DemoOrder,type DemoStock,
} from '@/lib/demo/demo-data';
import {VehicleVideoLibrary} from '@/components/garage/VehicleVideoLibrary';
import {servicesForRevision} from '@/lib/garage/manufacturer-service-guide';

type DemoPage='visao'|'veiculos'|'abastecimentos'|'revisoes'|'fipe'|'videos'|'estoque'|'pedidos'|'servicos'|'vitrine';
const PAGE_NAMES:Record<DemoPage,string>={
 visao:'Visão geral',veiculos:'Meus veículos',abastecimentos:'Abastecimentos',
 revisoes:'Revisões',fipe:'Tabela FIPE',videos:'Vídeos e reparos',
 estoque:'Estoque',pedidos:'Pedidos',servicos:'Serviços',vitrine:'Vitrine'
};
const CONFIG:{area:DemoArea;icon:LucideIcon;label:string;short:string}[]=[
 {area:'garage',icon:Gauge,label:'Minha garagem',short:'Proprietário'},
 {area:'parts_cars',icon:CarFront,label:'Autopeças de carros',short:'Loja automotiva'},
 {area:'parts_bikes',icon:Bike,label:'Autopeças de motos',short:'Loja de motocicletas'},
 {area:'workshop',icon:Wrench,label:'Oficina mecânica',short:'Serviços e ordens'},
];
const GARAGE_PAGES:DemoPage[]=['visao','veiculos','abastecimentos','revisoes','fipe','videos'];
const STORE_PAGES:DemoPage[]=['visao','estoque','pedidos','vitrine'];
const WORKSHOP_PAGES:DemoPage[]=['visao','pedidos','servicos','vitrine'];
const formatDate=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('pt-BR');
const number=(n:number)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n);
const card='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const darkCard='rounded-2xl border border-[#527196]/40 bg-[#142941] p-4 text-white shadow-sm';
const btnOff='inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-extrabold text-slate-500 opacity-80';
function PageIcon({id}:{id:DemoPage}){
 const Icon:LucideIcon={
 visao:Gauge,veiculos:CarFront,abastecimentos:Fuel,revisoes:CalendarClock,
 fipe:TrendingUp,videos:Video,estoque:Package,pedidos:ClipboardList,
 servicos:Wrench,vitrine:Store,
 }[id];
 return <Icon size={16}/>;
}

export const Route=createFileRoute('/demonstracao')({
 validateSearch:(search:Record<string,unknown>):{area:DemoArea;pagina?:DemoPage|undefined}=>({
  area:isDemoArea(search['area'])?search['area']:'garage',
  pagina:typeof search['pagina']==='string'&&
    Object.prototype.hasOwnProperty.call(PAGE_NAMES,search['pagina'])
    ?search['pagina'] as DemoPage:undefined
 }),
 head:()=>({meta:[
  {title:'Demonstração gratuita e somente leitura | SmartVeículos'},
  {name:'description',content:'Explore quatro perfis demonstrativos do SmartVeículos com dados fictícios, sem cadastro e sem permissão de gravação.'}
 ]}),
 component:DemoPortal,
});

function ReadonlyBanner(){
 return <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-xs text-slate-100 sm:px-5">
  <span className="flex items-start gap-2"><ShieldCheck className="mt-0.5 shrink-0 text-orange-300" size={17}/>
   <span><strong className="font-black text-white">Demonstração pública — somente visualização.</strong> Dados inteiramente fictícios. Não é uma conta real; nenhuma ação desta página consulta, altera ou exclui registros de clientes.</span>
  </span>
  <a href="/acesso?mode=register" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 font-extrabold text-slate-950 hover:bg-orange-400">Criar minha conta <ArrowRight size={13}/></a>
 </div>;
}
function Metric({title,value,sub,icon:Icon}:{title:string;value:string;sub?:string;icon:LucideIcon}){
 return <div className={card+' min-w-0'}><div className="flex items-center justify-between gap-2">
  <span className="text-xs font-bold text-slate-500">{title}</span>
  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700"><Icon size={18}/></span>
 </div><p className="mt-3 break-words text-2xl font-black text-[#152841]">{value}</p>
  {sub&&<p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
 </div>;
}
function Status({status}:{status:DemoOrder['status']}){
 const label={aberta:'Aberta',em_andamento:'Em andamento',concluida:'Concluída'}[status];
 return <span className={'rounded-full px-2.5 py-1 text-[10px] font-extrabold '+(
  status==='concluida'?'bg-emerald-100 text-emerald-800':
  status==='em_andamento'?'bg-sky-100 text-sky-800':'bg-amber-100 text-amber-800')}>{label}</span>;
}
function SectionTitle({title,desc,children}:{title:string;desc:string;children?:React.ReactNode}){
 return <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
  <div><h2 className="text-lg font-black text-[#13243d] sm:text-xl">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p></div>{children}
 </div>;
}
function DemoPortal(){
 const {area,pagina}=Route.useSearch();
 const persona=DEMO_PERSONAS[area],config=CONFIG.find(x=>x.area===area)!;
 const pages=area==='garage'?GARAGE_PAGES:area==='workshop'?WORKSHOP_PAGES:STORE_PAGES;
 const page=pagina&&pages.includes(pagina)?pagina:'visao';
 const Icon=config.icon;
 return <div className="sv-demo-shell sv-theme-surface min-h-screen bg-[#f3f6fb] pb-16 text-slate-900">
  <header className="border-b border-white/10 bg-[#0d1d34] px-4 py-3 text-white sm:px-6">
   <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
    <a href="/" className="inline-flex items-center gap-2 text-lg font-black tracking-tight">
     <span className="grid size-9 place-items-center rounded-xl bg-orange-500 text-slate-950"><Gauge size={19}/></span>
     Smart<span className="text-orange-300">Veículos</span>
    </a>
    <div className="flex flex-wrap items-center gap-2">
     <span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1.5 text-[11px] font-black text-orange-200"><Eye size={13} className="mr-1 inline"/> Modo demonstração</span>
     <a href="/" className="rounded-lg border border-white/25 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"><ArrowLeft size={14} className="mr-1 inline"/> Início</a>
    </div>
   </div>
  </header>
  <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
   <section className="relative overflow-hidden rounded-[25px] border border-[#5f87b6]/35 bg-gradient-to-r from-[#10223c] via-[#1d3b5d] to-[#203c57] p-5 text-white shadow-lg sm:p-7">
    <div className="pointer-events-none absolute -right-14 -top-20 size-72 rounded-full bg-orange-400/10 blur-3xl"/>
    <div className="relative flex flex-wrap items-start justify-between gap-4">
     <div className="flex min-w-0 items-start gap-4">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/10 text-orange-300 backdrop-blur-lg"><Icon size={27}/></span>
      <div><p className="text-[11px] font-black uppercase tracking-[.18em] text-orange-300">Perfil público de demonstração</p>
       <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{persona.company}</h1>
       <p className="mt-2 text-sm font-semibold text-slate-200">{persona.name} · {persona.role}</p>
       <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">{persona.description}</p>
      </div>
     </div>
     <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-extrabold backdrop-blur-md"><LockKeyhole size={15} className="text-orange-300"/> Sem permissão de inserir, alterar ou excluir</span>
    </div>
   </section>
   <ReadonlyBanner/>
   <section aria-label="Escolha uma área de demonstração">
    <SectionTitle title="Explore os quatro perfis" desc="Troque de perfil sem login. Cada um possui informações fictícias e separadas."/>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{CONFIG.map(c=>{
     const Component=c.icon;return <Link key={c.area} to="/demonstracao" search={{area:c.area,pagina:'visao'}}
      aria-current={area===c.area?'page':undefined}
      className={'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors '+(
       area===c.area?'border-orange-400 bg-[#152942] text-white shadow-md':'border-slate-200 bg-white text-slate-900 hover:border-orange-300 hover:bg-orange-50'
      )}>
      <span className={'grid size-10 shrink-0 place-items-center rounded-xl '+(area===c.area?'bg-orange-500 text-slate-950':'bg-orange-100 text-orange-700')}><Component size={19}/></span>
      <span className="min-w-0"><strong className="block text-xs font-black">{c.label}</strong><span className={'mt-1 block text-[11px] '+(area===c.area?'text-slate-200':'text-slate-500')}>{c.short}</span></span>
     </Link>;
    })}</div>
   </section>
   <nav aria-label={'Páginas de '+config.label} className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
    {pages.map(p=><Link key={p} to="/demonstracao" search={{area,pagina:p}} aria-current={page===p?'page':undefined}
     className={'inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold transition-colors sm:px-4 '+(
      page===p?'bg-[#132941] text-white':'text-slate-700 hover:bg-orange-50 hover:text-orange-800'
     )}><PageIcon id={p}/>{PAGE_NAMES[p]}</Link>)}
   </nav>
   {area==='garage'?<GarageDemo page={page}/>:<BusinessDemo area={area} page={page}/>}
   <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500">
    <p>Exibição ilustrativa, somente leitura. Sem autenticação nem gravação de informações.</p>
    <a href="/acesso?mode=register" className="inline-flex items-center gap-2 font-black text-orange-700 hover:underline">Criar conta real <ArrowUpRight size={14}/></a>
   </footer>
  </main>
 </div>;
}
function GarageDemo({page}:{page:DemoPage}){
 const [vehicleId,setVehicleId]=useState<DemoVehicle['id']>('gol');
 const [query,setQuery]=useState('');
 const vehicle=DEMO_VEHICLES.find(v=>v.id===vehicleId)!;
 const fuels=DEMO_FUEL.filter(v=>v.vehicleId===vehicleId);
 const services=DEMO_SERVICES.filter(v=>v.vehicleId===vehicleId);
 const confirmed=services.filter(v=>v.status==='realizado');
 const total=demoFuelTotal(fuels);
 const plan=servicesForRevision({
  kind:vehicle.kind,name:vehicle.name,modelYear:vehicle.year,
  modelKey:vehicle.id==='gol'?'gol-g6-selecao-2014':'cb650r-2024'
 },vehicle.id==='gol'?190000:18000);
 const monthCost=demoFuelTotal(fuels.filter(v=>v.date.startsWith('2026-10')));
 const selectedServiceRows=services.filter(s=>s.name.toLowerCase().includes(query.toLowerCase()));
 const selector=<label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">Veículo
  <select aria-label="Veículo do perfil demonstrativo" value={vehicleId} onChange={e=>{setVehicleId(e.target.value as DemoVehicle['id']);setQuery('')}} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-bold text-slate-900">
   {DEMO_VEHICLES.map(v=><option key={v.id} value={v.id}>{v.kind==='carro'?'Carro':'Moto'} · {v.name}</option>)}
  </select>
 </label>;
 return <div className="space-y-4">
  {page==='visao'&&<>
   <SectionTitle title="Visão geral da minha garagem" desc="Dois veículos de exemplo com dados independentes."/>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <Metric title="Veículos cadastrados" value="2" icon={CarFront} sub="1 carro · 1 moto"/>
    <Metric title="Gastos em combustível" value={formatDemoBRL(demoFuelTotal(DEMO_FUEL))} icon={Fuel} sub="Período ilustrativo"/>
    <Metric title="Manutenções registradas" value={String(DEMO_SERVICES.filter(s=>s.status==='realizado').length)} icon={Wrench}/>
    <Metric title="Cotação FIPE" value="2 veículos" icon={TrendingUp} sub="Referências históricas ilustrativas"/>
   </div>
   <VehicleCards onPick={setVehicleId} selected={vehicleId}/>
   <div className={card}><h3 className="text-sm font-black text-slate-900">Como funciona esta garagem?</h3>
    <p className="mt-2 text-xs leading-6 text-slate-600">Use as abas acima para consultar gastos, revisões, valores FIPE e tutoriais. Experimente trocar entre o Gol e a Honda. Os botões de cadastro estão bloqueados porque este é um ambiente público somente leitura.</p>
    <button type="button" className={btnOff+' mt-3'} disabled title="Disponível após cadastrar uma conta real"><LockKeyhole size={15}/> Cadastrar novo veículo (bloqueado)</button>
   </div>
  </>}
  {page==='veiculos'&&<><SectionTitle title="Meus veículos" desc="Explore cada ficha, ano, quilometragem e preço de referência."/><VehicleCards onPick={setVehicleId} selected={vehicleId}/></>}
  {page!=='visao'&&page!=='veiculos'&&<>
   <div className={card+' flex flex-wrap items-center justify-between gap-3'}>
    <div><h2 className="text-lg font-black text-slate-900">{PAGE_NAMES[page]}</h2>
     <p className="mt-1 text-xs text-slate-500">Dados fictícios organizados por veículo, para demonstração.</p></div>
    {selector}
   </div>
  </>}
  {page==='abastecimentos'&&<>
   <div className="grid gap-3 sm:grid-cols-3">
    <Metric title="Total do histórico" value={formatDemoBRL(total)} icon={Fuel} sub={fuels.length+' abastecimentos'}/>
    <Metric title="Gasto em outubro" value={formatDemoBRL(monthCost)} icon={CalendarClock} sub="Dados demonstrativos"/>
    <Metric title="Preço médio por litro" value={formatDemoBRL(total/fuels.reduce((n,r)=>n+r.liters,0))} icon={TrendingUp}/>
   </div>
   <div className={card}><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-black text-slate-900">Histórico de abastecimentos</h3>
    <button type="button" disabled className={btnOff}><LockKeyhole size={14}/> Novo abastecimento</button></div>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[550px] text-left text-xs">
     <thead className="bg-slate-50 text-slate-500"><tr>{['Data','Combustível','Odômetro','Litros','Preço/L','Total calculado'].map(h=><th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
     <tbody>{fuels.map(f=><tr key={f.date} className="border-t border-slate-100 text-slate-700">
      <td className="px-3 py-3">{formatDate(f.date)}</td><td className="px-3 py-3">{f.fuel}</td><td className="px-3 py-3">{number(f.km)} km</td>
      <td className="px-3 py-3">{number(f.liters)} L</td><td className="px-3 py-3">{formatDemoBRL(f.priceLiter)}</td>
      <td className="px-3 py-3 font-black">{formatDemoBRL(f.liters*f.priceLiter)}</td>
     </tr>)}</tbody></table></div>
    <p className="mt-3 text-[11px] text-slate-500">Na conta real, os gastos são calculados automaticamente com litros × preço por litro. A demonstração não aceita novos lançamentos.</p>
   </div>
  </>}
  {page==='revisoes'&&<>
   <div className="grid gap-3 sm:grid-cols-3">
    <Metric title="Odômetro ilustrativo" value={number(vehicle.km)+' km'} icon={Gauge}/>
    <Metric title="Serviços registrados" value={String(confirmed.length)} icon={Wrench}/>
    <Metric title="Gasto histórico" value={formatDemoBRL(confirmed.reduce((n,r)=>n+r.value,0))} icon={TrendingUp}/>
   </div>
   <div className={card}><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-black text-slate-900">Histórico de revisões e serviços</h3>
    <button disabled type="button" className={btnOff}><LockKeyhole size={14}/> Registrar revisão</button></div>
    <label className="relative mt-3 block"><Search size={16} className="absolute left-3 top-3 text-slate-500"/>
     <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filtrar por serviço" aria-label="Pesquisar serviço demonstrativo" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900"/></label>
    <div className="mt-3 divide-y divide-slate-100">{selectedServiceRows.map(s=><div key={s.name} className="flex flex-wrap items-center justify-between gap-2 py-3">
     <div><p className="text-xs font-black text-slate-900">{s.name}</p><p className="mt-1 text-[11px] text-slate-500">{formatDate(s.date)} · {number(s.km)} km</p></div>
     <div className="text-right"><span className={'rounded-full px-2 py-1 text-[10px] font-bold '+(s.status==='realizado'?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-900')}>{s.status==='realizado'?'Registrado':'A conferir'}</span><p className="mt-1 text-xs font-black">{s.status==='realizado'?formatDemoBRL(s.value):'—'}</p></div>
    </div>)}</div>
   </div>
   {plan&&<div className={card}><SectionTitle title="O que a montadora recomenda?" desc={plan.notice}>
    <a href={plan.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700"><BookOpen size={14}/> Consultar fonte <ArrowUpRight size={13}/></a></SectionTitle>
    <p className="mb-3 text-sm font-black text-slate-900">Revisão ilustrativa de {number(plan.revisionKm)} km</p>
    <div className="grid gap-2 sm:grid-cols-2">{plan.items.slice(0,12).map(item=><div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
     <div className="flex justify-between gap-2"><p className="text-xs font-black text-slate-900">{item.title}</p>
     <span className="text-[10px] font-black text-orange-700">{item.action==='trocar'?'Trocar':'Conferir'}</span></div>
     <p className="mt-1 text-[11px] text-slate-600">{item.interval}</p>
    </div>)}</div>
    <p className="mt-3 text-[11px] text-slate-500">Esta visualização não marca revisões como concluídas.</p>
   </div>}
  </>}
  {page==='fipe'&&<div className={card}>
   <SectionTitle title={'Valor FIPE de '+vehicle.name} desc="Exemplo histórico para explorar a apresentação do sistema. Não é uma cotação em tempo real."/>
   <p className="text-4xl font-black tracking-tight text-slate-900">{formatDemoBRL(vehicle.fipeValue)}</p>
   <p className="mt-3 text-xs font-semibold text-slate-600">Código FIPE: {vehicle.fipeCode} · Referência: {vehicle.fipeMonth}</p>
   <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">Os valores nesta demonstração são exemplos históricos. Na conta real, a consulta depende da versão do veículo e da resposta da fonte FIPE.</p>
   <button type="button" disabled className={btnOff+' mt-4'}><LockKeyhole size={15}/> Atualizar cotação real — somente conta cadastrada</button>
  </div>}
  {page==='videos'&&<VehicleVideoLibrary key={vehicle.id} vehicle={{
   kind:vehicle.kind,name:vehicle.name,modelYear:vehicle.year,
   modelKey:vehicle.id==='gol'?'gol-g6-selecao-2014':'cb650r-2024'
  }}/>}
 </div>;
}
function VehicleCards({selected,onPick}:{selected:DemoVehicle['id'];onPick:(id:DemoVehicle['id'])=>void}){
 return <div className="grid gap-3 sm:grid-cols-2">{DEMO_VEHICLES.map(v=>{
  const Icon=v.kind==='carro'?CarFront:Bike;
  return <button key={v.id} onClick={()=>onPick(v.id)} type="button" aria-pressed={selected===v.id}
   className={'min-w-0 rounded-2xl border p-5 text-left transition-colors '+(selected===v.id?'border-orange-400 bg-[#172c48] text-white shadow-md':'border-slate-200 bg-white text-slate-900 hover:border-orange-300')}>
   <div className="flex justify-between gap-2"><Icon size={27} className="text-orange-500"/>
    <span className={'rounded-full px-2.5 py-1 text-[11px] font-bold '+(selected===v.id?'bg-orange-500/20 text-orange-200':'bg-slate-100 text-slate-600')}>{selected===v.id?'Selecionado':'Ver ficha'}</span></div>
   <h3 className="mt-4 text-lg font-black">{v.name}</h3><p className={'mt-1 text-xs '+(selected===v.id?'text-slate-300':'text-slate-500')}>{v.year} · {number(v.km)} km</p>
   <div className={'mt-4 border-t pt-4 '+(selected===v.id?'border-white/20':'border-slate-100')}>
    <span className="text-[11px] font-bold">FIPE demonstrativa</span><p className="mt-1 text-xl font-black">{formatDemoBRL(v.fipeValue)}</p><p className="text-[11px]">{v.fipeMonth}</p>
   </div>
  </button>;
 })}</div>;
}
function BusinessDemo({area,page}:{area:Exclude<DemoArea,'garage'>;page:DemoPage}){
 const isShop=area!=='workshop';
 const stock=area==='workshop'?[]:DEMO_STOCK[area];
 const orders=DEMO_ORDERS[area];
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState<'todos'|DemoOrder['status']>('todos');
 const [selectedOrder,setSelectedOrder]=useState<string|null>(null);
 const filteredStock=useMemo(()=>stock.filter(p=>
  [p.name,p.application,p.sku,p.category].some(t=>t.toLowerCase().includes(search.toLowerCase()))
 ),[stock,search]);
 const filteredOrders=useMemo(()=>orders.filter(o=>
  (status==='todos'||o.status===status)&&
  [o.customer,o.vehicle,o.service,o.id].some(t=>t.toLowerCase().includes(search.toLowerCase()))
 ),[orders,status,search]);
 const focused=orders.find(o=>o.id===selectedOrder);
 const estimated=orders.reduce((sum,o)=>sum+o.value,0);
 const listHeading=isShop?'Solicitações e pedidos':'Ordens de serviço';
 return <div className="space-y-4">
  {page==='visao'&&<>
   <SectionTitle title="Painel de gestão demonstrativo" desc={isShop?'Controle ilustrativo de peças, estoque e solicitações.':'Ordens de serviço e etapas de atendimento em uma oficina fictícia.'}/>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <Metric title={isShop?'Peças no catálogo':'Ordens de serviço'} value={String(isShop?stock.length:orders.length)} icon={isShop?Package:ClipboardList}/>
    <Metric title={isShop?'Itens disponíveis':'Em atendimento'} value={String(isShop?stock.reduce((v,p)=>v+p.quantity,0):demoOpenOrders(orders))} icon={Wrench}/>
    <Metric title={isShop?'Valor do estoque':'Orçamentos apresentados'} value={formatDemoBRL(isShop?demoStockValue(stock):estimated)} icon={TrendingUp} sub="Valores fictícios"/>
    <Metric title="Pedidos pendentes" value={String(demoOpenOrders(orders))} icon={CalendarClock}/>
   </div>
   <div className="grid gap-3 lg:grid-cols-2">
    <section className={card}><SectionTitle title="Atividade recente" desc="Pedidos exibidos exclusivamente com dados de exemplo."/>
     <OrdersList orders={orders.slice(0,3)} onSelect={setSelectedOrder}/></section>
    <section className={darkCard}><p className="text-xs font-extrabold uppercase tracking-widest text-orange-300">O que você pode fazer na conta real</p>
     <h3 className="mt-3 text-xl font-black text-white">{isShop?'Controle de autopeças':'Gestão de oficina'}</h3>
     <p className="mt-2 text-sm leading-6 text-slate-200">{isShop?'Pesquisar aplicações, organizar disponibilidade, consultar preços e acompanhar solicitações de clientes.':'Acompanhar veículos por ordem de serviço, orçamentos, reparos e situação dos atendimentos.'}</p>
     <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-orange-200"><ShieldCheck size={17}/> Ações de escrita bloqueadas para visitantes</span>
    </section>
   </div>
  </>}
  {page==='estoque'&&isShop&&<section className={card}>
   <SectionTitle title="Catálogo e controle do estoque" desc="Pesquise peças pelo código, aplicação ou categoria.">
    <button type="button" disabled className={btnOff}><LockKeyhole size={14}/> Cadastrar peça</button></SectionTitle>
   <SearchField value={search} onChange={setSearch} placeholder="Buscar peça, SKU, aplicação…" />
   <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[630px] text-left text-xs">
    <thead className="bg-slate-50 text-slate-500"><tr>{['Código','Descrição','Aplicação','Categoria','Saldo','Preço ilustrativo'].map(h=><th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
    <tbody>{filteredStock.map(p=><tr key={p.id} className="border-t border-slate-100 text-slate-700">
     <td className="px-3 py-3 font-bold">{p.sku}</td><td className="px-3 py-3 font-black text-slate-900">{p.name}</td>
     <td className="px-3 py-3">{p.application}</td><td className="px-3 py-3">{p.category}</td>
     <td className="px-3 py-3">{p.quantity}</td><td className="px-3 py-3 font-black">{formatDemoBRL(p.price)}</td>
    </tr>)}</tbody></table></div>
   {filteredStock.length===0&&<p className="py-5 text-center text-xs text-slate-500">Nenhuma peça encontrada.</p>}
  </section>}
  {page==='pedidos'&&<section className={card}>
   <SectionTitle title={listHeading} desc="Filtre e abra um atendimento para ver detalhes, sem modificar seu status.">
    <button type="button" disabled className={btnOff}><LockKeyhole size={14}/> {isShop?'Novo pedido':'Nova ordem de serviço'}</button></SectionTitle>
   <div className="flex flex-wrap gap-2">
    <div className="min-w-[170px] flex-1"><SearchField value={search} onChange={setSearch} placeholder="Pesquisar atendimento…"/></div>
    <label className="flex items-center gap-2 text-xs font-bold text-slate-600">Status
     <select value={status} onChange={e=>setStatus(e.target.value as typeof status)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs">
      <option value="todos">Todos</option><option value="aberta">Abertos</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluídos</option>
     </select></label>
   </div>
   <div className="mt-4"><OrdersList orders={filteredOrders} onSelect={setSelectedOrder}/></div>
   {focused&&<OrderDetail order={focused} onClose={()=>setSelectedOrder(null)}/>}
  </section>}
  {page==='vitrine'&&<section className={card}>
   <SectionTitle title={isShop?'Vitrine de peças demonstrativas':'Vitrine de serviços da oficina'} desc="Informações de exemplo; publicação e edição não estão disponíveis nesta demonstração."/>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {(isShop?stock:orders).map(item=>('sku' in item
     ?<div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black text-orange-800">{item.category}</span><h3 className="mt-3 text-sm font-black text-slate-900">{item.name}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{item.application}</p><p className="mt-4 text-xl font-black text-slate-900">{formatDemoBRL(item.price)}</p><p className="mt-1 text-[11px] text-slate-500">Disponível: {item.quantity}</p></div>
     :<div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black text-orange-800">Serviço demonstrativo</span><h3 className="mt-3 text-sm font-black text-slate-900">{item.service}</h3><p className="mt-2 text-xs text-slate-500">{item.vehicle}</p><p className="mt-4 text-xl font-black">{formatDemoBRL(item.value)}</p></div>
    ))}</div>
   <button type="button" disabled className={btnOff+' mt-4'}><LockKeyhole size={14}/> Publicar item (bloqueado)</button>
  </section>}
  {page==='servicos'&&!isShop&&<section className={card}>
   <SectionTitle title="Acompanhamento de serviços" desc="Confira os status de cada ordem de serviço sem modificar dados."/>
   <div className="space-y-3">{orders.map(order=><div key={order.id} className="rounded-xl border border-slate-200 p-4">
    <div className="flex flex-wrap justify-between gap-2"><div><h3 className="text-sm font-black text-slate-900">{order.id} · {order.vehicle}</h3><p className="mt-1 text-xs text-slate-500">{order.service} · {formatDate(order.date)}</p></div><Status status={order.status}/></div>
    <div className="mt-3 grid grid-cols-3 gap-1">
     {['Recebimento','Serviço','Entrega'].map((step,i)=>{const active=order.status==='concluida'||order.status==='em_andamento'&&i<=1||order.status==='aberta'&&i===0;return <div key={step} className={'rounded-lg px-2 py-2 text-center text-[10px] font-bold '+(active?'bg-orange-100 text-orange-900':'bg-slate-100 text-slate-500')}>{active?<CheckCircle2 size={13} className="mr-1 inline"/>:null}{step}</div>})}</div>
   </div>)}</div>
   <button type="button" className={btnOff+' mt-4'} disabled><LockKeyhole size={14}/> Atualizar andamento (bloqueado)</button>
  </section>}
  {focused&&page==='visao'&&<OrderDetail order={focused} onClose={()=>setSelectedOrder(null)}/>}
 </div>;
}
function SearchField({value,onChange,placeholder}:{value:string;onChange:(value:string)=>void;placeholder:string}){
 return <label className="relative block"><span className="sr-only">{placeholder}</span>
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
   className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-orange-400"/>
 </label>;
}
function OrdersList({orders,onSelect}:{orders:readonly DemoOrder[];onSelect:(value:string)=>void}){
 if(!orders.length)return <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">Nenhuma solicitação encontrada.</p>;
 return <div className="divide-y divide-slate-100">{orders.map(order=><button type="button" key={order.id}
  onClick={()=>onSelect(order.id)} className="flex w-full flex-wrap items-center justify-between gap-3 py-3 text-left hover:bg-orange-50/50">
  <div><p className="text-xs font-black text-slate-900">{order.id} · {order.vehicle}</p>
   <p className="mt-1 text-xs text-slate-600">{order.service}</p><p className="mt-1 text-[11px] text-slate-500">{order.customer} · {formatDate(order.date)}</p></div>
  <div className="flex items-center gap-2"><div className="text-right"><Status status={order.status}/><p className="mt-1 text-xs font-black">{formatDemoBRL(order.value)}</p></div><ArrowRight size={16} className="text-orange-600"/></div>
 </button>)}</div>;
}
function OrderDetail({order,onClose}:{order:DemoOrder;onClose:()=>void}){
 return <div className="mt-4 rounded-2xl border border-orange-300 bg-orange-50/70 p-4">
  <div className="flex justify-between gap-2"><h3 className="text-sm font-black text-slate-900">Detalhes de {order.id}</h3>
   <button type="button" onClick={onClose} className="text-xs font-black text-orange-700 hover:underline">Fechar</button></div>
  <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2"><p><strong>Cliente:</strong> {order.customer}</p><p><strong>Veículo:</strong> {order.vehicle}</p>
   <p><strong>Serviço:</strong> {order.service}</p><p><strong>Data:</strong> {formatDate(order.date)}</p>
   <p><strong>Valor ilustrativo:</strong> {formatDemoBRL(order.value)}</p><p><strong>Status:</strong> {order.status.replace('_',' ')}</p></div>
  <button type="button" disabled className={btnOff+' mt-3'}><LockKeyhole size={14}/> Alterar status (bloqueado)</button>
 </div>;
}
