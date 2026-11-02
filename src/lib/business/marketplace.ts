/** Public marketplace fields only: never include customer contacts, internal stock,
 * costs, orders or non-public company profile data here. */
export type MarketplaceKind='product'|'service';
export type MarketplacePriceMode='fixed'|'starting_at'|'quote';
export type MarketplaceAvailability='available'|'on_request'|'out_of_stock';
export type MarketplaceListing={
 id:string;business_id:string;kind:MarketplaceKind;title:string;category:string;
 description:string;brand:string;reference_code:string;compatibility:string;
 image_url:string;price:number|null;price_mode:MarketplacePriceMode;
 availability:MarketplaceAvailability;is_published:boolean;is_approved:boolean;
 business_name:string;business_city:string;contact_phone:string;
 created_at:string;updated_at:string;
};
export const MONEY=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
export const formatMarketplacePrice=(listing:Pick<MarketplaceListing,'price'|'price_mode'>):string=>{
 if(listing.price_mode==='quote'||listing.price===null)return 'Sob consulta';
 const money=MONEY.format(Number(listing.price));
 return listing.price_mode==='starting_at'?'A partir de '+money:money;
};
export const availabilityLabel:Record<MarketplaceAvailability,string>={
 available:'Disponível',on_request:'Sob encomenda',out_of_stock:'Indisponível'
};
export const OFFER_TYPE_LABELS:Record<MarketplaceKind,string>={product:'Produto',service:'Serviço'};
export const uuidLike=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const publicOfferLink=(id:string)=>'/vitrines?oferta='+encodeURIComponent(id);
export const publicBusinessLink=(id:string)=>'/vitrines?empresa='+encodeURIComponent(id);
export const whatsappLink=(phone:string,offer:Pick<MarketplaceListing,'title'|'kind'>):string|null=>{
 const digits=phone.replace(/\D/g,'');
 if(!/^\d{10,13}$/.test(digits))return null;
 const countryPhone=digits.length===10||digits.length===11?'55'+digits:digits;
 const text='Olá! Vi '+(offer.kind==='service'?'o serviço ':'o produto ')+
  '"'+offer.title+'" na vitrine SmartVeículos. Gostaria de confirmar detalhes, disponibilidade e orçamento.';
 return 'https://wa.me/'+countryPhone+'?text='+encodeURIComponent(text);
};
