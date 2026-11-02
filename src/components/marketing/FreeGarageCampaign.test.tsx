import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {FreeGarageCampaign} from './FreeGarageCampaign';

afterEach(cleanup);

describe('Campanha da garagem gratuita',()=>{
 it('comunica preço, cadastro e link para clientes sem anunciar gratuidade empresarial',()=>{
  render(<FreeGarageCampaign/>);
  expect(screen.getByText(/Sua garagem é grátis/)).toBeInTheDocument();
  expect(screen.getByText('R$ 0')).toBeInTheDocument();
  expect(screen.getByText(/Cadastro gratuito/)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:/Criar minha garagem grátis/i})).toHaveAttribute('href','/acesso?mode=register');
  expect(screen.getByRole('link',{name:/Já tenho conta/i})).toHaveAttribute('href','/acesso?next=%2Fgaragem');
  expect(screen.getByText(/soluções para empresas são separadas/i)).toBeInTheDocument();
 });
 it('permite trocar entre carro e moto sem solicitar dados reais de veículos',()=>{
  render(<FreeGarageCampaign/>);
  expect(screen.getByRole('button',{name:/Carro/i})).toHaveAttribute('aria-pressed','true');
  fireEvent.click(screen.getByRole('button',{name:/Moto/i}));
  expect(screen.getByRole('button',{name:/Moto/i})).toHaveAttribute('aria-pressed','true');
  expect(screen.getByText('Sua moto. Seu controle.')).toBeInTheDocument();
  expect(screen.getByText(/Demonstração ilustrativa/)).toBeInTheDocument();
 });
 it('apresenta funções interativas para revisões, combustível e despesas',()=>{
  render(<FreeGarageCampaign/>);
  fireEvent.click(screen.getByRole('button',{name:/Combustível/i}));
  expect(screen.getByText('Abastecimentos organizados')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:/Despesas/i}));
  expect(screen.getByText('Histórico sempre à mão')).toBeInTheDocument();
 });
});
