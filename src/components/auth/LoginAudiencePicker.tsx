import {Building2,CarFront,Store,UserRound} from 'lucide-react';
import {BUSINESS_SEGMENTS,type BusinessSegment} from '@/lib/business/cnpj';

export type LoginAudience='personal'|'business';

/** Explicit login destination; business selector is not an authorization grant.
 * Supabase verifies email/password, then checks CNPJ ownership server-side.
 */
export function LoginAudiencePicker({
 audience,segment,onAudienceChange,onSegmentChange
}:{
 audience:LoginAudience;
 segment:BusinessSegment;
 onAudienceChange:(value:LoginAudience)=>void;
 onSegmentChange:(value:BusinessSegment)=>void;
}){
 return <div className="sv-login-audience mt-3 space-y-2.5">
  <p className="text-[11px] font-extrabold uppercase tracking-[.09em] text-slate-600">Como deseja acessar?</p>
  <div role="group" aria-label="Tipo de acesso" className="grid grid-cols-2 gap-2">
   <button type="button" aria-pressed={audience==='personal'} onClick={()=>onAudienceChange('personal')}
    className={'sv-login-audience-choice flex min-h-[51px] items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[11px] font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:text-xs '+(audience==='personal'?'border-orange-500 bg-orange-50 text-[#9a3412]':'border-slate-200 bg-white/80 text-slate-700 hover:border-orange-300 hover:bg-white')}>
    <UserRound className="shrink-0" size={17} aria-hidden="true"/> Sou cliente
   </button>
   <button type="button" aria-pressed={audience==='business'} onClick={()=>onAudienceChange('business')}
    className={'sv-login-audience-choice flex min-h-[51px] items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[11px] font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:text-xs '+(audience==='business'?'border-orange-500 bg-orange-50 text-[#9a3412]':'border-slate-200 bg-white/80 text-slate-700 hover:border-orange-300 hover:bg-white')}>
    <Store className="shrink-0" size={17} aria-hidden="true"/> Sou lojista / profissional
   </button>
  </div>
  {audience==='business'&&<label className="sv-login-segment grid gap-1 text-xs font-bold text-slate-700" htmlFor="sv-login-company-segment">
   <span className="inline-flex items-center gap-1.5"><Building2 size={14} aria-hidden="true"/> Qual é o ramo da sua empresa?</span>
   <select id="sv-login-company-segment" value={segment} onChange={e=>onSegmentChange(e.target.value as BusinessSegment)}
    className="w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100">
    {BUSINESS_SEGMENTS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
   </select>
  </label>}
 </div>;
}
