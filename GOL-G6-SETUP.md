# SmartVeículos — Gol G6 Seleção 1.6 2014 (prata)

## Arquivos e navegação
- `/gol-g6`: painel responsivo para o Gol 2014, com imagem ilustrativa de **Gol prata**.
- `src/components/garage/GolDashboard.tsx`: abas de visão geral, abastecimentos, manutenções, diagnósticos e catálogo.
- `src/lib/garage/gol-reference.ts`: catálogo de marcas/modelos, especificações, fotos ilustrativas de peças, pontos de inspeção e links de origem.
- `src/lib/garage/fuel.ts`: controle local de abastecimentos; `fuel.test.ts`: testes de consumo.
- `supabase/migrations/20261101020000_catalogo_veiculos.sql`: cadastro de modelos com RLS e seed.
- `supabase/migrations/20261101030000_abastecimentos.sql`: estrutura de abastecimentos vinculados a usuário e veículo, com RLS.

## Ativação da ficha pessoal
Ao abrir `/gol-g6`, informe a quilometragem real e, opcionalmente, a placa. Isso cria o Gol Seleção no armazenamento **local** do navegador. Não criamos placa, quilometragem, histórico de manutenção nem dados pessoais fictícios.

## Método de consumo
Registre a quilometragem e os litros cada vez que abastecer. O consumo é calculado **somente** quando houver dois abastecimentos consecutivos de tanque cheio e com o mesmo combustível. Distância entre os dois odômetros / litros do segundo abastecimento. O custo por km leva em conta o preço do segundo abastecimento.

O sistema separa gasolina e etanol e não mistura trechos, mas não tenta estimar consumo quando há trocas de combustível ou abastecimentos parciais. O valor pode diferir do PBEV e da realidade por condições de uso.

## Ficha técnica
Gol G6 Seleção 1.6 Flex 2014, motor EA111 VHT 8 válvulas, 1.598 cm³, 104 cv no etanol/101 cv na gasolina, tanque de 55 L.
Consumos referência **para a versão manual**, da ficha técnica:
- Gasolina: 10,7 cidade / 13,7 estrada km/l
- Etanol: 7,3 cidade / 9,4 estrada km/l

A transmissão real do veículo do proprietário **ainda não foi confirmada** (manual ou I-Motion). Dados de consumo podem diferir entre versões.

## Fotos e uso comercial
A foto de carro usada no painel é de um Gol 2014 **prata ilustrativo**, de fonte externa; não é uma fotografia do veículo do usuário nem se confirma que seja a versão Seleção. As fotos de componentes têm finalidade ilustrativa e podem exigir direitos de uso ou substituição por fotos autorizadas antes da distribuição comercial. Sempre confirme compatibilidade de peças por VIN/chassi.

## Fontes e inspeções
- [Ficha técnica Gol Seleção 1.6 manual](https://www.shopcar.com.br/fichatecnica.php?id=2540)
- [Volkswagen — manuais](https://www.vw.com.br/pt/servicos-e-acessorios/servicos-e-produtos/manuais-e-garantia/manuais.html)
- [Volkswagen — consulta de recall](https://www.vw.com.br/pt/servicos-e-acessorios/aviso-recall.html)
- [Senatran — recall](https://www.gov.br/pt-br/servicos/realizar-consulta-sobre-recall-de-veiculos)
- [Gol Seleção 2014 e cores disponíveis](https://www.uol.com.br/carros/noticias/redacao/2014/01/10/volkswagen-gol-selecao-e-lembranca-antecipada-da-copa-por-r-35890.htm)
- [Fotografia ilustrativa Gol prata](https://www.olhonocarro.com.br/blog/volkswagen-gol-2014-avaliacao-completa/)

Sintomas e soluções na biblioteca são hipóteses para inspeção; não são diagnósticos do veículo. Sistemas críticos exigem serviço especializado.

## Implementação e limites
- Os registros pessoais da garagem, as manutenções e os abastecimentos atualmente ficam em `localStorage`.
- As migrações são preparatórias: **não foram executadas no banco remoto**. Aplicá-las depois de validar migrações anteriores e credenciais.
- A sincronização de abastecimentos com Supabase ainda precisa de integração cliente e autenticação efetiva.
- O site não foi publicado em hospedagem; o código foi enviado à branch `main`. Verificar `bun install`, `bun run test` e `bun run build` no ambiente com dependências disponíveis.
