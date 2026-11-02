/** Biblioteca de tutoriais de terceiros: os vídeos são fontes independentes.
 * Nunca interpretá-los como diagnóstico de defeito já ocorrido no veículo.
 * IDs de vídeo conferidos via busca pública em novembro/2026.
 */
export type VideoCategory='preventiva'|'motor'|'transmissao'|'eletrica'|'revisoes';
export type VideoGuide={
 id:string;title:string;channel:string;category:VideoCategory;
 description:string;topic:string;compatibility:string;
 risk:'rotina'|'profissional';
};
export type VideoVehicle={kind:'carro'|'moto';name:string;modelYear?:number|null;modelKey?:string};
export const VIDEO_CATEGORIES:{id:'todos'|VideoCategory;label:string}[]=[
 {id:'todos',label:'Todos'},{id:'preventiva',label:'Óleo e filtros'},
 {id:'motor',label:'Motor e falhas'},{id:'transmissao',label:'Correias e transmissão'},
 {id:'eletrica',label:'Elétrica e freios'},{id:'revisoes',label:'Revisões'},
];
export const GOL_VIDEO_GUIDES:VideoGuide[]=[
 {id:'4HsPtG1-i84',title:'Limpeza do TBI do Gol G6',channel:'Fernando Queiroz',
  category:'motor',topic:'Oscilação de marcha lenta',description:'Demonstra limpeza preventiva do corpo de borboleta do Gol G6.',
  compatibility:'Gol G6; confirme a motorização e o sistema antes de aplicar.',risk:'profissional'},
 {id:'ghw1Ejon58A',title:'Gol G6: correia dentada e velas',channel:'Hot Rod Channel',
  category:'transmissao',topic:'Correia dentada e ignição',description:'Mostra serviço de correia dentada e velas em um Gol G6.',
  compatibility:'Gol G6; o sincronismo e as peças devem ser conferidos conforme motor.',risk:'profissional'},
 {id:'P83-qZDD5GA',title:'Troca da correia de acessórios do Gol G6',channel:'O que Der na Telha',
  category:'transmissao',topic:'Correia auxiliar e ruídos',description:'Registro em oficina da troca da correia de acessórios de um Gol G6.',
  compatibility:'Gol G6; compare polias, tensionador e configuração de acessórios.',risk:'profissional'},
 {id:'yYeUQt6OwZ0',title:'Troca dos sensores ABS do Gol G6',channel:'O que Der na Telha',
  category:'eletrica',topic:'Luz de ABS e sensores',description:'Mostra troca dos quatro sensores ABS de um Gol G6 1.6 ano 2013.',
  compatibility:'Gol G6 1.6 2013; referência visual, não confirmação de aplicação no 2014.',risk:'profissional'},
];
export const CB650R_VIDEO_GUIDES:VideoGuide[]=[
 {id:'YVn_aOsHE2U',title:'Troca de óleo e filtro da Honda CB650R',
  channel:'Brothers Moto Adventure',category:'preventiva',topic:'Óleo e filtro do motor',
  description:'Demonstra uma troca de óleo e filtro da CB650R.',
  compatibility:'CB650R; confira edição do manual e lubrificante para ano 2024.',risk:'rotina'},
 {id:'k6tWyridSRY',title:'Limpeza e lubrificação da corrente da CB650R',
  channel:'KF650-R',category:'transmissao',topic:'Corrente e relação',
  description:'Mostra lavagem e lubrificação da corrente de transmissão.',
  compatibility:'Honda CB650R; folga e ajuste devem seguir manual do ano.',risk:'rotina'},
 {id:'y7iaQURs09A',title:'Como trocar o filtro de ar da CB650R',
  channel:'Leo650f Foco e fé',category:'preventiva',topic:'Filtro de ar',
  description:'Mostra manutenção e troca de filtro de ar da família Honda 650.',
  compatibility:'Família CB650F/CB650R; confirme acesso, peça e versão pelo chassi.',risk:'rotina'},
 {id:'jQP0CCqRL60',title:'Revisão dos 1.000 km da CB650R 2024',
  channel:'PASSO DOBLE - Diário de um Casal',category:'revisoes',topic:'1ª revisão Honda',
  description:'Relato real de primeira revisão e itens avaliados em Honda CB650R 2024.',
  compatibility:'CB650R 2024; relato de proprietário, não substitui o plano oficial.',risk:'rotina'},
];
const clean=(text:string)=>text.toLocaleLowerCase('pt-BR').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
export function videoProfile(vehicle:VideoVehicle):'gol'|'cb650r'|'generic'{
 const name=clean(vehicle.name),key=clean(vehicle.modelKey??'');
 if(vehicle.kind==='carro'&&(
   key.includes('gol-g6-selecao-2014')||
   (/\bgol\b/.test(name)&&(/\bg6\b/.test(name)||/\bselecao\b/.test(name)))))return 'gol';
 if(vehicle.kind==='moto'&&(
   key.includes('cb650r-2024')||/\bcb\s*650\s*r\b/.test(name)))return 'cb650r';
 return 'generic';
}
export function guidesForVehicle(vehicle:VideoVehicle):VideoGuide[]{
 const profile=videoProfile(vehicle);
 return profile==='gol'?GOL_VIDEO_GUIDES:profile==='cb650r'?CB650R_VIDEO_GUIDES:[];
}
export function youtubeWatchUrl(id:string):string{
 if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw new Error('ID do vídeo inválido');
 return 'https://www.youtube.com/watch?v='+id;
}
export function youtubeSearchUrl(vehicle:VideoVehicle,subject:string):string{
 // Pesquisa público-sem-API, sempre com o veículo informado (sem placa, conta, ou km).
 const label=vehicle.name.slice(0,100).replace(/\s+/g,' ').trim();
 const year=vehicle.modelYear&&String(vehicle.modelYear)&&!label.includes(String(vehicle.modelYear))
   ?' '+vehicle.modelYear:'';
 const query=(label+year+' '+subject+' passo a passo').trim();
 return 'https://www.youtube.com/results?search_query='+encodeURIComponent(query);
}
export const VIDEO_RESEARCH_TOPICS:{
 category:VideoCategory;label:string;car:string;bike:string;
}[]=[
 {category:'preventiva',label:'Troca de óleo e filtros',car:'troca de oleo e filtros motor',bike:'troca oleo filtro moto'},
 {category:'motor',label:'Falhas e diagnóstico',car:'motor falhando marcha lenta diagnostico',bike:'falha partida motor injeção diagnóstico'},
 {category:'transmissao',label:'Transmissão e ajustes',car:'correia dentada correia de acessorios',bike:'limpeza regulagem corrente transmissao'},
 {category:'eletrica',label:'Elétrica e freios',car:'luz painel abs sensor diagnostico freios',bike:'bateria sensores freio diagnóstico'},
 {category:'revisoes',label:'Revisão preventiva',car:'revisão preventiva',bike:'revisão preventiva'}
];
