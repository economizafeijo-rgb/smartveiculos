import {describe,expect,it} from 'vitest';
import {
 DEMO_AREAS,DEMO_PERSONAS,DEMO_STOCK,DEMO_ORDERS,DEMO_VEHICLES,
 DEMO_FUEL,DEMO_SERVICES,demoStockValue,demoFuelTotal,demoOpenOrders,
 isDemoArea,formatDemoBRL,
} from './demo-data';

describe('quatro perfis de visitantes independentes',()=>{
 it('oferece exatamente quatro áreas de demonstração',()=>{
  expect(DEMO_AREAS).toEqual(['garage','parts_cars','parts_bikes','workshop']);
  expect(Object.keys(DEMO_PERSONAS)).toHaveLength(4);
  for(const area of DEMO_AREAS){
   expect(isDemoArea(area)).toBe(true);
   expect(DEMO_PERSONAS[area].name.length).toBeGreaterThan(5);
  }
  expect(isDemoArea('admin')).toBe(false);
  expect(isDemoArea('garagem-de-outra-pessoa')).toBe(false);
 });
 it('separa carro e moto com históricos independentes',()=>{
  expect(DEMO_VEHICLES).toHaveLength(2);
  expect(DEMO_VEHICLES.map(x=>x.id)).toEqual(['gol','honda']);
  expect(DEMO_FUEL.some(x=>x.vehicleId==='gol')).toBe(true);
  expect(DEMO_FUEL.some(x=>x.vehicleId==='honda')).toBe(true);
  expect(DEMO_SERVICES.every(x=>DEMO_VEHICLES.some(v=>v.id===x.vehicleId))).toBe(true);
 });
 it('lojas de carros e motos não compartilham produtos e códigos',()=>{
  const cars=DEMO_STOCK.parts_cars;
  const bikes=DEMO_STOCK.parts_bikes;
  expect(cars).toHaveLength(6);
  expect(bikes).toHaveLength(6);
  expect(cars.every(x=>x.sku.startsWith('CAR-'))).toBe(true);
  expect(bikes.every(x=>x.sku.startsWith('MOT-'))).toBe(true);
  expect(new Set(cars.map(x=>x.id)).size).toBe(cars.length);
  expect(new Set(bikes.map(x=>x.id)).size).toBe(bikes.length);
 });
 it('ordens são inventadas e têm status de demonstração',()=>{
  expect(Object.keys(DEMO_ORDERS)).toEqual(['parts_cars','parts_bikes','workshop']);
  for(const list of Object.values(DEMO_ORDERS)){
   expect(list.length).toBeGreaterThan(1);
   expect(list.every(x=>x.customer.startsWith('Cliente fictício'))).toBe(true);
   expect(demoOpenOrders(list)).toBeGreaterThan(0);
  }
 });
 it('estatísticas de litros e estoque são calculadas sem persistência',()=>{
  const gol=DEMO_FUEL.filter(x=>x.vehicleId==='gol');
  const expected=gol.reduce((a,x)=>a+x.liters*x.priceLiter,0);
  expect(demoFuelTotal(gol)).toBeCloseTo(expected);
  expect(demoStockValue(DEMO_STOCK.parts_cars)).toBeGreaterThan(0);
  expect(formatDemoBRL(193.5)).toContain('193,50');
 });
});
