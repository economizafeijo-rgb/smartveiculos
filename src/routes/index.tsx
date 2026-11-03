import {DeveloperCredit} from '@/components/ui/DeveloperCredit';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Bike, CarFront, CheckCircle2, ChevronDown, ClipboardCheck, Eye, Gauge, Layers3, Package, ShieldCheck, Store, Wrench } from 'lucide-react';
import {useEffect,useState,type KeyboardEvent} from 'react';
import { MotionReveal } from '@/components/ui/MotionReveal';
import type {PortalArea} from '@/components/portal/PortalAreaDialog';
import {supabase} from '@/lib/supabase/client';
import {areaEntryPath,areaEntryLabel} from '@/lib/portal/area-entry';
import {FreeGarageCampaign} from '@/components/marketing/FreeGarageCampaign';
import {DemoQRCode} from '@/components/demo/DemoQRCode';

export const Route=createFileRoute('/')({
 head:()=>({meta:[
 {title:'SmartVeículos — Garagem digital grátis, autopeças e oficinas'},
 {name:'description',content:'Sua garagem digital para carros e motos é gratuita mediante cadastro. Acompanhe revisões, abastecimentos e despesas. Encontre também autopeças e oficinas.'}
 ]}),
 component:HomePortal,
});

const imagery={
 car:'https://images.unsplash.com/photo-1727893119356-1702fe921cf9?auto=format&fit=crop&w=1300&q=86',
 bike:'https://images.unsplash.com/photo-1755378909673-d5afd0a15ee3?auto=format&fit=crop&w=1300&q=85',
 shop:'https://images.pexels.com/photos/13065692/pexels-photo-13065692.jpeg?auto=compress&cs=tinysrgb&w=1400',
 garage:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&q=82&fit=crop'
};
const businessCards=[
 {id:'parts_cars',label:'Autopeças para carros',subtitle:'Estoque, aplicação e gestão de peças automotivas',img:imagery.car,icon:CarFront,href:'/acesso?segment=parts_cars',alt:'Fotografia de carros reais em oficina automotiva iluminada'},
 {id:'parts_bikes',label:'Autopeças para motos',subtitle:'Catálogo de componentes e controle do estoque',img:imagery.bike,icon:Bike,href:'/acesso?segment=parts_bikes',alt:'Fotografia real de motocicleta Honda vermelha em ambiente externo'},
 {id:'workshop',label:'Oficinas mecânicas',subtitle:'Ordens de serviço e acompanhamento de atendimentos',img:imagery.shop,icon:Wrench,href:'/acesso?segment=workshop',alt:'Fotografia real de oficina automotiva'}
] as const;
const heroTiles=[
 {id:'parts_cars',image:imagery.car,title:'Autopeças para carros',subtitle:'Produtos, estoque e gestão',eyebrow:'AUTOMÓVEIS',icon:CarFront},
 {id:'parts_bikes',image:imagery.bike,title:'Autopeças para motos',subtitle:'Peças, acessórios e catálogo',eyebrow:'MOTOCICLETAS',icon:Bike},
 {id:'workshop',image:imagery.shop,title:'Oficinas e serviços',subtitle:'Revisões, manutenção e assistência ao cliente',eyebrow:'SERVIÇOS MECÂNICOS',icon:Wrench},
] as const;
function HomePortal(){
 const [partsOpen,setPartsOpen]=useState(true);
 const [authenticated,setAuthenticated]=useState(false);
 useEffect(()=>{
  const client=supabase;
  if(!client)return;
  let mounted=true;
  const check=()=>{void client.auth.getUser().then(({data,error})=>{
   if(mounted)setAuthenticated(!error&&Boolean(data.user));
  }).catch(()=>{if(mounted)setAuthenticated(false)})};
  const {data}=client.auth.onAuthStateChange((event,session)=>{
   if(!mounted)return;
   if(event==='SIGNED_OUT')setAuthenticated(false);
   else if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setAuthenticated(Boolean(session?.user));
  });
  check();
  return ()=>{mounted=false;data.subscription.unsubscribe();};
 },[]);
 const handleCardKeyDown=(event:KeyboardEvent<HTMLAnchorElement>)=>{
  if(event.key===' '){event.preventDefault();event.currentTarget.click();}
 };
 return <div className="sv-homepage sv-theme-surface min-h-screen overflow-x-clip bg-[#f5f7fb] text-[#111c30]">
  <header className="sv-glass-header sticky top-0 z-20 border-b border-white/15 text-white">
   <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
    <a href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight"><span className="sv-logo-mark grid size-10 place-items-center rounded-xl bg-[#F97316] text-[#111827] shadow-[0_6px_18px_-8px_rgba(249,115,22,.8)]"><Gauge size={23}/></span><span className="text-xl">Smart<span className="text-[#FDBA74]">Veículos</span><span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Ecossistema automotivo</span></span></a>
    <div className="flex items-center gap-2 sm:gap-5"><a href="#garagem-gratis" className="sv-free-nav hidden items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-xs font-extrabold text-orange-200 hover:bg-orange-500/20 lg:inline-flex">Garagem grátis <ArrowRight size={13}/></a><a href="#solucoes" className="hidden text-sm font-semibold text-slate-300 hover:text-white md:block">Soluções</a><a href="/vitrines" className="hidden text-sm font-semibold text-orange-300 hover:text-orange-200 sm:block">Vitrines</a><a href="/demonstracao" className="inline-flex items-center gap-1.5 rounded-xl border border-orange-300/40 bg-orange-500/10 px-3 py-2.5 text-xs font-black text-orange-200 transition-colors hover:bg-orange-500/20"><Eye size={15}/> <span className="hidden sm:inline">Testar</span> Demo</a><a href="/acesso" className="sv-nav-action rounded-xl border border-white/20 px-3 py-2.5 text-xs font-bold hover:bg-white/10 sm:px-5 sm:text-sm">Entrar</a><a href="/acesso?mode=register" className="sv-action-primary sv-nav-action rounded-xl bg-[#F97316] px-3 py-2.5 text-xs font-bold text-[#111827] shadow-sm hover:bg-[#EA580C] sm:px-5 sm:text-sm">Criar conta</a></div>
   </div>
  </header>
  <main>
   <section className="relative isolate overflow-hidden bg-[#0c1627] text-white">
    <div className="sv-ambient-orb pointer-events-none absolute -left-48 top-12 size-[540px] rounded-full bg-[#FB923C]/10 blur-3xl"/><div className="sv-ambient-orb sv-ambient-orb--reverse pointer-events-none absolute right-0 top-0 size-96 rounded-full bg-blue-500/10 blur-3xl"/>
    <div className="relative mx-auto grid max-w-[1440px] items-center gap-9 px-5 py-10 sm:px-8 lg:min-h-[calc(100dvh-69px)] lg:grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)] lg:gap-9 lg:py-8 xl:gap-10 xl:py-10">
     <div><div className="sv-intro-item sv-intro-item--1 sv-glass-dark inline-flex items-center gap-2 rounded-full border border-[#FB923C]/35 bg-[#FB923C]/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#FDBA74]"><CheckCircle2 size={14}/> Uma plataforma. Quatro soluções.</div><h1 className="sv-intro-item sv-intro-item--2 mt-4 max-w-2xl text-[clamp(1.9rem,4.2vw,3.1rem)] font-black leading-[1.08] tracking-tight lg:text-[clamp(2rem,3.65vw,3.2rem)] xl:text-[clamp(2.5rem,3.4vw,3.5rem)]">Conectamos quem <span className="sv-accent-word text-[#FB923C]">cuida</span> de veículos a quem <span className="sv-accent-word text-[#FB923C]">vive</span> sobre rodas.</h1><p className="sv-intro-item sv-intro-item--3 mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px] sm:leading-7">Autopeças para carros e motos, oficinas mecânicas e uma garagem digital para cada motorista. Cada perfil tem seu próprio espaço e acesso seguro.</p><div className="sv-intro-item sv-intro-item--4 mt-5 flex flex-wrap gap-3"><a href="/vitrines" className="sv-action-primary sv-cta-link inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 text-sm font-bold text-[#111827] shadow-sm hover:bg-[#EA580C]">Explorar vitrines <ArrowRight size={18}/></a><a href="/demonstracao" className="sv-cta-link inline-flex items-center gap-2 rounded-xl border border-orange-300/50 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur-lg hover:bg-white/20"><Eye size={18} className="text-orange-300"/> Explorar demonstração grátis</a><a href="/acesso?next=%2Fgaragem" className="sv-cta-link inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Minha garagem digital</a></div><p className="sv-intro-item sv-intro-item--5 mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-extrabold text-emerald-200"><CheckCircle2 size={15}/> Sua garagem pessoal é 100% grátis · Cadastro obrigatório</p><div className="sv-intro-item sv-intro-item--5 mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-400"><span className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#FDBA74]"/> Conta individual</span><span className="flex items-center gap-2"><Store size={17} className="text-[#FDBA74]"/> Empresas por CNPJ</span><span className="flex items-center gap-2"><ClipboardCheck size={17} className="text-[#FDBA74]"/> Histórico organizado</span></div></div>
     <section aria-label="Escolha a solução profissional" className="sv-home-solutions sv-home-solutions--premium min-w-0">
      <div className="sv-home-solutions-heading">
       <h2 className="sv-home-solutions-eyebrow"><span className="sv-home-solutions-marker" aria-hidden="true"/>ESCOLHA SUA ÁREA</h2>
       <span className="sv-home-solutions-count"><Layers3 size={17} aria-hidden="true"/> <span>{authenticated?'03 soluções profissionais':'03 áreas para explorar sem login'}</span></span>
      </div>
      <div className="sv-home-solutions-grid">
       {heroTiles.map((tile,index)=>{
        const TileIcon=tile.icon;
        return <a key={tile.id} href={areaEntryPath(tile.id,authenticated)}
         aria-label={areaEntryLabel(tile.id,authenticated)}
         onKeyDown={handleCardKeyDown}
         className={'sv-home-solution-card sv-home-solution-card--'+(index+1)+' group relative flex min-w-0 cursor-pointer flex-col justify-between overflow-hidden text-left text-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-orange-400'}>
          <img src={tile.image} loading={index<2?'eager':'lazy'} alt="" className="sv-home-solution-image absolute inset-0 h-full w-full object-cover"/>
          <span className="sv-home-solution-shade pointer-events-none absolute inset-0" aria-hidden="true"/>
          <span className="sv-home-solution-reflection pointer-events-none absolute inset-0" aria-hidden="true"/>
          <span className="sv-home-solution-top relative z-10 flex w-full items-start justify-between gap-2">
           <span className="sv-home-solution-icon grid shrink-0 place-items-center text-white"><TileIcon size={23} aria-hidden="true"/></span>
           <span className="sv-home-solution-category">{tile.eyebrow}</span>
          </span>
          <span className="sv-home-solution-info relative z-10 block w-full">
           <span className="sv-home-solution-title block font-black tracking-tight text-white">{tile.title}</span>
           <span className="sv-home-solution-desc block text-slate-100">{tile.subtitle}</span>
           <span className="sv-home-solution-link inline-flex items-center justify-center gap-3 font-extrabold text-white">
            {authenticated?'Entrar na minha área':'Explorar sem login'} <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true"/>
           </span>
          </span>
         </a>;
       })}
      </div>
     </section>
    </div>
   </section>
   <FreeGarageCampaign/>
    <section id="qr-codes" aria-label="QR Codes de acesso por setor" className="sv-home-qr-section border-y border-slate-200 px-5 py-10 sm:px-8">
     <div className="mx-auto max-w-7xl space-y-5">
      <div><p className="text-xs font-black uppercase tracking-widest text-orange-700">Acessos independentes</p>
       <h2 className="mt-2 text-2xl font-black text-slate-900">QR Codes de cada área</h2>
       <p className="mt-2 text-sm text-slate-600">Cada código abre somente a página indicada. Os QR Codes não incluem informações particulares.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
       <DemoQRCode label="Homepage SmartVeículos"/>
       <DemoQRCode area="garage" label="Garagem digital"/>
       <DemoQRCode area="parts_cars" label="Autopeças para carros"/>
       <DemoQRCode area="parts_bikes" label="Autopeças para motos"/>
       <DemoQRCode area="workshop" label="Oficinas e serviços"/>
      </div>
     </div>
    </section>
   <section id="solucoes" className="sv-ecosystem-section relative overflow-hidden border-t border-white/10 bg-[#111f33] py-12 text-white sm:py-16"><div className="relative mx-auto max-w-7xl space-y-7 px-5 sm:px-8">
    <MotionReveal><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Escolha seu perfil</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Qual é a sua área?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Cada ambiente foi pensado para o tipo de negócio. Empresas são registradas com CNPJ e passam por validação de cadastro.</p></div></MotionReveal>
    <MotionReveal delay={60}><div className="sv-ecosystem-panel sv-interactive-surface rounded-2xl border border-white/10 bg-white/[.06] p-4 shadow-sm backdrop-blur-sm sm:p-5"><button className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={partsOpen} onClick={()=>setPartsOpen(v=>!v)}><span className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-orange-500/15 text-orange-300"><Package/></span><span><span className="block text-lg font-extrabold">Autopeças</span><span className="text-xs text-slate-300">Selecione o seu segmento para entrar na área correta</span></span></span><ChevronDown className={'transition-transform '+(partsOpen?'rotate-180':'')}/></button>{partsOpen&&<div className="sv-accordion-body mt-5 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-2">{businessCards.slice(0,2).map(c=><a href={areaEntryPath(c.id,authenticated)} onKeyDown={handleCardKeyDown} key={c.label} aria-label={areaEntryLabel(c.id,authenticated)} className="sv-interactive-surface group relative min-h-64 w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 text-left text-white focus-visible:outline-2 focus-visible:outline-[#F97316]"><img src={c.img} loading="lazy" alt={c.alt} className="sv-solution-photo absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="sv-solution-scrim pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061626]/72 via-[#061626]/0 via-[57%] to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6"><c.icon size={27} className="mb-3 text-[#FDBA74]"/><h3 className="text-xl font-black">{c.label}</h3><p className="mt-1 text-sm text-slate-200">{c.subtitle}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#FDBA74]">{authenticated?'Entrar na área':'Explorar sem login'} <ArrowRight size={16}/></span></div></a>)}</div>}</div></MotionReveal>
    <MotionReveal delay={95}><div className="grid gap-5 md:grid-cols-2"><a href={areaEntryPath('workshop',authenticated)} aria-label={areaEntryLabel('workshop',authenticated)} onKeyDown={handleCardKeyDown} className="sv-ecosystem-profile-card sv-interactive-surface group w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#182b44] text-left text-white shadow-sm focus-visible:outline-2 focus-visible:outline-[#F97316]"><div className="relative h-52 overflow-hidden"><img src={imagery.shop} alt="Fotografia real de profissional trabalhando em oficina" className="sv-solution-photo h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy"/></div><div className="p-6"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300"><Wrench size={16}/> Para profissionais</span><h3 className="mt-2 text-2xl font-black">Oficinas mecânicas</h3><p className="mt-2 text-sm leading-6 text-slate-300">Gerencie ordens de serviço, atendimento e operações da sua oficina.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-orange-200">{authenticated?'Entrar na área':'Explorar sem login'} <ArrowRight size={16}/></span></div></a><a href={areaEntryPath('garage',authenticated)} aria-label={areaEntryLabel('garage',authenticated)} onKeyDown={handleCardKeyDown} className="sv-ecosystem-profile-card sv-interactive-surface group w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#182b44] text-left text-white shadow-sm focus-visible:outline-2 focus-visible:outline-[#F97316]"><div className="relative h-52 overflow-hidden"><img src={imagery.garage} alt="Fotografia real de automóvel estacionado" className="sv-solution-photo h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy"/></div><div className="p-6"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300"><Gauge size={16}/> Para proprietários</span><h3 className="mt-2 text-2xl font-black">Minha garagem digital</h3><p className="mt-2 text-sm leading-6 text-slate-300">Tenha seus carros e motos, revisões, combustível e histórico de custos em um só lugar.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-orange-200">{authenticated?'Entrar na garagem':'Explorar sem login'} <ArrowRight size={16}/></span></div></a></div></MotionReveal>
   </div></section>
   <section className="bg-[#111c30] py-14 text-white"><MotionReveal><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 sm:px-8 lg:flex-row lg:items-center"><div><h2 className="text-2xl font-black">Pronto para administrar tudo em um só lugar?</h2><p className="mt-2 max-w-2xl text-sm text-slate-300">Crie sua conta e escolha o ambiente ideal. Para empresas, o cadastro começa com CNPJ válido e fica pendente de verificação.</p></div><a href="/acesso?mode=register" className="sv-final-cta sv-action-primary sv-cta-link inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#FDBA74] bg-[#F97316] px-6 py-3 font-bold text-[#111827] shadow-md hover:border-[#F97316] hover:bg-[#EA580C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FB923C]">Começar agora <ArrowRight size={17}/></a></div></MotionReveal></section>
  </main><footer className="bg-[#0c1627] px-5 py-7 text-xs text-slate-400"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3"><span>© 2026 SmartVeículos · Tecnologia para quem move o Brasil</span><span>Gestão inteligente para carros, motos e oficinas</span><DeveloperCredit tone="dark" /></div></footer>
 </div>;
}
