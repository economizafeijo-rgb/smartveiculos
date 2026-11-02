import {type BusinessSegment,isBusinessSegment} from './cnpj';

/** Self-selected onboarding area, not an authorization role.
 * Permission to access any business data is enforced by Supabase RLS.
 */
export type RegistrationProfile='owner'|BusinessSegment;
export const REGISTRATION_PROFILES=[
 {id:'owner',label:'Proprietário de veículo',short:'Minha garagem',description:'Carros, motos, revisões e despesas'},
 {id:'parts_cars',label:'Autopeças de carros',short:'Loja automotiva',description:'Peças, catálogo e estoque'},
 {id:'parts_bikes',label:'Autopeças de motos',short:'Loja de motos',description:'Peças, catálogo e estoque'},
 {id:'workshop',label:'Oficina mecânica',short:'Serviços e oficina',description:'Ordens de serviço e atendimentos'}
] as const satisfies ReadonlyArray<{id:RegistrationProfile;label:string;short:string;description:string}>;

export function isRegistrationProfile(value:unknown):value is RegistrationProfile{
 return value==='owner'||(typeof value==='string'&&isBusinessSegment(value));
}
export function businessSegmentFromProfile(profile:RegistrationProfile|null):BusinessSegment|undefined{
 return profile!==null&&profile!=='owner'?profile:undefined;
}
export function profileDestination(profile:RegistrationProfile):string{
 const segment=businessSegmentFromProfile(profile);
 return segment?'/negocio?segment='+segment:'/garagem';
}
