import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {RegistrationProfilePicker} from './RegistrationProfilePicker';
import {
 REGISTRATION_PROFILES,businessSegmentFromProfile,
 isRegistrationProfile,profileDestination
} from '@/lib/business/registration-profiles';

afterEach(cleanup);
describe('Seleção de ramo de atuação no cadastro',()=>{
 it('mostra quatro perfis e não avança até selecionar um',()=>{
  render(<RegistrationProfilePicker selected={null} onSelect={vi.fn()} onContinue={vi.fn()}/>);
  expect(screen.getAllByRole('radio')).toHaveLength(4);
  expect(screen.getByRole('button',{name:/Continuar para o cadastro/i})).toBeDisabled();
  expect(screen.getByRole('radiogroup',{name:/ramo de atuação/i})).toBeInTheDocument();
 });
 it('destaca o ramo selecionado e permite avançar',()=>{
  const onSelect=vi.fn(),onContinue=vi.fn();
  const {rerender}=render(<RegistrationProfilePicker selected={null} onSelect={onSelect} onContinue={onContinue}/>);
  fireEvent.click(screen.getByRole('radio',{name:/Autopeças de motos/i}));
  expect(onSelect).toHaveBeenCalledWith('parts_bikes');
  rerender(<RegistrationProfilePicker selected="parts_bikes" onSelect={onSelect} onContinue={onContinue}/>);
  expect(screen.getByRole('radio',{name:/Autopeças de motos/i})).toHaveAttribute('aria-checked','true');
  fireEvent.click(screen.getByRole('button',{name:/Continuar para o cadastro/i}));
  expect(onContinue).toHaveBeenCalledOnce();
 });
 it('cada opção tem destino de acesso consistente',()=>{
  expect(REGISTRATION_PROFILES).toHaveLength(4);
  expect(REGISTRATION_PROFILES.map(p=>p.id)).toEqual(['owner','parts_cars','parts_bikes','workshop']);
  for(const p of REGISTRATION_PROFILES)expect(isRegistrationProfile(p.id)).toBe(true);
  expect(isRegistrationProfile('admin')).toBe(false);
  expect(businessSegmentFromProfile('owner')).toBeUndefined();
  expect(businessSegmentFromProfile('workshop')).toBe('workshop');
  expect(profileDestination('owner')).toBe('/garagem');
  expect(profileDestination('parts_cars')).toBe('/negocio?segment=parts_cars');
  expect(profileDestination('parts_bikes')).toBe('/negocio?segment=parts_bikes');
  expect(profileDestination('workshop')).toBe('/negocio?segment=workshop');
 });
});
