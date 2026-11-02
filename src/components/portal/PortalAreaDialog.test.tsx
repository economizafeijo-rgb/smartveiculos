import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {PortalAreaDialog,type PortalArea} from './PortalAreaDialog';

afterEach(()=>cleanup());

describe('Apresentação compacta das áreas do portal',()=>{
 const accessPaths:Record<PortalArea,string>={
  parts_cars:'/acesso?segment=parts_cars',
  parts_bikes:'/acesso?segment=parts_bikes',
  workshop:'/acesso?segment=workshop',
  garage:'/acesso?next=%2Fgaragem'
 };
 for(const [area,href] of Object.entries(accessPaths) as [PortalArea,string][]){
  it('abre '+area+' com botão de acesso e sem rolagem interna',()=>{
   render(<PortalAreaDialog area={area} onOpenChange={vi.fn()}/>);
   const dialog=screen.getByRole('dialog');
   expect(dialog).toHaveClass('overflow-hidden');
   expect(dialog).not.toHaveClass('overflow-y-auto');
   const link=within(dialog).getByRole('link',{name:/Entrar na/i});
   expect(link).toHaveAttribute('href',href);
   expect(within(dialog).getByText('Já disponível')).toBeInTheDocument();
   expect(within(dialog).getAllByText('Em desenvolvimento')).toHaveLength(2);
  });
 }
 it('permite alternar os grupos de conteúdo no celular',()=>{
  render(<PortalAreaDialog area="parts_cars" onOpenChange={vi.fn()}/>);
  const dialog=screen.getByRole('dialog');
  const management=within(dialog).getByRole('tab',{name:'Gestão'});
  const service=within(dialog).getByRole('tab',{name:'Atendimento'});
  expect(management).toHaveAttribute('aria-selected','true');
  fireEvent.click(service);
  expect(service).toHaveAttribute('aria-selected','true');
  expect(management).toHaveAttribute('aria-selected','false');
  expect(document.getElementById('sv-panel-management')).toHaveClass('hidden');
  expect(document.getElementById('sv-panel-service')).not.toHaveClass('hidden');
 });
 it('fecha a apresentação pelo botão dedicado',()=>{
  const onChange=vi.fn();
  render(<PortalAreaDialog area="workshop" onOpenChange={onChange}/>);
  fireEvent.click(screen.getByRole('button',{name:'Fechar apresentação'}));
  expect(onChange).toHaveBeenCalledWith(false);
 });
});
