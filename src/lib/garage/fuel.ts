import { useSyncExternalStore } from 'react';

export type FuelKind = 'gasolina' | 'etanol';
export type Fillup = {
  id: string; vehicleId: string; date: string; km: number; liters: number;
  pricePerLiter: number; fuel: FuelKind; fullTank: boolean;
};
const STORAGE_KEY='smartveiculos:abastecimentos:v1';
let storageOwner:string|null=null;
const scopedKey=()=>storageOwner?STORAGE_KEY+':owner:'+storageOwner:STORAGE_KEY;
const EMPTY: Fillup[]=[];
let cache:Fillup[]=EMPTY;
let loaded=false;
const listeners=new Set<()=>void>();

function read(): Fillup[] {
  if(typeof window==='undefined') return EMPTY;
  try {
    const raw=JSON.parse(window.localStorage.getItem(scopedKey())||'[]');
    if(!Array.isArray(raw))return EMPTY;
    return raw.filter((v:unknown):v is Fillup=>{
      if(!v||typeof v!=='object')return false;
      const r=v as Partial<Fillup>;
      return typeof r.id==='string'&&typeof r.vehicleId==='string'&&
        typeof r.date==='string'&&Number.isInteger(r.km)&&(r.km as number)>=0&&
        typeof r.liters==='number'&&r.liters>0&&Number.isFinite(r.liters)&&
        typeof r.pricePerLiter==='number'&&Number.isFinite(r.pricePerLiter)&&r.pricePerLiter>=0&&
        (r.fuel==='gasolina'||r.fuel==='etanol')&&typeof r.fullTank==='boolean';
    });
  }catch{return EMPTY;}
}
function getSnapshot(){if(!loaded&&typeof window!=='undefined'){cache=read();loaded=true;}return cache;}
function commit(value:Fillup[]){try{window.localStorage.setItem(scopedKey(),JSON.stringify(value));}catch{throw new Error('Armazenamento local indisponível. Não foi possível salvar.');}cache=value;listeners.forEach(fn=>fn());}
function subscribe(fn:()=>void){getSnapshot();listeners.add(fn);if(listeners.size===1)window.addEventListener('storage',onStorage);return()=>{listeners.delete(fn);if(!listeners.size)window.removeEventListener('storage',onStorage);};}
function onStorage(e:StorageEvent){if(e.key!==scopedKey())return;cache=read();listeners.forEach(fn=>fn());}
export function setFuelAccount(userId:string|null):void{
 if(storageOwner===userId)return;
 storageOwner=userId;cache=EMPTY;loaded=false;getSnapshot();
 listeners.forEach(fn=>fn());
}
export function importLegacyFillups():number{
 if(!storageOwner)throw Error('Entre na conta.');
 let records:unknown;
 try{records=JSON.parse(window.localStorage.getItem(STORAGE_KEY)||'[]');}catch{throw Error('Histórico anterior inválido.');}
 if(!Array.isArray(records))throw Error('Histórico anterior inválido.');
 const valid=records.filter((v:unknown):v is Fillup=>{
  if(!v||typeof v!=='object')return false;
  const f=v as Partial<Fillup>;
  return typeof f.id==='string'&&typeof f.vehicleId==='string'&&typeof f.date==='string'&&
  Number.isSafeInteger(f.km)&&Number(f.km)>=0&&typeof f.liters==='number'&&f.liters>0&&
  typeof f.pricePerLiter==='number'&&f.pricePerLiter>=0&&typeof f.fullTank==='boolean'&&
  (f.fuel==='gasolina'||f.fuel==='etanol');
 });
 return mergeCloudFillups(valid);
}
export function useFillups():Fillup[]{return useSyncExternalStore(subscribe,getSnapshot,()=>EMPTY);}
export function addFillup(input:Omit<Fillup,'id'>){
 if(!input.vehicleId||!/^\d{4}-\d\d-\d\d$/.test(input.date)||!Number.isSafeInteger(input.km)||input.km<0||
 !Number.isFinite(input.liters)||input.liters<=0||input.liters>200||
 !Number.isFinite(input.pricePerLiter)||input.pricePerLiter<=0||input.pricePerLiter>100||
 !['gasolina','etanol'].includes(input.fuel)||typeof input.fullTank!=='boolean')throw new Error('Confira os dados do abastecimento.');
 const existing=getSnapshot().filter(x=>x.vehicleId===input.vehicleId);
 if(existing.some(x=>x.km>=input.km))throw new Error('O hodômetro deve avançar em relação aos abastecimentos anteriores.');
 const result:{id:string}&Omit<Fillup,'id'>={...input,id:crypto.randomUUID()};
 commit([...getSnapshot(),result]);return result;
}
export function removeFillup(id:string){commit(getSnapshot().filter(x=>x.id!==id));}
/** Restaura abastecimentos ausentes mantendo os registros existentes no navegador. */
export function mergeCloudFillups(rows: readonly Fillup[]):number {
 const existing=getSnapshot();
 const ids=new Set(existing.map(x=>x.id));
 const added=rows.filter(x=>!ids.has(x.id));
 if(added.length)commit([...existing,...added]);
 return added.length;
}
export type FuelStat={fuel:FuelKind;kmPerLiter:number;costPerKm:number;distance:number;liters:number};
export function calculateFuelStats(fillups:readonly Fillup[]):FuelStat[]{
 const sorted=[...fillups].sort((a,b)=>a.km-b.km);
 const totals:{fuel:FuelKind;distance:number;liters:number;spent:number}[]=[
 {fuel:'gasolina',distance:0,liters:0,spent:0},{fuel:'etanol',distance:0,liters:0,spent:0}];
 for(let i=1;i<sorted.length;i++){
  const prev=sorted[i-1]!,cur=sorted[i]!;
  // Cada trecho exige dois tanques completos consecutivos do mesmo combustível.
  // O volume do SEGUNDO abastecimento representa o combustível gasto no trecho.
  if(!prev.fullTank||!cur.fullTank||prev.fuel!==cur.fuel||cur.km<=prev.km)continue;
  const t=totals.find(x=>x.fuel===cur.fuel)!;
  t.distance+=cur.km-prev.km;t.liters+=cur.liters;t.spent+=cur.liters*cur.pricePerLiter;
 }
 return totals.filter(t=>t.distance>0&&t.liters>0).map(t=>({fuel:t.fuel,kmPerLiter:t.distance/t.liters,costPerKm:t.spent/t.distance,distance:t.distance,liters:t.liters}));
}
export function fuelSpent(fillups:readonly Fillup[]){return fillups.reduce((sum,f)=>sum+f.liters*f.pricePerLiter,0);}
