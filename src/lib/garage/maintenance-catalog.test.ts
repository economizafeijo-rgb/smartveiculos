import {describe,expect,it} from 'vitest';
import {
 maintenanceItems,itemForVehicle,buildMaintenanceDescription,
 parseMaintenanceDescription,maintenanceTotals
} from './maintenance-catalog';
import {maintenancePlan,revisionsAroundOdometer,nextRevisionsForOdometer} from './manual-maintenance';
import type {ServiceRecord} from './types';

const gol={kind:'carro' as const,name:'Gol G6 Seleção 1.6',modelYear:2014,modelKey:'gol-g6-selecao-2014'};
const moto={kind:'moto' as const,name:'Honda CB650R 2024',modelYear:2024,modelKey:'cb650r-2024'};
const record=(id:string,kind:ServiceRecord['kind'],date:string,description:string,cost:number):ServiceRecord=>({
 id,vehicleId:'v1',date,km:205000,kind,description,cost,nextKm:null
});
describe('manutenção por tipo de veículo',()=>{
 it('separa bico injetor do carro e kit relação da moto',()=>{
  expect(itemForVehicle('carro','injectors')?.label).toMatch(/Bicos injetores/);
  expect(itemForVehicle('moto','injectors')).toBeUndefined();
  expect(itemForVehicle('moto','chain-kit')?.label).toMatch(/Kit relação/);
  expect(itemForVehicle('carro','chain-kit')).toBeUndefined();
 });
 it('oferece filtros, pneus, freios e ignição para ambos',()=>{
  for(const kind of ['carro','moto'] as const){
   const codes=maintenanceItems(kind).map(i=>i.id);
   for(const code of ['oil','oil-filter','air-filter','spark','brake-fluid','battery']){
    expect(codes).toContain(code);
   }
  }
 });
 it('guarda detalhes e custos sem perder compatibilidade com registros antigos',()=>{
  const item=itemForVehicle('carro','injectors')!;
  const desc=buildMaintenanceDescription({
   item,partBrand:'Bosch',partCode:'ABC-18',quantity:'4 un',workshop:'Auto Centro',
   invoice:'NF1234',notes:'Limpeza após diagnóstico',partsCost:'200',laborCost:'150'
  });
  expect(desc.length).toBeLessThanOrEqual(300);
  const parsed=parseMaintenanceDescription(desc);
  expect(parsed['Serviço']).toBe(item.label);
  expect(parsed['Marca']).toBe('Bosch');
  expect(parsed['Peças R$']).toBe('200');
  expect(parsed['MO R$']).toBe('150');
 });
 it('organiza despesas reais por ano',()=>{
  const totals=maintenanceTotals([
   record('a','oleo','2024-06-12','Troca óleo',150),
   record('b','peca','2025-09-12','Pneu',400),
   record('c','revisao','2025-11-01','Revisão',120),
  ]);
  expect(totals).toEqual([
   {year:'2025',count:2,total:520},
   {year:'2024',count:1,total:150}
  ]);
 });
});
describe('revisões a partir da quilometragem real de carros e motos usados',()=>{
 it('Gol com 185 mil km começa perto dos 190 mil, sem reiniciar em 10 mil',()=>{
  const plan=maintenancePlan(gol)!;
  const entries=revisionsAroundOdometer(plan,gol,[],185000);
  expect(entries[0]?.revision.km).toBeGreaterThanOrEqual(170000);
  expect(entries.some(x=>x.revision.km===190000)).toBe(true);
  expect(entries.every(x=>!x.completed)).toBe(true);
  expect(nextRevisionsForOdometer(plan,gol,[],185000)?.revision.km).toBe(190000);
 });
 it('Gol com 362 mil km continua além do limite original de 300 mil',()=>{
  const plan=maintenancePlan(gol)!;
  const entries=revisionsAroundOdometer(plan,gol,[],362000);
  expect(entries.some(x=>x.revision.km===370000)).toBe(true);
  expect(nextRevisionsForOdometer(plan,gol,[],362000)?.revision.km).toBe(370000);
 });
 it('CB650R em 56 mil km mostra marcos próximos do plano Honda, sem inventar revisões feitas',()=>{
  const plan=maintenancePlan(moto)!;
  const entries=revisionsAroundOdometer(plan,moto,[],56000);
  expect(entries.some(x=>x.revision.km===60000)).toBe(true);
  expect(entries.every(x=>!x.completed)).toBe(true);
  expect(nextRevisionsForOdometer(plan,moto,[],56000)?.revision.km).toBe(60000);
 });
 it('quilometragem não informada mantém os marcos iniciais apenas como referência',()=>{
  const plan=maintenancePlan(gol)!;
  expect(revisionsAroundOdometer(plan,gol,[],null)[0]?.revision.km).toBe(10000);
 });
});
