import {describe,expect,it} from 'vitest';
import {
 DEMO_AREAS,DEMO_PERSONAS,DEMO_STOCK,DEMO_ORDERS,
 DEMO_WORKSHOP_SERVICES,demoStockValue,demoOpenOrders,
 isDemoArea,formatDemoBRL,
} from './demo-data';

describe('demonstração pública isolada',()=>{
 it('contém somente quatro áreas com funções distintas',()=>{
  expect(DEMO_AREAS).toEqual(['garage','parts_cars','parts_bikes','workshop']);
  expect(Object.keys(DEMO_PERSONAS)).toHaveLength(4);
  for(const area of DEMO_AREAS){
   expect(isDemoArea(area)).toBe(true);
   expect(DEMO_PERSONAS[area].role.length).toBeGreaterThan(5);
  }
  expect(isDemoArea('admin')).toBe(false);
 });
 it('não exporta veículos cadastrados, informações FIPE, abastecimentos ou revisões',async()=>{
  const exported=await import('./demo-data');
  expect(Object.keys(exported)).not.toContain('DEMO_VEHICLES');
  expect(Object.keys(exported)).not.toContain('DEMO_FUEL');
  expect(Object.keys(exported)).not.toContain('DEMO_SERVICES');
  expect(JSON.stringify(exported)).not.toMatch(/CB650R|Gol G6|chassi|placa|fipeCode/i);
 });
 it('autopeças de carros não contém acessórios de moto nem produtos de loja real',()=>{
  const cars=DEMO_STOCK.parts_cars;
  const bikes=DEMO_STOCK.parts_bikes;
  expect(cars.length).toBeGreaterThanOrEqual(6);
  expect(bikes.length).toBeGreaterThanOrEqual(6);
  expect(cars.every(x=>x.sku.startsWith('DEMO-CAR-'))).toBe(true);
  expect(bikes.every(x=>x.sku.startsWith('DEMO-MOT-'))).toBe(true);
  expect(new Set(cars.map(x=>x.id)).size).toBe(cars.length);
  expect(new Set(bikes.map(x=>x.id)).size).toBe(bikes.length);
  expect(cars.map(x=>x.sku).some(id=>bikes.some(y=>y.sku===id))).toBe(false);
  expect(cars.some(x=>x.name.includes('motociclista'))).toBe(false);
  expect(bikes.some(x=>x.name.includes('automotiva 60 Ah'))).toBe(false);
 });
 it('a oficina não possui estoque da loja e exibe apenas seus serviços',()=>{
  expect(Object.keys(DEMO_STOCK)).toEqual(['parts_cars','parts_bikes']);
  expect(DEMO_WORKSHOP_SERVICES.length).toBeGreaterThan(3);
  expect(DEMO_WORKSHOP_SERVICES.every(x=>x.id.startsWith('service-'))).toBe(true);
 });
 it('pedidos públicos são exemplos genéricos e separados por setor',()=>{
  expect(Object.keys(DEMO_ORDERS)).toEqual(['parts_cars','parts_bikes','workshop']);
  const ids=new Set<string>();
  for(const [area,list] of Object.entries(DEMO_ORDERS)){
   expect(list.length).toBeGreaterThan(1);
   expect(demoOpenOrders(list)).toBeGreaterThan(0);
   expect(list.every(x=>x.customer.startsWith('Cliente exemplo'))).toBe(true);
   expect(list.every(x=>!x.vehicle.match(/gol|cb650r|onix|honda|placa/i))).toBe(true);
   for(const order of list){
    expect(ids.has(order.id)).toBe(false);
    ids.add(order.id);
   }
   if(area==='parts_cars')expect(list.every(x=>x.vehicle.startsWith('Automóvel'))).toBe(true);
   if(area==='parts_bikes')expect(list.every(x=>x.vehicle.startsWith('Motocicleta'))).toBe(true);
  }
 });
 it('exibe valores de produto e quantidades ilustrativos',()=>{
  expect(demoStockValue(DEMO_STOCK.parts_cars)).toBeGreaterThan(0);
  expect(demoStockValue(DEMO_STOCK.parts_bikes)).toBeGreaterThan(0);
  expect(formatDemoBRL(193.5)).toContain('193,50');
 });
});
