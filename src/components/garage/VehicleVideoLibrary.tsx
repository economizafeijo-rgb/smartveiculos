import {useMemo,useState} from 'react';
import {ArrowUpRight,BookOpen,CarFront,CircleAlert,Play,Search,ShieldAlert,Video} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {
 VIDEO_CATEGORIES,VIDEO_RESEARCH_TOPICS,guidesForVehicle,videoProfile,
 youtubeSearchUrl,youtubeWatchUrl,type VideoCategory,type VideoGuide,type VideoVehicle
} from '@/lib/garage/video-guides';

type Filter='todos'|VideoCategory;
const normalize=(value:string)=>value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

function VideoCard({guide,onPlay}:{guide:VideoGuide;onPlay:(guide:VideoGuide)=>void}){
 return <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[.075] text-white backdrop-blur-lg transition-colors hover:border-orange-300/65">
  <button type="button" onClick={()=>onPlay(guide)} aria-label={'Reproduzir '+guide.title} className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400">
   <span className="relative block aspect-video w-full overflow-hidden bg-[#0a1830]">
    <img loading="lazy" src={'https://i.ytimg.com/vi/'+guide.id+'/hqdefault.jpg'} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
    <span className="absolute inset-0 bg-gradient-to-t from-[#08192d]/75 via-transparent to-transparent" aria-hidden="true"/>
    <span className="absolute inset-0 grid place-items-center" aria-hidden="true"><span className="grid size-12 place-items-center rounded-2xl border border-white/55 bg-orange-500/90 text-white shadow-xl backdrop-blur-lg transition-transform group-hover:scale-110"><Play size={23} fill="currentColor"/></span></span>
    <span className="absolute bottom-3 left-3 rounded-full border border-white/25 bg-[#0b1d34]/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-lg">YouTube</span>
   </span>
   <span className="block px-4 pt-4">
    <span className="text-[10px] font-black uppercase tracking-[.13em] text-orange-300">{guide.topic}</span>
    <span className="mt-1.5 block min-h-11 text-[15px] font-extrabold leading-snug text-white">{guide.title}</span>
    <span className="mt-1 block text-xs text-slate-300">{guide.channel}</span>
    <span className="mt-2 block text-xs leading-5 text-slate-200">{guide.description}</span>
   </span>
  </button>
  <div className="mt-auto px-4 pb-4 pt-3">
   {guide.risk==='profissional'&&<p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-200"><ShieldAlert size={13}/> Serviço que exige profissional capacitado</p>}
   <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-3">
    <button type="button" onClick={()=>onPlay(guide)} className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-200 hover:text-white"><Play size={15}/> Assistir aqui</button>
    <a href={youtubeWatchUrl(guide.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white">Abrir YouTube <ArrowUpRight size={15}/></a>
   </div>
  </div>
 </article>;
}

export function VehicleVideoLibrary({vehicle}:{vehicle:VideoVehicle}){
 const [filter,setFilter]=useState<Filter>('todos');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<VideoGuide|null>(null);
 const guides=useMemo(()=>guidesForVehicle(vehicle),[vehicle.kind,vehicle.modelKey,vehicle.name]);
 const shown=useMemo(()=>guides.filter(g=>{
  if(filter!=='todos'&&g.category!==filter)return false;
  const term=normalize(query);
  return !term||normalize([g.title,g.description,g.topic,g.channel].join(' ')).includes(term);
 }),[guides,filter,query]);
 const profile=videoProfile(vehicle);
 const categories=VIDEO_CATEGORIES.filter(c=>c.id==='todos'||guides.some(g=>g.category===c.id));
 const topics=VIDEO_RESEARCH_TOPICS.filter(t=>filter==='todos'||t.category===filter);
 return <section className="sv-videoguide relative isolate overflow-hidden rounded-[26px] border border-[#86baff]/30 bg-[#0d1d35] text-white shadow-[0_18px_42px_-22px_rgba(2,12,31,.75)]">
  <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-orange-500/10 blur-3xl"/>
  <div className="pointer-events-none absolute -right-24 top-24 size-80 rounded-full bg-blue-500/20 blur-3xl"/>
  <div className="relative space-y-5 p-4 sm:p-6">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div className="flex min-w-0 flex-1 items-start gap-3">
     <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/35 bg-white/10 text-orange-300 backdrop-blur-xl"><Video size={24}/></span>
     <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[.19em] text-orange-300">Central de vídeos • YouTube</p>
      <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Reparos, manutenção e dicas</h2>
      <p className="mt-2 text-xs leading-5 text-slate-300">Para o veículo: <strong className="text-white">{vehicle.name}</strong></p>
     </div>
    </div>
    <span className="rounded-full border border-white/25 bg-white/[.08] px-3 py-2 text-[11px] font-bold text-slate-200 backdrop-blur-lg">{guides.length?guides.length+' vídeos selecionados':'Pesquisa por veículo'}</span>
   </div>
   <p className="rounded-xl border border-orange-300/25 bg-[#26324a]/60 px-3 py-2.5 text-xs leading-5 text-orange-100">
    <CircleAlert size={15} className="mr-1.5 inline align-text-bottom"/>
    Tutoriais ilustram possíveis procedimentos; não indicam que o veículo tenha esses defeitos. Confirme ano, motorização, peças e torques no manual. Freios, correias, ABS e direção exigem diagnóstico e profissional capacitado.
   </p>
   {guides.length>0&&<>
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div className="flex max-w-full flex-wrap gap-1.5" role="group" aria-label="Filtrar vídeos por assunto">
      {categories.map(c=><button key={c.id} type="button" aria-pressed={filter===c.id} onClick={()=>setFilter(c.id)}
       className={'rounded-full border px-3 py-2 text-[11px] font-bold transition-colors '+(filter===c.id?'border-orange-300 bg-orange-500 text-[#111c30]':'border-white/15 bg-white/[.07] text-slate-200 hover:bg-white/15')}>{c.label}</button>)}
     </div>
     <label className="relative min-w-[180px] flex-1 sm:max-w-64"><span className="sr-only">Pesquisar vídeos por tema ou defeito</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar falha, peça, serviço..." className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-400 outline-none focus:border-orange-300"/></label>
    </div>
    {shown.length?<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shown.map(v=><VideoCard key={v.id} guide={v} onPlay={setSelected}/>)}</div>:<p className="rounded-xl border border-white/15 bg-white/[.07] p-6 text-center text-sm text-slate-200">Nenhum vídeo corresponde à busca. Experimente outra palavra.</p>}
   </>}
   {guides.length===0&&<div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[.07] p-4 backdrop-blur-lg">
    <CarFront size={22} className="mt-1 shrink-0 text-orange-300"/>
    <p className="text-sm leading-6 text-slate-200">Não há vídeos revisados para esse modelo no catálogo. As buscas abaixo são feitas pelo nome do veículo cadastrado, sem apresentar tutoriais de outros veículos como específicos.</p>
   </div>}
   <div className="rounded-2xl border border-white/15 bg-white/[.055] p-3 backdrop-blur-lg sm:p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="inline-flex items-center gap-2 text-sm font-black text-white"><BookOpen size={17} className="text-orange-300"/> Pesquisar outros consertos</h3><span className="text-[10px] text-slate-400">{profile==='generic'?'Busca pelo modelo cadastrado':'Mais tutoriais do modelo'}</span></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{topics.map(t=><a key={t.category}
      href={youtubeSearchUrl(vehicle,vehicle.kind==='moto'?t.bike:t.car)}
      target="_blank" rel="noopener noreferrer"
      className="group inline-flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#172b46]/85 px-3 py-3 text-xs font-bold text-slate-100 transition-colors hover:border-orange-300/60 hover:bg-[#263c59]">
      {t.label}<ArrowUpRight size={16} className="shrink-0 text-orange-300"/>
    </a>)}</div>
   </div>
  </div>
  <Dialog open={selected!==null} onOpenChange={open=>{if(!open)setSelected(null)}}>
   <DialogContent className="w-[calc(100vw-24px)] max-w-4xl overflow-hidden border-slate-700 bg-[#0e1d32] p-0 text-white">
    <DialogHeader className="px-5 pt-6">
     <DialogTitle className="pr-6 text-lg text-white">{selected?.title??'Vídeo do YouTube'}</DialogTitle>
     <DialogDescription className="text-xs text-slate-300">{selected?.compatibility??''}</DialogDescription>
    </DialogHeader>
    {selected&&<div className="px-4 pb-5 sm:px-5">
     <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe key={selected.id} title={selected.title}
       src={'https://www.youtube-nocookie.com/embed/'+selected.id+'?rel=0'}
       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
       referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="h-full w-full border-0"/>
     </div>
     <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <span className="max-w-xl text-xs text-slate-300">{selected.compatibility}</span>
      <a href={youtubeWatchUrl(selected.id)} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/50 bg-orange-500/20 px-3 py-2 text-xs font-bold text-orange-100 hover:bg-orange-500/35">Abrir no YouTube <ArrowUpRight size={15}/></a>
     </div>
    </div>}
   </DialogContent>
  </Dialog>
 </section>;
}
