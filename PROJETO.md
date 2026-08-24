# Electronica Store — Marketplace Frontend

Marketplace de eletrônicos em React, no espírito de Shopee / Mercado Livre.
Catálogo grande, vendedores, avaliações, cupons, checkout completo e área do
usuário. **Tudo com dados mocados** — não existe backend.

A identidade visual segue a **Shopee**: fundo claro, laranja como cor de marca,
cards brancos densos e tipografia enxuta. Isso **substitui** o tema escuro atual
(night/volt/fuchsia, superfícies em vidro) — não convive com ele.

## Identidade visual (Shopee)

Tokens em `src/index.css`, como variáveis CSS e utilitários Tailwind.

| Token | Valor | Uso |
|---|---|---|
| `--brand` | `#EE4D2D` | laranja da marca: preços, CTAs, ativos |
| `--brand-dark` | `#D73211` | hover de botões primários |
| `--brand-soft` | `#FFF0ED` | fundos de destaque suave |
| `--header-from` / `--header-to` | `#F53D2D` → `#FF6633` | gradiente do topo |
| `--page` | `#F5F5F5` | fundo da página |
| `--surface` | `#FFFFFF` | cards e painéis |
| `--line` | `#E5E5E5` | bordas de 1px |
| `--ink` | `#222222` | texto principal |
| `--ink-soft` | `#757575` | texto secundário |
| `--star` | `#FFCE3D` | estrelas de avaliação |
| `--tag` | `#FFD839` | fita de desconto (texto em `--brand`) |
| `--ship` | `#00BFA5` | selo de frete grátis |

Regras de composição:

- Fundo da página cinza, conteúdo em cards brancos com borda de 1px. Sombra
  quase nula em repouso; ao passar o mouse, o card sobe levemente e ganha sombra.
- Cabeçalho fixo com gradiente laranja: linha superior de links pequenos, e
  abaixo logo + busca (input branco arredondado com botão laranja) + carrinho.
- Cartão de produto: imagem quadrada, nome em 2 linhas com reticências, preço em
  laranja com o "R$" menor, estrelas e quantidade vendida em texto miúdo.
- Fita de desconto no canto superior direito da imagem: fundo `--tag`, texto
  `--brand`, formato "-25%".
- Selos pequenos e retangulares (não pílulas): "Frete Grátis", "Mais vendido".
- Grade densa: 6 colunas em telas grandes, 2 no celular.
- Cantos suaves (2 a 4px), nunca totalmente arredondados, exceto a busca.
- Sem glassmorphism, sem gradientes coloridos fora do cabeçalho e dos botões.

## Stack

| Camada | Escolha |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Estilo | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Rotas | React Router 7 |
| Animação | Framer Motion 13 |
| Lint | Oxlint |

Persistência é `localStorage`. Latência de rede é simulada quando fizer sentido.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Estrutura

```
src/
  main.tsx              ponto de entrada
  App.tsx               rotas + providers (Auth > Favorites > Cart > Compare)
  index.css             tema, tokens, .card/.btn-brand, foco visível
  data/                 dados mocados e tipos (exportados de onde nascem)
    products.ts         catálogo (60 itens), categorias, getProduct
    sellers.ts          vendedores, getSeller
    reviews.ts          avaliações, reviewsFor / ratingSummary
    coupons.ts          cupons, getCoupon
  lib/                  regras de domínio e persistência (localStorage)
    format.ts           formatBRL / formatDate / formatCompact / formatInstallments
    catalog.ts          estado do catálogo, filtros e ordenação
    shipping.ts         quoteShipping e frete grátis (acima de R$ 999)
    totals.ts           computeCoupon e desconto Pix
    orders.ts           pedidos (createOrder, getOrder/getOrders)
    addresses.ts        endereços salvos
    recent.ts           produtos vistos recentemente
    useLoading.ts       useSimulatedLoading (latência simulada)
  context/              estado global por domínio (XxxCore = dados+hook, XxxContext = provider)
    cartCore.ts / CartContext.tsx           carrinho, seleção, cupom
    favoritesCore.ts / FavoritesContext.tsx favoritos
    authCore.ts / AuthContext.tsx          login mock (usuário)
    compareCore.ts / CompareContext.tsx    comparador (até 3)
  components/           componentes reutilizáveis
    Navbar, Footer, Reveal, SmartImage
    ProductCard, ProductReviews, SellerBlock, Questions
    CatalogView, FilterPanel, Pagination
    RecentlyViewed, Skeleton, FlashSale, CompareBar
  pages/                uma página por rota
```

## Rotas

| Rota | Página |
|---|---|
| `/` | Home |
| `/produtos` | catálogo completo |
| `/busca` | busca por termo |
| `/categoria/:slug` | catálogo por categoria |
| `/produto/:id` | detalhe do produto |
| `/loja/:id` | loja do vendedor |
| `/carrinho` | carrinho |
| `/checkout` | checkout |
| `/pedido/:id` | confirmação do pedido |
| `/favoritos` | favoritos |
| `/entrar` | login (mock) |
| `/pedidos` | meus pedidos |
| `/pedidos/:id` | acompanhamento do pedido |
| `/enderecos` | endereços salvos |
| `/comparar` | comparador de produtos |
| `/sobre` | sobre a loja |
| `*` | 404 (não encontrado) |

## Convenções

- Componentes em PascalCase, um por arquivo, `export default`.
- Texto da interface em **português**.
- Preços em BRL via `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- Datas via `Intl.DateTimeFormat("pt-BR")`.
- Só classes Tailwind. Utilitários compartilhados ficam em `index.css`.
- Cada contexto novo entra em `src/context/` e é montado em `App.tsx`.
- Persistência sempre dentro de `try/catch`, com chave prefixada `electronica:`.
- **Nenhuma dependência nova.** O que precisar, implemente à mão.
- Tipos exportados do módulo onde o dado nasce.

## Backlog

Uma tarefa por iteração, de cima para baixo. Ao concluir, troque `[ ]` por `[x]`.

### Fase 0 — Identidade visual Shopee

Vem primeiro: todo componente criado depois já nasce no visual certo.

- [x] **Reescrever os tokens em `src/index.css`.** Trocar o tema escuro pelos
  tokens da tabela "Identidade visual" acima, como variáveis CSS em `:root`.
  Definir `body` com fundo `--page` e texto `--ink`. Remover `.glass` e
  `.text-gradient`. Criar `.card` (fundo branco, borda 1px `--line`, raio 2px,
  transição de sombra) e `.btn-brand` (fundo `--brand`, texto branco, hover
  `--brand-dark`).
- [x] **Refazer o `Navbar.tsx` no padrão Shopee**: cabeçalho fixo com gradiente
  `--header-from` → `--header-to`, linha superior com links pequenos (Vender,
  Central de Ajuda, Notificações), e linha principal com logo à esquerda, busca
  centralizada (input branco arredondado + botão laranja com ícone de lupa) e
  ícone de carrinho com contador à direita.
- [x] **Refazer o `ProductCard.tsx` no padrão Shopee**: card branco, imagem
  quadrada no topo, fita de desconto no canto superior direito quando houver
  `oldPrice`, nome em 2 linhas com reticências, preço em laranja com "R$" menor,
  linha inferior com estrelas e "N vendidos". Elevação sutil no hover.
- [x] **Converter a `Home.tsx` para o novo tema**: faixa de categorias em grade
  com ícones, banner promocional laranja, e seções de produtos em grade densa.
  Remover animações de vidro e gradientes coloridos que não sejam da marca.
- [x] **Converter `Products.tsx`, `ProductDetail.tsx`, `Cart.tsx` e `About.tsx`**
  para o novo tema: fundo cinza, blocos em cards brancos, botões `--brand`,
  filtros e selects claros com borda de 1px.
- [x] **Converter o `Footer.tsx`**: fundo branco com borda superior, colunas de
  links em texto miúdo cinza, e faixa inferior com direitos reservados.
- [x] **Varredura final do tema escuro**: procurar por classes remanescentes
  (`night-`, `volt-`, `fuchsia-`, `glass`, `text-gradient`, `bg-white/5`,
  `border-white/10`, `text-slate-`) em todo o `src/` e substituir pelos tokens
  novos. O build precisa passar e nenhuma tela pode ficar com fundo escuro.

### Fase 1 — Fundação de dados

- [x] **Expandir o catálogo para 60 produtos** em `src/data/products.ts`,
  distribuídos entre as categorias existentes. Cada um com nome realista, preço,
  `oldPrice` quando houver desconto, rating entre 3.5 e 5, número de reviews,
  galeria com 3 imagens e 3 a 5 destaques.
- [x] **Adicionar campos de marketplace ao `Product`**: `sellerId`, `stock`,
  `sold` (unidades vendidas), `freeShipping: boolean`, `condition: "novo" | "usado"`,
  `installments: { count: number; value: number }`. Preencher em todos os produtos.
- [x] **Criar `src/data/sellers.ts`** com 8 vendedores mocados: `id`, `name`,
  `logo`, `rating`, `sales`, `since` (ano), `location`, `isOfficial: boolean`.
  Ligar aos produtos pelo `sellerId`.
- [x] **Criar `src/data/reviews.ts`** com ~120 avaliações mocadas espalhadas
  entre os produtos: `id`, `productId`, `author`, `rating`, `date`, `comment`,
  `helpful` (contagem), `photos?: string[]`.
- [x] **Criar `src/data/coupons.ts`** com 6 cupons: `code`, `type`
  (`percent` | `fixed` | `freeship`), `value`, `minValue`, `expiresAt`.
- [x] **Criar `src/lib/format.ts`** com `formatBRL`, `formatDate`, `formatCompact`
  (1,2 mil) e `formatInstallments`. Trocar todas as formatações espalhadas pelo
  projeto por essas funções.

### Fase 2 — Carrinho e compra

- [x] **Persistir o carrinho no localStorage** (`electronica:cart`), lendo no
  estado inicial e gravando a cada mudança, dentro de `try/catch`.
- [x] **Corrigir o aviso do lint em `CartContext.tsx`** — remover o reexport de
  `FALLBACK_IMAGE` e importar direto de `data/products` onde for usado.
  `npm run lint` deve ficar sem avisos.
- [x] **Agrupar o carrinho por vendedor**, como na Shopee: cada bloco com nome
  do vendedor, seus itens e subtotal próprio.
- [x] **Seleção de itens no carrinho**: checkbox por item e por vendedor,
  "selecionar todos", e o total considerando apenas os selecionados.
- [x] **Campo de cupom no carrinho**: valida contra `data/coupons.ts`, aplica o
  desconto, mostra erro para código inválido ou valor mínimo não atingido.
- [x] **Frete por CEP simulado**: campo de CEP no carrinho, cálculo determinístico
  a partir dos dígitos, exibindo prazo e valor. Frete grátis acima de R$ 999 ou
  quando todos os itens forem `freeShipping`.
- [x] **Barra de progresso de frete grátis**: mostra quanto falta para atingir
  R$ 999, com barra animada.
- [x] **Página de checkout** em `/checkout` (`src/pages/Checkout.tsx`), em etapas:
  endereço, entrega, pagamento e revisão. Navegação entre etapas com validação.
- [x] **Formas de pagamento no checkout**: Pix (com desconto de 5% e QR fake),
  boleto, e cartão com seleção de parcelas. Refletir no total.
- [x] **Confirmação de pedido** em `/pedido/:id`: número gerado, resumo, prazo
  estimado e status inicial. Limpar o carrinho ao concluir.

### Fase 3 — Descoberta

- [x] **Busca com sugestões**: no `Navbar`, dropdown que sugere produtos e
  categorias enquanto digita, com navegação por teclado (setas e Enter).
- [x] **Página de resultados de busca** em `/busca?q=`, com contagem de
  resultados e mensagem de vazio.
- [x] **Filtros avançados no catálogo**: faixa de preço, avaliação mínima,
  condição, frete grátis e vendedor oficial. Refletidos na URL como query params.
- [x] **Paginação do catálogo**: 12 por página, controles de navegação e
  preservação dos filtros na URL.
- [x] **Ordenação por mais vendidos** somando à ordenação existente, usando o
  campo `sold`.
- [x] **Página de categoria** em `/categoria/:slug`, com banner próprio e os
  filtros já aplicados àquela categoria.
- [x] **Vistos recentemente**: registra os últimos 8 produtos abertos em
  localStorage e exibe uma faixa na Home e no `ProductDetail`.

### Fase 4 — Produto

- [x] **Galeria com miniaturas** no `ProductDetail`: coluna de thumbs, troca da
  imagem principal e zoom ao passar o mouse.
- [x] **Bloco do vendedor** no `ProductDetail`: logo, nome, reputação, vendas,
  selo de oficial e link para a loja.
- [x] **Avaliações no `ProductDetail`**: nota média, histograma de 1 a 5
  estrelas, lista paginada com filtro por nota e botão "útil".
- [x] **Perguntas e respostas**: bloco com perguntas mocadas, respostas do
  vendedor e campo para enviar (adiciona à lista em memória).
- [x] **Produtos relacionados**: até 8 da mesma categoria, em carrossel horizontal.
- [x] **Indicadores de estoque e urgência**: "últimas N unidades" quando o
  estoque for baixo, e contagem de vendidos.
- [x] **Página do vendedor** em `/loja/:id`: cabeçalho com reputação e grade dos
  produtos daquele vendedor.

### Fase 5 — Área do usuário

- [x] **Contexto de favoritos** persistido, com botão de coração no
  `ProductCard` e no `ProductDetail`, e contador no `Navbar`.
- [x] **Página de favoritos** em `/favoritos`, com opção de mover para o carrinho.
- [x] **Login mocado**: contexto de usuário, página `/entrar` que aceita qualquer
  e-mail, persiste a sessão e troca o `Navbar` para o nome do usuário.
- [x] **Meus pedidos** em `/pedidos`: lista os pedidos gravados no localStorage
  com status, data e valor, e link para o detalhe.
- [x] **Rastreamento do pedido**: linha do tempo com etapas (confirmado,
  preparando, enviado, em trânsito, entregue), avançando conforme a data.
- [x] **Endereços salvos** em `/enderecos`: adicionar, editar, remover e definir
  o principal, tudo persistido.
- [x] **Notificações**: sino no `Navbar` com dropdown de avisos mocados e
  contador de não lidas.

### Fase 6 — Acabamento

- [x] **Página 404** (`src/pages/NotFound.tsx`) no visual do site, e rota `*`
  apontando para ela.
- [x] **Skeletons de carregamento** para as grades de produtos e para o detalhe,
  exibidos durante uma latência simulada curta.
- [x] **Ofertas relâmpago na Home**: faixa com contador regressivo real e
  produtos com desconto.
- [x] **Comparador de produtos**: selecionar até 3 do catálogo e comparar specs
  lado a lado em `/comparar`.
- [x] **Responsividade móvel**: revisar Navbar (menu hambúrguer), filtros do
  catálogo (drawer) e carrinho em telas pequenas.
- [x] **Acessibilidade**: `aria-label` em todo botão só de ícone, `alt`
  descritivo, foco visível, navegação por teclado nos dropdowns e modais.
- [x] **Metadados**: `<title>`, `description`, Open Graph, `lang="pt-BR"` e
  `theme-color` no `index.html`.
- [x] **Atualizar este arquivo**: revisar Estrutura e Rotas para refletir tudo
  que passou a existir.

## Backlog — Parte 2

A Parte 1 (fases 0 a 6) está concluída. Esta é a continuação: variações de
produto, lado do vendedor, pós-venda, engajamento e qualidade de plataforma.
Mesmas regras — uma tarefa por iteração, de cima para baixo.

### Fase 6.1 — Correções de layout e espaçamento (prioridade)

Levantado inspecionando o build de produção em `npm run preview` a 1440px.
Fazer antes da Fase 7 — há dois bugs que impedem o uso.

- [x] **BUG: a grade de `/produtos` não renderiza nenhum card.** O cabeçalho diz
  "60 produtos encontrados" e a paginação aparece, mas a área da grade fica
  vazia. A Home renderiza `ProductCard` normalmente, então o defeito está em
  `components/CatalogView.tsx` ou em `pages/Products.tsx` — provavelmente na
  fatia da paginação ou no estado de `useLoading`. Investigar e corrigir.
  Confirmar com `npm run preview` que os 12 cards da página 1 aparecem.
- [x] **BUG: a imagem principal do `ProductDetail` fica em branco.** Em
  `/produto/headphone-pro-max` o bloco da imagem grande ocupa cerca de 1000px de
  altura totalmente vazio, enquanto as miniaturas à esquerda carregam. Corrigir
  o carregamento e dar ao contêiner proporção fixa (quadrada) para não gerar esse
  vão gigante mesmo enquanto a imagem não chega.
- [x] **Detalhe do produto em duas colunas no desktop.** Hoje galeria e
  informações ficam empilhadas, desperdiçando a largura: a partir de `lg`, usar
  galeria à esquerda e bloco de compra à direita, com a coluna de compra grudada
  no topo (`sticky`) ao rolar.
- [x] **Conteúdo escondido atrás do cabeçalho fixo.** No `ProductDetail` a
  primeira miniatura e o selo aparecem cortados sob o `Navbar`. Definir um
  espaçamento de topo consistente para todas as páginas (o `Navbar` tem duas
  linhas) e `scroll-margin-top` nas âncoras.
- [x] **Botão de página ativa invisível na paginação.** Em
  `components/Pagination.tsx`, a página atual fica branca sobre fundo branco.
  Aplicar fundo `--brand` com texto branco no item ativo.
- [x] **Faixa de ofertas relâmpago cortada.** O último card fica truncado no
  limite direito, com nome e preço cortados. Transformar em rolagem horizontal
  de verdade: `overflow-x-auto` com `scroll-snap`, setas laterais no desktop e
  o último card completo ou claramente parcial, nunca cortado no meio do preço.
- [x] **Faixa de categorias sem ocupar a largura.** Na Home os 6 cartões param
  na metade da tela em telas largas. Distribuir em grade de 6 colunas ocupando
  toda a largura do contêiner.
- [x] **Banners promocionais desequilibrados.** Hoje são dois lado a lado e o
  terceiro sozinho com metade da largura. Usar grade de 3 colunas iguais no
  desktop, empilhando no celular.
- [x] **Selo de desconto colidindo com o coração no `ProductCard`.** Os dois
  disputam o canto superior direito. Mover o desconto para o canto superior
  esquerdo (abaixo do selo de "Mais vendido" quando houver) ou o coração para
  fora da área do selo, garantindo que nunca se sobreponham.
- [x] **Linha de preço do `ProductCard` apertada e inconsistente.** O preço
  antigo e o novo ficam colados, e o "R$" gruda no número. Além disso o card da
  Home mostra os preços em linha enquanto o card da oferta relâmpago mostra
  empilhados. Unificar a apresentação em um único componente de preço, com
  espaçamento respirável e o mesmo formato em todos os lugares.
- [x] **Varredura de espaçamento vertical.** Padronizar o respiro entre seções
  da Home e entre blocos das páginas internas usando uma escala única (por
  exemplo 24 / 40 / 64px), eliminando os saltos irregulares atuais.

### Fase 7 — Variações e estoque

- [x] **Adicionar variações ao `Product`** em `src/data/products.ts`: campo
  `variants?: { id, label, options: { id, name, hex?, priceDelta?, stock }[] }[]`
  (ex.: Cor e Capacidade). Preencher em pelo menos 20 produtos.
- [x] **Seletor de variação no `ProductDetail.tsx`**: botões por opção, cor como
  círculo colorido, opção esgotada riscada e desabilitada. Preço e estoque
  refletem a combinação escolhida.
- [x] **Bloquear a compra sem variação escolhida**: o botão de adicionar fica
  desabilitado com aviso até que todas as variações tenham seleção.
- [x] **Carrinho ciente de variação**: a chave do item passa a ser produto +
  combinação; o mesmo produto em cores diferentes ocupa linhas separadas, e a
  variação aparece sob o nome.
- [x] **Limitar quantidade ao estoque**: no carrinho e no detalhe, impedir passar
  do estoque da variação, com mensagem clara.
- [x] **Marca no catálogo**: adicionar `brand` ao `Product`, preencher em todos, e
  incluir filtro por marca no `FilterPanel.tsx`, refletido na URL.
- [x] **Alerta de preço**: botão "avisar quando baixar" no `ProductDetail`,
  persistido em `electronica:alerts`, com uma página `/alertas` listando os
  produtos monitorados e o preço-alvo.

### Fase 8 — Compra avançada

- [x] **Opções de frete no checkout**: econômico, padrão e expresso, cada um com
  prazo e preço próprios calculados em `lib/shipping.ts`, escolhidos na etapa de
  entrega.
- [x] **Busca de endereço por CEP**: ao digitar o CEP, preencher rua, bairro,
  cidade e UF a partir de uma base mocada em `src/data/ceps.ts` (20 CEPs), com
  latência simulada e estado de carregamento.
- [x] **Máscaras de entrada** em `src/lib/masks.ts`: CPF, telefone, CEP, cartão e
  validade. Aplicar nos formulários de checkout e endereço.
- [x] **Validar cartão com algoritmo de Luhn** em `lib/masks.ts`, mais validade
  não vencida e CVV de 3 a 4 dígitos. Bloquear o avanço com erro por campo.
- [x] **Parcelamento com juros**: acima de 6x aplicar 1,99% ao mês; o seletor
  mostra valor da parcela, total e se é sem juros.
- [x] **Cupom por vendedor**: além do cupom da plataforma, cada bloco do carrinho
  aceita um cupom próprio do vendedor, somando os descontos corretamente.
- [x] **Salvar para depois**: mover item do carrinho para uma lista separada
  persistida, exibida abaixo do carrinho, com opção de devolver ao carrinho.
- [x] **Comprar novamente**: em `/pedidos`, botão que recria o carrinho com os
  itens daquele pedido, avisando sobre itens sem estoque.

### Fase 9 — Pós-venda

- [x] **Avaliar produto comprado**: em `/pedidos/:id`, formulário de avaliação
  (nota, comentário, fotos por URL) que grava em `electronica:myreviews` e passa
  a aparecer na página do produto.
- [x] **Cancelar pedido** enquanto o status for "confirmado" ou "preparando",
  com confirmação e mudança de status para "cancelado".
- [x] **Solicitar devolução** em pedidos entregues: motivo, descrição e fotos,
  gerando um protocolo persistido.
- [x] **Página de devoluções** em `/devolucoes`: lista as solicitações com status
  (aberta, em análise, aprovada, concluída) e linha do tempo.
- [x] **Rastreamento detalhado**: em `/pedidos/:id`, linha do tempo com data,
  hora e local de cada evento, gerados de forma determinística a partir do id.
- [x] **Nota fiscal simulada**: botão que abre um modal com o resumo formatado do
  pedido, pronto para impressão via `window.print()`.
- [x] **Central de ajuda** em `/ajuda`: perguntas frequentes em acordeão,
  agrupadas por tema, com busca por termo.

### Fase 10 — Lado do vendedor

- [x] **Contexto de vendedor logado**: em `authCore.ts`, marcar se o usuário é
  vendedor e a qual `sellerId` pertence; alternar em `/entrar`.
- [x] **Painel do vendedor** em `/vendedor`: cartões com faturamento, pedidos,
  produtos ativos e reputação, tudo derivado dos dados mocados.
- [x] **Gráfico de vendas** em SVG puro (sem biblioteca): barras dos últimos 12
  meses, com eixo, rótulos e destaque no mês corrente.
- [x] **Meus produtos** em `/vendedor/produtos`: tabela com imagem, nome, preço,
  estoque e status, com busca e ordenação.
- [x] **Editar produto**: formulário que altera preço, estoque e destaque,
  persistindo as mudanças em `electronica:seller:overrides` e refletindo no
  catálogo.
- [x] **Pedidos do vendedor** em `/vendedor/pedidos`: lista os pedidos que contêm
  seus produtos, com ação de avançar o status.
- [x] **Responder perguntas**: em `/vendedor/perguntas`, listar as perguntas sem
  resposta e permitir respondê-las, refletindo no `Questions.tsx`.

### Fase 11 — Engajamento e promoções

- [x] **Seguir loja**: botão no `SellerStore` e no `SellerBlock`, persistido, com
  contador de seguidores e página `/lojas-seguidas`.
- [x] **Chat com o vendedor**: painel flutuante com histórico por vendedor,
  persistido, e respostas automáticas mocadas com atraso simulado.
- [x] **Central de cupons** em `/cupons`: todos os cupons disponíveis em cartões
  no estilo Shopee, com botão de coletar e validade destacada.
- [x] **Moedas de fidelidade**: saldo no perfil, ganho de 1 moeda por real gasto
  ao finalizar pedido, e abatimento no checkout limitado a 5% do total.
- [x] **Check-in diário**: em `/moedas`, calendário de 7 dias com recompensa
  crescente, uma marcação por dia, persistido.
- [x] **Carrossel de banners na Home**: 4 banners com troca automática, controles
  laterais, indicadores e pausa ao passar o mouse.
- [x] **Recomendações personalizadas**: seção na Home baseada nas categorias dos
  produtos vistos recentemente e favoritados.
- [x] **Compartilhar produto**: botão que copia o link para a área de
  transferência e mostra confirmação, com fallback quando a API não existir.

### Fase 12 — Conta e preferências

- [x] **Perfil completo** em `/perfil`: nome, e-mail, telefone, CPF e data de
  nascimento, com edição, validação e persistência.
- [x] **Cartões salvos** em `/cartoes`: adicionar (só os 4 últimos dígitos ficam
  gravados), definir principal e remover, disponíveis no checkout.
- [x] **Preferências de notificação**: interruptores por tipo (promoções,
  pedidos, mensagens), persistidos e respeitados pelo sino do `Navbar`.
- [x] **Histórico de busca**: guardar os últimos 10 termos, exibir no dropdown da
  busca ao focar, com opção de remover um ou limpar tudo.
- [x] **Tema claro e escuro**: alternador no `Navbar` que troca os tokens do
  `index.css` via `data-theme` no `html`, respeitando `prefers-color-scheme` e
  persistindo a escolha.
- [x] **Reduzir movimento**: respeitar `prefers-reduced-motion` desligando as
  animações do Framer Motion e as transições longas.
- [x] **Sair da conta**: encerra a sessão, limpa os dados sensíveis e mantém
  carrinho e favoritos.

### Fase 13 — Plataforma e qualidade

- [x] **Sistema de avisos (toasts)**: contexto próprio com fila, tipos de sucesso,
  erro e informação, saída automática e empilhamento no canto. Substituir os
  `alert()` que existirem.
- [x] **Sistema de modais**: componente reutilizável com foco preso, fechamento
  por `Esc` e clique fora, e confirmação para ações destrutivas.
- [x] **Fronteira de erro**: componente que captura falhas de renderização e
  mostra uma tela amigável com opção de recarregar, sem tela branca.
- [x] **Rotas com carregamento tardio**: converter as páginas para `React.lazy` +
  `Suspense`, com o `Skeleton` como fallback, reduzindo o pacote inicial.
- [x] **Trilha de navegação (breadcrumbs)**: em catálogo, categoria, produto e
  loja, com marcação semântica e link em cada nível.
- [x] **Menu de categorias expandido**: mega menu no `Navbar` com as categorias e
  suas subcategorias, navegável por teclado.
- [x] **Atalhos de teclado**: `/` foca a busca, `Esc` fecha o que estiver aberto,
  e uma tela de ajuda com a lista dos atalhos.
- [x] **Instalável (PWA)**: `public/manifest.webmanifest` com ícones e cores,
  ligado no `index.html`, mais um service worker simples que cacheia o casco da
  aplicação. Sem dependências novas.

## Regras do loop

1. Execute **uma** tarefa por iteração — a primeira não marcada.
2. Leia os arquivos que vai alterar antes de editar.
3. Depois de editar, rode `npm run build`. Se falhar, conserte antes de encerrar.
4. Só marque `[x]` quando a tarefa estiver concluída **e** o build passar.
5. Não instale dependências novas.
6. Não reescreva o que já funciona; faça a menor mudança que resolve.
7. Interface em português.
