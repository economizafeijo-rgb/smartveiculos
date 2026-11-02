/** Receita Federal: CNPJ numérico e alfanumérico (ASCII - 48 / módulo 11).
 * Formato válido NÃO comprova inscrição ativa nem vínculo do solicitante com a empresa.
 */
export const cleanCnpj=(input:string)=>input.toUpperCase().replace(/[^A-Z0-9]/g,'');
const weights1=[5,4,3,2,9,8,7,6,5,4,3,2];
const weights2=[6,5,4,3,2,9,8,7,6,5,4,3,2];
function digit(base:string,weights:number[]):number{
 const sum=[...base].reduce((total,char,i)=>total+(char.charCodeAt(0)-48)*weights[i]!,0);
 const remainder=sum%11;
 return remainder<2?0:11-remainder;
}
export function validateCnpj(input:string):boolean{
 const normalized=cleanCnpj(input);
 if(!/^[A-Z0-9]{12}[0-9]{2}$/.test(normalized))return false;
 if(/^([0-9])\1{13}$/.test(normalized))return false;
 const one=digit(normalized.slice(0,12),weights1);
 const two=digit(normalized.slice(0,12)+String(one),weights2);
 return normalized.slice(12)===String(one)+String(two);
}
export function formatCnpj(input:string):string{
 const c=cleanCnpj(input);
 if(c.length!==14)return input;
 return c.slice(0,2)+'.'+c.slice(2,5)+'.'+c.slice(5,8)+'/'+c.slice(8,12)+'-'+c.slice(12);
}
export type BusinessSegment='parts_cars'|'parts_bikes'|'workshop';
export const BUSINESS_SEGMENTS:{id:BusinessSegment;label:string;description:string}[]=[
 {id:'parts_cars',label:'Autopeças para carros',description:'Estoque, peças, fornecedores e atendimento automotivo'},
 {id:'parts_bikes',label:'Autopeças para motos',description:'Peças, pneus, transmissão e componentes para motocicletas'},
 {id:'workshop',label:'Oficina mecânica',description:'Serviços, ordens de serviço, veículos e clientes'},
];
export function isBusinessSegment(s:string|null):s is BusinessSegment{
 return s==='parts_cars'||s==='parts_bikes'||s==='workshop';
}
