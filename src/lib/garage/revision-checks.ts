/** Anotações locais de conferência de uma revisão. Não validam serviços de oficina.
 * Chave usa o identificador local exclusivo do veículo. O marco (km) separa as revisões.
 * A revisão somente é concluída pelo registro formal no livro digital.
 */
export function revisionChecklistKey(vehicleId:string,km:number){
 return 'smartveiculos:manual-checks:v1:'+vehicleId+':'+km;
}
export function readRevisionChecks(vehicleId:string,km:number):string[]{
 if(!vehicleId||!Number.isSafeInteger(km)||km<=0||typeof window==='undefined')return [];
 try{
  const raw=window.localStorage.getItem(revisionChecklistKey(vehicleId,km));
  if(!raw)return [];
  const obj:unknown=JSON.parse(raw);
  if(!Array.isArray(obj))return [];
  return [...new Set(obj.filter((s):s is string=>typeof s==='string'&&s.length<=80))].slice(0,60);
 }catch{return [];}
}
export function writeRevisionChecks(vehicleId:string,km:number,ids:readonly string[]):void{
 if(!vehicleId||!Number.isSafeInteger(km)||km<=0||typeof window==='undefined')return;
 try{window.localStorage.setItem(revisionChecklistKey(vehicleId,km),JSON.stringify([...new Set(ids)].slice(0,60)));}
 catch{/* Navegadores com armazenamento bloqueado mantêm a seleção somente na interface. */}
}
