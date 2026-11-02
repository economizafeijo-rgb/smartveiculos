import {describe,expect,it} from 'vitest';
import {areaEntryLabel,areaEntryPath} from './area-entry';
import {DEMO_AREAS,DEMO_STOCK,DEMO_ORDERS,DEMO_PERSONAS,DEMO_FUEL} from '@/lib/demo/demo-data';

describe('clique nas quatro áreas da homepage',()=>{
 it('visitantes entram em demos isoladas, sem login ou cadastro',()=>{
  expect(DEMO_AREAS).toEqual(['garage','parts_cars','parts_bikes','workshop']);
  for(const area of DEMO_AREAS){
   const path=areaEntryPath(area,false);
   expect(path).toBe('/demonstracao?area='+area);
   expect(path).not.toMatch(/acesso|login|senha|negocio/);
   expect(areaEntryLabel(area,false)).toContain('sem login');
  }
 });
 it('sessão autenticada navega ao painel real do segmento correto',()=>{
  expect(areaEntryPath('garage',true)).toBe('/garagem');
  expect(areaEntryPath('parts_cars',true)).toBe('/negocio?segment=parts_cars');
  expect(areaEntryPath('parts_bikes',true)).toBe('/negocio?segment=parts_bikes');
  expect(areaEntryPath('workshop',true)).toBe('/negocio?segment=workshop');
 });
});
describe('separação dos acervos da demonstração',()=>{
 it('peças do estoque de carro e moto têm códigos distintos',()=>{
  expect(DEMO_STOCK.parts_cars.every(v=>v.sku.startsWith('CAR-'))).toBe(true);
  expect(DEMO_STOCK.parts_bikes.every(v=>v.sku.startsWith('MOT-'))).toBe(true);
  expect(DEMO_STOCK.parts_cars.map(v=>v.id).some(id=>DEMO_STOCK.parts_bikes.some(x=>x.id===id))).toBe(false);
 });
 it('oficina contém ordens de serviço, sem inventário de autopeças',()=>{
  expect(DEMO_ORDERS.workshop.length).toBeGreaterThan(0);
  expect(Object.keys(DEMO_STOCK)).not.toContain('workshop');
  expect(DEMO_PERSONAS.workshop.role).toContain('Oficina');
 });
 it('garagem possui abastecimentos fictícios e acesso próprio',()=>{
  expect(DEMO_FUEL.length).toBeGreaterThan(0);
  expect(DEMO_PERSONAS.garage.company).toContain('demonstrativa');
 });
});
