// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {DisplayControls} from './DisplayControls';

afterEach(()=>{
 cleanup();vi.restoreAllMocks();window.localStorage.clear();
 document.documentElement.classList.remove('dark');
 Reflect.deleteProperty(document.documentElement,'requestFullscreen');
 Reflect.deleteProperty(document,'exitFullscreen');
 Reflect.deleteProperty(document,'fullscreenElement');
});
beforeEach(()=>{
 window.localStorage.clear();document.documentElement.classList.remove('dark');
});
describe('Controles de visualização SmartVeículos',()=>{
 it('alternar tema altera o documento e salva a preferência',async()=>{
  render(<DisplayControls/>);
  const dark=await screen.findByRole('button',{name:'Ativar modo escuro'});
  fireEvent.click(dark);
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  expect(window.localStorage.getItem('smartveiculos:display-theme')).toBe('dark');
  fireEvent.click(screen.getByRole('button',{name:'Ativar modo claro'}));
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  expect(window.localStorage.getItem('smartveiculos:display-theme')).toBe('light');
 });
 it('restaura modo escuro da conta neste dispositivo',async()=>{
  localStorage.setItem('smartveiculos:display-theme','dark');
  render(<DisplayControls/>);
  await waitFor(()=>expect(document.documentElement.classList.contains('dark')).toBe(true));
  expect(screen.getByRole('button',{name:'Ativar modo claro'})).toBeTruthy();
 });
 it('entra e sai da tela cheia usando a API do navegador',async()=>{
  Object.defineProperty(document.documentElement,'requestFullscreen',{configurable:true,value:vi.fn(async()=>{
   Object.defineProperty(document,'fullscreenElement',{configurable:true,value:document.documentElement});
   document.dispatchEvent(new Event('fullscreenchange'));
  })});
  Object.defineProperty(document,'exitFullscreen',{configurable:true,value:vi.fn(async()=>{
   Object.defineProperty(document,'fullscreenElement',{configurable:true,value:null});
   document.dispatchEvent(new Event('fullscreenchange'));
  })});
  render(<DisplayControls/>);
  const button=await screen.findByRole('button',{name:'Ativar tela cheia'});
  fireEvent.click(button);
  await screen.findByRole('button',{name:'Sair da tela cheia'});
  fireEvent.click(screen.getByRole('button',{name:'Sair da tela cheia'}));
  await screen.findByRole('button',{name:'Ativar tela cheia'});
 });
 it('explica a limitação quando a API de tela cheia não está disponível',async()=>{
  render(<DisplayControls/>);
  fireEvent.click(await screen.findByRole('button',{name:'Ativar tela cheia'}));
  expect(await screen.findByRole('status')).toBeTruthy();
 });
});
