// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {
 LAST_PRIVATE_PATH_KEY,safePrivatePath,rememberPrivateRoute,
 lastPrivateRoute,returnToPanel,clearReturnNavigation
} from './navigation';

beforeEach(()=>sessionStorage.clear());
afterEach(()=>sessionStorage.clear());

describe('retorno à área autenticada sem encerrar login',()=>{
 it('só aceita páginas privadas locais, jamais redirecionamento externo',()=>{
  expect(safePrivatePath('/garagem?pagina=combustivel&veiculo=privado')).toBe('/garagem');
  expect(safePrivatePath('/negocio?segment=parts_bikes')).toBe('/negocio?segment=parts_bikes');
  expect(safePrivatePath('/negocio?segment=forjado')).toBe('/negocio');
  expect(safePrivatePath('/admin-empresas')).toBe('/admin-empresas');
  expect(safePrivatePath('/')).toBeNull();
  expect(safePrivatePath('/acesso')).toBeNull();
  expect(safePrivatePath('//evil.com')).toBeNull();
  expect(safePrivatePath('https://evil.com')).toBeNull();
  expect(safePrivatePath('/\\evil.com')).toBeNull();
 });
 it('navegar para homepage não altera a sessão nem o destino guardado',()=>{
  rememberPrivateRoute('usuario-1','/garagem?pagina=revisoes');
  expect(lastPrivateRoute('usuario-1')).toBe('/garagem');
  rememberPrivateRoute('usuario-1','/');
  expect(lastPrivateRoute('usuario-1')).toBe('/garagem');
  expect(returnToPanel('usuario-1')).toBe('/garagem');
 });
 it('usuários diferentes não herdam o último painel de outra conta',()=>{
  rememberPrivateRoute('usuario-a','/admin');
  expect(lastPrivateRoute('usuario-a')).toBe('/admin');
  expect(lastPrivateRoute('usuario-b')).toBeNull();
  expect(returnToPanel('usuario-b')).toBe('/garagem');
 });
 it('perfila a empresa quando ainda não há rota visitada',()=>{
  sessionStorage.setItem('smartveiculos:selected-business',JSON.stringify({segment:'workshop',cnpj:'00000000000000'}));
  expect(returnToPanel('usuario-a')).toBe('/negocio?segment=workshop');
  sessionStorage.setItem('smartveiculos:selected-business',JSON.stringify({segment:'not-valid'}));
  expect(returnToPanel('usuario-a')).toBe('/garagem');
 });
 it('limpa apenas o retorno e a seleção empresarial após logout explícito',()=>{
  rememberPrivateRoute('usuario-a','/negocio?segment=parts_cars');
  sessionStorage.setItem('smartveiculos:selected-business','{}');
  sessionStorage.setItem('unrelated','keep');
  clearReturnNavigation();
  expect(sessionStorage.getItem(LAST_PRIVATE_PATH_KEY)).toBeNull();
  expect(sessionStorage.getItem('smartveiculos:selected-business')).toBeNull();
  expect(sessionStorage.getItem('unrelated')).toBe('keep');
 });
});
