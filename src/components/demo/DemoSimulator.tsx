import {useState} from 'react';
import {
 ArrowRight,CheckCircle2,ChevronRight,CircleHelp,ClipboardCheck,
 Clock3,LockKeyhole,MessageCircle,Minus,PackageCheck,Plus,Send,ShoppingCart,
 Wrench, type LucideIcon,
} from 'lucide-react';
import {
 DEMO_STOCK,DEMO_WORKSHOP_SERVICES,formatDemoBRL,
 type DemoBusinessArea,type DemoShopArea,
} from '@/lib/demo/demo-data';

type View=string; // A rota aceita também páginas específicas da garagem.
type ChatMessage={id:number;author:'visitante'|'assistente';text:string};
export type Cart=Record<string,number>;
const statuses={
 shop:['Pedido simulado','Separação dos itens','Conferência','Pronto para entrega'],
 workshop:['Solicitação criada','Em diagnóstico','Serviço em execução','Pronto para retirada'],
} as const;
const statusIcons:[LucideIcon,LucideIcon,LucideIcon,LucideIcon]=[ShoppingCart,Clock3,Wrench,PackageCheck];
const buttons='inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-orange-400';
const panel='sv-demo-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
export function DemoSimulator({
 area,view,cart,setCart
}:{
 area:DemoBusinessArea;view:View;cart:Cart;setCart:(cart:Cart)=>void
}){
 const isShop=area!=='workshop';
 const stock=isShop?DEMO_STOCK[area as DemoShopArea]:[];
 const [services,setServices]=useState<string[]>([]);
 const [saleMode,setSaleMode]=useState<'compra'|'venda'>('compra');
 const [order,setOrder]=useState<null|{id:string;description:string;value:number}>(null);
 const [stage,setStage]=useState(0);
 const [text,setText]=useState('');
 const [messages,setMessages]=useState<ChatMessage[]>([
  {id:0,author:'assistente',text:isShop
   ?'Olá! Este é um atendimento demonstrativo da loja. Escolha uma peça no catálogo e experimente uma compra.'
   :'Olá! Este é um chat demonstrativo da oficina. Você pode explorar uma ordem de serviço e acompanhar suas etapas.'},
 ]);
 const [feedback,setFeedback]=useState('');
 const chosen=stock.filter(p=>(cart[p.id]??0)>0);
 const total=isShop?chosen.reduce((n,p)=>n+p.price*(cart[p.id]??0),0):
  DEMO_WORKSHOP_SERVICES.filter(x=>services.includes(x.id)).reduce((n,s)=>n+s.priceFrom,0);
 const count=isShop?chosen.reduce((n,p)=>n+(cart[p.id]??0),0):services.length;
 const workflow=isShop?statuses.shop:statuses.workshop;
 function quantity(id:string,delta:number){
  const next=Math.max(0,Math.min(9,(cart[id]??0)+delta));
  setCart({...cart,[id]:next});
  setFeedback('');
 }
 function completeSimulation(){
  if(!count){setFeedback(isShop?'Escolha pelo menos uma peça de demonstração.':'Selecione pelo menos um serviço demonstrativo.');return;}
  const description=isShop
   ?chosen.map(p=>(cart[p.id]??0)+'× '+p.name).join(' · ')
   :DEMO_WORKSHOP_SERVICES.filter(x=>services.includes(x.id)).map(x=>x.name).join(' · ');
  setOrder({id:(isShop?(saleMode==='compra'?'COMPRA':'VENDA'):'OS')+'-SIMULADA',description,value:total});
  setStage(0);setFeedback('Simulação criada. Nenhum pedido foi enviado, pago ou gravado.');
 }
 function sendChat(){
  const message=text.trim().slice(0,300);
  if(!message)return;
  setMessages(prev=>[...prev,{id:prev.length,author:'visitante',text:message},{
   id:prev.length+1,author:'assistente',
   text:isShop?'Resposta simulada: consulte o catálogo da loja e o resumo de pedidos. Em uma conta real, a conversa depende de atendimento disponível.':
    'Resposta simulada: a ordem de serviço pode passar por diagnóstico, execução e retirada. Não existe mecânico conectado neste ambiente.'
  }]);
  setText('');
 }
 if(view!=='simular'&&view!=='chat'&&view!=='acompanhar')return null;
 return <section aria-label={'Simulador exclusivo de '+area} className="space-y-4">
  <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
   <div><p className="text-xs font-black uppercase tracking-wider text-orange-800">Ambiente interativo de treinamento</p>
    <h2 className="mt-1 text-lg font-black text-slate-900">{view==='chat'?'Chat interno demonstrativo':view==='acompanhar'?'Acompanhamento de pedido e serviço':isShop?'Simulação de compra e venda':'Simulação de ordem de serviço'}</h2>
    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-700">Todas as ações acontecem somente nesta sessão do navegador. Sem conexão com vendedores, clientes, mecânicos, pagamentos ou banco de dados real.</p>
   </div>
   <span className="rounded-full border border-orange-300 bg-white px-3 py-1.5 text-[10px] font-extrabold text-orange-800">100% simulado</span>
  </div>
  {view==='simular'&&<>
   <div className={panel}>
    <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">{isShop?<ShoppingCart size={18} className="text-orange-600"/>:<Wrench size={18} className="text-orange-600"/>}{isShop?'Selecione os produtos e quantidades':'Escolha os serviços para uma OS de teste'}</h3>
    {isShop&&<div role="group" aria-label="Escolher simulação de compra ou venda" className="mt-4 flex flex-wrap gap-2">
     <button type="button" aria-pressed={saleMode==='compra'} onClick={()=>setSaleMode('compra')}
      className={'rounded-xl border px-3 py-2 text-xs font-black '+(saleMode==='compra'?'border-orange-400 bg-orange-500 text-slate-950':'border-slate-200 bg-white text-slate-800')}>Compra como cliente</button>
     <button type="button" aria-pressed={saleMode==='venda'} onClick={()=>setSaleMode('venda')}
      className={'rounded-xl border px-3 py-2 text-xs font-black '+(saleMode==='venda'?'border-orange-400 bg-orange-500 text-slate-950':'border-slate-200 bg-white text-slate-800')}>Venda pela loja</button>
    </div>}
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
     {isShop?stock.map(p=><div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="min-w-0"><p className="text-xs font-black text-slate-900">{p.name}</p><p className="mt-1 text-[11px] text-slate-600">{formatDemoBRL(p.price)} · {p.sku}</p></div>
      <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
       <button aria-label={'Retirar '+p.name} onClick={()=>quantity(p.id,-1)} type="button" className="rounded-md p-1.5 text-slate-800 hover:bg-orange-50"><Minus size={15}/></button>
       <span className="w-5 text-center text-xs font-black text-slate-900">{cart[p.id]??0}</span>
       <button aria-label={'Adicionar '+p.name} onClick={()=>quantity(p.id,1)} type="button" className="rounded-md p-1.5 text-orange-700 hover:bg-orange-50"><Plus size={15}/></button>
      </div>
     </div>):DEMO_WORKSHOP_SERVICES.map(service=><label key={service.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input type="checkbox" checked={services.includes(service.id)} onChange={e=>setServices(curr=>e.target.checked?[...curr,service.id]:curr.filter(x=>x!==service.id))} className="size-4 accent-orange-500"/>
      <span className="flex-1"><span className="block text-xs font-black text-slate-900">{service.name}</span><span className="text-[11px] text-slate-600">A partir de {formatDemoBRL(service.priceFrom)}</span></span>
     </label>)}
    </div>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-200 pt-4">
     <div><p className="text-xs font-semibold text-slate-600">{count} {isShop?'produto(s) no carrinho':'serviço(s) selecionado(s)'}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{formatDemoBRL(total)}</p><p className="text-[11px] text-slate-500">Valor exclusivamente ilustrativo; nenhum pagamento ocorre.</p></div>
     <button type="button" onClick={completeSimulation} className={buttons}>{isShop?(saleMode==='compra'?'Simular pedido de compra':'Simular venda de produtos'):'Criar OS de demonstração'} <ChevronRight size={16}/></button>
    </div>
    {feedback&&<p role="status" className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-bold text-slate-800">{feedback}</p>}
   </div>
   {order&&<div className={panel}><h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><CheckCircle2 size={18} className="text-emerald-600"/> {order.id} — criado somente nesta tela</h3>
    <p className="mt-2 text-xs leading-5 text-slate-600">{order.description}</p><p className="mt-2 text-lg font-black text-slate-900">{formatDemoBRL(order.value)}</p>
    <p className="mt-2 text-[11px] text-slate-500">Use a aba “Acompanhar” para testar as etapas. Simulação não gera venda ou OS real.</p></div>}
  </>}
  {view==='acompanhar'&&<div className={panel}>
   <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black text-slate-900">{order?order.id:'Fluxo de atendimento de exemplo'}</h3><span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-extrabold text-orange-800">Não conectado ao vivo</span></div>
   <p className="mt-2 text-xs leading-5 text-slate-600">{order?.description??'Acompanhe uma sequência ilustrativa. Para um pedido personalizado, primeiro crie uma simulação.'}</p>
   <ol className="mt-5 grid gap-2 sm:grid-cols-4">{workflow.map((title,i)=>{
    const Icon=statusIcons[i]??Clock3;
    return <li key={title} className={'min-w-0 rounded-xl border p-3 '+(i<=stage?'border-orange-300 bg-orange-50':'border-slate-200 bg-slate-50')}>
     <span className={'grid size-9 place-items-center rounded-lg '+(i<=stage?'bg-orange-500 text-slate-950':'bg-slate-200 text-slate-500')}><Icon size={19}/></span>
     <p className="mt-3 text-xs font-black text-slate-900">{title}</p><p className="mt-1 text-[11px] text-slate-600">{i<=stage?'Etapa simulada':'Próxima etapa'}</p>
    </li>;
   })}</ol>
   <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
    <button type="button" onClick={()=>setStage(v=>(v+1)%workflow.length)} className={buttons}>Avançar simulação <ArrowRight size={15}/></button>
    <button type="button" className="text-xs font-bold text-slate-700 underline" onClick={()=>setStage(0)}>Reiniciar etapas</button>
   </div>
  </div>}
  {view==='chat'&&<div className={panel}>
   <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><MessageCircle size={18} className="text-orange-700"/> Atendimento ilustrativo</h3>
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600"><LockKeyhole size={14}/> Sem atendente real</span></div>
   <div className="mt-4 flex min-h-[270px] max-h-[370px] flex-col gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3" role="log" aria-label="Mensagens de demonstração" aria-live="polite">
    {messages.map(m=><div key={m.id} className={'max-w-[88%] rounded-2xl p-3 text-xs leading-5 '+(m.author==='visitante'?'self-end bg-[#142943] text-white':'self-start border border-slate-200 bg-white text-slate-800')}>
     <span className="mb-1 block text-[10px] font-black">{m.author==='visitante'?'Visitante':'Assistente ilustrativo'}</span>{m.text}</div>)}
   </div>
   <form onSubmit={e=>{e.preventDefault();sendChat()}} className="mt-3 flex flex-wrap gap-2">
    <label className="min-w-[190px] flex-1"><span className="sr-only">Digite mensagem de teste</span><input value={text} onChange={e=>setText(e.target.value)} maxLength={300}
     placeholder="Digite uma pergunta de teste…" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-orange-400"/></label>
    <button type="submit" disabled={!text.trim()} className={buttons+' disabled:cursor-not-allowed disabled:opacity-50'}><Send size={15}/> Enviar simulação</button>
   </form>
   <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-600"><CircleHelp size={15} className="mt-0.5 shrink-0"/> Este chat demonstra a interface. Não envia mensagens a oficinas, lojas, vendedores ou clientes cadastrados.</p>
  </div>}
 </section>;
}
