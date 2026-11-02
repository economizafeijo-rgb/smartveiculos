import {useState} from 'react';
import {ArrowRight,Bike,CarFront,Check,CheckCircle2,ClipboardCheck,Clock3,Fuel,Gauge,LockKeyhole,ShieldCheck,Sparkles,Wallet,Wrench} from 'lucide-react';

type VehicleAudience='carro'|'moto';
type FeatureIndex=0|1|2;
const features=[
 {icon:Wrench,title:'Revisões em ordem',desc:'Registre manutenções, serviços e as próximas revisões.'},
 {icon:Fuel,title:'Abastecimentos organizados',desc:'Acompanhe os abastecimentos e os gastos do seu veículo.'},
 {icon:Wallet,title:'Histórico sempre à mão',desc:'Consulte seus registros de despesas e serviços em um lugar só.'}
] as const;
const gallery={
 carro:{
  label:'MEU CARRO',
  title:'Seu carro. Seu histórico.',
  subtitle:'Organização para quem dirige todos os dias.',
  image:'https://images.unsplash.com/photo-1727893119356-1702fe921cf9?auto=format&fit=crop&w=1200&q=85',
  alt:'Fotografia real de automóvel em ambiente de oficina',
  icon:CarFront
 },
 moto:{
  label:'MINHA MOTO',
  title:'Sua moto. Seu controle.',
  subtitle:'Tudo sobre a manutenção da sua companheira de estrada.',
  image:'https://images.unsplash.com/photo-1755378909673-d5afd0a15ee3?auto=format&fit=crop&w=1200&q=85',
  alt:'Fotografia de motocicleta em ambiente externo',
  icon:Bike
 }
} as const;

/** Campanha interativa para pessoas físicas: nunca confundir com o plano
 * empresarial e não simular dados reais ou usuários que não existem.
 */
export function FreeGarageCampaign(){
 const [audience,setAudience]=useState<VehicleAudience>('carro');
 const [step,setStep]=useState<FeatureIndex>(0);
 const active=gallery[audience];
 const ActiveIcon=active.icon;
 const FeatureIcon=features[step].icon;
 return <section id="garagem-gratis" aria-labelledby="sv-free-campaign-title" className="sv-free-campaign relative isolate overflow-hidden bg-[#eaf0f7] py-10 text-[#112039] sm:py-14 lg:py-16">
  <div aria-hidden="true" className="sv-free-campaign-pattern pointer-events-none absolute inset-0"/>
  <div className="relative mx-auto grid max-w-7xl items-center gap-7 px-5 sm:px-8 lg:grid-cols-[.98fr_1.02fr] lg:gap-12">
   <div className="sv-free-campaign-copy">
    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#fdba74] bg-[#fff7ed] px-3 py-2 text-[11px] font-black uppercase tracking-[.12em] text-[#9a3412]">
     <Sparkles size={15} aria-hidden="true"/> PARA QUEM TEM CARRO OU MOTO
    </div>
    <h2 id="sv-free-campaign-title" className="mt-4 max-w-xl text-[clamp(1.85rem,3.3vw,3.5rem)] font-black leading-[1.08] tracking-tight">
     Seu veículo merece cuidado. <span className="sv-free-accent">Sua garagem é grátis.</span>
    </h2>
    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
     Tenha seu carro ou sua moto organizados em um único espaço digital. Registre revisões, abastecimentos e despesas, consulte o histórico e acompanhe a manutenção — sem pagar pelo acesso pessoal.
    </p>
    <div className="sv-free-offer mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-orange-200 bg-white/90 p-3.5 shadow-sm sm:gap-5 sm:p-4">
     <div className="flex shrink-0 flex-col">
      <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-600">ACESSO PESSOAL</span>
      <div className="flex items-baseline gap-1"><span className="sv-free-price text-4xl font-black text-[#c2410c] sm:text-[43px]">R$ 0</span><span className="text-xs font-bold text-slate-500">/mês</span></div>
     </div>
     <div className="h-12 w-px shrink-0 bg-slate-200 max-[380px]:hidden"/>
     <div className="min-w-0 flex-1 space-y-1.5 text-xs font-semibold text-slate-700">
      <p className="flex items-center gap-2"><CheckCircle2 size={15} className="shrink-0 text-emerald-600"/> Cadastro gratuito</p>
      <p className="flex items-center gap-2"><CheckCircle2 size={15} className="shrink-0 text-emerald-600"/> Para carros e motos</p>
      <p className="flex items-center gap-2"><LockKeyhole size={15} className="shrink-0 text-emerald-600"/> Acesso com login e senha</p>
     </div>
    </div>
    <div className="mt-5 flex flex-wrap gap-2.5">
     <a href="/acesso?mode=register" className="sv-free-cta sv-action-primary group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ea580c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-900/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
      Criar minha garagem grátis <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true"/>
     </a>
     <a href="/acesso?next=%2Fgaragem" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50">
      Já tenho conta
     </a>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-600"><ShieldCheck size={14} className="mr-1 inline text-orange-700" aria-hidden="true"/> É necessário criar uma conta para salvar e consultar seus registros. O acesso gratuito refere-se à área de proprietários; soluções para empresas são separadas.</p>
   </div>
   <div className="sv-free-preview min-w-0 overflow-hidden rounded-[25px] border border-white/80 bg-white p-3 shadow-[0_20px_60px_-23px_rgba(10,31,55,.24)] sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
     <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.1em] text-slate-700"><Gauge size={16} className="text-orange-600"/> PRÉVIA DA SUA GARAGEM</span>
     <div role="group" aria-label="Escolher veículo de demonstração" className="flex rounded-xl bg-slate-100 p-1">
      <button type="button" onClick={()=>setAudience('carro')} aria-pressed={audience==='carro'} className={'sv-free-choice flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold '+(audience==='carro'?'bg-[#13233b] text-white shadow-sm':'text-slate-600 hover:text-[#13233b]')}><CarFront size={15}/> Carro</button>
      <button type="button" onClick={()=>setAudience('moto')} aria-pressed={audience==='moto'} className={'sv-free-choice flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold '+(audience==='moto'?'bg-[#13233b] text-white shadow-sm':'text-slate-600 hover:text-[#13233b]')}><Bike size={15}/> Moto</button>
     </div>
    </div>
    <div className="sv-free-image-card relative isolate overflow-hidden rounded-2xl bg-[#12243a]">
     <img key={audience} src={active.image} alt={active.alt} loading="lazy" className="sv-free-visual absolute inset-0 h-full w-full object-cover"/>
     <div className="sv-free-image-overlay absolute inset-0"/>
     <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-[#0b1728]/60 px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-white backdrop-blur-sm"><ActiveIcon size={15}/>{active.label}</span>
      <div>
       <h3 className="text-xl font-black tracking-tight text-white drop-shadow-md sm:text-2xl">{active.title}</h3>
       <p className="mt-1 text-xs font-medium text-slate-100 sm:text-sm">{active.subtitle}</p>
      </div>
     </div>
    </div>
    <div className="mt-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-3 sm:p-4">
     <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-black text-[#13233b]">Explore os recursos</span>
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500"><Clock3 size={13}/> Você no controle</span>
     </div>
     <div className="grid grid-cols-3 gap-2" role="group" aria-label="Recursos da garagem">
      {features.map((item,index)=><button key={item.title} type="button" onClick={()=>setStep(index as FeatureIndex)} aria-pressed={step===index} className={'sv-free-feature flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center text-[10px] font-extrabold transition-colors sm:text-[11px] '+(step===index?'border-orange-400 bg-orange-50 text-[#9a3412]':'border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/50')}>
       <item.icon size={18} aria-hidden="true"/><span>{index===0?'Revisões':index===1?'Combustível':'Despesas'}</span>
      </button>)}
     </div>
     <div className="sv-free-feature-detail mt-3 flex min-h-[75px] items-start gap-3 rounded-xl bg-white p-3" aria-live="polite">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-100 text-[#c2410c]"><FeatureIcon size={19} aria-hidden="true"/></div>
      <div><p className="text-xs font-black text-[#16233b]">{features[step].title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{features[step].desc}</p></div>
     </div>
    </div>
    <p className="pt-3 text-center text-[11px] text-slate-500"><Check size={13} className="mr-1 inline text-emerald-600"/> Demonstração ilustrativa. Seus dados aparecem somente após o cadastro e registro do veículo.</p>
   </div>
  </div>
 </section>;
}
