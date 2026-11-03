import {createFileRoute,Link} from '@tanstack/react-router';
import {DemoQRCode} from '@/components/demo/DemoQRCode';
import {DemoSimulator,type Cart} from '@/components/demo/DemoSimulator';
import {useMemo,useState} from 'react';
import {
 ArrowLeft,ArrowRight,ArrowUpRight,BadgeCheck,Bike,BookOpen,CalendarClock,
 CarFront,CheckCircle2,ClipboardList,Eye,Fuel,Gauge,LockKeyhole,ListChecks,MessageCircle,ShoppingCart,
 Package,Play,Search,ShieldCheck,Store,TrendingUp,Video,Wrench,
 type LucideIcon
} from 'lucide-react';
import {
 DEMO_PERSONAS,DEMO_STOCK,DEMO_ORDERS,DEMO_WORKSHOP_SERVICES,
 formatDemoBRL,demoStockValue,demoOpenOrders,isDemoArea,
 type DemoArea,type DemoOrder,
} from '@/lib/demo/demo-data';

type DemoPage='visao'|'veiculos'|'abastecimentos'|'revisoes'|'fipe'|'videos'|'estoque'|'pedidos'|'servicos'|'vitrine'|'simular'|'chat'|'acompanhar';
const PAGE_NAMES:Record<DemoPage,string>={
 visao:'Visão geral',veiculos:'Meus veículos',abastecimentos:'Abastecimentos',
 revisoes:'Revisões',fipe:'Tabela FIPE',videos:'Vídeos e reparos',
 estoque:'Estoque',pedidos:'Pedidos',servicos:'Serviços',vitrine:'Vitrine',simular:'Simular compra/OS',chat:'Chat de teste',acompanhar:'Acompanhar etapas'
};
const CONFIG:{area:DemoArea;icon:LucideIcon;label:string;short:string}[]=[
 {area:'garage',icon:Gauge,label:'Minha garagem',short:'Proprietário'},
 {area:'parts_cars',icon:CarFront,label:'Autopeças de carros',short:'Loja automotiva'},
 {area:'parts_bikes',icon:Bike,label:'Autopeças de motos',short:'Loja de motocicletas'},
 {area:'workshop',icon:Wrench,label:'Oficina mecânica',short:'Serviços e ordens'},
];
const GARAGE_PAGES:DemoPage[]=['visao','veiculos','abastecimentos','revisoes','fipe','videos'];
const STORE_PAGES:DemoPage[]=['visao','estoque','pedidos','vitrine','simular','chat','acompanhar'];
const WORKSHOP_PAGES:DemoPage[]=['visao','pedidos','servicos','vitrine','simular','chat','acompanhar'];
const formatDate=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('pt-BR');
const number=(n:number)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n);
const card='sv-demo-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const darkCard='sv-demo-feature-panel rounded-2xl border border-[#527196]/40 bg-[#142941] p-4 text-white shadow-sm';
const btnOff='sv-demo-disabled inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-extrabold text-slate-500 opacity-80';
function PageIcon({id}:{id:DemoPage}){
 const Icon:LucideIcon={
 visao:Gauge,veiculos:CarFront,abastecimentos:Fuel,revisoes:CalendarClock,
 fipe:TrendingUp,videos:Video,estoque:Package,pedidos:ClipboardList,
 servicos:Wrench,vitrine:Store,simular:ShoppingCart,chat:MessageCircle,acompanhar:ListChecks,
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
 return <div role="note" aria-label="Aviso de demonstração"
  className="sv-demo-readonly flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-orange-400/25 bg-orange-500/[.065] px-3 py-2.5 text-[11px] text-slate-200 sm:px-4">
  <span className="inline-flex items-center gap-2">
   <Eye className="shrink-0 text-orange-300" size={15}/>
   <strong className="font-extrabold text-orange-200">Modo demonstração</strong>
   <span className="text-slate-300">Explore simulações com dados inventados. Nenhuma compra, conversa ou OS é enviada para clientes reais.</span>
  </span>
  <a href="/acesso?mode=register" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-300/30 px-2.5 py-1.5 text-[11px] font-bold text-orange-200 hover:bg-orange-500/10">
   Criar conta <ArrowRight size={13}/>
  </a>
 </div>;
}
function Metric({title,value,sub,icon:Icon}:{title:string;value:string;sub?:string;icon:LucideIcon}){
 return <div className={card+' min-w-0'}><div className="flex items-center justify-between gap-2">
  <span className="text-xs font-bold text-slate-500">{title}</span>
  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700"><Icon size={18}/></span>
 </div><p className="sv-demo-metric-value mt-3 break-words text-2xl font-black text-[#152841]">{value}</p>
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
  <div><h2 className="sv-demo-section-title text-lg font-black text-[#13243d] sm:text-xl">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p></div>{children}
 </div>;
}
function DemoPortal(){
 const {area,pagina}=Route.useSearch();
 const persona=DEMO_PERSONAS[area],config=CONFIG.find(x=>x.area===area)!;
 const pages=area==='garage'?GARAGE_PAGES:area==='workshop'?WORKSHOP_PAGES:STORE_PAGES;
 const page=pagina&&pages.includes(pagina)?pagina:'visao';
 const Icon=config.icon;
 return <div className="sv-demo-shell sv-theme-surface min-h-screen bg-[#f3f6fb] pb-16 text-slate-900">
  <header className="sv-demo-header border-b border-white/10 bg-[#0d1d34] px-4 py-3 text-white sm:px-6">
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
   <section className="sv-demo-hero relative overflow-hidden rounded-[25px] border border-[#5f87b6]/35 bg-gradient-to-r from-[#10223c] via-[#1d3b5d] to-[#203c57] p-5 text-white shadow-lg sm:p-7">
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
     <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-semibold text-slate-200 backdrop-blur-md"><Eye size={14} className="text-orange-300"/> Prévia somente leitura</span>
    </div>
   </section>
   <ReadonlyBanner/>
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm sm:p-4">
    <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700">Link exclusivo desta área</p>
     <p className="mt-1 text-sm font-black text-slate-900">{config.label}</p>
     <p className="mt-1 text-xs text-slate-600">QR Code exclusivo desta demonstração; não contém informações particulares.</p>
    </div>
    <DemoQRCode area={area} label={config.label} compact/>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-xs font-semibold text-slate-600">Você está conhecendo apenas a área de <strong className="text-slate-900">{config.label}</strong>.</p>
    <a href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-orange-700 hover:border-orange-300">
     Escolher outra área <ArrowUpRight size={14}/>
    </a>
   </div>
   <nav aria-label={'Páginas de '+config.label} className="sv-demo-page-nav flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
    {pages.map(p=><Link key={p} to="/demonstracao" search={{area,pagina:p}} aria-current={page===p?'page':undefined}
     className={'inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold transition-colors sm:px-4 '+(
      page===p?'bg-[#132941] text-white':'text-slate-700 hover:bg-orange-50 hover:text-orange-800'
     )}><PageIcon id={p}/>{PAGE_NAMES[p]}</Link>)}
   </nav>
   {area==='garage'?<GarageDemo page={page}/>:<BusinessDemo key={area} area={area} page={page}/>}
   <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500">
    <p>Exibição ilustrativa, somente leitura. Sem autenticação nem gravação de informações.</p>
    <a href="/acesso?mode=register" className="inline-flex items-center gap-2 font-black text-orange-700 hover:underline">Criar conta real <ArrowUpRight size={14}/></a>
   </footer>
  </main>
 </div>;
}
/**
 * Visitante nunca acessa fichas de clientes ou dados de um veículo real.
 * Essa prévia explica os módulos e apresenta campos desativados, sem cadastro
 * de carro/moto e sem consulta ao Supabase, à FIPE ou a historicos pessoais.
 */
const GARAGE_FEATURES=[
 {page:'veiculos',title:'Minha garagem',detail:'Cadastro privado de carros e motos, quilometragem e ficha técnica.',icon:CarFront},
 {page:'abastecimentos',title:'Abastecimentos',detail:'Registro de litros, preço por litro e análise de gastos.',icon:Fuel},
 {page:'revisoes',title:'Revisões e manutenções',detail:'Agenda, serviços, valores e recomendações do fabricante.',icon:CalendarClock},
 {page:'fipe',title:'Tabela FIPE',detail:'Consulta atualizada conforme o veículo do próprio cliente.',icon:TrendingUp},
 {page:'videos',title:'Vídeos de reparos',detail:'Biblioteca particular filtrada pelo modelo e ano do veículo.',icon:Video},
] as const;
function GarageDemo({page}:{page:DemoPage}){
 const selected=GARAGE_FEATURES.find(f=>f.page===page);
 const Icon=selected?.icon??CarFront;
 return <div className="space-y-4">
  {page==='visao'?<>
   <SectionTitle title="Conheça sua garagem digital" desc="Prévia sem veículos de clientes: clique nos serviços para entender as funções de uma conta particular."/>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {GARAGE_FEATURES.map(feature=>{
     const FeatureIcon=feature.icon;
     return <Link key={feature.page} to="/demonstracao" search={{area:'garage',pagina:feature.page}}
      className={card+' group flex min-h-32 flex-col justify-between gap-3 hover:border-orange-400'}>
      <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-[#142941] text-orange-300"><FeatureIcon size={22}/></span>
       <ArrowUpRight size={18} className="text-orange-600"/></div>
      <div><h3 className="text-sm font-black text-slate-900">{feature.title}</h3>
       <p className="mt-1 text-xs leading-5 text-slate-600">{feature.detail}</p></div>
     </Link>;
    })}
   </div>
  </>:<>
   <div className={card+' space-y-4'}>
    <div className="flex flex-wrap items-start gap-3">
     <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#142941] text-orange-300"><Icon size={24}/></span>
     <div className="min-w-0 flex-1"><h2 className="text-lg font-black text-slate-900">{selected?.title??'Garagem'}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-600">{selected?.detail}</p></div>
     <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">Nenhum cadastro exibido</span>
    </div>
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
     <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#182f4d] text-orange-300"><LockKeyhole size={26}/></span>
     <h3 className="mt-3 text-base font-black text-slate-900">Dados dos proprietários são privados</h3>
     <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-600">
      A demonstração não exibe veículos cadastrados, placas, quilometragem, abastecimentos, preços FIPE, revisões ou vídeos personalizados de outras pessoas.
      O conteúdo desta ferramenta é preenchido exclusivamente na conta particular de cada cliente.
     </p>
    </div>
    {page==='abastecimentos'&&<div className="grid gap-3 sm:grid-cols-3">
     {['Data do abastecimento','Litros abastecidos','Valor por litro (R$)'].map(name=><label key={name} className="grid gap-1 text-xs font-bold text-slate-600">
      {name}<input disabled placeholder="Disponível na conta do proprietário" className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-xs" /></label>)}
    </div>}
    {page==='revisoes'&&<div className="grid gap-2 sm:grid-cols-3">
     {['Plano por quilometragem','Histórico de serviços','Alertas e manuais'].map(title=><div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-extrabold text-slate-900">{title}</p><p className="mt-2 text-[11px] text-slate-600">Personalizado depois que o proprietário cadastrar seu veículo.</p></div>)}
    </div>}
    {page==='fipe'&&<p className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-xs leading-6 text-orange-900">Os valores FIPE não são simulados para veículos de terceiros. Consulte o valor do seu próprio carro ou moto após entrar em sua garagem.</p>}
    {page==='videos'&&<p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-6 text-blue-900">Cada biblioteca é exclusiva do modelo cadastrado. O acervo não utiliza veículos de outras contas para gerar a demonstração pública.</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
     <p className="max-w-xl text-xs leading-5 text-slate-600">Navegação liberada para conhecer a estrutura. Nenhum dado particular é compartilhado com visitantes.</p>
     <a href="/acesso?mode=register" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-slate-950 hover:bg-orange-400">Criar minha garagem gratuita <ArrowRight size={15}/></a>
    </div>
   </div>
  </>}
 </div>;
}

/** Fotos de categoria ilustrativas, não são fotos dos SKUs, anúncios ou inventário reais. */
const PRODUCT_PHOTOS:Record<string,string>={
 'car-filter-oil':'https://api.autoplanet.cl/medias/sys_master/images/ha3/h4f/9966083112990/400x400_Repuestos/400x400-Repuestos.png',
 'car-brake-pad':'https://api.autoplanet.cl/medias/sys_master/images/ha3/h4f/9966083112990/400x400_Repuestos/400x400-Repuestos.png',
 'car-spark':'https://repuestos.toyotainalmotors.cl/assets/banner2-xxOGrIQs.jpg',
 'car-air-filter':'https://api.autoplanet.cl/medias/sys_master/images/ha3/h4f/9966083112990/400x400_Repuestos/400x400-Repuestos.png',
 'car-belt':'https://cdn.autodoc.de/thumb?id=7487293&lng=en&m=0&n=0&rev=94077955',
 'car-battery':'https://www.cdiscount.com/pdt2/6/3/0/1/700x700/exi3661024034630/rw/batterie-exide-excell-lb2-12v-60ah-540a-242x175x17.jpg',
 'car-cabin':'https://repuestos.toyotainalmotors.cl/assets/banner2-xxOGrIQs.jpg',
 'car-shock':'https://repuestos.toyotainalmotors.cl/assets/banner2-xxOGrIQs.jpg',
 'bike-filter-oil':'https://gxmotor.co/cdn/shop/files/29848.jpg?v=1767030540&width=1000',
 'bike-brake-pad':'https://images.tcdn.com.br/img/img_prod/983748/kit_relacao_para_moto_nx_400_falcon_coxim_pastilha_traseira_dianteira_filtro_de_oleo_3279_1_a9f5a13b9989cb33faec49673cfb12da.jpg',
 'bike-chain-kit':'https://nicheindustries.com/cdn/shop/files/15kit_mk1013135_1.jpg?v=1747145798',
 'bike-air-filter':'https://gxmotor.co/cdn/shop/files/29848.jpg?v=1767030540&width=1000',
 'bike-spark':'https://images.tcdn.com.br/img/img_prod/983748/kit_relacao_para_moto_nx_400_falcon_coxim_pastilha_traseira_dianteira_filtro_de_oleo_3279_1_a9f5a13b9989cb33faec49673cfb12da.jpg',
 'bike-gloves':'https://www.outletmotostorevalencia.com/web/image/190272/ms-guantes-moto-homologados--3-2026-07-23.jpg',
 'bike-clutch':'https://nicheindustries.com/cdn/shop/files/15kit_mk1013135_1.jpg?v=1747145798',
 'bike-tire':'https://ubikemotos.cl/36275-large_default/neumatico-eurogrip-120-70-zr17-m-c-58w-roadhound-tl.jpg'
};
function ProductCard({product,sector,onAdd}:{product:(typeof DEMO_STOCK.parts_cars)[number];sector:'parts_cars'|'parts_bikes';onAdd:(id:string)=>void}){
 const Icon=sector==='parts_cars'?CarFront:Bike;
 return <article className="sv-demo-product-card flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <div className="relative mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[#f0f3f7]">
   <img loading="lazy" src={PRODUCT_PHOTOS[product.id]} alt={'Foto ilustrativa da categoria '+product.category}
    className="h-full w-full object-contain p-2" onError={e=>{e.currentTarget.style.display='none'}}/>
   <span className="absolute bottom-2 left-2 rounded-md border border-white/60 bg-white/90 px-2 py-1 text-[9px] font-extrabold text-slate-700">Ilustração de categoria</span>
  </div>
  <div className="flex items-center justify-between gap-3">
   <span className="grid size-9 place-items-center rounded-xl bg-[#152c48] text-orange-300"><Icon size={19}/></span>
   <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-800">{product.category}</span>
  </div>
  <h3 className="mt-4 text-sm font-black text-slate-900">{product.name}</h3>
  <p className="mt-1 text-[11px] font-semibold text-slate-500">{product.sku}</p>
  <p className="mt-3 flex-1 text-xs leading-5 text-slate-600">{product.application}</p>
  <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-200 pt-3">
   <div><p className="text-[10px] font-bold text-slate-500">Preço demonstrativo</p><p className="text-lg font-black text-slate-900">{formatDemoBRL(product.price)}</p></div>
   <span className="text-[11px] font-semibold text-slate-600">{product.quantity} un. (exemplo)</span>
  </div>
  <button type="button" onClick={()=>onAdd(product.id)}
   className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2.5 text-xs font-black text-orange-800 hover:bg-orange-100">
   <ShoppingCart size={15}/> Adicionar à compra de teste
  </button>
 </article>;
}
function WorkshopServiceCard({item}:{item:(typeof DEMO_WORKSHOP_SERVICES)[number]}){
 return <article className="sv-demo-product-card flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <div className="flex items-center justify-between gap-2">
   <span className="grid size-11 place-items-center rounded-xl bg-[#152c48] text-orange-300"><Wrench size={22}/></span>
   <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-800">{item.category}</span>
  </div>
  <h3 className="mt-4 text-sm font-black text-slate-900">{item.name}</h3>
  <p className="mt-2 flex-1 text-xs leading-5 text-slate-600">{item.description}</p>
  <p className="mt-4 border-t border-slate-200 pt-3 text-[11px] font-bold text-slate-600">Valor ilustrativo a partir de <strong className="block text-lg font-black text-slate-900">{formatDemoBRL(item.priceFrom)}</strong></p>
 </article>;
}
function BusinessDemo({area,page}:{area:Exclude<DemoArea,'garage'>;page:DemoPage}){
 const isShop=area!=='workshop';
 const stock=area==='workshop'?[]:DEMO_STOCK[area];
 const orders=DEMO_ORDERS[area];
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState<'todos'|DemoOrder['status']>('todos');
 const [selectedOrder,setSelectedOrder]=useState<string|null>(null);
 const [cart,setCart]=useState<Cart>({});
 const [cartNotice,setCartNotice]=useState('');
 function addProduct(id:string){
  setCart(previous=>({...previous,[id]:Math.min(9,(previous[id]??0)+1)}));
  setCartNotice('Peça adicionada à simulação. Abra a aba “Simular compra/OS” para finalizar o teste.');
 }
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
  {cartNotice&&<div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-bold text-orange-900">
   <span>{cartNotice}</span>
   <Link to="/demonstracao" search={{area,pagina:'simular'}} onClick={()=>setCartNotice('')}
    className="inline-flex items-center gap-1 rounded-lg border border-orange-300 px-3 py-2 font-black">Abrir simulação <ArrowRight size={13}/></Link>
  </div>
  {page==='visao'&&<>
   <SectionTitle title="Painel de gestão demonstrativo" desc={isShop?'Controle ilustrativo de peças, estoque e solicitações.':'Ordens de serviço e etapas de atendimento em uma oficina fictícia.'}/>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <Metric title={isShop?'Peças no catálogo':'Ordens de serviço'} value={String(isShop?stock.length:orders.length)} icon={isShop?Package:ClipboardList}/>
    <Metric title={isShop?'Itens disponíveis':'Em atendimento'} value={String(isShop?stock.reduce((v,p)=>v+p.quantity,0):demoOpenOrders(orders))} icon={Wrench}/>
    <Metric title={isShop?'Valor do estoque':'Orçamentos apresentados'} value={formatDemoBRL(isShop?demoStockValue(stock):estimated)} icon={TrendingUp} sub="Valores fictícios"/>
    <Metric title="Pedidos pendentes" value={String(demoOpenOrders(orders))} icon={CalendarClock}/>
   </div>
   {isShop?<section className={card+' space-y-4'}>
    <SectionTitle title={area==='parts_cars'?'Peças automotivas de demonstração':'Motopeças de demonstração'}
     desc={area==='parts_cars'?'Catálogo exclusivo de peças para carros. Preços e saldos são exemplos, sem produtos reais.':'Catálogo exclusivo para motocicletas, sem peças de automóveis.'}>
     <Link to="/demonstracao" search={{area,pagina:'estoque'}}
      className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black text-orange-800 hover:bg-orange-100">
      Ver todo o catálogo <ArrowRight size={15}/>
     </Link>
    </SectionTitle>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
     {stock.slice(0,4).map(item=><ProductCard key={item.id} product={item} sector={area==='parts_bikes'?'parts_bikes':'parts_cars'} onAdd={addProduct}/>)}
    </div>
   </section>:<section className={card+' space-y-4'}>
    <SectionTitle title="Serviços demonstrativos da oficina" desc="Serviços de exemplo próprios da oficina, sem peças ou cadastros de outras áreas."/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     {DEMO_WORKSHOP_SERVICES.slice(0,3).map(item=><WorkshopServiceCard key={item.id} item={item}/>)}
    </div>
   </section>}
   <div className="grid gap-3 lg:grid-cols-2">
    <section className={card}><SectionTitle title={isShop?'Pedidos recentes da loja':'Ordens de serviço recentes'} desc="Registros de demonstração, sem dados de clientes reais."/>
     <OrdersList orders={orders.slice(0,3)} onSelect={setSelectedOrder}/></section>
    <section className={darkCard}><p className="text-xs font-extrabold uppercase tracking-widest text-orange-300">O que você pode fazer na conta real</p>
     <h3 className="mt-3 text-xl font-black text-white">{isShop?'Controle de autopeças':'Gestão de oficina'}</h3>
     <p className="mt-2 text-sm leading-6 text-slate-200">{isShop?'Pesquisar aplicações, organizar disponibilidade, consultar preços e acompanhar solicitações de clientes.':'Acompanhar veículos por ordem de serviço, orçamentos, reparos e situação dos atendimentos.'}</p>
     <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-orange-200"><ShieldCheck size={17}/> Ações de escrita bloqueadas para visitantes</span>
    </section>
   </div>
  </>}
  {page==='estoque'&&isShop&&<section className={card}>
   <SectionTitle title={area==='parts_cars'?'Estoque de autopeças para carros':'Estoque exclusivo de motopeças'} desc="Produtos e quantidades de exemplo, sem ligação com lojas reais. Pesquise por SKU ou aplicação.">
    <button type="button" disabled className={btnOff}><LockKeyhole size={14}/> Cadastrar peça</button></SectionTitle>
   <SearchField value={search} onChange={setSearch} placeholder="Buscar peça, SKU, aplicação…" />
   <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {filteredStock.map(item=><ProductCard key={item.id} product={item} sector={area==='parts_bikes'?'parts_bikes':'parts_cars'} onAdd={addProduct}/>)}
   </div>
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
   <SectionTitle title={isShop?(area==='parts_cars'?'Vitrine de autopeças para carros':'Vitrine de motopeças'):'Vitrine de serviços da oficina'}
    desc="Catálogo demonstrativo, isolado das demais áreas e sem anúncios ou cadastros de clientes reais."/>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {isShop?stock.map(item=><ProductCard key={item.id} product={item} sector={area==='parts_bikes'?'parts_bikes':'parts_cars'} onAdd={addProduct}/>)
     :DEMO_WORKSHOP_SERVICES.map(item=><WorkshopServiceCard key={item.id} item={item}/>)}
   </div>
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
  <DemoSimulator area={area} view={page} cart={cart} setCart={setCart}/>
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
