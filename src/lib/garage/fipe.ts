/** Cotação FIPE por versão exata: nunca estime preços a partir do nome livre do veículo.
 * Fonte: API FIPE (Parallelum), consulta pública sem token e sujeita a limites.
 * Cache por veículo no navegador: atualizado ao abrir no mês seguinte.
 */
export type FipeKind = 'carro'|'moto';
export type FipeOption = {code:string;name:string};
export type FipeSelection = {
  brandId:string;brandName:string;modelId:string;modelName:string;
  yearId:string;yearName:string;
};
export type FipePrice = {
  price:string;referenceMonth:string;codeFipe:string;brand:string;
  model:string;modelYear:number;fuel:string;
};
export type FipeSaved = {
  selection:FipeSelection;quote:FipePrice;checkedAt:string;
};
const API_BASE='https://fipe.parallelum.com.br/api/v2';
const typePath=(kind:FipeKind)=>kind==='carro'?'cars':'motorcycles';
export const fipeStorageKey=(vehicleId:string)=>'smartveiculos:fipe:v1:'+vehicleId;

export function getMonthStamp(date:Date):string {
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0');
}
export function needsFipeRefresh(entry:FipeSaved,now:Date):boolean {
  const checked=new Date(entry.checkedAt);
  if(!Number.isFinite(checked.getTime()))return true;
  // Não faz requisições em cada render: ao mudar o mês busca uma vez ao dia.
  if(getMonthStamp(checked)===getMonthStamp(now))return false;
  const nowDate=now.toISOString().slice(0,10);
  return checked.toISOString().slice(0,10)!==nowDate;
}
export function readFipe(vehicleId:string):FipeSaved|null {
  if(!vehicleId||typeof window==='undefined')return null;
  try {
    const raw=window.localStorage.getItem(fipeStorageKey(vehicleId));
    if(!raw)return null;
    const v:unknown=JSON.parse(raw);
    if(!v||typeof v!=='object')return null;
    const r=v as Partial<FipeSaved>;
    if(!r.selection||!r.quote||typeof r.checkedAt!=='string')return null;
    const s=r.selection,p=r.quote;
    if([s.brandId,s.brandName,s.modelId,s.modelName,s.yearId,s.yearName,
      p.price,p.referenceMonth,p.codeFipe,p.model,p.brand,p.fuel].some(x=>typeof x!=='string')||
      typeof p.modelYear!=='number')return null;
    return r as FipeSaved;
  }catch{return null;}
}
export function writeFipe(vehicleId:string,data:FipeSaved):void{
  if(!vehicleId||typeof window==='undefined')return;
  window.localStorage.setItem(fipeStorageKey(vehicleId),JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('smartveiculos:fipe:updated',{detail:vehicleId}));
}
export function clearFipe(vehicleId:string):void{
  if(typeof window==='undefined')return;
  window.localStorage.removeItem(fipeStorageKey(vehicleId));
  window.dispatchEvent(new CustomEvent('smartveiculos:fipe:updated',{detail:vehicleId}));
}
async function request(path:string,signal?:AbortSignal):Promise<unknown>{
  const response=await fetch(API_BASE+path,{signal,headers:{Accept:'application/json'}});
  if(response.status===429)throw new Error('Limite temporário da consulta FIPE. Tente novamente mais tarde.');
  if(!response.ok)throw new Error('Consulta FIPE indisponível (HTTP '+response.status+').');
  return response.json();
}
function asOptions(value:unknown):FipeOption[]{
  if(!Array.isArray(value))throw new Error('A API FIPE retornou uma lista inválida.');
  return value.filter((x):x is {code:string|number;name:string}=>Boolean(x)&&
    (typeof x.code==='string'||typeof x.code==='number')&&typeof x.name==='string')
    .map(x=>({code:String(x.code),name:x.name}));
}
const safe=(value:string)=>encodeURIComponent(value);
export async function fipeBrands(kind:FipeKind,signal?:AbortSignal):Promise<FipeOption[]>{
  return asOptions(await request('/'+typePath(kind)+'/brands',signal));
}
export async function fipeModels(kind:FipeKind,brandId:string,signal?:AbortSignal):Promise<FipeOption[]>{
  return asOptions(await request('/'+typePath(kind)+'/brands/'+safe(brandId)+'/models',signal));
}
export async function fipeYears(kind:FipeKind,brandId:string,modelId:string,signal?:AbortSignal):Promise<FipeOption[]>{
  return asOptions(await request('/'+typePath(kind)+'/brands/'+safe(brandId)+'/models/'+safe(modelId)+'/years',signal));
}
export async function fipePrice(kind:FipeKind,selection:FipeSelection,signal?:AbortSignal):Promise<FipePrice>{
  const data=await request('/'+typePath(kind)+'/brands/'+safe(selection.brandId)+
    '/models/'+safe(selection.modelId)+'/years/'+safe(selection.yearId),signal);
  if(!data||typeof data!=='object')throw new Error('Resposta inválida da consulta FIPE.');
  const d=data as Record<string,unknown>;
  const fields=['price','referenceMonth','codeFipe','brand','model','fuel'] as const;
  if(fields.some(k=>typeof d[k]!=='string')||!Number.isFinite(d.modelYear)||
      !/^R\$\s*[\d.]+,\d{2}$/.test(String(d.price))||
      !/^\d{6}-\d$/.test(String(d.codeFipe))) {
    throw new Error('Preço FIPE não confirmado. Tente novamente.');
  }
  return {
    price:String(d.price),referenceMonth:String(d.referenceMonth),
    codeFipe:String(d.codeFipe),brand:String(d.brand),
    model:String(d.model),modelYear:Number(d.modelYear),fuel:String(d.fuel),
  };
}
