// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from 'vitest';
import {servicesForRevision} from './manufacturer-service-guide';
import {readRevisionChecks,writeRevisionChecks} from './revision-checks';

const moto={kind:'moto' as const,name:'Honda CB650R 2024',modelYear:2024,modelKey:'cb650r-2024'};
const gol={kind:'carro' as const,name:'Gol G6 Seleção 1.6',modelYear:2014,modelKey:'gol-g6-selecao-2014'};
const actions=(km:number)=>(servicesForRevision(moto,km)?.items??[]).map(x=>x.id);

describe('serviços recomendados pelo manual Honda CB650R 2024',()=>{
 it('1.000 km: óleo e filtro sem inventar troca de pastilha ou vela',()=>{
  const ids=actions(1000);
  expect(ids).toContain('oil');expect(ids).toContain('oilfilter');
  expect(ids).not.toContain('brakepads');expect(ids).not.toContain('sparkreplace');
 });
 it('6.000 km: inspecionar freios e embreagem, não trocar óleo por km',()=>{
  const ids=actions(6000);
  expect(ids).toContain('brakepads');expect(ids).toContain('clutch');
  expect(ids).not.toContain('oil');expect(ids).not.toContain('airfilter');
 });
 it('12.000 km: óleo e filtro mais verificações de segurança',()=>{
  const ids=actions(12000);
  for(const i of ['oil','oilfilter','brakepads','fuel-line','coolant','tires'])expect(ids).toContain(i);
  expect(ids).not.toContain('airfilter');
 });
 it('18.000 km: trocar filtro de ar, mas não presume troca das pastilhas',()=>{
  const guide=servicesForRevision(moto,18000)!;
  expect(actions(18000)).toContain('airfilter');
  expect(guide.items.find(x=>x.id==='brakepads')?.action).toBe('verificar');
 });
 it('24.000 km: verificar velas, e não trocar antes de 48.000',()=>{
  expect(actions(24000)).toContain('sparkcheck');
  expect(actions(24000)).not.toContain('sparkreplace');
  expect(actions(48000)).toContain('sparkreplace');
 });
 it('36.000 km: inclui verificação da folga de válvulas',()=>{
  expect(actions(36000)).toContain('valves');
  expect(actions(72000)).toContain('valves');
 });
 it('mostra vencimentos por tempo mesmo com poucos quilômetros',()=>{
  const guide=servicesForRevision(moto,6000)!;
  expect(guide.level).toBe('especifico');
  expect(guide.timeItems.map(x=>x.interval)).toContain('A cada 2 anos');
  expect(guide.timeItems.map(x=>x.interval)).toContain('A cada 3 anos');
  expect(guide.source).toContain('honda.com.br');
 });
});
describe('Volkswagen Gol 2014: não atribuir troca sem livrete do modelo',()=>{
 it('exibe somente orientações gerais e a diferença de confiabilidade',()=>{
  const guide=servicesForRevision(gol,30000)!;
  expect(guide.level).toBe('parcial');
  expect(guide.notice).toContain('NÃO foi localizada');
  expect(guide.items.some(x=>x.action==='trocar')).toBe(false);
  expect(guide.items.find(x=>x.id==='vw-belts')?.interval).toContain('Confirmar');
  expect(guide.source).toContain('vw.com.br');
 });
 it('não compartilha cronograma com carro ou moto de modelo não identificado',()=>{
  expect(servicesForRevision({kind:'carro',name:'Fiat Argo 2022'},10000)).toBeNull();
  expect(servicesForRevision({kind:'moto',name:'Fazer 250 2020'},6000)).toBeNull();
 });
});
describe('marcação de itens conferidos, sem registro automático da revisão',()=>{
 beforeEach(()=>localStorage.clear());
 it('salva por veículo e por marco individualmente',()=>{
  writeRevisionChecks('v1',12000,['oil','brakepads']);
  expect(readRevisionChecks('v1',12000)).toEqual(['oil','brakepads']);
  expect(readRevisionChecks('v1',6000)).toEqual([]);
  expect(readRevisionChecks('v2',12000)).toEqual([]);
 });
 it('descarta entrada inválida sem lançar erro',()=>{
  localStorage.setItem('smartveiculos:manual-checks:v1:v1:6000','not-json');
  expect(readRevisionChecks('v1',6000)).toEqual([]);
  expect(readRevisionChecks('',6000)).toEqual([]);
 });
});
