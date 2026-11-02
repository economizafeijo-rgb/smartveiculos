import {cleanCnpj,type BusinessSegment} from './cnpj';

/** Identificador da empresa é separado da identidade do responsável.
 * Nunca confiar apenas no CNPJ digitado: a consulta ao Supabase deve
 * estar restrita ao owner_id autenticado por RLS.
 */
export type OwnedBusiness={cnpj:string;segment:BusinessSegment};
export type BusinessAccessResult='linked'|'setup'|'wrong-company';

export function businessAccessResult(
 owned:readonly OwnedBusiness[],
 cnpj:string,
 segment:BusinessSegment
):BusinessAccessResult{
 const relevant=owned.filter(b=>b.segment===segment);
 if(relevant.length===0)return 'setup';
 return relevant.some(b=>cleanCnpj(b.cnpj)===cleanCnpj(cnpj))?'linked':'wrong-company';
}
