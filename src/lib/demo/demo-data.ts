/** Vitrine pública estática. NÃO utiliza conta, garagem, localStorage,
 * autenticação, Supabase, FIPE ou cadastro de um cliente.
 *
 * A demonstração da garagem é propositalmente vazia: nunca replica veículos
 * de proprietários reais, nem mesmo suas marcas/modelos ou valores.
 * Produtos e ordens de negócio são exemplos genéricos inventados e rotulados.
 */
export const DEMO_AREAS=['garage','parts_cars','parts_bikes','workshop'] as const;
export type DemoArea=(typeof DEMO_AREAS)[number];
export type DemoBusinessArea=Exclude<DemoArea,'garage'>;
export type DemoShopArea=Extract<DemoArea,'parts_cars'|'parts_bikes'>;
export function isDemoArea(x:unknown):x is DemoArea{
 return typeof x==='string'&&DEMO_AREAS.some(v=>v===x);
}
export const DEMO_PERSONAS={
 garage:{name:'Visitante da garagem',role:'Área do proprietário',company:'Conheça a garagem digital',
  description:'Veja como o sistema organiza seus veículos e despesas. Nenhum cadastro de proprietário é exibido.'},
 parts_cars:{name:'Loja demonstrativa de carros',role:'Comércio de autopeças para automóveis',company:'Autopeças · demonstração',
  description:'Exemplos de peças e funcionalidades comerciais exclusivos para automóveis.'},
 parts_bikes:{name:'Loja demonstrativa de motos',role:'Comércio de peças para motocicletas',company:'Motopeças · demonstração',
  description:'Exemplos próprios de motopeças, estoque e pedidos de motocicletas.'},
 workshop:{name:'Oficina demonstrativa',role:'Serviços mecânicos',company:'Oficina · demonstração',
  description:'Exemplos genéricos de serviços, orçamentos e etapas de atendimento.'},
} as const satisfies Record<DemoArea,{name:string;role:string;company:string;description:string}>;

export type DemoStock={
 id:string;name:string;sku:string;application:string;
 quantity:number;price:number;category:string
};
export type DemoOrder={
 id:string;customer:string;vehicle:string;service:string;date:string;
 value:number;status:'aberta'|'em_andamento'|'concluida'
};
export type DemoWorkshopService={
 id:string;name:string;category:string;description:string;priceFrom:number
};
/** Somente modelos genéricos de produto (não são anúncios nem estoque real).
 * SKUs são intencionalmente "DEMO-*" para impedir confusão com produtos de clientes.
 */
export const DEMO_STOCK:Readonly<Record<DemoShopArea,readonly DemoStock[]>>={
 parts_cars:[
  {id:'car-filter-oil',sku:'DEMO-CAR-001',name:'Filtro de óleo automotivo',application:'Motores de automóveis — conferir código e versão',quantity:28,price:39.9,category:'Filtros'},
  {id:'car-brake-pad',sku:'DEMO-CAR-002',name:'Jogo de pastilhas dianteiras',application:'Sistema de freio de automóveis — aplicação sob consulta',quantity:12,price:179.9,category:'Freios'},
  {id:'car-spark',sku:'DEMO-CAR-003',name:'Jogo de velas automotivas',application:'Motor de automóvel — confirmar medida e referência',quantity:9,price:129.9,category:'Ignição'},
  {id:'car-air-filter',sku:'DEMO-CAR-004',name:'Filtro de ar para automóvel',application:'Motor de automóvel — verificar aplicação',quantity:18,price:64.9,category:'Filtros'},
  {id:'car-belt',sku:'DEMO-CAR-005',name:'Kit de correia dentada',application:'Automóveis com correia — confirmar motorização',quantity:4,price:349.9,category:'Motor'},
  {id:'car-battery',sku:'DEMO-CAR-006',name:'Bateria automotiva 60 Ah',application:'Automóveis 12 V — verificar capacidade e dimensões',quantity:7,price:429.9,category:'Elétrica'},
  {id:'car-cabin',sku:'DEMO-CAR-007',name:'Filtro de cabine',application:'Ar-condicionado automotivo — verificar encaixe',quantity:22,price:49.9,category:'Filtros'},
  {id:'car-shock',sku:'DEMO-CAR-008',name:'Amortecedor para automóvel',application:'Suspensão de automóvel — conferir lado e versão',quantity:11,price:289.9,category:'Suspensão'},
 ],
 parts_bikes:[
  {id:'bike-filter-oil',sku:'DEMO-MOT-001',name:'Filtro de óleo para motocicleta',application:'Motor de motocicleta — conferir código',quantity:16,price:74.9,category:'Filtros'},
  {id:'bike-brake-pad',sku:'DEMO-MOT-002',name:'Pastilhas para freio de moto',application:'Pinça de motocicleta — consultar modelo e ABS',quantity:8,price:219.9,category:'Freios'},
  {id:'bike-chain-kit',sku:'DEMO-MOT-003',name:'Kit relação para motocicleta',application:'Corrente, coroa e pinhão — conferir passo e dentes',quantity:6,price:449.9,category:'Transmissão'},
  {id:'bike-air-filter',sku:'DEMO-MOT-004',name:'Filtro de ar para moto',application:'Admissão de motocicleta — confirmar formato',quantity:12,price:124.9,category:'Filtros'},
  {id:'bike-spark',sku:'DEMO-MOT-005',name:'Vela de ignição para moto',application:'Motor de motocicleta — conferir código e folga',quantity:25,price:64.9,category:'Ignição'},
  {id:'bike-gloves',sku:'DEMO-MOT-006',name:'Luva de motociclista',application:'Equipamento do motociclista — confirmar tamanho',quantity:13,price:159.9,category:'Acessórios'},
  {id:'bike-clutch',sku:'DEMO-MOT-007',name:'Cabo de embreagem de moto',application:'Comando mecânico de motocicleta — confirmar comprimento',quantity:10,price:79.9,category:'Comandos'},
  {id:'bike-tire',sku:'DEMO-MOT-008',name:'Pneu para motocicleta',application:'Aro e medida devem coincidir com a moto',quantity:9,price:389.9,category:'Pneus'},
 ],
};
export const DEMO_WORKSHOP_SERVICES:readonly DemoWorkshopService[]=[
 {id:'service-checkup',name:'Revisão preventiva',category:'Revisão',description:'Checklist de itens de segurança, fluidos e componentes.',priceFrom:190},
 {id:'service-oil',name:'Troca de óleo e filtro',category:'Lubrificação',description:'Execução condicionada à especificação do fabricante.',priceFrom:120},
 {id:'service-brakes',name:'Inspeção do sistema de freios',category:'Freios',description:'Avaliação das pastilhas, discos e fluido; peças à parte.',priceFrom:100},
 {id:'service-suspension',name:'Diagnóstico da suspensão',category:'Suspensão',description:'Verificação de folgas e desgaste com relatório técnico.',priceFrom:150},
 {id:'service-electric',name:'Diagnóstico elétrico',category:'Elétrica',description:'Leitura e análise dos sistemas antes da troca de peças.',priceFrom:160},
 {id:'service-alignment',name:'Alinhamento e balanceamento',category:'Rodas',description:'Serviço sujeito às medidas e características do veículo.',priceFrom:145},
];
/** São pedidos genéricos de exibição, não correspondem a proprietários ou veículos.
 * Nunca renderizar a placa, modelo, valor FIPE ou qualquer ficha registrada.
 */
export const DEMO_ORDERS:Readonly<Record<DemoBusinessArea,readonly DemoOrder[]>>={
 parts_cars:[
  {id:'DEMO-PC-01',customer:'Cliente exemplo 01',vehicle:'Automóvel · dados não exibidos',service:'Solicitação de filtros automotivos',date:'2026-10-28',value:104.8,status:'aberta'},
  {id:'DEMO-PC-02',customer:'Cliente exemplo 02',vehicle:'Automóvel · dados não exibidos',service:'Pedido de jogo de pastilhas',date:'2026-10-21',value:179.9,status:'em_andamento'},
  {id:'DEMO-PC-03',customer:'Cliente exemplo 03',vehicle:'Automóvel · dados não exibidos',service:'Peças para revisão automotiva',date:'2026-10-16',value:429.9,status:'concluida'},
 ],
 parts_bikes:[
  {id:'DEMO-PM-01',customer:'Cliente exemplo 04',vehicle:'Motocicleta · dados não exibidos',service:'Solicitação de filtro de óleo para moto',date:'2026-10-29',value:74.9,status:'aberta'},
  {id:'DEMO-PM-02',customer:'Cliente exemplo 05',vehicle:'Motocicleta · dados não exibidos',service:'Pedido de kit relação',date:'2026-10-23',value:449.9,status:'em_andamento'},
  {id:'DEMO-PM-03',customer:'Cliente exemplo 06',vehicle:'Motocicleta · dados não exibidos',service:'Pastilhas de motocicleta',date:'2026-10-18',value:219.9,status:'concluida'},
 ],
 workshop:[
  {id:'DEMO-OS-01',customer:'Cliente exemplo 07',vehicle:'Veículo · identificação omitida',service:'Revisão preventiva',date:'2026-10-28',value:390,status:'aberta'},
  {id:'DEMO-OS-02',customer:'Cliente exemplo 08',vehicle:'Veículo · identificação omitida',service:'Avaliação de freios',date:'2026-10-25',value:170,status:'em_andamento'},
  {id:'DEMO-OS-03',customer:'Cliente exemplo 09',vehicle:'Veículo · identificação omitida',service:'Diagnóstico elétrico',date:'2026-10-20',value:160,status:'concluida'},
  {id:'DEMO-OS-04',customer:'Cliente exemplo 10',vehicle:'Veículo · identificação omitida',service:'Troca de óleo e filtro',date:'2026-10-18',value:290,status:'concluida'},
 ]
};
export const formatDemoBRL=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export const demoStockValue=(rows:readonly DemoStock[])=>rows.reduce((total,r)=>total+r.quantity*r.price,0);
export const demoOpenOrders=(rows:readonly DemoOrder[])=>rows.filter(row=>row.status!=='concluida').length;
