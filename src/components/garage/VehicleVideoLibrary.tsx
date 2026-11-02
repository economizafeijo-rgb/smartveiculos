import {useEffect,useMemo,useState} from 'react';
import {
 ArrowRight,ArrowUpRight,BookOpen,CarFront,CheckCircle2,ChevronLeft,ChevronRight,
 CircleAlert,ExternalLink,Headphones,Play,Search,ShieldAlert,Video,X
} from 'lucide-react';
import {
 VIDEO_CATEGORIES,VIDEO_RESEARCH_TOPICS,guidesForVehicle,videoLibraryKey,
 videoProfile,youtubeSearchUrl,youtubeWatchUrl,
 type VideoCategory,type VideoGuide,type VideoVehicle,
} from '@/lib/garage/video-guides';

type Filter='todos'|VideoCategory;
const normalize=(value:string)=>value.toLocaleLowerCase('pt-BR').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').trim();
const thumbnail=(id:string)=>'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
function VideoPoster({guide,large=false}:{guide:VideoGuide;large?:boolean}){
 return <span className="relative block aspect-video overflow-hidden bg-[#111d33]">
  <img src={thumbnail(guide.id)} loading="lazy" alt=""
   className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
   onError={e=>{e.currentTarget.style.opacity='0'}}/>
  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#051126]/65 via-transparent to-transparent"/>
  <span className="pointer-events-none absolute inset-0 grid place-items-center">
   <span className={'grid place-items-center rounded-2xl border border-white/50 bg-orange-500 text-white shadow-[0_8px_30px_rgba(249,115,22,.36)] '+(large?'size-16':'size-12')}>
    <Play size={large?30:22} fill="currentColor" className="ml-0.5"/>
   </span>
  </span>
  <span className="absolute bottom-3 left-3 rounded-full border border-white/25 bg-[#101f32]/80 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur-md">YouTube</span>
 </span>;
}
function VideoTile({guide,active,onClick}:{guide:VideoGuide;active:boolean;onClick:()=>void}){
 return <button type="button" onClick={onClick} aria-pressed={active}
  aria-label={'Selecionar vídeo: '+guide.title}
  className={'group min-w-0 overflow-hidden rounded-2xl border text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 '+(
   active?'border-orange-400 bg-[#233a56] ring-1 ring-orange-300/50':'border-white/15 bg-white/[.07] hover:border-orange-300/70 hover:bg-white/15'
  )}>
  <VideoPoster guide={guide}/>
  <span className="block space-y-1 px-3 py-3">
   <span className="block text-[10px] font-black uppercase tracking-wider text-orange-300">{guide.topic}</span>
   <span className="block min-h-10 text-xs font-extrabold leading-5 text-white sm:text-sm">{guide.title}</span>
   <span className="block text-[11px] font-semibold text-slate-300">{guide.channel}</span>
  </span>
 </button>;
}

export function VehicleVideoLibrary({vehicle}: {vehicle:VideoVehicle}){
 const libraryId=videoLibraryKey(vehicle);
 const [filter,setFilter]=useState<Filter>('todos');
 const [query,setQuery]=useState('');
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [playing,setPlaying]=useState(false);
 // A identidade da biblioteca isola completamente seleções e iframe ao mudar de veículo.
 useEffect(()=>{setFilter('todos');setQuery('');setSelectedId(null);setPlaying(false)},[libraryId]);
 const guides=useMemo(()=>guidesForVehicle(vehicle),[libraryId]);
 const shown=useMemo(()=>guides.filter(guide=>{
  if(filter!=='todos'&&guide.category!==filter)return false;
  const term=normalize(query);
  return !term||normalize([guide.title,guide.description,guide.topic,guide.channel].join(' ')).includes(term);
 }),[guides,filter,query]);
 const selected=guides.find(x=>x.id===selectedId)??guides[0]??null;
 const selectedIndex=selected?guides.findIndex(x=>x.id===selected.id):-1;
 const profile=videoProfile(vehicle);
 const categories=VIDEO_CATEGORIES.filter(c=>c.id==='todos'||guides.some(g=>g.category===c.id));
 function select(guide:VideoGuide){setSelectedId(guide.id);setPlaying(true)}
 function move(delta:number){
  if(!guides.length)return;
  const index=(selectedIndex+delta+guides.length)%guides.length;
  const next=guides[index];
  if(next){setSelectedId(next.id);setPlaying(true)}
 }
 const topics=VIDEO_RESEARCH_TOPICS.filter(topic=>filter==='todos'||topic.category===filter);
 return <section aria-label={'Biblioteca exclusiva de '+vehicle.name}
  className="sv-videoguide relative isolate overflow-hidden rounded-[26px] border border-[#8abdf6]/35 bg-[#0c1b32] text-white shadow-[0_18px_42px_-22px_rgba(2,12,31,.75)]">
  <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-orange-500/10 blur-3xl"/>
  <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-20 size-80 rounded-full bg-blue-500/20 blur-3xl"/>
  <div className="relative space-y-5 p-4 sm:p-6">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
     <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/10 text-orange-300 backdrop-blur-xl"><Video size={23}/></span>
     <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[.18em] text-orange-300">Biblioteca técnica individual</p>
      <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{profile==='gol'?'Volkswagen Gol G6 Seleção':profile==='cb650r'?'Honda CB650R':'Tutoriais do meu veículo'}</h2>
      <p className="mt-2 text-xs text-slate-300">Acervo exclusivo para <strong className="text-white">{vehicle.name}</strong>{vehicle.modelYear?' · '+vehicle.modelYear:''}</p>
     </div>
    </div>
    <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-extrabold text-white backdrop-blur-lg">{guides.length} vídeos do acervo</span>
   </header>
   <p className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/[.08] p-3 text-xs leading-5 text-amber-100">
    <CircleAlert size={16} className="mt-0.5 shrink-0"/>
    Os tutoriais não indicam defeitos no seu veículo. Verifique ano, motorização, peças e manual antes de qualquer reparo. Freios, correias e arrefecimento exigem cuidados profissionais.
   </p>

   {selected&&<div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(230px,.83fr)]">
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/20 bg-[#060f1f] shadow-2xl">
     <div className="relative aspect-video w-full overflow-hidden bg-black">
      {playing?<iframe key={libraryId+':'+selected.id}
        title={'Reprodução integrada do YouTube: '+selected.title}
        src={'https://www.youtube-nocookie.com/embed/'+selected.id+'?autoplay=1&rel=0&playsinline=1'}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen className="absolute inset-0 h-full w-full border-0"
       />:
       <button type="button" className="group relative block h-full w-full text-left" onClick={()=>select(selected)}
        aria-label={'Reproduzir '+selected.title+' no SmartVeículos'}>
        <VideoPoster guide={selected} large/>
        <span className="pointer-events-none absolute bottom-5 right-4 rounded-full border border-orange-300/45 bg-[#10233b]/85 px-3 py-2 text-xs font-extrabold text-white backdrop-blur-md">Assistir na plataforma <ArrowRight size={13} className="ml-1 inline"/></span>
       </button>}
     </div>
     <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 px-4 py-3">
      <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-200"><Headphones size={16} className="text-orange-300"/>{playing?'Player integrado ativo':'Pronto para reproduzir'}</span>
      <div className="flex flex-wrap gap-2">
       {playing&&<button type="button" onClick={()=>setPlaying(false)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10"><X size={13}/> Fechar vídeo</button>}
       <a href={youtubeWatchUrl(selected.id)} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300/40 bg-orange-500/15 px-3 py-2 text-xs font-bold text-orange-100 hover:bg-orange-500/25">Abrir no YouTube <ExternalLink size={13}/></a>
      </div>
     </div>
    </div>
    <aside aria-label="Informações e reprodução" className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-white/15 bg-white/[.07] p-4 backdrop-blur-lg sm:p-5">
     <div>
      <p className="text-[10px] font-black uppercase tracking-[.15em] text-orange-300">{selected.topic}</p>
      <h3 className="mt-2 text-lg font-black leading-snug text-white">{selected.title}</h3>
      <p className="mt-2 text-xs font-semibold text-slate-300">Canal: {selected.channel}</p>
      <p className="mt-4 text-sm leading-6 text-slate-100">{selected.description}</p>
      <p className="mt-4 rounded-xl border border-white/15 bg-[#12253e] px-3 py-3 text-xs leading-5 text-slate-200">{selected.compatibility}</p>
      {selected.risk==='profissional'&&<p className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-200"><ShieldAlert size={16} className="shrink-0"/> Requer profissional capacitado</p>}
     </div>
     <div className="space-y-3">
      <p className="text-[11px] font-bold text-slate-400">Vídeo {selectedIndex+1} de {guides.length}</p>
      <div className="flex flex-wrap gap-2">
       <button type="button" onClick={()=>move(-1)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-bold text-white hover:bg-white/20"><ChevronLeft size={15}/> Anterior</button>
       <button type="button" onClick={()=>move(1)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-orange-300/50 bg-orange-500 px-3 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-orange-400">Próximo <ChevronRight size={15}/></button>
      </div>
     </div>
    </aside>
   </div>}
   {selected&&<p className="text-[11px] leading-5 text-slate-400">A reprodução ocorre no player oficial incorporado do YouTube. Se o autor restringir incorporação, utilize “Abrir no YouTube”. O vídeo é carregado somente após o clique.</p>}

   {guides.length>0&&<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div role="group" aria-label="Filtros de vídeos" className="flex flex-wrap gap-2">
      {categories.map(category=><button key={category.id} type="button" aria-pressed={filter===category.id}
       onClick={()=>setFilter(category.id)}
       className={'rounded-full border px-3 py-2 text-[11px] font-extrabold transition-colors '+(filter===category.id?'border-orange-300 bg-orange-500 text-slate-950':'border-white/20 bg-white/10 text-slate-200 hover:bg-white/20')}>{category.label}</button>)}
     </div>
     <label className="relative min-w-[175px] flex-1 sm:max-w-72">
      <span className="sr-only">Pesquisar na biblioteca deste veículo</span>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar reparos, peças, sintomas…"
       className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-400 outline-none focus:border-orange-300"/>
     </label>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">
     <h3 className="text-sm font-black text-white">Vídeos disponíveis <span className="ml-1 text-xs font-medium text-slate-400">({shown.length})</span></h3>
     <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400"><CheckCircle2 size={13} className="text-orange-300"/> Seleção exclusiva por modelo</span>
    </div>
    {shown.length?
     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {shown.map(guide=><VideoTile key={guide.id} guide={guide} active={selected?.id===guide.id} onClick={()=>select(guide)}/>)}
     </div>:
     <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center text-sm text-slate-200">Nenhum vídeo desse veículo encontrado com esses filtros.</div>}
   </div>}
   {guides.length===0&&<div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-5">
    <CarFront className="mt-1 shrink-0 text-orange-300" size={23}/>
    <p className="text-sm leading-6 text-slate-200">Este veículo não possui vídeos específicos revisados. Não exibimos vídeos do Gol ou da CB650R quando o veículo cadastrado é outro. Utilize as buscas direcionadas abaixo.</p>
   </div>}
   <div className="rounded-2xl border border-white/15 bg-white/[.06] p-4 backdrop-blur-lg">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
     <h3 className="inline-flex items-center gap-2 text-sm font-black text-white"><BookOpen size={17} className="text-orange-300"/> Mais reparos para {vehicle.name}</h3>
     <span className="text-[11px] text-slate-400">Buscas direcionadas pelo veículo selecionado</span>
    </div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
     {topics.map(topic=><a key={topic.category} href={youtubeSearchUrl(vehicle,vehicle.kind==='moto'?topic.bike:topic.car)}
      rel="noopener noreferrer" target="_blank"
      className="inline-flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#192e4b] px-3 py-3 text-xs font-bold text-slate-100 hover:border-orange-300/60 hover:bg-[#274362]">
      {topic.label}<ArrowUpRight size={16} className="shrink-0 text-orange-300"/>
     </a>)}
    </div>
   </div>
  </div>
 </section>;
}
