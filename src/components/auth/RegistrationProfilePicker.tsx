import {Bike,CarFront,Check,UserRound,Wrench} from 'lucide-react';
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
    <p className="text-[11px] font-extrabold uppercase tracking-[.13em] text-orange-700">Etapa 1 de 2 · Seu perfil</p>
    <h3 className="mt-0.5 text-base font-extrabold text-[#111B2E]">Em qual área você atua?</h3>
   </div>
   <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-bold text-orange-800">Escolha uma opção</span>
  </div>
  <div role="radiogroup" aria-label="Escolha o ramo de atuação" className="grid grid-cols-2 gap-2.5">
   {REGISTRATION_PROFILES.map(profile=>{
    const Icon=icons[profile.id];
    const isSelected=selected===profile.id;
    return <button
     type="button" role="radio" aria-checked={isSelected}
     key={profile.id} onClick={()=>onSelect(profile.id)}
     className={'sv-registration-choice flex min-h-[89px] min-w-0 items-start gap-2.5 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 '+
       (isSelected?'border-orange-500 bg-[#FFF7ED] shadow-sm':'border-slate-200 bg-white/90 hover:border-orange-300 hover:bg-orange-50/40')}>
      <span className={'grid size-8 shrink-0 place-items-center rounded-lg '+(isSelected?'bg-orange-500 text-[#172033]':'bg-slate-100 text-slate-600')}><Icon size={18}/></span>
      <span className="min-w-0 flex-1">
       <span className="block text-xs font-extrabold leading-[1.35] text-[#172033]">{profile.label}</span>
       <span className="mt-1 block text-[11px] leading-[1.45] text-slate-500">{profile.description}</span>
      </span>
      {isSelected&&<Check className="mt-0.5 shrink-0 text-orange-700" size={15} aria-hidden="true"/>}
    </button>;
   })}
  </div>
  <button type="button" disabled={!selected} onClick={onContinue}
   className="sv-action-primary flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-40">
   Continuar para o cadastro
  </button>
  <p className="text-center text-[11px] leading-4 text-slate-500">Lojas e oficinas terão cadastro de CNPJ. Proprietários precisam apenas de uma conta pessoal.</p>
 </div>;
}
