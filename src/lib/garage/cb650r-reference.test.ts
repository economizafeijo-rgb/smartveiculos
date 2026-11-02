import { describe,it,expect } from 'vitest';
import {CB650R_REVISIONS,addMonthsToDate,revisionDue} from './cb650r-reference';

describe('Honda CB650R 2024 — revisões',()=>{
 it('respeita primeira revisão e progressão de 6.000 km / 6 meses',()=>{
  expect(CB650R_REVISIONS[0]).toMatchObject({index:1,km:1000,months:6});
  expect(CB650R_REVISIONS[1]).toMatchObject({index:2,km:6000,months:12});
  expect(CB650R_REVISIONS[2]).toMatchObject({index:3,km:12000,months:18});
  expect(CB650R_REVISIONS[8]).toMatchObject({index:9,km:48000,months:54});
 });
 it('calcula prazos por meses inclusive fim de mês',()=>{
  expect(addMonthsToDate('2024-08-31',6)).toBe('2025-02-28');
  expect(addMonthsToDate('2024-02-29',12)).toBe('2025-02-28');
  expect(addMonthsToDate('2024-13-01',6)).toBe(null);
 });
 it('não inventa data se a entrega não foi informada',()=>{
  expect(revisionDue(CB650R_REVISIONS[0]!,250,undefined,'2026-11-02')).toMatchObject({state:'soon',date:null,remainingKm:750});
 });
 it('considera prazo por data mesmo sem atingir quilometragem',()=>{
  expect(revisionDue(CB650R_REVISIONS[1]!,2000,'2024-06-10','2025-06-10')).toMatchObject({state:'due',date:'2025-06-10'});
 });
 it('mantém revisão futura como programada',()=>{
  expect(revisionDue(CB650R_REVISIONS[3]!,1000,'2026-10-01','2026-11-02').state).toBe('ok');
 });
});
