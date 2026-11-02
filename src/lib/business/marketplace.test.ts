import {describe,expect,it} from 'vitest';
import {
 formatMarketplacePrice,publicBusinessLink,publicOfferLink,uuidLike,whatsappLink
} from './marketplace';
describe('Vitrines — formatos e links compartilháveis',()=>{
 it('exibe preço sem inventar valores de orçamento',()=>{
  expect(formatMarketplacePrice({price:null,price_mode:'quote'})).toBe('Sob consulta');
  expect(formatMarketplacePrice({price:120,price_mode:'starting_at'})).toContain('A partir de');
  expect(formatMarketplacePrice({price:120,price_mode:'fixed'})).toContain('120');
 });
 it('gera URLs de vitrine com ids codificados',()=>{
  expect(publicOfferLink('123')).toBe('/vitrines?oferta=123');
  expect(publicBusinessLink('abc')).toBe('/vitrines?empresa=abc');
  expect(uuidLike('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  expect(uuidLike('../admin')).toBe(false);
 });
 it('não cria contato quando o telefone não é válido',()=>{
  const offer={title:'Revisão completa',kind:'service' as const};
  expect(whatsappLink('',offer)).toBeNull();
  expect(whatsappLink('abc',offer)).toBeNull();
  const link=whatsappLink('(68) 99999-1234',offer);
  expect(link).toContain('https://wa.me/5568999991234?text=');
  expect(link).toContain('Revis');
 });
});
