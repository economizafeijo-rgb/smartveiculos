# SmartVeículos — Plano de evolução comercial

**Revisado em:** 02/11/2026
**Escopo:** autopeças de carros, autopeças de motos, oficinas mecânicas e proprietários de veículos
**Fontes de verdade:** arquivos `src/routes/negocio.tsx`, `src/components/portal/PortalAreaDialog.tsx` e esquema público do Supabase (`pwvayaflyamjihqqqvpk`).

## 1. Situação verificada (sem promessas fictícias)

| Área | Já existe | Ainda falta |
| --- | --- | --- |
| Empresas | Registro com CNPJ de dígitos válidos, nome, segmento e aprovação administrativa | Consulta automática da situação cadastral e verificação documental de representante, múltiplos colaboradores por negócio |
| Autopeças | Cadastro de SKU, título, compatibilidade em texto, quantidade e preço, filtros e ajuste de estoque | Fotos, categorias, marcas, aplicações estruturadas, variantes, catálogo público, links de peça, favoritos, orçamentos, pedidos, expedição |
| Oficina | OS com cliente em texto, veículo em texto, descrição, orçamento, status aberta/em andamento/concluída | Vínculo seguro ao usuário cliente, linha do tempo, fotos, orçamento aprovado, agenda, chat, avisos e serviço em tempo real no painel do cliente |
| Cliente/proprietário | Garagem individual, manutenção, abastecimentos, Gol e CB650R | Conectar uma OS real de uma oficina ao proprietário, agendas, mensagens e acompanhamento de compras |
| Comunicação | Login e páginas específicas | Chat individual entre cliente e empresa, alertas, notificações, histórico e arquivos |
| Entregas | Nenhum fluxo operacional de venda | Pedido, pagamento (futuramente), endereço, retirada, despacho, rastreio e comprovantes |

Inspeção de base: em 02/11/2026, `business_accounts`, `parts_inventory` e `work_orders` estavam vazias; `owner_vehicle_cards` continha 2 registros. Os esquemas permitem cadastrar peças e ordens, mas não fornecem as capacidades de atendimento externo mencionadas acima.

**Marketing:** mencionar apenas as funcionalidades existentes como disponíveis; divulgar o restante com o rótulo **Em desenvolvimento**. O modal da homepage foi ajustado para essa regra.

## 2. Proposta de valor

**Para lojas de autopeças:** transforme o estoque num catálogo inteligente, compartilhe produtos e aplicações, receba pedidos, converse com o consumidor e acompanhe a venda até a entrega. Reduza mensagens perdidas e a busca manual por códigos.

**Para oficinas:** da marcação do horário à entrega do veículo, mantenha histórico de OS, orçamento, peças, atendimento e atualizações visíveis para o cliente.

**Para o proprietário:** acompanhe o próprio veículo, encontre produtos e profissionais e consulte o andamento dos pedidos ou serviços autorizados sem precisar telefonar para obter cada informação.

## 3. Etapas recomendadas de implementação

### P0 — Base comercial publicável

1. **Catálogo estruturado:** ampliar `parts_inventory` ou criar `products`, `product_media`, `product_compatibilities` com descrição, fotos, categoria, marca, aplicação por fabricante/modelo/ano, preço público opcional, disponibilidade e `is_published`. Manter custos, fornecedor e estoque reservado exclusivamente no painel privado.
2. **Vitrine/links compartilháveis:** rota pública `/loja/:slug` e `/peca/:public_id`. Apenas negócios aprovados e produtos publicados podem aparecer; visitantes anônimos não têm acesso a `parts_inventory` diretamente. Uma API/view/endpoint restrita entrega só informações públicas. Incluir botão **Copiar link**, **Compartilhar** e **Solicitar orçamento**, com `navigator.share` opcional.
3. **Testes reais:** cadastro de loja e oficina por conta de teste, inclusão de peças, compartilhar link com navegador anônimo, verificar que nenhuma outra empresa tem acesso a custos privados, e teste responsive mobile.
4. **Publicação Lovable:** resolver builds malsucedidos da prévia e publicar no domínio público. GitHub Actions verde não implica publicação.

### P1 — Serviço transparente e cliente conectado

1. **Cliente vinculado à OS:** adicionar `customer_user_id` opcional e fluxo de convite/autorização, ou um token exclusivo de acompanhamento com expiração, rotação e escopo limitado. Nunca revelar todas as OS por nome ou placa.
2. **Linha do tempo imutável:** `work_order_events` com `work_order_id`, autor, data, status, mensagem visível ao cliente e fotos opcionais. Estados mais úteis: recebido → diagnóstico → aguardando aprovação → em execução → testes → pronto → entregue. Usar eventos e não somente sobrescrever um status.
3. **Atualização em tempo real:** enviar eventos ao cliente via Supabase Realtime com tópico privado e políticas RLS por participante; utilizar Broadcast para melhor escalabilidade e segurança. Fallback de atualização manual em caso de desconexão.
4. **Orçamentos e autorizações:** cliente recebe valor, peças e mão de obra, aprova ou pede revisão com registro de data e versão.
5. **Notificações:** sininho in-app e e-mails transacionais; WhatsApp apenas como canal opcional conforme integração e consentimento.

### P2 — Chat e agenda

1. **Chat:** `conversations`, `conversation_members`, `messages`, `message_reads` e anexos em Storage privado. Participantes vinculados ao usuário autenticado e ao negócio; RLS para leitura e escrita somente da conversa autorizada. Tratar denúncias, spam, bloqueio e limites.
2. **Agenda:** `business_hours`, `service_types`, `appointments` com duração, profissional, recurso/vaga e status (solicitado, confirmado, remarcado, cancelado, concluído). Prevenir sobreposição com transações e constraints, não apenas validação visual.
3. **Portal do cliente:** caixas **Minhas conversas**, **Meus agendamentos**, **Meus serviços** e **Meus pedidos**.

### P3 — Comercialização e entrega

1. **Orçamentos/pedidos:** `quotes`, `orders`, `order_items`, reservas de estoque e políticas de cancelamento; descontar itens com transações para evitar overselling.
2. **Expedição:** `shipments`, `shipment_events`, modalidade (retirada, entrega local, transportadora), prazo estimado informado pela loja, código de rastreio opcional, comprovante de entrega. Não exibir localização 'ao vivo' sem integração real.
3. **Depois:** pagamentos, integrações fiscais, notificações externas, relatórios de conversão e ERP/fornecedores.

## 4. Riscos e controles obrigatórios

- **RLS multi-tenant:** nenhum cliente ou empresa pode consultar conversas, preços internos, histórico ou dados pessoais de outra pessoa/empresa. Preferir autorização por participação e vínculo verificável.
- **Vitrine pública:** usar view `security_invoker` ou endpoint limitado para publicar dados explicitamente liberados; nunca abrir `parts_inventory` inteira ao papel `anon`.
- **Links de acompanhamento:** token aleatório de alta entropia; salvar hash no banco, restringir escopo; expiração e revogação; nunca usar placa ou CNPJ como segredo.
- **LGPD:** consentimento/contexto de uso, política de retenção, remoção e acesso às informações do cliente; evitar divulgar dados pessoais em imagens e compartilhamentos.
- **CNPJ:** dígito verificador não é prova de atividade nem legitimidade. Aprovar empresa somente após conferência de situação cadastral e responsável.
- **Acessibilidade:** notificações visíveis sem depender exclusivamente de animações, bom foco do teclado e suporte a preferências de movimento reduzido.
- **Aplicação publicada:** funcionalidades novas só devem ser consideradas entregues aos usuários após CI aprovado, build Lovable e verificação da rota pública.
- **Back-end:** logs de eventos relevantes, auditoria de alterações de orçamento, proteção contra duplicações e testes de concorrência.

## 5. Critérios mínimos de aceite por recurso

- **Compartilhamento:** um lojista gera link de uma peça publicada; cliente anônimo visualiza foto, descrição, compatibilidade e canal de contato; outra loja não pode editar o produto; produto despublicado não aparece.
- **Serviço ao vivo:** uma oficina atualiza OS vinculada; o cliente vê evento com horário e conteúdo autorizado; outra pessoa não consegue ver a OS; perda da conexão preserva histórico.
- **Chat:** mensagens privadas armazenadas, indicação de mensagem enviada/lida sem falsear entrega; participante pode consultar histórico, terceiro não.
- **Agenda:** dois clientes não conseguem ocupar a mesma vaga; cancelamento libera vaga; avisos são persistidos.
- **Entrega:** o pedido tem sequência de etapas registrada e visível ao comprador; sem afirmar rastreio GPS inexistente.
- **Implantação:** preview e produção confirmadas separadamente do GitHub.
