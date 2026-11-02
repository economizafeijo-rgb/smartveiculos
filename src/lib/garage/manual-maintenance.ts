import {CB650R_MANUAL,CB650R_REVISIONS,addMonthsToDate} from './cb650r-reference';
import type {ServiceRecord} from './types';
import type {VideoVehicle} from './video-guides';
export type ManualRevision={km:number;months:number;label:string};
export type MaintenancePlan={maker:string;model:string;source:string;sourceLabel:string;notes:string;revisions:ManualRevision[]};
export const GOL_MANUAL_URL='https://www.vw.com.br/pt/servicos-e-acessorios/servicos-e-produtos/manuais-e-garantia.html';
export const GOL_REVISIONS:ManualRevision[]=Array.from({length:30},(_,i)=>({
 km:(i+1)*10000,months:(i+1)*6,label:String(i+1)+'ª revisão'
}));
export function maintenancePlan(vehicle:VideoVehicle):MaintenancePlan|null{
 const name=vehicle.name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const key=vehicle.modelKey??'';
 if(vehicle.kind==='carro'&&(key.includes('gol-g6-selecao-2014')||(/\bgol\b/.test(name)&&/\b(g6|selecao)\b/.test(name)))){
  return {maker:'Volkswagen',model:'Gol G6 Seleção 1.6 2014',
   source:GOL_MANUAL_URL,sourceLabel:'Manuais e garantia Volkswagen',
   notes:'Para veículos adquiridos antes de outubro de 2016, a VW indica revisão a cada 10.000 km ou 6 meses, o que ocorrer primeiro. O programa detalhado de peças deve ser confirmado pelo manual e chassi; uso severo pode exigir antecipação.',
   revisions:GOL_REVISIONS};
 }
 if(vehicle.kind==='moto'&&(key.includes('cb650r-2024')||/\bcb\s*650\s*r\b/.test(name))){
  return {maker:'Honda',model:'CB650R 2024',
   source:CB650R_MANUAL,sourceLabel:'Manual Honda CB650R 2024 (PDF)',
   notes:'Honda: 1ª revisão em 1.000 km/6 meses, 2ª em 6.000 km/12 meses, depois a cada 6.000 km ou 6 meses. Os prazos contam da entrega. O que ocorrer primeiro; guarde carimbos e comprovantes.',
   revisions:CB650R_REVISIONS.map(r=>({km:r.km,months:r.months,label:r.title}))};
 }
 return null;
}
export function revisionDescription(vehicle:VideoVehicle,km:number):string{
 const plan=maintenancePlan(vehicle);
 return (plan?.maker==='Honda'?'Revisão Honda CB650R • ':plan?.maker==='Volkswagen'?'Revisão Volkswagen • ':'Revisão • ')+km+' km';
}
export function revisionCompleted(record:ServiceRecord,vehicle:VideoVehicle,km:number):boolean{
 if(record.kind!=='revisao')return false;
 const label=revisionDescription(vehicle,km);
 return record.description===label||record.description.startsWith(label+' |')||
  record.description.startsWith(label+' — ');
}
export function upcomingManualRevisions(
 plan:MaintenancePlan,vehicle:VideoVehicle,records:readonly ServiceRecord[],currentKm:number|null
):{revision:ManualRevision;completed:boolean;remainingKm:number|null}[]{
 return plan.revisions.map(revision=>({
  revision,
  completed:records.some(record=>revisionCompleted(record,vehicle,revision.km)),
  remainingKm:currentKm===null?null:revision.km-currentKm
 }));
}
export function latestManualDate(records:readonly ServiceRecord[]):string|null{
 return [...records].filter(r=>r.kind==='revisao').sort((a,b)=>b.date.localeCompare(a.date))[0]?.date??null;
}
export function nextServiceDate(lastServiceDate:string|null,months:number):string|null{
 return lastServiceDate?addMonthsToDate(lastServiceDate,months):null;
}


/** Projeta somente marcos futuros necessários, incluindo veículos com mais de 300 mil km.
 * O planejamento não afirma que qualquer revisão histórica foi realizada.
 * Marcação sem comprovante é "histórico não informado", não "atrasado".
 */
export function revisionsAroundOdometer(plan:MaintenancePlan,vehicle:VideoVehicle,records:readonly ServiceRecord[],currentKm:number|null,expanded=false){
 if(currentKm===null)return upcomingManualRevisions(plan,vehicle,records,null).slice(0,expanded?30:8);
 const honda=plan.maker==='Honda',step=honda?6000:10000,first=honda?1000:10000;
 const lastKnown=plan.revisions[plan.revisions.length-1]?.km??first;
 const needed=Math.min(9_999_999,Math.max(currentKm+step*8,lastKnown));
 const revisions=[...plan.revisions];
 for(let km=lastKnown+step;km<=needed;km+=step){
  const index=honda?Math.round(km/step)+1:Math.round(km/step);
  revisions.push({km,months:honda?12+Math.max(0,index-2)*6:index*6,label:index+'ª revisão'});
 }
 const all=upcomingManualRevisions({...plan,revisions},vehicle,records,currentKm);
 if(expanded)return all.filter(r=>r.revision.km>=Math.max(first,currentKm-step*2)).slice(0,32);
 const firstAtOrAfter=all.findIndex(x=>x.revision.km>=currentKm);
 const focus=firstAtOrAfter>=0?firstAtOrAfter:Math.max(0,all.length-1);
 return all.slice(Math.max(0,focus-1),focus+7);
}
export function nextRevisionsForOdometer(plan:MaintenancePlan,vehicle:VideoVehicle,records:readonly ServiceRecord[],currentKm:number|null){
 return revisionsAroundOdometer(plan,vehicle,records,currentKm,false).find(x=>x.revision.km>= (currentKm??0)&&!x.completed)??null;
}
