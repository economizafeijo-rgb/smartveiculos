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
 {id:'V8sa_qC-tjI',title:'Troca da correia dentada: Gol G5/G6 1.0 e 1.6',
  channel:'minuto automotivo',category:'transmissao',topic:'Correia dentada',
  description:'Apresenta substituição da correia e ferramentas de sincronismo em motores da família.',
  compatibility:'Gol G5/G6 1.0 e 1.6; procedimento exato depende do motor.',risk:'profissional'},
 {id:'P83-qZDD5GA',title:'Troca da correia de acessórios no Gol G6',
  channel:'O que Der na Telha',category:'transmissao',topic:'Ruídos e correia auxiliar',
  description:'Mostra a substituição da correia de acessórios em um Gol G6.',
  compatibility:'Gol G6; confira polias e configuração de acessórios.',risk:'profissional'},
 {id:'zJwf5Or2gmA',title:'Troca de óleo e filtros no Gol G6',
  channel:'Consultor Cleiton - Batista Caminhões',category:'preventiva',topic:'Óleo do motor',
  description:'Registro em oficina de troca de óleo, filtro de óleo e filtro de ar.',
  compatibility:'Gol G6; confira viscosidade e especificações do seu motor.',risk:'rotina'},
 {id:'XgVgl2JNemY',title:'Gol G6 1.6: vazamento, direção e suspensão',
  channel:'Mecânica Mgr',category:'motor',topic:'Vazamentos e direção hidráulica',
  description:'Oficina mostra verificações ligadas a vazamento de óleo, direção hidráulica e batente traseiro.',
  compatibility:'Gol G6 1.6; confirme a peça e a causa com diagnóstico.',risk:'profissional'},
 {id:'yYeUQt6OwZ0',title:'Troca dos sensores ABS do Gol G6',
  channel:'O que Der na Telha',category:'eletrica',topic:'Luz ABS e sensores',
  description:'Substituição dos sensores ABS em Gol G6 1.6 de 2013; use como referência visual.',
  compatibility:'Gol G6 1.6 2013; sensores e diagnóstico podem diferir em 2014.',risk:'profissional'},
];
export const CB650R_VIDEO_GUIDES:VideoGuide[]=[
 {id:'YVn_aOsHE2U',title:'Troca de óleo e filtro da Honda CB650R',
  channel:'Brothers Moto Adventure',category:'preventiva',topic:'Óleo e filtro de óleo',
  description:'Demonstra uma troca de óleo e filtro da CB650R.',
  compatibility:'CB650R; confira edição do manual e lubrificante recomendado para 2024.',risk:'rotina'},
 {id:'k6tWyridSRY',title:'Lavagem e lubrificação da corrente da CB650R',
  channel:'KF650-R',category:'transmissao',topic:'Corrente e relação',
  description:'Rotina prática de limpeza e lubrificação da corrente de transmissão.',
  compatibility:'Honda CB650R; folga e ajuste devem seguir manual do ano.',risk:'rotina'},
 {id:'NrhbfHkqFsA',title:'Filtro de ar compatível com CB650R e CBR650R',
  channel:'REMOTOX TV',category:'preventiva',topic:'Filtro de ar',
  description:'Avalia um filtro de ar como alternativa para a família 650; não é tutorial de instalação.',
  compatibility:'Família CB650R / CBR650R; confirmar peça pelo ano e chassi.',risk:'rotina'},
 {id:'VbuTF8y6vbY',title:'CB650R: o que foi feito na revisão de 1.000 km',
  channel:'KF650-R',category:'revisoes',topic:'Revisão inicial',
  description:'Relato de serviços executados na primeira revisão, incluindo óleo, filtro e corrente.',
  compatibility:'CB650R; relato de proprietário, não substitui o plano oficial de revisão.',risk:'rotina'},
 {id:'RgcnkQWKfk4',title:'CB650R: revisão de 6.000 km e custos',
  channel:'KF650-R',category:'revisoes',topic:'Revisão periódica',
  description:'Relato de revisão de 6.000 km, itens verificados e custos informados pelo autor.',
  compatibility:'CB650R; valores e procedimentos variam por ano e concessionária.',risk:'rotina'},
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
