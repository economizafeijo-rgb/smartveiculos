import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {LoginAudiencePicker} from './LoginAudiencePicker';

afterEach(cleanup);
describe('Login — escolha entre cliente e profissional',()=>{
 it('exibe o acesso profissional na mesma tela do login pessoal',()=>{
  const choose=vi.fn(),segment=vi.fn();
  render(<LoginAudiencePicker audience="personal" segment="parts_cars" onAudienceChange={choose} onSegmentChange={segment}/>);
  expect(screen.getByRole('button',{name:/Sou cliente/i})).toHaveAttribute('aria-pressed','true');
  expect(screen.getByRole('button',{name:/Sou lojista \/ profissional/i})).toBeInTheDocument();
  expect(screen.queryByLabelText(/ramo da sua empresa/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:/Sou lojista \/ profissional/i}));
  expect(choose).toHaveBeenCalledWith('business');
 });
 it('apresenta três segmentos e seleciona oficina mecânica',()=>{
  const choose=vi.fn(),segment=vi.fn();
  render(<LoginAudiencePicker audience="business" segment="parts_cars" onAudienceChange={choose} onSegmentChange={segment}/>);
  expect(screen.getByRole('button',{name:/Sou lojista \/ profissional/i})).toHaveAttribute('aria-pressed','true');
  const choice=screen.getByLabelText(/ramo da sua empresa/i);
  expect(choice.querySelectorAll('option')).toHaveLength(3);
  fireEvent.change(choice,{target:{value:'workshop'}});
  expect(segment).toHaveBeenCalledWith('workshop');
  fireEvent.click(screen.getByRole('button',{name:/Sou cliente/i}));
  expect(choose).toHaveBeenCalledWith('personal');
 });
});
