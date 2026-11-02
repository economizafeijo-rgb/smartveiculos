import type {RecordKind,ServiceRecord,VehicleKind} from './types';

export type ServiceGroup='Motor e fluidos'|'Filtros e ignição'|'Freios e pneus'|'Transmissão'|'Elétrica e suspensão'|'Outros';
export type ServiceItem={id:string;label:string;group:ServiceGroup;kind:RecordKind;advice?:string};
const item=(id:string,label:string,group:ServiceGroup,kind:RecordKind,advice?:string):ServiceItem=>({
 id,label,group,kind,...(advice?{advice}:{})
});
const shared:ServiceItem[]=[
 item('oil','Óleo do motor','Motor e fluidos','oleo'),
 item('oil-filter','Filtro de óleo','Filtros e ignição','peca'),
 item('air-filter','Filtro de ar','Filtros e ignição','peca'),
 item('spark','Velas de ignição','Filtros e ignição','peca'),
 item('brake-pads','Pastilhas de freio','Freios e pneus','peca','Trocar conforme inspeção e limite de desgaste.'),
 item('brake-discs','Discos de freio','Freios e pneus','peca'),
 item('brake-fluid','Fluido de freio','Freios e pneus','manutencao'),
 item('tires','Pneus','Freios e pneus','peca','O desgaste e a condição determinam a troca.'),
 item('battery','Bateria','Elétrica e suspensão','peca'),
 item('suspension','Amortecedores / suspensão','Elétrica e suspensão','manutencao'),
 item('coolant','Líquido de arrefecimento','Motor e fluidos','manutencao'),
 item('electrical','Sensores e sistema elétrico','Elétrica e suspensão','manutencao'),
 item('clutch','Embreagem','Transmissão','manutencao'),
 item('general','Serviço personalizado','Outros','manutencao'),
];
const car:ServiceItem[]=[
 item('cabin-filter','Filtro de cabine / ar-condicionado','Filtros e ignição','peca'),
 item('fuel-filter','Filtro de combustível','Filtros e ignição','peca'),
 item('injectors','Bicos injetores (limpeza / substituição)','Filtros e ignição','manutencao','Somente após diagnóstico adequado.'),
 item('ignition-coil','Bobina e cabos de ignição','Filtros e ignição','peca'),
 item('timing-belt','Correia dentada e tensor','Transmissão','peca','Consultar o procedimento e os prazos exatos do manual VW.'),
 item('aux-belt','Correia de acessórios','Transmissão','peca'),
 item('trans-fluid','Óleo do câmbio / transmissão','Transmissão','manutencao'),
 item('wheel-alignment','Alinhamento / balanceamento','Freios e pneus','manutencao'),
 item('fuel-pump','Bomba de combustível','Motor e fluidos','peca'),
 item('thermostat','Válvula termostática / radiador','Motor e fluidos','manutencao'),
 item('wipers','Palhetas e limpadores','Outros','peca'),
 item('steering','Direção hidráulica / elétrica','Elétrica e suspensão','manutencao'),
];
const bike:ServiceItem[]=[
 item('front-pads','Pastilhas dianteiras','Freios e pneus','peca'),
 item('rear-pads','Pastilhas traseiras','Freios e pneus','peca'),
 item('front-tire','Pneu dianteiro','Freios e pneus','peca'),
 item('rear-tire','Pneu traseiro','Freios e pneus','peca'),
 item('chain-care','Limpeza / lubrificação da corrente','Transmissão','manutencao','Verificar folga e lubrificar conforme manual.'),
 item('chain-adjust','Ajuste da tensão da corrente','Transmissão','manutencao','A folga correta depende do modelo.'),
 item('chain-kit','Kit relação (corrente / coroa / pinhão)','Transmissão','peca','A troca depende de desgaste e inspeção.'),
 item('fork-oil','Óleo da suspensão dianteira','Elétrica e suspensão','manutencao'),
 item('valves','Verificação da folga das válvulas','Motor e fluidos','manutencao'),
 item('throttle','Acelerador / cabos / manetes','Elétrica e suspensão','manutencao'),
 item('chain-slider','Guia / proteção da corrente','Transmissão','peca'),
];
const groups:ServiceGroup[]=['Motor e fluidos','Filtros e ignição','Freios e pneus','Transmissão','Elétrica e suspensão','Outros'];
export const MAINTENANCE_GROUPS=groups;
export function maintenanceItems(kind:VehicleKind):ServiceItem[]{
 const source=kind==='carro'?[...shared,...car]:[...shared.filter(x=>x.id!=='brake-pads'&&x.id!=='tires'),...bike];
 return groups.flatMap(group=>source.filter(x=>x.group===group));
}
export function itemForVehicle(kind:VehicleKind,id:string):ServiceItem|undefined{
 return maintenanceItems(kind).find(x=>x.id===id);
}
export function buildMaintenanceDescription(input:{
 item:ServiceItem;partBrand:string;partCode:string;quantity:string;
 workshop:string;invoice:string;notes:string;
}):string{
 // Texto legível e compatível com registros e backup Supabase já existentes.
 const parts=[
  'Serviço: '+input.item.label,
  input.partBrand.trim()?'Marca: '+input.partBrand.trim():'',
  input.partCode.trim()?'Peça: '+input.partCode.trim():'',
  input.quantity.trim()?'Qtde: '+input.quantity.trim():'',
  input.workshop.trim()?'Oficina: '+input.workshop.trim():'',
  input.invoice.trim()?'OS/NF: '+input.invoice.trim():'',
  input.notes.trim()?'Obs: '+input.notes.trim():'',
 ].filter(Boolean);
 return parts.join(' | ');
}
export function maintenanceItemInDescription(description:string):string|null{
 const name=description.match(/^Serviço:\s*([^|]+)/)?.[1]?.trim();
 return name||null;
}
export function maintenanceTotals(records:readonly ServiceRecord[]){
 const years=new Map<string,{count:number;total:number}>();
 for(const r of records){
  const year=r.date.slice(0,4);
  const curr=years.get(year)??{count:0,total:0};
  curr.count++;
  curr.total+=r.cost;
  years.set(year,curr);
 }
 return [...years.entries()].sort(([a],[b])=>b.localeCompare(a)).map(([year,data])=>({year,...data,total:Math.round(data.total*100)/100}));
}
