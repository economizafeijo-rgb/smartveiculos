/** Catálogo inicial ilustrativo; apenas o Gol Seleção tem ficha técnica validada. */
export const VEHICLE_CATALOG = [
 {kind:'carro',brand:'Volkswagen',models:['Gol G6 Seleção 1.6 (2014)','Gol','Voyage','Fox','Polo']},
 {kind:'carro',brand:'Fiat',models:['Uno','Palio','Argo','Mobi','Strada']},
 {kind:'carro',brand:'Chevrolet',models:['Onix','Prisma','Corsa','Celta','Tracker']},
 {kind:'carro',brand:'Hyundai',models:['HB20','Creta']},
 {kind:'carro',brand:'Toyota',models:['Corolla','Etios','Yaris','Hilux']},
 {kind:'carro',brand:'Honda',models:['Civic','Fit','City','HR-V']},
 {kind:'carro',brand:'Renault',models:['Sandero','Logan','Kwid','Duster']},
 {kind:'carro',brand:'Ford',models:['Ka','Fiesta','EcoSport']},
 {kind:'moto',brand:'Honda',models:['CG 160','Biz 125','Pop 110i','NXR Bros 160','XRE 300']},
 {kind:'moto',brand:'Yamaha',models:['Factor 150','Fazer 150','FZ25','Lander 250','NMax 160']},
 {kind:'moto',brand:'Bajaj',models:['Dominar 160','Dominar 200','Dominar 400']},
 {kind:'moto',brand:'Suzuki',models:['Yes 125','Intruder 125','GSX-S']},
] as const;
export const GOL={
 name:'Gol G6 Seleção 1.6 • 2014',
 motor:'EA111 VHT · 1.598 cm³ · 8 válvulas',
 transmission:'Manual de 5 marchas (versão de referência)',
 power:'104 cv etanol / 101 cv gasolina',
 fuelCapacity:55,
 inmetro:{gasolina:{city:10.7,road:13.7},etanol:{city:7.3,road:9.4}},
 photo:'https://blog.olhonocarro.com.br/wp-content/uploads/2024/03/volkswagen-gol-2014-frente.jpg',
 photoCredit:'Olho no Carro — Gol 2014 prata, foto ilustrativa (não é o veículo cadastrado nem versão confirmada Seleção)',
 photoSource:'https://www.olhonocarro.com.br/blog/volkswagen-gol-2014-avaliacao-completa/',
} as const;
export const GOL_PROBLEMS=[
 {id:'ignicao',system:'Ignição',name:'Bobina, velas e cabos',symptoms:'Motor falhando, perda de força, engasgos e luz de injeção.',checks:'Ler códigos OBD, verificar bobina, velas, cabos e conectores. Confirmar causa antes da troca.',solution:'Reparar mau contato e substituir somente componentes diagnosticados como defeituosos.',image:'https://images.tcdn.com.br/img/img_prod/1060960/bobina_ignicao_fox_gol_voyage_saveiro_1_6_8v_casteliho_865_1_c19caaaabf03bd2650feaeda5bab13b0.jpeg',imageAlt:'Bobina de ignição compatível com Gol G6 EA111 1.6, imagem de peça ilustrativa',source:'https://www.v8autopecasusadas.com.br/eletrica/bobina-ignicao/bobina-ignicao-fox-gol-voyage-saveiro-1-6-8v-casteliho',severity:'Inspecionar'},
 {id:'correia',system:'Motor e distribuição',name:'Correia dentada e tensor',symptoms:'Histórico de troca desconhecido, correia envelhecida, ruído ou desgaste visível.',checks:'Conferir comprovante, ano, quilometragem e plano correto pelo chassi; inspeção feita por profissional.',solution:'Realizar substituição do kit conforme especificação VW e procedimento de sincronismo; falha pode causar dano grave.',image:'https://http2.mlstatic.com/D_NQ_NP_720961-MLB75964005590_052024-O.webp',imageAlt:'Kit de correia dentada e tensionador, imagem ilustrativa de peças EA111',source:'https://www.vw.com.br/pt/servicos-e-acessorios/servicos-e-produtos/manuais-e-garantia.html',severity:'Preventivo'},
 {id:'arrefecimento',system:'Arrefecimento',name:'Perda de líquido e superaquecimento',symptoms:'Nível de reservatório caindo, ventoinha com funcionamento irregular ou aquecimento acima do normal.',checks:'Checar vazamentos a frio, mangueiras, tampa, válvula termostática, sensor, radiador e bomba-d’água.',solution:'Identificar e corrigir a origem do vazamento; utilizar fluido homologado. Nunca abrir reservatório quente.',image:'',imageAlt:'Cofre do motor de Gol 1.6 2014; foto ilustrativa, não do veículo cadastrado',source:'https://www.vw.com.br/pt/servicos-e-acessorios/servicos-e-produtos/manuais-e-garantia.html',severity:'Atenção'},
 {id:'eletrica',system:'Elétrica e sensores',name:'Bateria, aterramento e sensores',symptoms:'Dificuldade de partida, luzes oscilando, pane intermitente ou leitura errática de temperatura.',checks:'Medir tensão, carga do alternador, queda de tensão, fusíveis, aterramentos e leitura dos sensores no scanner.',solution:'Corrigir conexões e chicotes; substituir apenas o componente reprovado em teste.',image:'',imageAlt:'',source:'https://carabbit.com.br/usados/vw-gol/2014',severity:'Inspecionar'},
 {id:'freios',system:'Freios e suspensão',name:'Ruídos, vibração e desgaste',symptoms:'Barulhos em piso irregular, frenagem irregular ou volante vibrando.',checks:'Examinar buchas, amortecedores, pneus, discos, pastilhas, fluido de freio e sensores ABS.',solution:'Reparar conforme inspeção técnica; em perda de eficiência de freios, não utilizar o veículo.',image:'',imageAlt:'',source:'https://www.vw.com.br/pt/servicos-e-acessorios/servicos-e-produtos/manuais-e-garantia.html',severity:'Segurança'},
] as const;
export const MAINTENANCE_PRESETS=[
 'Troca de óleo do motor','Filtro de óleo','Filtro de ar do motor','Filtro de combustível',
 'Filtro de cabine','Correia dentada e tensor','Bomba-d’água','Velas de ignição',
 'Cabos e bobina','Fluido de freio','Fluido de arrefecimento','Discos e pastilhas',
 'Pneus e alinhamento','Bateria e alternador','Embreagem','Revisão geral'
] as const;
export const IMPORTANT_LINKS=[
 {label:'Manual e revisões Volkswagen',url:'https://www.vw.com.br/pt/servicos-e-acessorios/servicos-e-produtos/manuais-e-garantia.html',official:true},
 {label:'Consulta de recall Volkswagen',url:'https://www.vw.com.br/pt/servicos-e-acessorios/aviso-recall.html',official:true},
 {label:'Consulta de recall Senatran',url:'https://www.gov.br/pt-br/servicos/realizar-consulta-sobre-recall-de-veiculos',official:true},
 {label:'Peças originais e lubrificantes VW',url:'https://www.vw.com.br/pt/servicos-e-acessorios/servicos-e-produtos/pecas.html',official:true},
 {label:'Consumo Inmetro/PBEV 2014',url:'https://estaticog1.globo.com/2014/01/20/veiculos_leves_2014.pdf',official:true},
 {label:'Ficha técnica do Gol Seleção',url:'https://www.shopcar.com.br/fichatecnica.php?id=2540',official:false},
] as const;
