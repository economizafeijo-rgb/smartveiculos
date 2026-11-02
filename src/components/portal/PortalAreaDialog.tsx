import {ArrowRight,Bike,CarFront,CheckCircle2,Gauge,ShieldCheck,Wrench,type LucideIcon} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';

export type PortalArea='parts_cars'|'parts_bikes'|'workshop'|'garage';

type AreaDetail={
 title:string;
 eyebrow:string;
 introduction:string;
 features:readonly string[];
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
  introduction:'Organize sua operação de autopeças em um ambiente desenvolvido para o comércio automotivo. Controle o que há no estoque, identifique cada produto e mantenha as informações acessíveis para sua equipe.',
  features:[
   'Cadastro de peças por código SKU, descrição e aplicação',
   'Controle de quantidades e valores de referência em estoque',
   'Busca e organização de produtos para diferentes veículos',
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
  introduction:'Um espaço dedicado à gestão de peças para motocicletas, com organização de catálogo, aplicações e estoque. Ideal para separar sua operação de motos do segmento automotivo.',
  features:[
   'Cadastro de componentes com SKU e modelos compatíveis',
   'Acompanhamento da quantidade de peças disponíveis',
   'Consulta de preços e pesquisa rápida no catálogo',
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
  introduction:'Tenha mais organização no atendimento da sua oficina. Registre os serviços solicitados, acompanhe cada etapa e consulte os orçamentos em um painel próprio.',
  features:[
   'Abertura de ordens de serviço vinculadas a cliente e veículo',
   'Registro de descrição dos reparos e valor orçado',
   'Acompanhamento de OS abertas, em andamento ou concluídas',
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
  introduction:'Cada carro e moto merece um histórico organizado. Acesse o painel do seu veículo para registrar manutenção, acompanhar revisões e consultar os abastecimentos.',
  features:[
   'Fichas individuais para carros e motocicletas',
   'Histórico de serviços, revisões e despesas registradas',
   'Informações de combustível e quilometragem informadas pelo proprietário',
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
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">O que você encontra nessa área</h3>
      <ul className="mt-3 grid gap-3">{data.features.map(feature=>
       <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
        <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-orange-600" aria-hidden="true"/>
        <span>{feature}</span>
       </li>
      )}</ul>
     </div>
     <div className="flex items-start gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs leading-6 text-orange-900">
      <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true"/>
      <span>{data.business?'Acesso profissional com login e senha. O cadastro da empresa exige CNPJ com dígitos verificadores válidos e verificação de titularidade.':'Acesso com e-mail e senha. Seus veículos ficam vinculados à sua conta.'}</span>
     </div>
     <a href={data.href}
       className="sv-cta-link flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-extrabold text-[#101b2b] shadow-sm hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
      {data.buttonLabel}<ArrowRight size={19} aria-hidden="true"/>
     </a>
     <p className="text-center text-xs text-slate-500">Você será direcionado para o acesso seguro da área selecionada.</p>
    </div>
   </>}
  </DialogContent>
 </Dialog>;
}
