import {ArrowRight,Bike,CarFront,CheckCircle2,Gauge,ShieldCheck,Wrench,type LucideIcon} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';

export type PortalArea='parts_cars'|'parts_bikes'|'workshop'|'garage';

type AreaDetail={
 title:string;
 eyebrow:string;
 introduction:string;
 features:readonly string[];
 upcoming:readonly string[];
 href:string;
 buttonLabel:string;
 image:string;
 icon:LucideIcon;
 business:boolean;
};

const AREAS:Record<PortalArea,AreaDetail>={
 parts_cars:{
  title:'Autopeças para carros',
  eyebrow:'SOLUÇÃO PARA LOJISTAS',
  introduction:'Sua autopeças merece mais do que uma planilha. Centralize seu catálogo, organize o estoque e prepare sua empresa para atender clientes com mais agilidade — do primeiro contato à venda.',
  features:[
   'Cadastro de peças por código SKU, descrição e aplicação',
   'Controle de quantidades e valores de referência em estoque',
   'Busca e organização de produtos para diferentes veículos',
  ],
  upcoming:[
   'Vitrine de peças com fotos, compatibilidade e links para enviar aos clientes',
   'Chat integrado para tirar dúvidas, negociar e acompanhar atendimentos',
   'Pedidos, separação de produtos e atualização do status de entrega',
  ],
  href:'/acesso?segment=parts_cars',
  buttonLabel:'Entrar na área de autopeças',
  image:'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1100&q=82&fit=crop',
  icon:CarFront,
  business:true,
 },
 parts_bikes:{
  title:'Autopeças para motos',
  eyebrow:'SOLUÇÃO PARA O SETOR DE MOTOS',
  introduction:'Organize sua loja de peças para motos em um só lugar. Tenha controle dos componentes por modelo, apresente seu catálogo com clareza e prepare um atendimento mais próximo para cada motociclista.',
  features:[
   'Cadastro de componentes com SKU e modelos compatíveis',
   'Acompanhamento da quantidade de peças disponíveis',
   'Consulta de preços e pesquisa rápida no catálogo',
  ],
  upcoming:[
   'Catálogo ilustrado de peças com links exclusivos para compartilhar',
   'Conversas diretas com clientes e solicitações de orçamento',
   'Pedidos, acompanhamento de envio e informações de entrega',
  ],
  href:'/acesso?segment=parts_bikes',
  buttonLabel:'Entrar na área de motos',
  image:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1100&q=82&fit=crop',
  icon:Bike,
  business:true,
 },
 workshop:{
  title:'Oficinas mecânicas',
  eyebrow:'GESTÃO PARA PROFISSIONAIS',
  introduction:'Dê mais transparência ao atendimento da sua oficina. Registre os serviços e organize os orçamentos hoje, enquanto evoluímos a plataforma para que cada cliente possa acompanhar o veículo do agendamento à entrega.',
  features:[
   'Abertura de ordens de serviço vinculadas a cliente e veículo',
   'Registro de descrição dos reparos e valor orçado',
   'Acompanhamento interno de OS abertas, em andamento ou concluídas',
  ],
  upcoming:[
   'Agenda online para marcar e confirmar serviços',
   'Linha do tempo do reparo com atualizações visíveis ao cliente',
   'Chat, avisos e fotos do serviço para manter o cliente informado',
  ],
  href:'/acesso?segment=workshop',
  buttonLabel:'Entrar na área da oficina',
  image:'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1100&q=82&fit=crop',
  icon:Wrench,
  business:true,
 },
 garage:{
  title:'Minha garagem digital',
  eyebrow:'SOLUÇÃO PARA PROPRIETÁRIOS',
  introduction:'Seu carro e sua moto têm uma história. Mantenha revisões, manutenção e abastecimentos organizados e tenha um espaço pessoal para acompanhar o que importa em cada veículo.',
  features:[
   'Fichas individuais para carros e motocicletas',
   'Histórico de serviços, revisões e despesas registradas',
   'Informações de combustível e quilometragem informadas pelo proprietário',
  ],
  upcoming:[
   'Conexão com oficinas para receber atualizações do serviço',
   'Agendamentos e mensagens com profissionais cadastrados',
   'Consulta de peças e pedidos vinculados ao seu veículo',
  ],
  href:'/acesso?next=%2Fgaragem',
  buttonLabel:'Entrar na minha garagem',
  image:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1100&q=82&fit=crop',
  icon:Gauge,
  business:false,
 }
};

/** Exibe explicações sem tirar o visitante da homepage. O acesso continua pela rota autenticada. */
export function PortalAreaDialog({area,onOpenChange}:{
 area:PortalArea|null;
 onOpenChange:(open:boolean)=>void;
}){
 const data=area?AREAS[area]:null;
 const Icon=data?.icon;
 return <Dialog open={area!==null} onOpenChange={onOpenChange}>
  <DialogContent className="max-h-[min(90dvh,760px)] w-[calc(100%-2rem)] max-w-[570px] overflow-y-auto rounded-3xl border-0 bg-white p-0 text-slate-900 shadow-2xl gap-0 [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-white [&>button]:p-2 [&>button]:text-slate-800 [&>button]:opacity-100 [&>button]:shadow-md">
   {data&&Icon&&<>
    <div className="relative h-40 overflow-hidden bg-[#101b2b] sm:h-48">
     <img src={data.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy"/>
     <div className="absolute inset-0 bg-gradient-to-t from-[#101b2b]/90 via-[#101b2b]/30 to-[#101b2b]/5"/>
     <div className="absolute bottom-5 left-6 flex items-center gap-3 text-white sm:left-8">
      <span className="grid size-11 place-items-center rounded-xl border border-white/25 bg-orange-500 text-slate-950"><Icon size={22}/></span>
      <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-200">{data.eyebrow}</span>
     </div>
    </div>
    <div className="space-y-5 px-6 pb-7 pt-6 sm:px-8 sm:pb-8">
     <DialogHeader className="space-y-3 text-left">
      <DialogTitle className="text-2xl font-black leading-tight tracking-tight text-[#101b2b] sm:text-3xl">{data.title}</DialogTitle>
      <DialogDescription className="text-sm leading-7 text-slate-600">{data.introduction}</DialogDescription>
     </DialogHeader>
     <div>
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">O que você já pode fazer</h3>
      <ul className="mt-3 grid gap-3">{data.features.map(feature=>
       <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
        <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-orange-600" aria-hidden="true"/>
        <span>{feature}</span>
       </li>
      )}</ul>
     </div>
     <div className="rounded-2xl border border-orange-200/80 bg-orange-50/60 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
       <h3 className="text-xs font-black uppercase tracking-[0.12em] text-orange-900">Novidades que estão a caminho</h3>
       <span className="rounded-full border border-orange-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-orange-800">Em desenvolvimento</span>
      </div>
      <ul className="mt-3 grid gap-2">{data.upcoming.map(feature=>
       <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-slate-700">
        <ArrowRight size={14} className="mt-0.5 shrink-0 text-orange-600" aria-hidden="true"/>
        <span>{feature}</span>
       </li>
      )}</ul>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">Estas funcionalidades fazem parte do plano de evolução e ainda não estão disponíveis para uso.</p>
     </div>
     <div className="flex items-start gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs leading-6 text-orange-900">
      <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true"/>
      <span>{data.business?'Acesso profissional com login e senha. O cadastro da empresa exige CNPJ com dígitos verificadores válidos e verificação de titularidade.':'Acesso com e-mail e senha. Seus veículos ficam vinculados à sua conta.'}</span>
     </div>
     <a href={data.href}
       className="sv-cta-link flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-extrabold text-[#101b2b] shadow-sm hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
      {data.buttonLabel}<ArrowRight size={19} aria-hidden="true"/>
     </a>
     <p className="text-center text-xs text-slate-500">Explore as funcionalidades atuais em um ambiente protegido por login.</p>
    </div>
   </>}
  </DialogContent>
 </Dialog>;
}
