/** Personas e dados EXCLUSIVAMENTE fictícios, disponíveis publicamente.
 * Nunca usar CNPJ, placas, e-mail ou IDs de contas reais.
 * Nenhuma ação aqui acessa Supabase, localStorage ou serviços privados.
 */
export const DEMO_AREAS=['garage','parts_cars','parts_bikes','workshop'] as const;
export type DemoArea=(typeof DEMO_AREAS)[number];
export function isDemoArea(x:unknown):x is DemoArea{
 return typeof x==='string'&&DEMO_AREAS.some(v=>v===x);
}
export const DEMO_PERSONAS={
 garage:{name:'Visitante da Garagem',role:'Proprietário de carro e moto',company:'Garagem demonstrativa',
  description:'Explore veículos, abastecimentos, revisões, FIPE e vídeos em uma conta somente leitura.'},
 parts_cars:{name:'Atendente de autopeças',role:'Loja de peças para carros',company:'Autopeças Exemplo',
  description:'Conheça estoque, catálogo, aplicação de peças e acompanhamento de pedidos.'},
 parts_bikes:{name:'Atendente de peças para motos',role:'Loja de peças para motocicletas',company:'Motopeças Exemplo',
  description:'Explore produtos para motos, disponibilidade, catálogo e solicitações.'},
 workshop:{name:'Gestor de oficina',role:'Oficina mecânica',company:'Oficina Exemplo',
  description:'Explore ordens de serviço, fila de atendimento, etapas e valores.'},
} as const satisfies Record<DemoArea,{name:string;role:string;company:string;description:string}>;
export type DemoStock={id:string;name:string;sku:string;application:string;quantity:number;price:number;category:string};
export type DemoOrder={id:string;customer:string;vehicle:string;service:string;date:string;value:number;status:'aberta'|'em_andamento'|'concluida'};
export type DemoVehicle={
 id:'gol'|'honda';kind:'carro'|'moto';name:string;year:number;km:number;
 fipeValue:number;fipeMonth:string;fipeCode:string;
};
export type DemoFuel={vehicleId:DemoVehicle['id'];date:string;km:number;fuel:string;liters:number;priceLiter:number};
export type DemoService={vehicleId:DemoVehicle['id'];date:string;km:number;name:string;value:number;status:'realizado'|'a_conferir'};
export const DEMO_VEHICLES:readonly DemoVehicle[]=[
 {id:'gol',kind:'carro',name:'VW Gol G6 Seleção 1.6',year:2014,km:184520,
  fipeValue:39745,fipeMonth:'outubro/2026',fipeCode:'005363-5'},
 {id:'honda',kind:'moto',name:'Honda CB650R ABS',year:2024,km:12650,
  fipeValue:54365,fipeMonth:'novembro/2026',fipeCode:'811160-0'},
];
export const DEMO_FUEL:readonly DemoFuel[]=[
 {vehicleId:'gol',date:'2026-10-27',km:184520,fuel:'Gasolina',liters:39.2,priceLiter:5.94},
 {vehicleId:'gol',date:'2026-10-14',km:184055,fuel:'Etanol',liters:40.4,priceLiter:4.13},
 {vehicleId:'gol',date:'2026-09-30',km:183628,fuel:'Gasolina',liters:36.8,priceLiter:5.99},
 {vehicleId:'gol',date:'2026-09-13',km:183197,fuel:'Gasolina',liters:39.5,priceLiter:5.85},
 {vehicleId:'gol',date:'2026-08-29',km:182740,fuel:'Etanol',liters:42,priceLiter:4.19},
 {vehicleId:'honda',date:'2026-10-26',km:12650,fuel:'Gasolina',liters:12.9,priceLiter:6.08},
 {vehicleId:'honda',date:'2026-10-08',km:12422,fuel:'Gasolina',liters:13.3,priceLiter:6.03},
 {vehicleId:'honda',date:'2026-09-19',km:12190,fuel:'Gasolina',liters:12.5,priceLiter:5.94},
 {vehicleId:'honda',date:'2026-08-29',km:11980,fuel:'Gasolina',liters:12.7,priceLiter:5.89},
];
export const DEMO_SERVICES:readonly DemoService[]=[
 {vehicleId:'gol',date:'2026-10-12',km:183990,name:'Troca de óleo e filtro',value:279,status:'realizado'},
 {vehicleId:'gol',date:'2026-09-08',km:183025,name:'Pastilhas de freio dianteiras',value:410,status:'realizado'},
 {vehicleId:'gol',date:'2026-08-11',km:181880,name:'Filtro de ar',value:85,status:'realizado'},
 {vehicleId:'gol',date:'2026-11-10',km:190000,name:'Próxima revisão por KM — conferir manual',value:0,status:'a_conferir'},
 {vehicleId:'honda',date:'2026-10-01',km:12200,name:'Troca de óleo e filtro',value:395,status:'realizado'},
 {vehicleId:'honda',date:'2026-09-10',km:12020,name:'Lubrificação e ajuste de corrente',value:90,status:'realizado'},
 {vehicleId:'honda',date:'2026-11-16',km:18000,name:'Filtro de ar — previsto no manual',value:0,status:'a_conferir'},
];
export const DEMO_STOCK:Readonly<Record<'parts_cars'|'parts_bikes',readonly DemoStock[]>>={
 parts_cars:[
  {id:'p1',sku:'CAR-001',name:'Filtro de óleo',application:'Gol G5/G6 1.6 — conferir referência',quantity:28,price:38.9,category:'Filtros'},
  {id:'p2',sku:'CAR-002',name:'Pastilhas de freio dianteiras',application:'Gol G6 — conferir versão',quantity:12,price:159.9,category:'Freios'},
  {id:'p3',sku:'CAR-003',name:'Jogo de velas',application:'Motor VW EA111 — aplicação por código',quantity:9,price:128,category:'Ignição'},
  {id:'p4',sku:'CAR-004',name:'Filtro de ar do motor',application:'VW Gol 1.6',quantity:18,price:54.9,category:'Filtros'},
  {id:'p5',sku:'CAR-005',name:'Kit de correia dentada',application:'Motor 1.6 — confirmar ano/chassi',quantity:4,price:346,category:'Transmissão'},
  {id:'p6',sku:'CAR-006',name:'Bateria 60 Ah',application:'Automóveis 12 V — conferir dimensões',quantity:7,price:419,category:'Elétrica'},
 ],
 parts_bikes:[
  {id:'m1',sku:'MOT-001',name:'Filtro de óleo CB650R',application:'Honda CB650R — aplicação por ano',quantity:15,price:79.9,category:'Filtros'},
  {id:'m2',sku:'MOT-002',name:'Pastilhas de freio dianteiras',application:'Honda CB650R ABS — confirmar modelo',quantity:7,price:285,category:'Freios'},
  {id:'m3',sku:'MOT-003',name:'Kit relação 525',application:'Honda CB650R — confirmar 15/42 dentes',quantity:5,price:749,category:'Transmissão'},
  {id:'m4',sku:'MOT-004',name:'Filtro de ar',application:'CB650R 2024 — aplicação sob conferência',quantity:9,price:175,category:'Filtros'},
  {id:'m5',sku:'MOT-005',name:'Vela de ignição',application:'Honda CB650R — confirmar código',quantity:26,price:115.5,category:'Ignição'},
  {id:'m6',sku:'MOT-006',name:'Protetor de radiador',application:'Honda CB650R',quantity:3,price:249.9,category:'Acessórios'},
 ]
};
export const DEMO_ORDERS:Readonly<Record<'parts_cars'|'parts_bikes'|'workshop',readonly DemoOrder[]>>={
 parts_cars:[
  {id:'PED-1042',customer:'Cliente fictício A',vehicle:'Gol 2014',service:'Orçamento: pastilhas e filtro',date:'2026-11-01',value:198.8,status:'aberta'},
  {id:'PED-1041',customer:'Cliente fictício B',vehicle:'Onix 2020',service:'Pedido de filtro e velas',date:'2026-10-30',value:182.9,status:'em_andamento'},
  {id:'PED-1040',customer:'Cliente fictício C',vehicle:'Argo 2022',service:'Peças para revisão',date:'2026-10-28',value:436,status:'concluida'},
 ],
 parts_bikes:[
  {id:'PED-2084',customer:'Cliente fictício D',vehicle:'CB650R 2024',service:'Pastilhas e filtro de óleo',date:'2026-11-01',value:364.9,status:'aberta'},
  {id:'PED-2083',customer:'Cliente fictício E',vehicle:'Fazer 250',service:'Consulta de peças',date:'2026-10-30',value:175,status:'em_andamento'},
  {id:'PED-2082',customer:'Cliente fictício F',vehicle:'CB650R 2024',service:'Kit relação',date:'2026-10-24',value:749,status:'concluida'},
 ],
 workshop:[
  {id:'OS-302',customer:'Cliente fictício A',vehicle:'VW Gol G6 2014',service:'Revisão preventiva e troca de filtros',date:'2026-11-01',value:485,status:'aberta'},
  {id:'OS-301',customer:'Cliente fictício D',vehicle:'Honda CB650R 2024',service:'Revisão dos freios e corrente',date:'2026-10-31',value:620,status:'em_andamento'},
  {id:'OS-300',customer:'Cliente fictício G',vehicle:'Hyundai HB20',service:'Troca de pastilhas e inspeção',date:'2026-10-27',value:740,status:'concluida'},
  {id:'OS-299',customer:'Cliente fictício H',vehicle:'Fiat Uno',service:'Troca de óleo e filtro',date:'2026-10-22',value:290,status:'concluida'},
 ]
};
export const formatDemoBRL=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export const demoFuelTotal=(rows:readonly DemoFuel[])=>rows.reduce((total,r)=>total+r.liters*r.priceLiter,0);
export const demoStockValue=(rows:readonly DemoStock[])=>rows.reduce((total,r)=>total+r.quantity*r.price,0);
export const demoOpenOrders=(rows:readonly DemoOrder[])=>rows.filter(row=>row.status!=='concluida').length;
