import {describe,expect,it} from 'vitest';
import {validateCnpj,cleanCnpj,formatCnpj} from './cnpj';
describe('validação Receita Federal CNPJ 2026',()=>{
 it('aceita CNPJ numérico válido com e sem máscara',()=>{
  expect(validateCnpj('04.252.011/0001-10')).toBe(true);
  expect(validateCnpj('04252011000110')).toBe(true);
 });
 it('aceita o exemplo oficial alfanumérico com DV 35',()=>{
  expect(validateCnpj('12.ABC.345/01DE-35')).toBe(true);
  expect(validateCnpj('12abc34501de35')).toBe(true);
 });
 it('recusa dígito errado, repetição e símbolos inesperados',()=>{
  expect(validateCnpj('04252011000111')).toBe(false);
  expect(validateCnpj('11.111.111/1111-11')).toBe(false);
  expect(validateCnpj('12ABC34501DE36')).toBe(false);
  expect(validateCnpj('123')).toBe(false);
 });
 it('normaliza dados para armazenamento',()=>{
  expect(cleanCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35');
  expect(formatCnpj('12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
 });
});
