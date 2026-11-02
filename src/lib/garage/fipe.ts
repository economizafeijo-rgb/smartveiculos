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
  selection:FipeSelection|null;quote:FipePrice;checkedAt:string;source?:'published-reference'|'api';
};
const API_BASE='https://fipe.parallelum.com.br/api/v2';
const typePath=(kind:FipeKind)=>kind==='carro'?'cars':'motorcycles';
export const fipeStorageKey=(vehicleId:string)=>'smartveiculos:fipe:v1:'+vehicleId;

/** Valores publicados e verificáveis em 02/11/2026.
 * O preço do Gol é de outubro, não deve ser rotulado como novembro.
 * Ao abrir o painel ou atualizar, a API independente é consultada para verificar o valor mais recente.
 */
export const FIPE_FEATURED_KEYS={
  gol:'featured:gol-g6-selecao-2014',
  cb650r:'featured:cb650r-2024',
} as const;
type FeaturedFipe={kind:FipeKind;code:string;year:number;fuel:'Flex'|'Gasolina';snapshot:FipeSaved};
const FEATURED:Record<string,FeaturedFipe>={
 [FIPE_FEATURED_KEYS.gol]:{
  kind:'carro',code:'005363-5',year:2014,fuel:'Flex',
  snapshot:{
   selection:null,source:'published-reference',checkedAt:'2026-11-02T12:00:00-03:00',
   quote:{price:'R$ 39.745,00',referenceMonth:'outubro de 2026',
    codeFipe:'005363-5',brand:'VW - VolksWagen',
    model:'Gol SELEÇÃO 1.6 Total Flex 8V 5p',modelYear:2014,fuel:'Flex'}
  }
 },
 [FIPE_FEATURED_KEYS.cb650r]:{
  kind:'moto',code:'811160-0',year:2024,fuel:'Gasolina',
  snapshot:{
   selection:null,source:'published-reference',checkedAt:'2026-11-02T12:00:00-03:00',
   quote:{price:'R$ 54.365,00',referenceMonth:'novembro de 2026',
    codeFipe:'811160-0',brand:'Honda',
    model:'CB 650 R ABS',modelYear:2024,fuel:'Gasolina'}
  }
 },
};
export function knownFipe(vehicleId:string):FeaturedFipe|null {
 return FEATURED[vehicleId]??null;
}


export function getMonthStamp(date:Date):string {
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0');
}
export function needsFipeRefresh(entry:FipeSaved,now:Date):boolean {
  const checked=new Date(entry.checkedAt);
  if(!Number.isFinite(checked.getTime()))return true;
  const expected=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(now);
  const clean=(value:string)=>value.toLocaleLowerCase('pt-BR').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  // Uma consulta mensal é suficiente quando a referência já é a atual.
  if(getMonthStamp(checked)===getMonthStamp(now)&&
     clean(entry.quote.referenceMonth)===clean(expected))return false;
  // Se a publicação da FIPE atrasar, tenta novamente no dia seguinte.
  const localDay=(date:Date)=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+
    '-'+String(date.getDate()).padStart(2,'0');
  return localDay(checked)!==localDay(now);
}
export function readFipe(vehicleId:string):FipeSaved|null {
  if(!vehicleId||typeof window==='undefined')return null;
  try {
    const raw=window.localStorage.getItem(fipeStorageKey(vehicleId));
    if(!raw)return null;
    const v:unknown=JSON.parse(raw);
    if(!v||typeof v!=='object')return null;
    const r=v as Partial<FipeSaved>;
    if(!r.quote||typeof r.checkedAt!=='string')return null;
    const selection=r.selection??null,p=r.quote;
    if(selection&&[selection.brandId,selection.brandName,selection.modelId,
      selection.modelName,selection.yearId,selection.yearName].some(x=>typeof x!=='string'))return null;
    if([p.price,p.referenceMonth,p.codeFipe,p.model,p.brand,p.fuel].some(x=>typeof x!=='string')||
      typeof p.modelYear!=='number')return null;
    return r as FipeSaved;
  }catch{return null;}
}

/** Cotação para exibição: armazenamento persistente validado ou referência publicada.
 * Não persiste automaticamente referências de terceiros como se viessem da API.
 */
export function displayedFipe(vehicleId:string):FipeSaved|null {
 const stored=readFipe(vehicleId);
 return stored??knownFipe(vehicleId)?.snapshot??null;
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
  const response=await fetch(API_BASE+path,{signal:signal??null,headers:{Accept:'application/json'}});
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
function normalizeFipe(raw:unknown):FipePrice {
  if(!raw||typeof raw!=='object')throw new Error('Resposta inválida da consulta FIPE.');
  const d=raw as Record<string,unknown>;
  const fields=['price','referenceMonth','codeFipe','brand','model','fuel'] as const;
  if(fields.some(k=>typeof d[k]!=='string')||!Number.isFinite(d['modelYear'])||
      !/^R\$\s*[\d.]+,\d{2}$/.test(String(d['price']))||
      !/^\d{6}-\d$/.test(String(d['codeFipe']))) {
    throw new Error('Preço FIPE não confirmado. Tente novamente.');
  }
  return {
    price:String(d['price']),referenceMonth:String(d['referenceMonth']),
    codeFipe:String(d['codeFipe']),brand:String(d['brand']),
    model:String(d['model']),modelYear:Number(d['modelYear']),fuel:String(d['fuel']),
  };
}

export async function fipePrice(kind:FipeKind,selection:FipeSelection,signal?:AbortSignal):Promise<FipePrice>{
 const data=await request('/'+typePath(kind)+'/brands/'+safe(selection.brandId)+
   '/models/'+safe(selection.modelId)+'/years/'+safe(selection.yearId),signal);
 return normalizeFipe(data);
}

/** Consulta identificada pelo código oficial FIPE, não depende do ID interno do modelo. */
export async function fipePriceByCode(
 kind:FipeKind,codeFipe:string,year:number,signal?:AbortSignal
):Promise<FipePrice>{
 if(!/^\d{6}-\d$/.test(codeFipe)||!Number.isInteger(year)||year<1950||year>2100) {
  throw new Error('Código FIPE ou ano-modelo inválido.');
 }
 const years=asOptions(await request('/'+typePath(kind)+'/'+safe(codeFipe)+'/years',signal));
 const eligible=years.filter(y=>y.code.startsWith(year+'-')&&Number(y.code.split('-')[0])===year);
 if(!eligible.length)throw new Error('Ano-modelo não disponível para este código FIPE.');
 const wantedFuel=knownFuelByCode(kind,codeFipe);
 const matched=eligible.filter(x=>x.name.toLocaleLowerCase('pt-BR').includes(wantedFuel.toLocaleLowerCase('pt-BR')));
 const selected=matched.length===1?matched[0]:eligible.length===1?eligible[0]:null;
 if(!selected)throw new Error('Há mais de uma versão de combustível neste ano. Selecione a versão correta.');
 const quote=normalizeFipe(await request('/'+typePath(kind)+'/'+safe(codeFipe)+'/years/'+safe(selected.code),signal));
 if(quote.codeFipe!==codeFipe||quote.modelYear!==year){
  throw new Error('A consulta retornou outra versão FIPE. Valor anterior preservado.');
 }
 return quote;
}
function knownFuelByCode(kind:FipeKind,code:string):string{
 const value=Object.values(FEATURED).find(v=>v.kind===kind&&v.code===code);
 return value?.fuel??'';
}
export async function refreshFipe(
 vehicleId:string,kind:FipeKind,current:FipeSaved,signal?:AbortSignal
):Promise<FipeSaved>{
 const known=knownFipe(vehicleId);
 // Respeita versão FIPE escolhida pelo usuário, quando há uma seleção válida.
 const quote=current.selection
  ?await fipePrice(kind,current.selection,signal)
  :known&&known.kind===kind
   ?await fipePriceByCode(kind,known.code,known.year,signal)
   :await fipePriceByCode(kind,current.quote.codeFipe,current.quote.modelYear,signal);
 if(current.quote.codeFipe!==quote.codeFipe||current.quote.modelYear!==quote.modelYear){
  throw new Error('A API retornou código ou ano diferentes. O valor registrado foi preservado.');
 }
 return {selection:current.selection,quote,checkedAt:new Date().toISOString(),source:'api'};
}
