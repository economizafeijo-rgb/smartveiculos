import type {Fillup,FuelKind} from './fuel';

export type FuelPeriod='week'|'month'|'year';
export type FuelBucket={
 key:string;label:string;count:number;liters:number;spent:number;
 gasoline:number;ethanol:number;averagePrice:number;
};
export type FuelTotals={
 count:number;liters:number;spent:number;averagePrice:number;
 gasoline:number;ethanol:number;
};
export const fuelCost=(f:Pick<Fillup,'liters'|'pricePerLiter'>)=>Math.round(f.liters*f.pricePerLiter*100)/100;
const zero=():FuelTotals=>({count:0,liters:0,spent:0,averagePrice:0,gasoline:0,ethanol:0});
function validDate(date:string):boolean {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const parsed=new Date(date+'T00:00:00Z');
 return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
}
export function toFuelMoney(value:string):number|null {
 const s=value.trim();
 if(!/^\d{1,5}([.,]\d{1,3})?$/.test(s))return null;
 const n=Number(s.replace(',','.'));
 return Number.isFinite(n)&&n>0&&n<=100?n:null;
}
export function toFuelLiters(value:string):number|null {
 const s=value.trim();
 if(!/^\d{1,3}([.,]\d{1,3})?$/.test(s))return null;
 const n=Number(s.replace(',','.'));
 return Number.isFinite(n)&&n>0&&n<=200?n:null;
}
export function validateFuelSequence(
 rows:readonly Fillup[],entry:Pick<Fillup,'vehicleId'|'date'|'km'>,
 editingId?:string
):string|null{
 if(!validDate(entry.date))return 'Informe uma data válida.';
 if(!Number.isSafeInteger(entry.km)||entry.km<0||entry.km>9999999)return 'Informe o odômetro real.';
 // Permitir abastecimentos de anos anteriores quando o odômetro é coerente com as datas.
 for(const row of rows){
  if(row.id===editingId||row.vehicleId!==entry.vehicleId)continue;
  if(row.date===entry.date&&row.km===entry.km)return 'Já existe abastecimento nesta data e quilometragem.';
  if(row.date<entry.date&&row.km>entry.km)return 'A quilometragem é menor que a de um abastecimento anterior.';
  if(row.date>entry.date&&row.km<entry.km)return 'A quilometragem supera um abastecimento registrado posteriormente.';
 }
 return null;
}
export function totalFuel(rows:readonly Fillup[]):FuelTotals {
 const s=zero();
 for(const r of rows){
  const price=fuelCost(r);
  s.count++;
  s.liters+=r.liters;s.spent+=price;
  if(r.fuel==='gasolina')s.gasoline+=price;else s.ethanol+=price;
 }
 s.averagePrice=s.liters?s.spent/s.liters:0;
 return s;
}
const dayUTC=(date:string)=>new Date(date+'T00:00:00Z');
export function fuelWeekStart(date:string):string{
 const d=dayUTC(date),day=d.getUTCDay();
 d.setUTCDate(d.getUTCDate()-((day+6)%7));
 return d.toISOString().slice(0,10);
}
export function fuelBucketKey(date:string,period:FuelPeriod):string{
 if(!validDate(date))throw new Error('Data de abastecimento inválida');
 if(period==='week')return fuelWeekStart(date);
 if(period==='month')return date.slice(0,7);
 return date.slice(0,4);
}
const monthLabels=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
export function bucketLabel(key:string,period:FuelPeriod):string{
 if(period==='year')return key;
 if(period==='month'){const [year,m]=key.split('-');return monthLabels[Number(m)-1]+' / '+year;}
 const date=dayUTC(key);date.setUTCDate(date.getUTCDate()+6);
 return key.slice(8,10)+'/'+key.slice(5,7)+' a '+date.toISOString().slice(8,10)+'/'+date.toISOString().slice(5,7);
}
export function groupFuel(rows:readonly Fillup[],period:FuelPeriod):FuelBucket[]{
 const map=new Map<string,Fillup[]>();
 for(const row of rows){
  if(!validDate(row.date))continue;
  const key=fuelBucketKey(row.date,period);
  const group=map.get(key)??[];
  group.push(row);map.set(key,group);
 }
 return [...map.entries()].sort(([a],[b])=>b.localeCompare(a)).map(([key,items])=>{
  const totals=totalFuel(items);
  return {key,label:bucketLabel(key,period),...totals};
 });
}
export function fuelByType(rows:readonly Fillup[],kind:FuelKind):FuelTotals{
 return totalFuel(rows.filter(r=>r.fuel===kind));
}
