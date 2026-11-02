import {ArrowRight,Bike,CarFront,Check,UserRound,Wrench} from 'lucide-react';
import {
 REGISTRATION_PROFILES,type RegistrationProfile
} from '@/lib/business/registration-profiles';

const icons={owner:UserRound,parts_cars:CarFront,parts_bikes:Bike,workshop:Wrench};

export function RegistrationProfilePicker({
 selected,onSelect,onContinue
}:{
 selected:RegistrationProfile|null;
 onSelect:(value:RegistrationProfile)=>void;
 onContinue:()=>void;
}){
 return <div className="sv-registration-step space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div>
    <p className="text-[11px] font-extrabold uppercase tracking-[.13em] text-orange-700">Etapa 1 de 2 — seu perfil</p>
    <h3 className="mt-0.5 text-base font-black tracking-tight text-[#14213B] sm:text-lg">Em qual área você atua?</h3>
   </div>
   <span className="sv-registration-hint rounded-full border border-orange-300/80 bg-orange-50 px-3 py-1.5 text-[10px] font-extrabold text-orange-800">Escolha uma opção</span>
  </div>
  <div role="radiogroup" aria-label="Escolha o ramo de atuação" className="grid grid-cols-2 gap-2.5 sm:gap-3">
   {REGISTRATION_PROFILES.map(profile=>{
    const Icon=icons[profile.id];
    const isSelected=selected===profile.id;
    return <button
     type="button" role="radio" aria-checked={isSelected}
     key={profile.id} onClick={()=>onSelect(profile.id)}
     className={'sv-registration-choice group flex min-h-[78px] min-w-0 items-start gap-2.5 rounded-2xl border px-3 py-3 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 sm:min-h-[88px] sm:gap-3 sm:p-3.5 '+
       (isSelected?'border-orange-500 bg-[#FFF7ED] shadow-md':'border-slate-200 bg-white/80 hover:border-orange-400 hover:bg-orange-50/70 hover:shadow-md')}>
      <span className={'sv-registration-icon grid size-9 shrink-0 place-items-center rounded-xl '+(isSelected?'bg-[#F97316] text-white':'bg-[#FFEDD5] text-[#EA580C]')}><Icon size={19}/></span>
      <span className="min-w-0 flex-1">
       <span className="block text-[11px] font-extrabold leading-[1.35] text-[#14213B] sm:text-[13px]">{profile.label}</span>
       <span className="mt-1 block text-[10px] leading-[1.45] text-slate-600 sm:text-[11px]">{profile.description}</span>
      </span>
      {isSelected&&<Check className="mt-0.5 shrink-0 text-orange-700" size={15} aria-hidden="true"/>}
    </button>;
   })}
  </div>
  <button type="button" disabled={!selected} onClick={onContinue}
   className="sv-auth-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
   Continuar para o cadastro <ArrowRight size={17} aria-hidden="true"/>
  </button>
  <p className="text-center text-[10px] leading-[1.4] text-slate-600 sm:text-[11px]">Lojas e oficinas terão cadastro de CNPJ. Proprietários precisam apenas de uma conta pessoal.</p>
 </div>;
}
