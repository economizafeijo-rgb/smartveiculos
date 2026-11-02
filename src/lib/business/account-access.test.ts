import {describe,it,expect} from 'vitest';
import {businessAccessResult} from './account-access';

describe('Acesso de empresas vinculado ao responsável',()=>{
 const owned=[{cnpj:'11222333000181',segment:'parts_cars' as const}];
 it('identifica empresa do responsável por CNPJ e ramo',()=>{
  expect(businessAccessResult(owned,'11.222.333/0001-81','parts_cars')).toBe('linked');
 });
 it('não libera CNPJ diferente, mesmo com e-mail autenticado',()=>{
  expect(businessAccessResult(owned,'22111222000180','parts_cars')).toBe('wrong-company');
 });
 it('permite entrar na configuração quando a conta não possui empresa naquele ramo',()=>{
  expect(businessAccessResult(owned,'22111222000180','parts_bikes')).toBe('setup');
  expect(businessAccessResult([],'22111222000180','workshop')).toBe('setup');
 });
});
