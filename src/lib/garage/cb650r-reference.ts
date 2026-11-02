/** Dados verificados no Manual Honda CB650R 2024 (D2203-MAN-1312). */
export const CB650R_NAME='Honda CB650R 2024';
export const CB650R_MANUAL='https://www.honda.com.br/pos-venda/motos/sites/customer_service_motos/files/manuais/MP%20CB%20650R%20%282024%29%20D2203-MAN-1312_WEB.pdf';
export const CB650R_REFERENCE={
  engine:'649 cm³ · DOHC · 4 cilindros em linha · arrefecimento líquido',
  power:'88,4 cv a 11.500 rpm',torque:'6,13 kgf.m a 8.000 rpm',
  gearbox:'6 marchas',fuel:'Gasolina',tankLiters:15.4,
  engineOil:'SAE 10W-30 API SL ou superior, JASO MA',
  oilWithFilter:2.6,oilWithoutFilter:2.3,
  frontTire:'120/70 ZR17 M/C (58W)',rearTire:'180/55 ZR17 M/C (73W)',
  frontPsi:36,rearPsi:42,frontMinMm:1.5,rearMinMm:2,
  chain:'DID 525V11 / RK 525KRW, 118 elos',sprockets:'15 dentes (pinhão) / 42 (coroa)',
  chainSlack:'25 a 35 mm',chainDoNotRide:50,
  battery:'12 V · YTZ10S',brakeFluid:'DOT 4',
  warranty:'3 anos a partir da entrega, conforme condições Honda',
  photo:'https://cdn.autopapo.com.br/box/uploads/2023/11/14110147/0i8a4940c-1920x1280.jpg',
  photoCredit:'Foto ilustrativa: AutoPapo / divulgação Honda. Não é foto da motocicleta cadastrada.',
  photoLink:'https://autopapo.com.br/motos/honda-cb-650r-cbr-650r-2024/'
} as const;

export type Revision={index:number;km:number;months:number;title:string};
export const CB650R_REVISIONS:Revision[]=[
 {index:1,km:1000,months:6,title:'1ª revisão' },
 ...Array.from({length:25},(_,i)=>{
   const index=i+2;
   return {index,km:(i+1)*6000,months:12+i*6,title:index+'ª revisão'};
 })
];
export type Preventive={id:string;title:string;group:string;kmInterval:number|null;monthInterval:number|null;details:string;type:'revisao'|'manutencao'|'oleo'|'peca';conditionBased?:boolean};
export const CB650R_PREVENTIVE:Preventive[]=[
 {id:'chain-care',title:'Inspeção, ajuste e lubrificação da corrente',group:'Transmissão',kmInterval:1000,monthInterval:null,details:'Honda: a cada 1.000 km, ou antes sob chuva, poeira, acelerações severas; conferir folga 25–35 mm.',type:'manutencao'},
 {id:'engine-oil',title:'Troca de óleo do motor',group:'Motor',kmInterval:12000,monthInterval:12,details:'Primeira troca aos 1.000 km; depois intervalos de 12.000 km ou 12 meses, o que ocorrer primeiro. 10W-30 JASO MA.',type:'oleo'},
 {id:'oil-filter',title:'Filtro de óleo',group:'Motor',kmInterval:12000,monthInterval:null,details:'Trocar na revisão inicial e nos marcos 12.000 / 24.000 / 36.000 km etc. Confirmar tabela do manual.',type:'peca'},
 {id:'air-filter',title:'Filtro de ar',group:'Admissão',kmInterval:18000,monthInterval:null,details:'Substituir a cada 18.000 km; antecipar em poeira/umidade.',type:'peca'},
 {id:'spark',title:'Velas de ignição',group:'Ignição',kmInterval:24000,monthInterval:null,details:'Verificar aos 24.000 km; substituir aos 48.000 km.',type:'manutencao'},
 {id:'valves',title:'Folga das válvulas',group:'Motor',kmInterval:36000,monthInterval:null,details:'Inspecionar a cada 36.000 km em oficina habilitada.',type:'manutencao'},
 {id:'brake-fluid',title:'Troca de fluido de freio',group:'Freios',kmInterval:null,monthInterval:24,details:'A cada 2 anos. Fluido DOT 4 especificado no manual.',type:'manutencao'},
 {id:'coolant',title:'Troca do líquido de arrefecimento',group:'Arrefecimento',kmInterval:null,monthInterval:36,details:'A cada 3 anos; completar somente com especificação compatível.',type:'manutencao'},
 {id:'pads',title:'Pastilhas e discos',group:'Freios',kmInterval:6000,monthInterval:null,details:'Honda: verificar pastilhas a cada 6.000 km; trocar conforme limite de desgaste.',type:'manutencao'},
 {id:'tires',title:'Condição dos pneus e calibragem',group:'Pneus',kmInterval:null,monthInterval:null,details:'Sem km fixo para troca: TWI, danos, desgaste irregular; mín. 1,5 mm frente, 2,0 mm traseira. Pressões a frio: 36/42 psi.',type:'manutencao',conditionBased:true},
 {id:'kit',title:'Kit relação (corrente, coroa e pinhão)',group:'Transmissão',kmInterval:null,monthInterval:null,details:'Sem km fixo para troca; substituir os três juntos quando gastos/danificados. Conferir elos presos, retentores e dentes.',type:'peca',conditionBased:true},
];
export const CB650R_TECH=[
 {title:'Pneus',description:'Dianteiro 120/70 ZR17 (58W) · 36 psi, mín. 1,5 mm. Traseiro 180/55 ZR17 (73W) · 42 psi, mín. 2,0 mm. Substituir no TWI ou com danos.',link:CB650R_MANUAL+'#page=68',tag:'Segurança',image:'https://www.motorrad-bilder.at/slideshows/291/023015/185796_HondaE-ClutchCBR650R-CB650RYM241625.JPG_0.jpg'},
 {title:'Relação e corrente',description:'DID 525V11 / RK 525KRW; 118 elos; 15/42 dentes; folga 25–35 mm. Não pilotar com folga acima de 50 mm.',link:CB650R_MANUAL+'#page=84',tag:'Transmissão',image:'https://www.tech2roo.com/627552-large_default/kit-chaine-ekpbr-honda-cb650r-cbr650f-cbr650r-2014-2025-525-srx2-1542-renforce-couronne-acier-standard.jpg'},
 {title:'Motor e lubrificação',description:'Quatro cilindros, 649 cm³. Óleo 10W-30 API SL ou superior / JASO MA. 2,3 L na drenagem; 2,6 L com filtro.',link:CB650R_MANUAL+'#page=122',tag:'Motor',image:''},
 {title:'Freios e ABS',description:'Inspecionar pastilhas regularmente; fluido DOT 4 a cada 2 anos. Vibração anormal, vazamento ou perda de frenagem exigem inspeção.',link:CB650R_MANUAL+'#page=78',tag:'Segurança',image:''},
 {title:'Bateria, elétrica e iluminação',description:'Bateria 12 V YTZ10S, farol e sinalização LED. Medir carga e conexões ao diagnosticar falhas de partida.',link:CB650R_MANUAL+'#page=121',tag:'Elétrica',image:''},
 {title:'Arrefecimento',description:'Revisar nível a frio, mangueiras e ventoinha. Troca preventiva do líquido a cada 3 anos.',link:CB650R_MANUAL+'#page=76',tag:'Motor',image:''},
];
export const CB650R_LINKS=[
 {title:'Manual oficial Honda CB650R 2024 (PDF)',url:CB650R_MANUAL},
 {title:'Tabela e valores de revisões Honda',url:'https://www.honda.com.br/pos-venda/motos/revisao-periodica'},
 {title:'Apresentação oficial Honda do modelo 2024',url:'https://prodsalaimp.honda.com.br/releases/honda-cb-650r-e-cbr-650r-2024-novas-opcoes-de-cores-e-acabamento-definem-nova-versao-da'},
 {title:'Recall de motocicletas Honda',url:'https://www.honda.com.br/pos-venda/motos/recall'},
];
/** Exibição correta: primeira em 1.000 km/6 meses; a partir da 2ª, 6.000 km e acréscimos de 6 meses. */
export function addMonthsToDate(value:string,months:number):string|null {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const [y,m,d]=value.split('-').map(Number);if(y===undefined||m===undefined||d===undefined||m<1||m>12||d<1||d>31)return null;
 const start=new Date(Date.UTC(y,m-1,d));
 if(start.getUTCFullYear()!==y||start.getUTCMonth()!==m-1||start.getUTCDate()!==d)return null;
 const result=new Date(Date.UTC(y,m-1+months,1));
 const last=new Date(Date.UTC(result.getUTCFullYear(),result.getUTCMonth()+1,0)).getUTCDate();
 result.setUTCDate(Math.min(d,last));return result.toISOString().slice(0,10);
}
export function revisionDue(revision:Revision,currentKm:number,deliveryDate:string|undefined,nowIso:string):{state:'ok'|'soon'|'due';date:string|null;remainingKm:number}{
 const dueDate=deliveryDate?addMonthsToDate(deliveryDate,revision.months):null;
 const remainingKm=revision.km-currentKm;
 const remainingDays=dueDate?Math.ceil((Date.parse(dueDate+'T00:00:00Z')-Date.parse(nowIso+'T00:00:00Z'))/86400000):null;
 const state=remainingKm<=0||(remainingDays!==null&&remainingDays<=0)?'due':remainingKm<=1000||(remainingDays!==null&&remainingDays<=30)?'soon':'ok';
 return {state,date:dueDate,remainingKm};
}
