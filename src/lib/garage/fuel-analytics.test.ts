import {describe,expect,it} from 'vitest';
import {
 fuelBucketKey,fuelCost,groupFuel,toFuelLiters,toFuelMoney,totalFuel,
 validateFuelSequence
} from './fuel-analytics';
import type {Fillup} from './fuel';
const row=(id:string,date:string,km:number,liters:number,pricePerLiter:number,fuel:'gasolina'|'etanol'='gasolina'):Fillup=>({
 id,vehicleId:'v1',date,km,liters,pricePerLiter,fuel,fullTank:true
});
describe('controle de combustível do proprietário',()=>{
 it('calcula automaticamente o total real com preço por litro',()=>{
  expect(fuelCost({liters:35,pricePerLiter:5.89})).toBe(206.15);
  expect(fuelCost({liters:32.5,pricePerLiter:6.19})).toBe(201.18);
 });
 it('aceita vírgula brasileira para litros e preço em reais',()=>{
  expect(toFuelMoney('5,89')).toBe(5.89);
  expect(toFuelLiters('32,5')).toBe(32.5);
  expect(toFuelMoney('')).toBeNull();
  expect(toFuelLiters('0')).toBeNull();
 });
 it('soma gasolina, etanol, preço médio e todos os anos',()=>{
  const data=[row('a','2025-12-28',10000,20,5,'gasolina'),row('b','2026-01-05',10100,30,6,'etanol'),row('c','2026-02-01',10200,40,5.5)];
  const total=totalFuel(data);
  expect(total.spent).toBe(500);
  expect(total.liters).toBe(90);
  expect(total.gasoline).toBe(320);
  expect(total.ethanol).toBe(180);
  expect(total.averagePrice).toBeCloseTo(500/90);
  expect(groupFuel(data,'year').map(g=>g.key)).toEqual(['2026','2025']);
  expect(groupFuel(data,'month').map(g=>g.key)).toEqual(['2026-02','2026-01','2025-12']);
 });
 it('identifica a semana pela segunda-feira inclusive na virada de ano',()=>{
  expect(fuelBucketKey('2026-01-01','week')).toBe('2025-12-29');
  expect(fuelBucketKey('2026-11-02','week')).toBe('2026-11-02');
 });
 it('permite inserir abastecimento antigo em ordem cronológica coerente',()=>{
  const all=[row('a','2025-01-01',10000,20,5),row('b','2025-03-01',14000,30,5)];
  expect(validateFuelSequence(all,{vehicleId:'v1',date:'2025-02-01',km:12000})).toBeNull();
  expect(validateFuelSequence(all,{vehicleId:'v1',date:'2025-02-01',km:15000})).toContain('posteriormente');
  expect(validateFuelSequence(all,{vehicleId:'v1',date:'2025-01-01',km:10000})).toContain('Já existe');
  expect(validateFuelSequence(all,{vehicleId:'v1',date:'2025-02-30',km:12000})).toContain('data válida');
 });
});
