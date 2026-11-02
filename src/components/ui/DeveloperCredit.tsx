import {Code2, MapPin} from 'lucide-react';

/**
 * Assinatura do responsável pelo desenvolvimento do SmartVeículos.
 * Não contém links promocionais nem informação pessoal além do crédito solicitado.
 */
export function DeveloperCredit({tone='light',compact=false}:{
 tone?:'light'|'dark';compact?:boolean;
}){
 const dark=tone==='dark';
 return <div
   aria-label="Créditos de desenvolvimento: Franc D'nis, Feijó, Acre"
   className={'sv-developer-credit inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium tracking-wide '+
    (dark?'text-slate-400':'text-slate-500')}
  >
  <span className="inline-flex items-center gap-1.5">
   <Code2 aria-hidden="true" size={13} className={dark?'text-orange-300':'text-orange-600'}/>
   <span>{compact?'Desenvolvido por':'Desenvolvimento e tecnologia por'}</span>
   <strong className={'sv-developer-name font-extrabold '+(dark?'text-slate-100':'text-slate-700')}>Franc D&apos;nis</strong>
  </span>
  <span aria-hidden="true" className={dark?'text-slate-600':'text-slate-300'}>·</span>
  <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" size={12}/> Feijó, Acre</span>
 </div>;
}
