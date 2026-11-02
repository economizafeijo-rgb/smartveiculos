import {describe,expect,it} from 'vitest';
import {
 GOL_REVISIONS,maintenancePlan,revisionCompleted,revisionDescription,upcomingManualRevisions
} from './manual-maintenance';
import {guidesForVehicle,videoProfile,youtubeSearchUrl} from './video-guides';
import type {ServiceRecord} from './types';
const gol={kind:'carro' as const,name:'Gol G6 Seleção 1.6',modelKey:'gol-g6-selecao-2014',modelYear:2014};
const bike={kind:'moto' as const,name:'Honda CB650R 2024',modelKey:'cb650r-2024',modelYear:2024};
const rec=(description:string):ServiceRecord=>({id:'a',vehicleId:'abc',kind:'revisao',date:'2026-01-15',km:10100,cost:220,nextKm:null,description});
describe('planos revisados por montadora e histórico real',()=>{
 it('usa prazos VW de 2014 e não assume que revisão já foi feita',()=>{
  const plan=maintenancePlan(gol)!;
  expect(plan.maker).toBe('Volkswagen');
  expect(GOL_REVISIONS[0]).toMatchObject({km:10000,months:6});
  expect(upcomingManualRevisions(plan,gol,[],10000)[0]?.completed).toBe(false);
 });
 it('usa o cronograma Honda 2024 1000/6000/12000 km com datas originais',()=>{
  const revisions=maintenancePlan(bike)!.revisions;
  expect(revisions.slice(0,3)).toEqual([
   {km:1000,months:6,label:'1ª revisão'},
   {km:6000,months:12,label:'2ª revisão'},
   {km:12000,months:18,label:'3ª revisão'},
  ]);
 });
 it('revisão só fica concluída com registro explícito da mesma etapa',()=>{
  const description=revisionDescription(bike,6000);
  expect(revisionCompleted(rec(description+' | OS 4382'),bike,6000)).toBe(true);
  expect(revisionCompleted(rec(description),bike,12000)).toBe(false);
  expect(revisionCompleted(rec('Troca de óleo e filtro'),bike,6000)).toBe(false);
 });
 it('não inventa cronograma para modelos de carros desconhecidos',()=>{
  expect(maintenancePlan({kind:'carro',name:'Fiat Argo 2022'})).toBeNull();
 });
});
describe('biblioteca audiovisual por modelo',()=>{
 it('mostra vídeos do Gol e da Honda em bibliotecas separadas',()=>{
  expect(videoProfile(gol)).toBe('gol');
  expect(videoProfile(bike)).toBe('cb650r');
  expect(guidesForVehicle(gol)).toHaveLength(10);
  expect(guidesForVehicle(bike)).toHaveLength(7);
  expect(guidesForVehicle({kind:'moto',name:'Yamaha Fazer 150'})).toEqual([]);
  const golIds=new Set(guidesForVehicle(gol).map(v=>v.id));
  const cbIds=new Set(guidesForVehicle(bike).map(v=>v.id));
  expect([...golIds].filter(id=>cbIds.has(id))).toHaveLength(0);
  expect(new Set(golIds).size).toBe(10);
  expect(new Set(cbIds).size).toBe(7);
  expect(guidesForVehicle({kind:'carro',name:'Gol G6 Seleção 1.6 2015',modelYear:2015})).toEqual([]);
  expect(guidesForVehicle({kind:'moto',name:'Honda CB650R 2026',modelYear:2026})).toEqual([]);
  expect(guidesForVehicle({kind:'carro',name:'Gol G6 1.0 2014'})).toEqual([]);
  // Sem ano confirmado, não herdar tutoriais de outra versão da mesma família.
  expect(guidesForVehicle({kind:'moto',name:'Honda CB650R'})).toEqual([]);
  expect(guidesForVehicle({kind:'carro',name:'Gol G6 Seleção 1.6'})).toEqual([]);


 });
 it('usa busca específica do próprio modelo, sem dados privados',()=>{
  const url=youtubeSearchUrl(gol,'limpeza TBI');
  expect(decodeURIComponent(url)).toContain('Gol G6 Seleção 1.6');
  expect(url).toContain('youtube.com/results?search_query=');
 });
});
