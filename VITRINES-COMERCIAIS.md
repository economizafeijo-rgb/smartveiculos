# SmartVeículos | Vitrines comerciais — implantação inicial

Data: 02/11/2026

## Objetivo

Conectar os cadastros existentes de autopeças para carros, lojas de motos e oficinas com uma vitrine pública de **produtos, acessórios e serviços**. Cada empresa controla suas ofertas, preço e publicação; compradores pesquisam e compartilham links antes de pedir orçamento.

## O que foi entregue

- **Público**: rota `/vitrines` com pesquisa textual, filtro por tipo (produtos/serviços), categorias, ordenação por preços ou novidades, fotos com placeholder, nome da empresa, disponibilidade e preço.
- **Detalhe compartilhável**: `/vitrines?oferta=<uuid>` com descrição, marca, código, compatibilidade, preço, disponibilidade, empresa e cidade. Botão Compartilhar e contato via WhatsApp quando há telefone válido.
- **Vitrine de estabelecimento**: `/vitrines?empresa=<uuid>`, com ofertas publicadas pela empresa, seguindo as mesmas regras de segurança.
- **Empresas**: nova aba **Minha vitrine** na rota `/negocio`. É possível criar/editar/excluir/publicar/despublicar ofertas de produtos ou serviços, com fotos externas HTTPS, título, descrição, aplicação, marca, referência, categoria, valor e disponibilidade.
- **Importação assistida** de dados do cadastro de `parts_inventory`, sem publicar automaticamente a tabela privada.
- **Home**: entrada **Vitrines** na navegação e botão **Explorar vitrines**.
- **Backend**: nova tabela `marketplace_listings` com políticas RLS; dados pessoais, custos e estoque interno permanecem separados. Uma oferta só fica pública quando `is_published=true` E a empresa tem aprovação registrada. Gatilhos do PostgreSQL sincronizam aprovação, nome/cidade/telefone da empresa.
- **Testes**: formato de preços, links públicos, id UUID e contato válido.

O banco inicia com **zero ofertas reais**. Não inserir peças, preços ou empresas fictícias em produção. O lojista publica ofertas reais após registrar a empresa; o responsável administrativo aprova a empresa.

## Áreas existentes reutilizadas

| Área | Integração |
| --- | --- |
| Cadastro com CNPJ / identidade Supabase | Vincula ofertas ao proprietário autêntico da empresa |
| Estoque de autopeças | Opção de importar informações de SKU, nome, aplicação e preço |
| Clientes e veículos | Mantidos privados; não surgem em vitrines públicas |
| Serviços / assistência técnica | Podem ser anunciados como serviço sem expor OS |
| Acompanhamento de cliente / chat de OS | Mantidos independentes da nova vitrine |
| Garagem pessoal | Motorista pode acessar vitrine por link; integração de compatibilidade automática fica para próxima etapa |

## Próximas incrementações, em ordem recomendada

1. **Compatibilidade estruturada por veículo**: marca, modelo, ano, motorização, versão e código OEM; indicação obrigatória de compatibilidade declarada ou a confirmar. Pesquisa do Baymard Institute salienta fitment, especificações, filtros combináveis e pesquisa inteligente.
2. **Fotos reais e galeria**: upload protegido de imagens, múltiplos ângulos, marca d'água opcional e visualização ampliada; otimização de imagens e texto alternativo.
3. **Catálogos por categorias**: manutenção, freios, suspensão, pneus, motor, acessórios, elétrica, lubrificantes, revisão, instalação e socorro; filtros de disponibilidade, localização, marca, ano e faixa de preços.
4. **Pedido de orçamento dentro da plataforma**: conexão com chat e pedidos, proposta com validade e histórico de versões, sem prometer pagamento. Substituir WhatsApp por chat interno onde autenticado.
5. **Carrinho, reserva de estoque e pedidos**: somar valores, impostos/frete conforme a operação, confirmar pagamento por provedor, cancelar e estornar de forma auditável. Requer integrações e regras comerciais antes de anunciar checkout real.
6. **Serviços com agenda e preço-base**: duração, disponibilidade do profissional, confirmação e lembretes; conectar com painel de acompanhamento existente.
7. **Logística e pós-venda**: retirada programada, transportadora, rastreio real quando disponível, comprovantes, trocas e garantia.
8. **SEO e Google Merchant Center**: URLs canônicas de produto, Product structured data, GTIN/MPN/marca e atualizações consistentes de preço, disponibilidade e condição. Só mostrar feeds quando houver dados confiáveis.
9. **Métricas**: visualizações reais da oferta, visitas da loja, solicitações de orçamento e conversão; LGPD, consentimento quando necessário e proteção contra abuso.

## Fontes de pesquisa

- Baymard Institute, Automotive Parts UX: https://baymard.com/industries/automotive-parts-ux
- Baymard, Product Listing Page UX (2026): https://baymard.com/blog/product-listing-page-plp-ux
- Shopify, Product Page Best Practices (2026): https://www.shopify.com/blog/product-page
- Google Merchant Center — Product data specification: https://support.google.com/merchants/answer/7052112
- Supabase RLS — Grants e policies: https://supabase.com/docs/guides/database/postgres/row-level-security

## Escopo explícito (não prometer o que não existe)

A vitrine **não cobra pagamentos, não processa vendas, não realiza checkout, não confirma frete e não garante compatibilidade**. A ação de conversão disponível nesta primeira versão é o contato da empresa via WhatsApp, quando o telefone é válido. O cadastro de estoque interno e as ordens de serviço não são publicados automaticamente.

As atualizações enviadas ao `main` precisam ser sincronizadas e publicadas no Lovable. CI verde no GitHub não comprova deploy em produção.
