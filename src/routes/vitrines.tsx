import {createFileRoute} from '@tanstack/react-router';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Bike,CarFront,CheckCircle2,Copy,Filter,ImageOff,MapPin,MessageCircle,Package,Search,Share2,ShieldCheck,Store,Wrench,X} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {
 availabilityLabel,formatMarketplacePrice,publicBusinessLink,publicOfferLink,
 uuidLike,whatsappLink,type MarketplaceListing,type MarketplaceKind
} from '@/lib/business/marketplace';
import {DeveloperCredit} from '@/components/ui/DeveloperCredit';

export const Route=createFileRoute('/vitrines')({
 validateSearch:(s:Record<string,unknown>)=>({
  empresa:uuidLike(s['empresa'])?s['empresa']:undefined,
  oferta:uuidLike(s['oferta'])?s['oferta']:undefined
 }),
 head:()=>({meta:[
  {title:'Vitrines de peças e serviços | SmartVeículos'},
  {name:'description',content:'Encontre peças de carros e motos, acessórios, revisão e serviços de oficinas. Consulte preços e compatibilidade antes de falar com a empresa.'}
 ]}),
 component:MarketplacePage
});

function OfferPicture({offer,large=false}:{offer:MarketplaceListing;large?:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[offer.image_url]);
 return <div className={'relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 '+(large?'min-h-56 rounded-2xl sm:min-h-[330px]':'aspect-[5/4] rounded-t-2xl')}>
  {offer.image_url&&!failed?
   <img src={offer.image_url} alt={'Fotografia de '+offer.title} loading="lazy" onError={()=>setFailed(true)} className="absolute inset-0 h-full w-full object-cover"/>:
   <div className="flex flex-col items-center gap-2 text-slate-400">{offer.kind==='product'?<Package size={large?54:34}/>:<Wrench size={large?54:34}/>}<span className="text-xs">Imagem não disponível</span></div>}
 </div>;
}
async function shareHref(href:string,onNotice:(text:string)=>void){
 const url=new URL(href,window.location.origin).href;
 try{
  if(navigator.share){await navigator.share({title:'SmartVeículos — vitrine',url});return;}
  if(navigator.clipboard){await navigator.clipboard.writeText(url);onNotice('Link copiado para compartilhar.');return;}
 }catch(e){if(e instanceof Error&&e.name==='AbortError')return;}
 onNotice('Link: '+url);
}
function MarketplacePage(){
 const search=Route.useSearch();
 const [all,setAll]=useState<MarketplaceListing[]>([]);
 const [selected,setSelected]=useState<MarketplaceListing|null>(null);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [text,setText]=useState('');
 const [kind,setKind]=useState<'all'|MarketplaceKind>('all');
 const [category,setCategory]=useState('');
 const [sort,setSort]=useState('recent');
 useEffect(()=>{
  let live=true;
  async function load(){
   if(!supabase){if(live){setBusy(false);setError('Vitrine temporariamente indisponível.');}return;}
   const query=supabase.from('marketplace_listings').select('*')
    .eq('is_published',true).eq('is_approved',true);
   const [batch,detail]=await Promise.all([
    (search.empresa?query.eq('business_id',search.empresa):query)
      .order('created_at',{ascending:false}).limit(300),
    search.oferta?supabase.from('marketplace_listings').select('*').eq('id',search.oferta)
      .eq('is_published',true).eq('is_approved',true).maybeSingle():Promise.resolve({data:null,error:null})
   ]);
   if(!live)return;
   if(batch.error||detail.error){setError(batch.error?.message||detail.error?.message||'Falha ao carregar as vitrines.');}
   else{setAll((batch.data??[]) as MarketplaceListing[]);setSelected((detail.data??null) as MarketplaceListing|null);setError('');}
   setBusy(false);
  }
  void load();
  return()=>{live=false;};
 },[search.empresa,search.oferta]);
 const categories=useMemo(()=>[...new Set(all.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')),[all]);
 const filtered=useMemo(()=>{
  const term=text.toLocaleLowerCase('pt-BR').trim();
  const list=all.filter(o=>(kind==='all'||o.kind===kind)&&(!category||o.category===category)&&(
   !term||[o.title,o.brand,o.category,o.compatibility,o.description,o.business_name,o.reference_code]
    .some(s=>s.toLocaleLowerCase('pt-BR').includes(term))
  ));
  return [...list].sort((a,b)=>{
   if(sort==='price_low')return (a.price??Infinity)-(b.price??Infinity);
   if(sort==='price_high')return (b.price??-1)-(a.price??-1);
   return b.created_at.localeCompare(a.created_at);
  });
 },[all,text,kind,category,sort]);
 const selectedContact=selected?whatsappLink(selected.contact_phone,selected):null;
 const shopName=search.empresa?all[0]?.business_name:undefined;
 return <div className="min-h-screen bg-[#f4f7fa] text-[#12203a]">
  <header className="border-b border-white/10 bg-[#101d30] text-white">
   <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
    <a href="/" className="inline-flex items-center gap-2 font-black"><span className="grid size-9 place-items-center rounded-xl bg-orange-500 text-slate-950"><CarFront size={19}/></span>Smart<span className="text-orange-300">Veículos</span></a>
    <div className="flex items-center gap-4 text-xs font-bold">
     <a href="/" className="inline-flex items-center gap-1 text-slate-200 hover:text-white"><ArrowLeft size={15}/> Início</a>
     <a href="/acesso?mode=register" className="rounded-xl bg-orange-500 px-3.5 py-2.5 text-slate-950 hover:bg-orange-400">Anuncie sua vitrine</a>
    </div>
   </div>
  </header>
  <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
   <section className="relative overflow-hidden rounded-3xl bg-[#12223b] px-5 py-7 text-white sm:px-8 sm:py-9">
    <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-orange-500/10 blur-3xl"/>
    <div className="relative flex flex-wrap items-end justify-between gap-4">
     <div>
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-orange-300">{shopName?'Vitrine de empresa':'Marketplace automotivo'}</p>
      <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{shopName??'Peças, acessórios e serviços em um só lugar.'}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Encontre produtos para carros e motos, consulte preços e aplicações ou conheça serviços oferecidos por lojas e oficinas verificadas.</p>
     </div>
     {search.empresa&&<a className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-bold hover:bg-white/10" href="/vitrines"><Store size={16}/> Ver todas as vitrines</a>}
    </div>
   </section>
   {notice&&<div role="status" className="flex items-start justify-between gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-semibold text-orange-900"><span className="break-all">{notice}</span><button onClick={()=>setNotice('')} aria-label="Fechar aviso"><X size={15}/></button></div>}
   {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
   {!search.oferta&&<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid gap-3 md:grid-cols-[1fr_155px_185px]">
     <label className="relative block"><Search size={19} className="absolute left-3 top-3 text-slate-400"/><input aria-label="Pesquisar produtos e serviços" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm focus:border-orange-500 focus:outline-none" placeholder="Peça, marca, modelo, oficina ou serviço..." value={text} onChange={e=>setText(e.target.value)}/></label>
     <select aria-label="Filtrar categoria" value={category} onChange={e=>setCategory(e.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Todas as categorias</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
     <select aria-label="Ordenar ofertas" value={sort} onChange={e=>setSort(e.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="recent">Mais recentes</option><option value="price_low">Menor preço</option><option value="price_high">Maior preço</option></select>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1.5" aria-label="Tipo de oferta">{([['all','Tudo',Store],['product','Produtos',Package],['service','Serviços',Wrench]] as const).map(([value,label,Icon])=><button key={value} onClick={()=>setKind(value)} className={'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold '+(kind===value?'bg-[#12223b] text-white':'bg-slate-100 text-slate-600 hover:bg-orange-50')}><Icon size={15}/>{label}</button>)}</div><p className="text-xs text-slate-500"><Filter size={14} className="mr-1 inline"/>{filtered.length} {filtered.length===1?'oferta encontrada':'ofertas encontradas'}</p></div>
   </section>}
   {busy?<div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-600">Carregando ofertas...</div>:
    search.oferta?selected?
    <div className="grid items-start gap-5 lg:grid-cols-[.95fr_1.05fr]">
     <OfferPicture offer={selected} large/>
     <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-orange-50 px-2 py-1 text-xs font-extrabold text-orange-700">{selected.kind==='service'?'Serviço':'Produto'}</span><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{selected.category}</span></div>
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{selected.title}</h2>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-2xl font-black text-orange-700">{formatMarketplacePrice(selected)}</p><span className={'rounded-full px-3 py-1.5 text-xs font-bold '+(selected.availability==='out_of_stock'?'bg-slate-100 text-slate-600':'bg-emerald-50 text-emerald-800')}>{availabilityLabel[selected.availability]}</span></div>
      <div className="space-y-1 text-sm leading-6 text-slate-700">{selected.brand&&<p><strong>Marca:</strong> {selected.brand}</p>}{selected.reference_code&&<p><strong>Referência:</strong> {selected.reference_code}</p>}{selected.compatibility&&<p><strong>Aplicação / compatibilidade:</strong> {selected.compatibility}</p>}</div>
      {selected.description&&<div className="border-t pt-4"><h3 className="font-extrabold">Descrição</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{selected.description}</p></div>}
      <div className="border-t pt-4"><a href={publicBusinessLink(selected.business_id)} className="inline-flex items-center gap-2 text-sm font-bold text-[#12223b] underline-offset-2 hover:underline"><Store size={18} className="text-orange-600"/>{selected.business_name}</a>{selected.business_city&&<p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={14}/>{selected.business_city}</p>}</div>
      <div className="grid gap-2 sm:grid-cols-2">{selectedContact&&<a href={selectedContact} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-[#12203a] hover:bg-orange-400"><MessageCircle size={18}/> Solicitar atendimento</a>}<button onClick={()=>void shareHref(publicOfferLink(selected.id),setNotice)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50"><Share2 size={17}/> Compartilhar oferta</button></div>
      {!selectedContact&&<p className="text-xs text-slate-500">A empresa ainda não cadastrou um telefone público para contato.</p>}
      <p className="text-xs leading-5 text-slate-500">Preço e disponibilidade são informações do anunciante. Confirme compatibilidade, condições, frete e garantia antes de concluir a compra. A plataforma não processa pagamentos nesta vitrine.</p>
     </div>
    </div>:<div className="rounded-2xl border bg-white p-8 text-center"><ImageOff size={35} className="mx-auto text-slate-400"/><h2 className="mt-3 font-black">Oferta não disponível</h2><p className="mt-2 text-sm text-slate-500">Este anúncio pode ter sido removido, despublicado ou ainda estar em análise.</p><a href="/vitrines" className="mt-4 inline-flex items-center gap-2 font-bold text-orange-700">Ver outras ofertas <ArrowRight size={16}/></a></div>:
    filtered.length?
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map(item=><article key={item.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl">
     <a href={publicOfferLink(item.id)} className="block"><OfferPicture offer={item}/></a>
     <div className="space-y-2.5 p-4">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-700">{item.kind==='product'?'Peça / acessório':'Serviço'}</span><span className="max-w-full truncate text-xs text-slate-500">{item.category}</span></div>
      <a className="block text-base font-black leading-6 text-[#12203a] hover:text-orange-700" href={publicOfferLink(item.id)}>{item.title}</a>
      <p className="line-clamp-2 min-h-9 text-xs leading-5 text-slate-500">{item.compatibility||item.description||'Consulte as informações completas.'}</p>
      <p className="text-lg font-black text-orange-700">{formatMarketplacePrice(item)}</p>
      <div className="flex items-center justify-between gap-2 border-t pt-3"><div className="min-w-0"><p className="truncate text-xs font-bold">{item.business_name}</p><p className="text-[11px] text-slate-500">{availabilityLabel[item.availability]}</p></div><a href={publicOfferLink(item.id)} aria-label={'Ver detalhes de '+item.title} className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#12223b] text-white hover:bg-orange-600"><ArrowRight size={18}/></a></div>
     </div>
    </article>)}</div>:
    <div className="rounded-2xl border bg-white p-9 text-center"><Package size={39} className="mx-auto text-orange-500"/><h2 className="mt-3 text-lg font-black">Nenhuma oferta encontrada</h2><p className="mt-2 text-sm leading-6 text-slate-500">Experimente outra busca ou categoria. Lojas e oficinas precisam publicar ofertas após a aprovação empresarial.</p><a href="/acesso?mode=register" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold">Cadastrar minha empresa <ArrowRight size={16}/></a></div>}
   {!search.oferta&&<p className="flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck size={15}/> Apenas ofertas publicadas por empresas aprovadas aparecem nesta vitrine. Valores e condições são informados pelos estabelecimentos.</p>}
  </main>
  <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center"><DeveloperCredit compact/></footer>
 </div>;
}
