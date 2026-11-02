import {afterEach,describe,expect,it,vi} from 'vitest';
import {
 displayedFipe,FIPE_FEATURED_KEYS,knownFipe,needsFipeRefresh,refreshFipe,
} from './fipe';

afterEach(()=>vi.unstubAllGlobals());

describe('FIPE dos dois veículos cadastrados',()=>{
 it('exibe o valor verificado do Gol Seleção, e não o Gol 1.6 comum',()=>{
  const value=displayedFipe(FIPE_FEATURED_KEYS.gol)!;
  expect(value.quote.codeFipe).toBe('005363-5');
  expect(value.quote.price).toBe('R$ 39.745,00');
  expect(value.quote.referenceMonth).toBe('outubro de 2026');
  expect(knownFipe(FIPE_FEATURED_KEYS.gol)?.year).toBe(2014);
  expect(value.source).toBe('published-reference');
 });
 it('exibe a cotação verificada de novembro da Honda CB650R ABS',()=>{
  const value=displayedFipe(FIPE_FEATURED_KEYS.cb650r)!;
  expect(value.quote.codeFipe).toBe('811160-0');
  expect(value.quote.price).toBe('R$ 54.365,00');
  expect(value.quote.referenceMonth).toBe('novembro de 2026');
  expect(knownFipe(FIPE_FEATURED_KEYS.cb650r)?.kind).toBe('moto');
 });
 it('reconsulta uma referência antiga mesmo quando foi conferida neste mês',()=>{
  const value=displayedFipe(FIPE_FEATURED_KEYS.gol)!;
  expect(needsFipeRefresh(value,new Date('2026-11-03T11:00:00-03:00'))).toBe(true);
 });
 it('busca pelo código FIPE e pelo ano na API para renovar os valores',async()=>{
  const mocked=vi.fn(async (input:RequestInfo|URL)=>{
   const url=String(input);
   if(url.endsWith('/cars/005363-5/years'))return {ok:true,status:200,json:async()=>[{code:'2014-5',name:'2014 Flex'}]};
   if(url.endsWith('/cars/005363-5/years/2014-5'))return {ok:true,status:200,json:async()=>({
    brand:'VW - VolksWagen',model:'Gol SELEÇÃO 1.6 Total Flex 8V 5p',
    modelYear:2014,fuel:'Flex',codeFipe:'005363-5',
    price:'R$ 40.123,00',referenceMonth:'novembro de 2026',
   })};
   throw new Error('URL inesperada: '+url);
  });
  vi.stubGlobal('fetch',mocked);
  const updated=await refreshFipe(
   FIPE_FEATURED_KEYS.gol,'carro',displayedFipe(FIPE_FEATURED_KEYS.gol)!
  );
  expect(updated.quote.price).toBe('R$ 40.123,00');
  expect(updated.quote.referenceMonth).toBe('novembro de 2026');
  expect(updated.source).toBe('api');
  expect(mocked).toHaveBeenCalledTimes(2);
 });
 it('rejeita resposta de versão incorreta sem trocar o preço exibido',async()=>{
  const mocked=vi.fn(async (input:RequestInfo|URL)=>{
   const url=String(input);
   return {ok:true,status:200,json:async()=>url.endsWith('/years')
    ?[{code:'2024-1',name:'2024 Gasolina'}]
    :{brand:'Honda',model:'CBR 650R ABS',modelYear:2024,fuel:'Gasolina',
      codeFipe:'811162-6',price:'R$ 60.000,00',referenceMonth:'novembro de 2026'},
   };
  });
  vi.stubGlobal('fetch',mocked);
  await expect(refreshFipe(
   FIPE_FEATURED_KEYS.cb650r,'moto',displayedFipe(FIPE_FEATURED_KEYS.cb650r)!
  )).rejects.toThrow('outra versão FIPE');
 });
});
