import type {VideoVehicle} from './video-guides';
import {CB650R_MANUAL} from './cb650r-reference';
import {GOL_MANUAL_URL,maintenancePlan} from './manual-maintenance';

/** Transcrição estruturada de instruções de manutenção, não diagnóstico.
 * Honda: manual oficial CB650R 2024, tabela pp. 56-58 e notas p. 58.
 * VW: a lista oficial de manuais não contém Gol 2014 (na consulta de 02/11/2026);
 * o prazo 10.000 km/6 meses vem da política de garantia de veículos adquiridos
 * antes de 01/10/2016. Evitar afirmar substituições por revisão sem livrete
 * específico correspondente ao chassi.
 */
export type ServiceAction='trocar'|'verificar'|'ajustar'|'condicional';
export type EvidenceLevel='manual-exato'|'orientacao-vw'|'condicao';
export type ManualServiceItem={
 id:string;title:string;action:ServiceAction;why:string;
 interval:string;page:string;evidence:EvidenceLevel;
};
export type ManualGuide={
 manufacturer:string;model:string;revisionKm:number;source:string;
 sourceTitle:string;level:'especifico'|'parcial';notice:string;
 items:ManualServiceItem[];timeItems:ManualServiceItem[];
};
const HONDA_URL=CB650R_MANUAL;
const VW_REVISIONS_URL='https://www.vw.com.br/pt/servicos-e-acessorios/servicos-e-produtos/manuais-e-garantia/garantia-de-3-anos.html';
const put=(id:string,title:string,action:ServiceAction,interval:string,page:string,why:string,
 evidence:EvidenceLevel='manual-exato'):ManualServiceItem=>({id,title,action,interval,page,why,evidence});
const hondaTime:ManualServiceItem[]=[
 put('oil-time','Óleo do motor: prazo máximo de 1 ano','trocar','12 meses, se ocorrer antes do marco quilométrico','Manual p. 58','Mesmo rodando pouco, a Honda orienta a troca anual.'),
 put('brake-time','Fluido de freio: substituição por tempo','trocar','A cada 2 anos','Manual p. 57','A vida útil do fluido depende também do tempo; substituição requer habilidade mecânica.'),
 put('coolant-time','Líquido de arrefecimento: substituição por tempo','trocar','A cada 3 anos','Manual p. 57','A verificação de nível não substitui a troca periódica por tempo.'),
];
function hondaGuide(km:number):ManualGuide{
 const first=km===1000;
 const multiple=(n:number)=>km>=n&&km%n===0;
 const tasks:ManualServiceItem[]=[];
 const add=(...items:ManualServiceItem[])=>tasks.push(...items);
 if(first||multiple(12000)){
  add(put('oil','Óleo do motor','trocar',first?'1.000 km (primeira troca)':'A cada 12.000 km ou 12 meses','Manual p. 56','Lubrificante conforme especificação do manual Honda 2024.'),
   put('oilfilter','Filtro de óleo','trocar',first?'1.000 km (primeira revisão)':'Conforme as marcações da tabela de manutenção','Manual p. 56','Substituir o filtro conforme as revisões indicadas; peça compatível com a CB650R.'));
 }
 if(multiple(6000)){
  add(
   put('brakefluid','Nível do fluido de freio','verificar','A cada 6.000 km','Manual p. 57','Checar o nível e sinais de perda; não confundir inspeção com troca do fluido.'),
   put('brakepads','Pastilhas de freio dianteiras e traseiras','verificar','A cada 6.000 km','Manual p. 57','Trocar somente se o desgaste atingir o limite ou houver condição anormal.'),
   put('clutch','Sistema de embreagem','verificar','A cada 6.000 km','Manual p. 57','Conferir operação e folga da alavanca.'),
  );
 }
 if(multiple(12000)){
  add(
   put('fuel-line','Linha de combustível','verificar','A cada 12.000 km','Manual p. 56','Procurar desgaste e vazamentos.'),
   put('throttle','Funcionamento do acelerador','ajustar','A cada 12.000 km','Manual p. 56','Verificar curso, retorno e ajuste quando necessário.'),
   put('idle','Marcha lenta','verificar','A cada 12.000 km','Manual p. 57','Conferir funcionamento do motor em marcha lenta.'),
   put('coolant','Nível e sistema de arrefecimento','verificar','A cada 12.000 km','Manual p. 57','Verificar nível, mangueiras e sistema; substituição do líquido é por tempo.'),
   put('chain-slider','Deslizador da corrente','verificar','A cada 12.000 km','Manual p. 57','Avaliar desgaste da guia da corrente de transmissão.'),
   put('brakes','Sistema de freio e luz de freio','verificar','A cada 12.000 km','Manual p. 57','Inspecionar funcionamento e interruptor da luz; ajustar se necessário.'),
   put('headlamp','Facho do farol','ajustar','A cada 12.000 km','Manual p. 57','Verificar alinhamento e corrigir se necessário.'),
   put('suspension','Suspensão, coluna de direção e fixações','verificar','A cada 12.000 km','Manual pp. 57–58','Verificar folgas, aperto e estado de componentes.'),
   put('tires','Rodas e pneus','verificar','A cada 12.000 km','Manual p. 58','Inspecionar condição e desgaste; troca não tem quilometragem fixa.'),
   put('side-stand','Cavalete lateral','verificar','A cada 12.000 km','Manual p. 57','Inspecionar acionamento e funcionamento do corte de ignição.'),
  );
 }
 if(multiple(18000)){
  add(put('airfilter','Filtro de ar','trocar','A cada 18.000 km','Manual p. 56','Filtro úmido viscoso: substituir, nunca limpar com ar comprimido. Antecipar sob poeira/umidade.'));
 }
 if(multiple(24000)){
  add(put('sparkcheck','Velas de ignição','verificar','A cada 24.000 km','Manual p. 56','Inspecionar. A substituição é determinada pelo intervalo de 48.000 km.'),
      put('emissions','Sistemas de emissões e ar secundário','verificar','A cada 24.000 km','Manual p. 57','Avaliação técnica dos sistemas de emissões da motocicleta.'));
 }
 if(multiple(36000))add(put('valves','Folga das válvulas','verificar','A cada 36.000 km','Manual p. 56','Ajustar somente se necessário e por profissional capacitado.'));
 if(multiple(48000))add(put('sparkreplace','Velas de ignição','trocar','A cada 48.000 km','Manual p. 56','Troca programada das velas compatíveis com o modelo.'));
 // Rotina independente de revisão; especialmente importante para motocicleta usada.
 add(put('chain','Corrente de transmissão','ajustar','A cada 1.000 km, independentemente da revisão','Manual p. 57','Verificar folga, ajustar e lubrificar a corrente. Limite de folga 25–35 mm.'),
     put('daily','Inspeção antes de pilotar','verificar','Antes de cada uso','Manual pp. 59–60','Óleo, pneus, freios, iluminação e sinais de vazamento. Não indica troca obrigatória de peças.'));
 return {
  manufacturer:'Honda',model:'CB650R 2024',revisionKm:km,source:HONDA_URL,
  sourceTitle:'Manual Honda CB650R 2024 — tabela pp. 56–58',level:'especifico',
  notice:'Lista extraída do manual da CB650R 2024. Verificar não significa trocar. A tabela manda repetir os intervalos para leituras maiores do hodômetro; uso severo pode exigir manutenções antecipadas.',
  items:tasks,timeItems:hondaTime,
 };
}
const golItems:ManualServiceItem[]=[
 put('vw-oil','Óleo do motor e filtro: confirmar a revisão','verificar','Revisão a cada 10.000 km / 6 meses (modelo de 2014)','Política VW para veículos anteriores a 10/2016','O serviço de óleo e filtro integra revisões VW, mas os itens exatos de cada marco do Gol Seleção 2014 dependem do livrete do veículo.','orientacao-vw'),
 put('vw-brakes','Freios, fluido e componentes de segurança','verificar','Conforme inspeção e livrete da versão','Política de revisão VW','Conferir desgaste de freios, nível do fluido e anormalidades. Troca de componentes não é automática por quilometragem.','orientacao-vw'),
 put('vw-tires','Pneus e estado das rodas','verificar','Inspeção preventiva e condição de uso','Orientação geral de segurança','Inspecionar desgaste, danos, calibragem e alinhamento. Não há troca programada por quilometragem neste guia.','condicao'),
 put('vw-filters','Filtros de ar, combustível e cabine','verificar','Confirmar intervalos pelo livrete e versão','Literatura de bordo VW','Os filtros têm periodicidades específicas, que não foram confirmadas para este chassi; avaliar e confirmar antes da substituição.','orientacao-vw'),
 put('vw-belts','Correias, tensionadores e acessórios','verificar','Confirmar plano pela motorização e ano','Literatura de bordo VW','A correia dentada é crítica: prazo exato não deve ser copiado de outros motores Gol.','orientacao-vw'),
 put('vw-fluid','Fluidos e vazamentos','verificar','Na revisão e quando houver anormalidade','Orientação geral VW','Conferir arrefecimento, freios, direção e sinais de vazamentos.','orientacao-vw'),
 put('vw-injection','Ignição e injeção eletrônica','condicional','Mediante diagnóstico / sintomas','Verificações condicionais','Velas, bobinas e bicos não são trocas automáticas em toda revisão; investigar falhas e seguir o livrete.','condicao'),
];
function vwGuide(km:number):ManualGuide{
 return {
  manufacturer:'Volkswagen',model:'Gol G6 Seleção 1.6 2014',revisionKm:km,
  source:VW_REVISIONS_URL,sourceTitle:'Volkswagen — política de manutenção/garantia',
  level:'parcial',items:golItems,timeItems:[],
  notice:'A VW confirma revisões a cada 10.000 km ou 6 meses para veículos adquiridos antes de 01/10/2016. A lista detalhada por marco/chassi do Gol Seleção 1.6 2014 NÃO foi localizada em manual oficial público. Esta é uma lista de conferência orientativa, NÃO um pacote de trocas prescrito para cada revisão. Consulte o livrete original e a concessionária.',
 };
}
export function servicesForRevision(vehicle:VideoVehicle,km:number):ManualGuide|null{
 const plan=maintenancePlan(vehicle);
 if(!plan||!Number.isSafeInteger(km)||km<=0)return null;
 if(plan.maker==='Honda')return hondaGuide(km);
 if(plan.maker==='Volkswagen')return vwGuide(km);
 return null;
}
/** Separação explícita da fonte e natureza da orientação. */
export const SERVICE_MANUAL_SOURCES={honda:HONDA_URL,vw:VW_REVISIONS_URL,vwManuals:GOL_MANUAL_URL} as const;
