import { describe, expect, it } from 'vitest';
import { calculateFuelStats, fuelSpent, type Fillup } from './fuel';
const fill=(id:string,km:number,liters:number,fuel:'gasolina'|'etanol'='gasolina',fullTank=true):Fillup=>({
 id,vehicleId:'gol',date:'2026-10-01',km,liters,pricePerLiter:6,fuel,fullTank,
});
describe('calculadora de combustível',()=>{
 it('não inventa consumo com um único abastecimento',()=>{
  expect(calculateFuelStats([fill('a',1000,30)])).toEqual([]);
 });
 it('usa o segundo tanque cheio para a distância desde o primeiro',()=>{
  const result=calculateFuelStats([fill('a',1000,30),fill('b',1450,30)]);
  expect(result).toHaveLength(1);
  expect(result[0].kmPerLiter).toBe(15);
  expect(result[0].costPerKm).toBeCloseTo(0.4);
 });
 it('não usa trechos de combustíveis diferentes ou tanques parciais',()=>{
  expect(calculateFuelStats([
   fill('a',1000,30,'gasolina'),fill('b',1300,30,'etanol'),
   fill('c',1500,20,'etanol',false),fill('d',1800,30,'etanol'),
  ])).toEqual([]);
 });
 it('calcula médias separadas de gasolina e etanol',()=>{
  const result=calculateFuelStats([
   fill('a',1000,30,'gasolina'),fill('b',1400,40,'gasolina'),
   fill('c',1650,30,'etanol'),fill('d',1950,30,'etanol'),
  ]);
  expect(result.find(x=>x.fuel==='gasolina')?.kmPerLiter).toBe(10);
  expect(result.find(x=>x.fuel==='etanol')?.kmPerLiter).toBe(10);
 });
 it('soma gastos registrados',()=>{
  expect(fuelSpent([fill('a',1000,20),fill('b',1200,30)])).toBe(300);
 });
});
