import {useCallback,useEffect,useMemo,useState,type FormEvent} from 'react';
import {ArrowRight,CheckCircle2,Copy,Eye,EyeOff,ImageIcon,Package,PenLine,Plus,RefreshCw,Store,Trash2,Wrench} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {
 availabilityLabel,formatMarketplacePrice,publicBusinessLink,publicOfferLink,
 type MarketplaceAvailability,type MarketplaceKind,type MarketplaceListing,type MarketplacePriceMode
} from '@/lib/business/marketplace';

type StockPart={sku:string;name:string;application:string;quantity:number;price:number};
type Draft={
 kind:MarketplaceKind;title:string;category:string;description:string;brand:string;
 reference_code:string;compatibility:string;image_url:string;price:string;
 price_mode:MarketplacePriceMode;availability:MarketplaceAvailability;is_published:boolean
};
const initial:Draft={
 kind:'product',title:'',category:'',description:'',brand:'',reference_code:'',
 compatibility:'',image_url:'',price:'',price_mode:'fixed',availability:'available',is_published:false
};
const input='w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100';
const label='grid gap-1.5 text-xs font-bold text-slate-600';
export function BusinessShowcasePanel({businessId,businessName,approved,stock}:{
 businessId:string;businessName:string;approved:boolean;stock:StockPart[];
}){
 const [items,setItems]=useState<MarketplaceListing[]>([]);
 const [draft,setDraft]=useState<Draft>(initial);
 const [editId,setEditId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [info,setInfo]=useState('');
 const [kindFilter,setKindFilter]=useState<'all'|MarketplaceKind>('all');
 const load=useCallback(async()=>{
  if(!supabase){setLoading(false);setError('Conexão indisponível.');return;}
  const {data,error}=await supabase.from('marketplace_listings').select('*')
   .eq('business_id',businessId).order('created_at',{ascending:false}).limit(300);
  if(error)setError(error.message);
  else{setItems((data??[]) as MarketplaceListing[]);setError('');}
  setLoading(false);
 },[businessId]);
 useEffect(()=>{void load();},[load]);
 const visible=useMemo(()=>items.filter(x=>kindFilter==='all'||x.kind===kindFilter),[items,kindFilter]);
 const publicCount=items.filter(x=>x.is_published&&x.is_approved).length;
 function reset(){setEditId(null);setDraft(initial);}
 function edit(item:MarketplaceListing){
  setEditId(item.id);
  setDraft({kind:item.kind,title:item.title,category:item.category,description:item.description,
   brand:item.brand,reference_code:item.reference_code,compatibility:item.compatibility,
   image_url:item.image_url,price:item.price===null?'':String(item.price),
   price_mode:item.price_mode,availability:item.availability,is_published:item.is_published});
 }
 function copyLink(href:string){
  const url=new URL(href,window.location.origin).href;
  void navigator.clipboard?.writeText(url).then(()=>setInfo('Link copiado: '+url))
   .catch(()=>setInfo('Link da vitrine: '+url));
  if(!navigator.clipboard)setInfo('Link da vitrine: '+url);
 }
 async function save(e:FormEvent){
  e.preventDefault();if(!supabase)return;
  setError('');setInfo('');
  const cost=draft.price_mode==='quote'?null:Number(draft.price);
  if(draft.price_mode!=='quote'&&(!draft.price.trim()||!Number.isFinite(cost)||cost===null||cost<0))return setError('Informe um preço válido ou selecione Sob consulta.');
  if(draft.image_url.trim()&&!/^https:\/\/\S+$/i.test(draft.image_url.trim()))return setError('A foto precisa ter um endereço HTTPS válido.');
  if(draft.title.trim().length<3||draft.category.trim().length<2)return setError('Informe título e categoria válidos.');
  setBusy(true);
  try{
   const payload={business_id:businessId,...draft,title:draft.title.trim(),category:draft.category.trim(),
    description:draft.description.trim(),brand:draft.brand.trim(),reference_code:draft.reference_code.trim(),
    compatibility:draft.compatibility.trim(),image_url:draft.image_url.trim(),price:cost};
   const result=editId?await supabase.from('marketplace_listings').update(payload).eq('id',editId).eq('business_id',businessId):
    await supabase.from('marketplace_listings').insert(payload);
   if(result.error)throw result.error;
   reset();await load();
   setInfo('Oferta salva! '+(approved?'Você pode compartilhar a vitrine quando a oferta estiver publicada.':'A empresa ainda precisa de aprovação para exibir ofertas ao público.'));
  }catch(e){setError(e instanceof Error?e.message:'Falha ao salvar a oferta.');}
  finally{setBusy(false);}
 }
 async function toggle(item:MarketplaceListing){
  if(!supabase)return;setBusy(true);setError('');setInfo('');
  try{
   const {error}=await supabase.from('marketplace_listings').update({is_published:!item.is_published})
    .eq('id',item.id).eq('business_id',businessId);
   if(error)throw error;
   await load();setInfo(item.is_published?'Oferta retirada da vitrine.':approved?'Oferta publicada na vitrine.':'Oferta marcada para publicação após a aprovação da empresa.');
  }catch(e){setError(e instanceof Error?e.message:'Falha ao alterar publicação.');}
  finally{setBusy(false);}
 }
 async function remove(item:MarketplaceListing){
  if(!supabase||!window.confirm('Excluir permanentemente esta oferta da vitrine?'))return;
  setBusy(true);setError('');setInfo('');
  try{
   const {error}=await supabase.from('marketplace_listings').delete().eq('id',item.id).eq('business_id',businessId);
   if(error)throw error;await load();if(editId===item.id)reset();setInfo('Oferta excluída.');
  }catch(e){setError(e instanceof Error?e.message:'Falha ao remover oferta.');}
  finally{setBusy(false);}
 }
 return <div className="space-y-4">
  <section className="relative overflow-hidden rounded-2xl bg-[#14243b] p-5 text-white sm:p-6">
   <div className="flex flex-wrap items-center justify-between gap-4">
    <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-300">Vitrine SmartVeículos</p>
     <h2 className="mt-1 text-2xl font-black">Sua loja, seus produtos e serviços</h2>
     <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">Publique fotos, preços, aplicação das peças, acessórios, serviços e revisões. Cada oferta ganha um link para enviar aos clientes.</p>
    </div>
    <button onClick={()=>copyLink(publicBusinessLink(businessId))} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10"><Copy size={16}/> Copiar link da minha vitrine</button>
   </div>
   <div className="mt-4 flex flex-wrap gap-3 text-xs"><span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">{items.length} ofertas cadastradas</span><span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">{publicCount} visíveis ao público</span><span className={'rounded-xl px-3 py-2 '+(approved?'bg-emerald-100 text-emerald-900':'bg-amber-100 text-amber-900')}>{approved?'Empresa aprovada':'Aguardando aprovação empresarial'}</span></div>
  </section>
  {!approved&&<p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">Você pode preparar suas ofertas. Elas só serão mostradas aos consumidores após a aprovação da empresa pelo administrador.</p>}
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
  {info&&<p role="status" className="break-words rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{info}</p>}
  <div className="grid items-start gap-4 lg:grid-cols-[.95fr_1.05fr]">
   <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
    <div className="sm:col-span-2 flex items-center justify-between gap-3"><h3 className="text-lg font-black">{editId?'Editar oferta':'Cadastrar oferta'}</h3>{editId&&<button type="button" onClick={reset} className="text-xs font-bold text-orange-700">Cancelar edição</button>}</div>
    <label className={label}>Tipo<select className={input} value={draft.kind} onChange={e=>setDraft(d=>({...d,kind:e.target.value as MarketplaceKind,category:''}))}><option value="product">Peça ou acessório</option><option value="service">Serviço, revisão ou manutenção</option></select></label>
    <label className={label}>Categoria<input className={input} minLength={2} maxLength={80} required placeholder={draft.kind==='service'?'Ex.: Revisões':'Ex.: Suspensão'} value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))}/></label>
    {draft.kind==='product'&&stock.length>0&&<label className={label+' sm:col-span-2'}>Importar dados do estoque<select className={input} defaultValue="" onChange={e=>{const chosen=stock.find(p=>p.sku===e.target.value);if(chosen)setDraft(d=>({...d,title:chosen.name,reference_code:chosen.sku,compatibility:chosen.application,price:String(chosen.price),price_mode:'fixed',availability:chosen.quantity>0?'available':'out_of_stock'}));}}><option value="">Escolher peça cadastrada...</option>{stock.map(p=><option key={p.sku} value={p.sku}>{p.sku} · {p.name}</option>)}</select></label>}
    <label className={label+' sm:col-span-2'}>Nome da oferta<input required minLength={3} maxLength={150} className={input} placeholder={draft.kind==='product'?'Ex.: Pastilha de freio dianteira':'Ex.: Revisão completa de motocicleta'} value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}/></label>
    <label className={label}>Marca / fabricante<input maxLength={80} className={input} placeholder="Ex.: Honda, Bosch, NGK" value={draft.brand} onChange={e=>setDraft(d=>({...d,brand:e.target.value}))}/></label>
    <label className={label}>Código da peça<input maxLength={80} className={input} placeholder="SKU ou referência" value={draft.reference_code} onChange={e=>setDraft(d=>({...d,reference_code:e.target.value}))}/></label>
    <label className={label+' sm:col-span-2'}>Aplicação e compatibilidade<input maxLength={400} className={input} placeholder="Ex.: CB650R 2019 a 2024; confirmar chassi" value={draft.compatibility} onChange={e=>setDraft(d=>({...d,compatibility:e.target.value}))}/></label>
    <label className={label+' sm:col-span-2'}>Foto do produto / serviço (endereço HTTPS)<input className={input} inputMode="url" placeholder="https://..." value={draft.image_url} onChange={e=>setDraft(d=>({...d,image_url:e.target.value}))}/></label>
    <label className={label}>Como mostrar o preço<select className={input} value={draft.price_mode} onChange={e=>setDraft(d=>({...d,price_mode:e.target.value as MarketplacePriceMode}))}><option value="fixed">Preço fixo</option><option value="starting_at">A partir de</option><option value="quote">Sob consulta</option></select></label>
    <label className={label}>Preço (R$)<input className={input} disabled={draft.price_mode==='quote'} type="number" min="0" step="0.01" required={draft.price_mode!=='quote'} value={draft.price_mode==='quote'?'':draft.price} onChange={e=>setDraft(d=>({...d,price:e.target.value}))}/></label>
    <label className={label+' sm:col-span-2'}>Disponibilidade<select className={input} value={draft.availability} onChange={e=>setDraft(d=>({...d,availability:e.target.value as MarketplaceAvailability}))}><option value="available">Disponível</option><option value="on_request">Sob encomenda ou agendamento</option><option value="out_of_stock">Indisponível no momento</option></select></label>
    <label className={label+' sm:col-span-2'}>Descrição detalhada<textarea rows={3} maxLength={3500} className={input} placeholder="Descrição, especificações, garantia, itens inclusos, condições do serviço..." value={draft.description} onChange={e=>setDraft(d=>({...d,description:e.target.value}))}/></label>
    <label className="sm:col-span-2 flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 p-3 text-xs font-bold text-orange-950"><input type="checkbox" checked={draft.is_published} onChange={e=>setDraft(d=>({...d,is_published:e.target.checked}))}/> Exibir esta oferta na vitrine pública após a aprovação empresarial</label>
    <button disabled={busy} type="submit" className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-[#162037] hover:bg-orange-400 disabled:opacity-50"><CheckCircle2 size={17}/> {editId?'Salvar alterações':'Cadastrar oferta na vitrine'}</button>
   </form>
   <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-black">Minhas ofertas</h3><button onClick={()=>void load()} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600"><RefreshCw size={14}/> Atualizar</button></div>
    <div className="mt-3 flex gap-1.5">{([['all','Todas'],['product','Produtos'],['service','Serviços']] as const).map(([id,name])=><button key={id} onClick={()=>setKindFilter(id)} className={'rounded-lg px-3 py-2 text-xs font-bold '+(kindFilter===id?'bg-[#12213a] text-white':'bg-slate-100 text-slate-600')}>{name}</button>)}</div>
    <div className="mt-4 max-h-[900px] space-y-3 overflow-y-auto pr-1">
     {loading?<p className="text-sm text-slate-500">Carregando suas ofertas...</p>:visible.length?visible.map(item=><article key={item.id} className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-start gap-3">
       <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100">{item.image_url?<img src={item.image_url} alt="" loading="lazy" className="size-full object-cover" onError={e=>{e.currentTarget.style.display='none';}}/>:item.kind==='service'?<Wrench size={22} className="text-slate-400"/>:<Package size={22} className="text-slate-400"/>}</div>
       <div className="min-w-0 flex-1"><p className="text-sm font-black">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.kind==='product'?'Produto':'Serviço'} · {item.category}</p><p className="mt-1 text-sm font-black text-orange-700">{formatMarketplacePrice(item)}</p></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5"><span className={'rounded-full px-2 py-1 text-[10px] font-bold '+(item.is_published?'bg-orange-50 text-orange-900':'bg-slate-100 text-slate-600')}>{item.is_published?'Marcado para publicar':'Rascunho'}</span><span className={'rounded-full px-2 py-1 text-[10px] font-bold '+(item.is_approved?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800')}>{item.is_approved?'Empresa aprovada':'Empresa em análise'}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px]">{availabilityLabel[item.availability]}</span></div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
       <button onClick={()=>edit(item)} className="inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold"><PenLine size={14}/> Editar</button>
       <button disabled={busy} onClick={()=>void toggle(item)} className="inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold">{item.is_published?<EyeOff size={14}/>:<Eye size={14}/>} {item.is_published?'Ocultar':'Publicar'}</button>
       <button disabled={!item.is_published||!item.is_approved} onClick={()=>copyLink(publicOfferLink(item.id))} className="inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold disabled:opacity-35"><Copy size={14}/> Link</button>
       <button disabled={busy} onClick={()=>void remove(item)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-2 text-xs font-bold text-red-700"><Trash2 size={14}/> Excluir</button>
      </div>
     </article>):<div className="rounded-xl border border-dashed p-7 text-center"><ImageIcon size={28} className="mx-auto text-slate-400"/><p className="mt-3 text-sm font-bold">Sua vitrine ainda está vazia</p><p className="mt-1 text-xs text-slate-500">Cadastre seu primeiro produto ou serviço para começar.</p></div>}
    </div>
    <div className="mt-4 border-t pt-4"><a href={publicBusinessLink(businessId)} className="inline-flex items-center gap-2 text-xs font-bold text-orange-700 hover:underline"><Store size={16}/> Abrir vitrine pública <ArrowRight size={14}/></a></div>
   </section>
  </div>
  <p className="text-xs leading-6 text-slate-500">A vitrine é informativa: o cliente pode consultar os detalhes e contatar o estabelecimento. Carrinho, pagamento, cálculo de frete e rastreio de pedidos ainda não estão disponíveis nesta etapa.</p>
 </div>;
}
