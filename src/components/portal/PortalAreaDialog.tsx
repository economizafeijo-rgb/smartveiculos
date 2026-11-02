import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
 ArrowRight,Bike,CarFront,CheckCircle2,Clock3,Gauge,
 Headset,PackageCheck,ShieldCheck,TrendingUp,Wrench,X,
 type LucideIcon
} from 'lucide-react';
import {useEffect,useState} from 'react';

export type PortalArea='parts_cars'|'parts_bikes'|'workshop'|'garage';
type SectionId='management'|'service'|'evolution';
type AreaDetail={
 title:string;
 eyebrow:string;
 summary:string;
 current:readonly string[];
 service:readonly string[];
 evolution:readonly string[];
 href:string;
 buttonLabel:string;
 icon:LucideIcon;
 business:boolean;
};

const AREAS:Record<PortalArea,AreaDetail>={
 parts_cars:{
  title:'Autopeças para carros',eyebrow:'Solução para lojistas',
  summary:'Mais controle para sua loja. Mais oportunidades para atender seus clientes.',
  current:['Cadastre peças por código e aplicação','Controle quantidades e preços','Publique fotos, preços e links na vitrine'],
  service:['Chat de pré-venda com clientes','Solicitações de orçamento no sistema'],
  evolution:['Pedidos em um só painel','Atualizações sobre o envio'],
  href:'/acesso?segment=parts_cars',buttonLabel:'Entrar na área de autopeças',icon:CarFront,business:true,
 },
 parts_bikes:{
  title:'Autopeças para motos',eyebrow:'Solução para o setor de motos',
  summary:'Sua loja organizada para atender cada motociclista com agilidade.',
  current:['Cadastre peças e modelos compatíveis','Controle estoque e preços','Publique produtos com foto e link próprio'],
  service:['Chat integrado com motociclistas','Solicitações de orçamento e pedidos'],
  evolution:['Pedidos e solicitações online','Acompanhamento das entregas'],
  href:'/acesso?segment=parts_bikes',buttonLabel:'Entrar na área de motos',icon:Bike,business:true,
 },
 workshop:{
  title:'Oficinas mecânicas',eyebrow:'Gestão profissional de oficinas',
  summary:'Organize os serviços hoje e construa uma experiência mais transparente.',
  current:['Abra ordens de serviço','Registre orçamentos e reparos','Divulgue serviços com preços na vitrine'],
  service:['Agendamento online de serviços','Chat direto com cada cliente'],
  evolution:['Etapas do reparo em tempo real','Fotos e avisos até a entrega'],
  href:'/acesso?segment=workshop',buttonLabel:'Entrar na área da oficina',icon:Wrench,business:true,
 },
 garage:{
  title:'Minha garagem digital',eyebrow:'Para proprietários de veículos',
  summary:'Seu carro e sua moto organizados em uma garagem feita para você.',
  current:['Acesse fichas de carros e motos','Registre revisões e manutenções','Acompanhe combustível e gastos'],
  service:['Contato com lojas e oficinas','Agendamentos e mensagens'],
  evolution:['Andamento dos serviços','Acompanhamento dos pedidos'],
  href:'/acesso?next=%2Fgaragem',buttonLabel:'Entrar na minha garagem',icon:Gauge,business:false,
 },
};
const SECTIONS:{id:SectionId;title:string;subtitle:string;icon:LucideIcon}[]=[
 {id:'management',title:'Gestão',subtitle:'Já disponível',icon:PackageCheck},
 {id:'service',title:'Atendimento',subtitle:'Em desenvolvimento',icon:Headset},
 {id:'evolution',title:'Evolução',subtitle:'Em desenvolvimento',icon:TrendingUp},
];

/** Apresentação clara, compacta e sem barra de rolagem.
 * Em celular, os três grupos viram abas para manter o CTA visível.
 */
export function PortalAreaDialog({area,onOpenChange}:{
 area:PortalArea|null;
 onOpenChange:(open:boolean)=>void;
}){
 const data=area?AREAS[area]:null;
 const Icon=data?.icon;
 const [selected,setSelected]=useState<SectionId>('management');
 useEffect(()=>{setSelected('management');},[area]);
 return <DialogPrimitive.Root open={area!==null} onOpenChange={onOpenChange}>
  <DialogPrimitive.Portal>
   <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0c1627]/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"/>
   <DialogPrimitive.Content
    className="sv-portal-dialog fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-24px)] w-[min(840px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white text-[#12203a] shadow-[0_28px_90px_-28px_rgba(8,20,44,0.35)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
    {data&&Icon&&<>
     <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
      <div className="flex items-start gap-3.5 pr-8 sm:gap-4">
       <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#F5E7DC] text-[#AD6543] sm:size-12"><Icon size={24} aria-hidden="true"/></div>
       <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#985232]">{data.eyebrow}</p>
        <DialogPrimitive.Title className="mt-1 text-[clamp(1.25rem,3.3vw,1.75rem)] font-black leading-tight tracking-tight">{data.title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="mt-1.5 max-w-2xl text-[12px] leading-[1.45] text-slate-600 sm:text-sm">
         {data.summary}
        </DialogPrimitive.Description>
       </div>
      </div>
      <DialogPrimitive.Close
       aria-label="Fechar apresentação"
       className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AC5937] sm:right-5 sm:top-5">
       <X size={18} aria-hidden="true"/>
      </DialogPrimitive.Close>
     </div>
     <div className="min-h-0 flex-1 px-5 py-4 sm:px-7 sm:py-5">
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 sm:hidden" role="tablist" aria-label="Conheça esta solução">
       {SECTIONS.map(section=><button key={section.id} type="button" role="tab"
        id={'sv-tab-'+section.id}
        aria-selected={selected===section.id}
        aria-controls={'sv-panel-'+section.id}
        onClick={()=>setSelected(section.id)}
        className={'rounded-lg px-1.5 py-2 text-[11px] font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-[#AC5937] '+(selected===section.id?'bg-white text-[#985232] shadow-sm':'text-slate-600 hover:bg-white/60')}>
        {section.title}
       </button>)}
      </div>
      <div className="mt-3 grid gap-3 sm:mt-0 sm:grid-cols-3 sm:gap-3.5">
       {SECTIONS.map(section=>{
        const FeatureIcon=section.icon;
        const items=section.id==='management'?data.current:section.id==='service'?data.service:data.evolution;
        const isCurrent=section.id==='management';
        return <section key={section.id}
         id={'sv-panel-'+section.id}
         aria-labelledby={'sv-tab-'+section.id}
         role="tabpanel"
         className={'rounded-2xl border p-3.5 sm:p-4 '+(isCurrent?'border-[#E7C7B3] bg-[#FCF3ED]':'border-slate-200 bg-[#f8fafc]')+(selected!==section.id?' hidden sm:block':'')}>
         <div className="flex items-center gap-2">
          <span className={'grid size-8 shrink-0 place-items-center rounded-lg '+(isCurrent?'bg-[#F5E7DC] text-[#985232]':'bg-slate-200/65 text-slate-700')}>
           <FeatureIcon size={17} aria-hidden="true"/>
          </span>
          <div className="min-w-0">
           <h3 className="text-[13px] font-extrabold leading-tight text-slate-900">{section.title}</h3>
           <p className={'mt-0.5 text-[10px] font-bold '+(isCurrent?'text-emerald-700':'text-[#985232]')}>{section.subtitle}</p>
          </div>
         </div>
         <ul className="mt-3 space-y-2.5">
          {items.map(item=><li key={item} className="flex items-start gap-2 text-xs leading-[1.4] text-slate-700 sm:text-[12px]">
           {isCurrent?<CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true"/>:
            <Clock3 size={15} className="mt-0.5 shrink-0 text-[#AD6543]" aria-hidden="true"/>}
           <span>{item}</span>
          </li>)}
         </ul>
        </section>;
       })}
      </div>
     </div>
     <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3.5 sm:px-7 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
       <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
        <ShieldCheck size={15} className="text-emerald-600" aria-hidden="true"/>
        {data.business?'Login e CNPJ para empresas':'Acesso pessoal protegido'}
       </p>
       <div className="flex flex-wrap items-center gap-2">
        <DialogPrimitive.Close className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#AC5937]">Fechar</DialogPrimitive.Close>
        <a href={data.href} className="sv-cta-link inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#AC5937] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#93492B] focus-visible:outline-2 focus-visible:outline-[#AC5937] sm:text-sm">
         {data.buttonLabel}<ArrowRight size={17} aria-hidden="true"/>
        </a>
       </div>
      </div>
     </div>
    </>}
   </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
 </DialogPrimitive.Root>;
}
