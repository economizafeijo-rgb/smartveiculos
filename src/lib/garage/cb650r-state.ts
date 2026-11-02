import { useSyncExternalStore } from 'react';
export type BikeMeasurements={
 deliveryDate:string;frontDepthMm:string;rearDepthMm:string;chainSlackMm:string;
 frontTireKm:string;rearTireKm:string;chainKitKm:string;lastChainKm:string;
 notes:string;
};
const DEFAULT:BikeMeasurements={
 deliveryDate:'',frontDepthMm:'',rearDepthMm:'',chainSlackMm:'',
 frontTireKm:'',rearTireKm:'',chainKitKm:'',lastChainKm:'',notes:''
};
const KEY='smartveiculos:cb650r2024:inspecoes:v1';
let storageOwner:string|null=null;
const scopedKey=()=>storageOwner?KEY+':owner:'+storageOwner:KEY;
let loaded=false;
let snapshot:BikeMeasurements=DEFAULT;
const subscribers=new Set<()=>void>();
function hydrate(){
 if(loaded||typeof window==='undefined')return;loaded=true;
 try{
  const json=JSON.parse(window.localStorage.getItem(scopedKey())||'{}');
  if(!json||typeof json!=='object'||Array.isArray(json))return;
  const obj=json as Record<string,unknown>;
  const next={...DEFAULT};
  for(const key of Object.keys(DEFAULT) as (keyof BikeMeasurements)[]){
   if(typeof obj[key]==='string')next[key]=String(obj[key]).slice(0,key==='notes'?600:24);
  }
  snapshot=next;
 }catch{/* Ignore invalid legacy data. */}
}
function notify(){subscribers.forEach(listener=>listener());}
function onStorage(event:StorageEvent){if(event.key!==scopedKey())return;loaded=false;hydrate();notify();}
function subscribe(listener:()=>void){hydrate();if(subscribers.size===0)window.addEventListener('storage',onStorage);subscribers.add(listener);return()=>{subscribers.delete(listener);if(subscribers.size===0)window.removeEventListener('storage',onStorage);};}
export function setBikeAccount(userId:string|null){
 if(storageOwner===userId)return;
 storageOwner=userId;loaded=false;snapshot=DEFAULT;hydrate();notify();
}
export function useBikeMeasurements(){return useSyncExternalStore(subscribe,()=>{hydrate();return snapshot;},()=>DEFAULT);}
export function saveBikeMeasurements(update:Partial<BikeMeasurements>){
 hydrate();
 const next={...snapshot,...update};
 for(const [key,value] of Object.entries(next)){
  if(typeof value!=='string')throw Error('Campo inválido: '+key);
 }
 try{window.localStorage.setItem(scopedKey(),JSON.stringify(next));}catch{throw Error('Não foi possível salvar as medições neste navegador.');}
 snapshot=next;notify();
}

/** Recupera da nuvem apenas valores que ainda estão vazios localmente. */
export function mergeBikeMeasurements(remote:Partial<BikeMeasurements>):number{
 hydrate();
 const next={...snapshot};
 let count=0;
 for(const key of Object.keys(DEFAULT) as (keyof BikeMeasurements)[]){
  const value=remote[key];
  if(next[key]===''&&typeof value==='string'&&value.length<=(key==='notes'?600:24)&&value!==''){
   next[key]=value;count++;
  }
 }
 if(count)saveBikeMeasurements(next);
 return count;
}
