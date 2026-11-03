import {describe,expect,it} from 'vitest';
import {demoQrUrl,demoQrImage,DEMO_PUBLIC_ORIGIN} from './DemoQRCode';
import {DEMO_AREAS,DEMO_STOCK,DEMO_WORKSHOP_SERVICES} from '@/lib/demo/demo-data';

describe('QR Codes públicos exclusivos',()=>{
 it('codifica homepage e cada área sem misturar rotas',()=>{
  expect(demoQrUrl()).toBe(DEMO_PUBLIC_ORIGIN+'/');
  const urls=DEMO_AREAS.map(a=>demoQrUrl(a));
  expect(new Set(urls).size).toBe(4);
  for(const area of DEMO_AREAS)expect(demoQrUrl(area)).toBe(DEMO_PUBLIC_ORIGIN+'/demonstracao?area='+area);
 });
 it('emite PNG a partir do endereço público exato',()=>{
  for(const area of DEMO_AREAS){
   const url=demoQrUrl(area),qr=demoQrImage(url);
   expect(qr).toContain('create-qr-code');
   expect(qr).toContain(encodeURIComponent(url));
  }
 });
 it('rejeita endereços que não são do SmartVeículos',()=>{
  expect(()=>demoQrImage('https://example.com/private')).toThrow('Somente URLs públicas');
 });
});
describe('isolamento dos ambientes interativos',()=>{
 it('peças de auto e moto têm SKUs diferentes',()=>{
  expect(DEMO_STOCK.parts_cars.every(x=>x.sku.startsWith('DEMO-CAR-'))).toBe(true);
  expect(DEMO_STOCK.parts_bikes.every(x=>x.sku.startsWith('DEMO-MOT-'))).toBe(true);
  expect(DEMO_STOCK.parts_cars.some(x=>DEMO_STOCK.parts_bikes.some(y=>x.id===y.id))).toBe(false);
 });
 it('oficina tem serviços próprios sem estoque compartilhado',()=>{
  expect(DEMO_WORKSHOP_SERVICES.length).toBeGreaterThan(4);
  expect(Object.keys(DEMO_STOCK)).not.toContain('workshop');
 });
});
