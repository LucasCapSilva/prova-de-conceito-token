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
| `/entrar` | login (e-mail e senha) |
| `/cadastro` | criar conta |
| `/recuperar` | recuperação de senha (código na tela) |
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

## Backlog — Parte 3

As Partes 1 e 2 (fases 0 a 13) estão concluídas: 115 tarefas, build e lint
limpos. Esta parte ataca a dívida técnica que sobrou, cobertura de testes,
desempenho, e o que falta para o marketplace parecer maduro.

**Premissa desta parte: comprar não exige conta.** Catálogo, carrinho, checkout,
favoritos e acompanhamento de pedido continuam funcionando para visitante, com
estado em `localStorage`. Nenhuma tarefa das fases 13.1 a 20 pode passar a exigir
login para um fluxo que hoje funciona sem ele.

A **Fase 21** acrescenta cadastro e login com senha de verdade, mas como camada
opcional sobre isso — quem não quiser conta segue comprando como visitante.

### Fase 13.1 — Bugs e dívida técnica (prioridade)

Levantado com `npm run build`, `npm run lint` e varredura do `src/`.

- [x] **Centralizar o acesso ao `localStorage` em `src/lib/storage.ts`.** Hoje
  são 45 chamadas diretas espalhadas por `lib/` e `context/`, cada uma com seu
  próprio `try/catch`. Criar `read<T>(key, fallback)` e `write<T>(key, value)`
  com o prefixo `electronica:` aplicado uma vez só, e migrar todos os módulos.
- [x] **BUG: a aplicação quebra quando o `localStorage` está indisponível.** Em
  aba anônima com cookies bloqueados o acesso lança e a tela fica em branco.
  Detectar uma vez na carga, cair para um armazenamento em memória e mostrar um
  aviso discreto de que os dados não serão mantidos.
- [x] **BUG: cota de `localStorage` estourada não é tratada.** Com muitos pedidos
  e avaliações com fotos o `setItem` lança `QuotaExceededError` e a gravação
  falha em silêncio. Capturar, avisar via toast e oferecer limpar o histórico de
  vistos recentemente.
- [x] **Versionar e migrar as chaves persistidas.** Gravar `electronica:schema`
  com um número de versão e escrever migrações para quando o formato de um dado
  mudar. Hoje uma mudança de formato deixa o usuário com dado velho corrompido.
- [x] **Limpar chaves órfãs.** Existem chaves `electronica:` de funcionalidades
  que mudaram de formato ao longo do backlog. Criar uma rotina que roda uma vez
  e remove o que não é mais lido por nenhum módulo.
- [x] **BUG: índice usado como chave de lista em 6 lugares.** Varrer `key={i}`,
  `key={idx}` e `key={index}` no `src/` e trocar por um identificador estável.
  Onde não houver id, derivar um determinístico — reordenar ou remover um item
  hoje remonta os componentes errados e perde o estado dos campos.
- [x] **Eliminar os 2 `any` / `as unknown` remanescentes.** Localizar com
  `grep -rn "\bany\b\|as unknown" src` e substituir por tipos reais exportados do
  módulo onde o dado nasce, como manda a convenção do projeto.
- [x] **BUG: `useSimulatedLoading` não cancela ao desmontar.** Trocar de rota
  antes da latência simulada terminar dispara atualização de estado em componente
  desmontado. Guardar o timer, limpar no `useEffect` e ignorar o resultado se o
  componente já saiu.
- [x] **BUG: datas de pedido voltam do `localStorage` como texto.**
  `lib/orders.ts` grava `Date` via `JSON.stringify` e lê de volta como string,
  então as comparações de status e a linha do tempo operam sobre texto onde
  esperam `Date`. Normalizar na leitura e cobrir com teste.
- [x] **BUG: o service worker serve a versão velha para sempre.** O cache do casco
  não tem estratégia de atualização, então quem já visitou nunca recebe um deploy
  novo. Versionar o nome do cache, limpar os antigos no `activate` e avisar com
  um toast de "nova versão disponível".

### Fase 14 — Testes e verificação

Sem dependências novas: o Node 24 já traz `node --test` e `node:assert`.

- [x] **Configurar o runner nativo.** Adicionar
  `"test": "node --test --experimental-strip-types src/**/*.test.ts"` ao
  `package.json`. Um teste trivial precisa passar antes de seguir.
- [x] **Testar `lib/format.ts`**: `formatBRL` com zero, negativo e milhar;
  `formatCompact` na virada de mil; `formatInstallments` com e sem juros;
  `formatDate` com data inválida.
- [x] **Testar `lib/totals.ts`**: cupom percentual, fixo e de frete grátis; valor
  mínimo não atingido; desconto Pix; empilhamento de cupom de plataforma com
  cupom de vendedor.
- [x] **Testar `lib/shipping.ts`**: determinismo do cálculo por CEP; frete grátis
  acima de R$ 999; frete grátis quando todos os itens são `freeShipping`; as três
  modalidades (econômico, padrão, expresso).
- [x] **Testar `lib/masks.ts`**: Luhn com cartões válidos e inválidos conhecidos;
  validade vencida; CVV de 3 e 4 dígitos; máscaras de CPF, telefone e CEP com
  entrada parcial e com colagem de texto sujo.
- [x] **Testar `lib/variants.ts`**: preço e estoque da combinação escolhida;
  combinação esgotada; produto sem variação.
- [x] **Testar `lib/catalog.ts`**: cada filtro isolado, filtros combinados, cada
  ordenação, e a fatia de paginação nos limites (primeira, última, página vazia).
- [x] **Script `npm run check`** que roda `lint`, `build` e `test` em sequência e
  para no primeiro erro. Passa a ser o comando citado na regra 3 do loop.

### Fase 15 — Desempenho

O pacote inicial está em 304 kB (96 kB gzip), mais 120 kB de `framer-motion`.

- [x] **Trocar o `Reveal.tsx` por `IntersectionObserver` e transição CSS.** É o
  uso mais espalhado de `framer-motion` e o que menos precisa dele. Sozinho, deve
  tirar a biblioteca do caminho crítico da Home.
- [x] **Isolar o `framer-motion` no que sobrar.** Depois do `Reveal`, mapear quem
  ainda importa a biblioteca e mover esses componentes para import dinâmico, com
  o estado sem animação como alternativa.
- [x] **Orçamento de pacote.** Script que lê o `dist/` após o build e falha se o
  `index` passar de um teto definido, começando em 250 kB. Entra no
  `npm run check`.
- [x] **Virtualizar a grade do catálogo.** Com 60 produtos ainda cabe, mas a
  paginação de 12 existe só para não renderizar tudo. Renderizar apenas as linhas
  visíveis com `IntersectionObserver`, à mão, sem biblioteca.
- [x] **`width` e `height` em toda imagem.** O `SmartImage` não reserva espaço,
  então a grade salta enquanto carrega. Fixar a proporção e medir a melhora no
  deslocamento de layout.
- [x] **`loading="lazy"` e `decoding="async"`** nas imagens fora da primeira
  dobra, mantendo `eager` na imagem principal do `ProductDetail` e no primeiro
  banner da Home.
- [x] **Memoizar o pipeline de filtros em `lib/catalog.ts`.** Hoje cada mudança de
  filtro refaz a varredura completa dos 60 produtos e reordena. Memoizar por
  assinatura dos filtros.
- [x] **Atrasar a busca do `Navbar`.** O dropdown de sugestões recalcula a cada
  tecla. Aplicar 150 ms de espera e cancelar o cálculo anterior.
- [x] **Pré-carregar a rota no `mouseenter`** dos links de produto e categoria,
  disparando o `import()` da página antes do clique.

### Fase 16 — Catálogo e descoberta

- [x] **Busca tolerante a erro de digitação.** Implementar distância de
  Levenshtein à mão em `lib/search.ts` e aceitar até 2 edições em termos com 5
  letras ou mais, para "notbook" encontrar "notebook".
- [x] **Normalizar acentuação e caixa na busca.** "cafeteira" e "Cafeteíra" devem
  dar o mesmo resultado. Normalizar índice e consulta com `NFD`.
- [x] **Dicionário de sinônimos** em `src/data/synonyms.ts`: "fone" para
  "headphone" e "headset", "celular" para "smartphone", "tv" para "televisão".
  Aplicar na busca.
- [x] **Contagem por faceta no `FilterPanel.tsx`.** Cada marca, categoria e faixa
  mostra quantos produtos restam com os filtros atuais, e a opção que zeraria o
  resultado aparece desabilitada.
- [x] **Chips de filtros ativos** acima da grade, cada um removível
  individualmente, mais um "limpar tudo". Sincronizados com a URL.
- [x] **Filtro "somente com desconto" e ordenação por maior desconto**, calculados
  a partir de `oldPrice`.
- [x] **Filtro por faixa de parcelas** — "até 6x sem juros", "10x ou mais" —
  usando o campo `installments`.
- [x] **Filtros salvos.** Guardar combinações nomeadas em
  `electronica:savedFilters` e oferecê-las em um seletor no topo do catálogo.
- [x] **Subcategorias reais no `MegaMenu.tsx`.** Hoje o menu lista rótulos que não
  filtram nada. Ligar cada subcategoria a um recorte de verdade do catálogo.
- [x] **Página de marca** em `/marca/:slug`: cabeçalho com a marca, contagem de
  produtos e a grade filtrada, reaproveitando o `CatalogView`.

### Fase 17 — Carrinho, checkout e conversão

- [x] **Estimativa de entrega antes do checkout.** Com o CEP já informado, mostrar
  "chega até <data>" no `ProductCard` e no `ProductDetail`, usando
  `lib/shipping.ts`.
- [x] **Melhor cupom aplicado automaticamente.** Ao abrir o carrinho, avaliar
  todos os cupons coletados e sugerir o que gera o maior desconto, com botão de
  aplicar e comparação com o atual.
- [x] **Comprados juntos com frequência.** Bloco no `ProductDetail` e no carrinho
  com dois ou três itens complementares determinísticos por categoria, e botão
  que adiciona o conjunto.
- [x] **Kits com desconto progressivo.** "Leve 2, ganhe 10%" por vendedor ou
  categoria, calculado em `lib/totals.ts` e exibido no bloco do vendedor no
  carrinho.
- [x] **Rascunho de checkout persistido.** Gravar a etapa e os campos preenchidos
  em `electronica:checkoutDraft`; ao voltar, retomar de onde parou com aviso, e
  limpar ao concluir o pedido.
- [x] **Aviso de carrinho parado.** Se houver itens com mais de um dia e o usuário
  voltar à Home, mostrar uma faixa discreta com o resumo e link para o carrinho.
- [x] **Resumo do pedido fixo no rodapé em telas pequenas.** No `Checkout.tsx` o
  total fica fora da tela no celular; fixar uma barra com total e botão de
  avançar.
- [x] **Embrulho para presente.** Caixa de seleção no checkout com taxa fixa e
  campo de mensagem, refletidos no total, na confirmação e na nota simulada.
- [x] **Aviso de mudança de preço no carrinho.** Guardar o preço de quando o item
  entrou e, se o `sellerOverrides` alterar, destacar a diferença antes de fechar
  a compra.

### Fase 18 — Lado do vendedor

- [x] **Cadastrar produto novo** em `/vendedor/produtos/novo`: formulário com
  nome, categoria, marca, preço, estoque, imagens por URL e destaques, persistido
  junto dos `sellerOverrides` e visível no catálogo.
- [x] **Edição de estoque em lote.** Na tabela de `/vendedor/produtos`, seleção
  múltipla e ação de ajustar estoque ou preço em porcentagem de uma vez.
- [x] **Promoções por período.** Desconto com data de início e fim por produto,
  refletido como `oldPrice` no catálogo enquanto vigente.
- [x] **Cupom próprio do vendedor.** Criar, editar e desativar cupons que aparecem
  no bloco daquele vendedor no carrinho e na `/cupons`.
- [x] **Métricas do painel**: ticket médio, taxa de conversão simulada, produtos
  sem venda no período e o mais vendido, derivados dos pedidos gravados.
- [x] **Exportar pedidos em CSV.** Gerar o arquivo com `Blob` e
  `URL.createObjectURL` — sem dependência nova — a partir de `/vendedor/pedidos`.
- [x] **Avaliações recebidas** em `/vendedor/avaliacoes`: lista as avaliações dos
  produtos do vendedor, com filtro por nota e campo de resposta pública que
  aparece sob a avaliação no `ProductReviews.tsx`.
- [x] **Meta mensal de faturamento.** Definir uma meta persistida e mostrar barra
  de progresso no painel, com projeção até o fim do mês.

### Fase 19 — Conteúdo, avaliações e confiança

- [x] **Ordenar avaliações** por mais recentes, maior nota, menor nota e mais
  úteis, somando ao filtro por nota que já existe.
- [x] **Filtrar avaliações com foto** e marcar "compra verificada" nas que vieram
  de um pedido gravado em `electronica:myreviews`.
- [x] **Ampliação das fotos de avaliação.** Abrir em tela cheia com navegação por
  setas e `Esc`, reaproveitando o `Modal.tsx`.
- [x] **Denunciar avaliação.** Botão discreto com motivo, persistido, que oculta a
  avaliação localmente após o envio.
- [x] **Resumo automático das avaliações.** Extrair os termos mais frequentes dos
  comentários e exibir como etiquetas clicáveis que filtram a lista.
- [x] **Histórico de preço** no `ProductDetail`: gráfico em SVG puro dos últimos 6
  meses, gerado de forma determinística a partir do id, com o menor preço
  destacado.
- [x] **Garantia e prazo de troca** no bloco de compra: selos com política de 7
  dias, garantia do fabricante e devolução grátis, vindos de `data/products.ts`.
- [x] **Guias de compra** em `/guias`: cinco artigos mocados, como "como escolher
  um notebook", com produtos relacionados ao final de cada um e link a partir da
  categoria correspondente.

### Fase 20 — Acessibilidade e experiência

- [x] **Auditoria de contraste dos tokens.** Verificar cada par de texto e fundo
  do `index.css` contra WCAG AA, 4.5:1 para texto normal. O `--ink-soft` sobre
  `--surface` e o branco sobre `--brand` são os suspeitos. Corrigir os tokens que
  reprovarem, nos dois temas.
- [x] **Marcos semânticos e link de pular.** `header`, `nav`, `main` e `footer`
  com papéis corretos, e um "pular para o conteúdo" visível ao focar, como
  primeiro elemento tabulável.
- [x] **Região de status para leitores de tela.** `aria-live="polite"` nos toasts
  e nas mudanças de carrinho, favoritos e filtros, sem repetir o mesmo anúncio.
- [x] **Foco ao trocar de rota.** Hoje o foco fica preso onde estava. Mover para o
  `h1` da página nova e anunciar o título, sem roubar o foco de campos.
- [x] **Modo de alto contraste** como terceira opção do alternador de tema, com
  bordas mais fortes e sem sombras.
- [x] **Tamanho de texto ajustável** em `/preferencias`: três níveis aplicados via
  `font-size` na raiz, persistidos, sem quebrar as grades.
- [x] **Estados vazios em todas as listas.** Favoritos, alertas, cupons, pedidos,
  devoluções, lojas seguidas e busca sem resultado: ilustração em SVG, uma frase
  e um botão que leva ao catálogo.
- [x] **Tela de offline do PWA.** Quando não houver rede, servir uma página própria
  com o que está em cache — carrinho e favoritos continuam acessíveis — em vez do
  erro do navegador.

### Fase 21 — Cadastro e login com senha

Hoje o `/entrar` aceita qualquer nome e e-mail, sem senha: a interface `User` em
`context/authCore.ts` não tem campo de credencial e `type="password"` não existe
em lugar nenhum do `src/`. Esta fase troca isso por cadastro e autenticação de
verdade.

O que isso é e o que não é: sem backend, a base de contas mora no `localStorage`
do próprio navegador. Isso protege a senha de ficar legível em texto puro e faz o
fluxo se comportar como o de um site real — mas **não** é segurança de servidor.
Quem abrir o DevTools apaga ou edita a base à vontade. Trate como simulação
fiel, não como proteção. Nenhuma senha real do usuário deve ser digitada aqui.

Regra que não pode quebrar: **comprar continua não exigindo conta.** Carrinho,
checkout, favoritos e acompanhamento de pedido seguem funcionando para visitante.

- [x] **Derivação de senha em `src/lib/crypto.ts`.** Usar a Web Crypto nativa
  (`crypto.subtle`), sem dependência nova: PBKDF2 com SHA-256, salt aleatório de
  16 bytes por conta, 100.000 iterações, saída de 32 bytes em hexadecimal.
  Expor `hashPassword(senha, salt)` e `verifyPassword(senha, salt, hash)` com
  comparação de tempo constante. Nunca gravar a senha em texto.
- [x] **Base de contas em `src/lib/accounts.ts`.** Persistir em
  `electronica:accounts` uma lista de `{ id, name, email, salt, hash, createdAt }`.
  E-mail normalizado em minúsculas e único — cadastro com e-mail já existente
  falha com mensagem clara. Nenhum campo de senha em claro no objeto.
- [x] **Página de cadastro em `/cadastro`.** Nome, e-mail, senha e confirmação de
senha, com validação por campo e erro abaixo de cada um. Ao concluir, cria a
conta, inicia a sessão e leva de volta para onde o usuário estava.
- [x] **Medidor de força da senha.** Mínimo de 8 caracteres; barra com níveis
  fraca, média e forte considerando tamanho, mistura de caixas, dígitos e
  símbolos; lista de regras que vão sendo marcadas conforme atendidas. Bloquear o
  envio enquanto estiver fraca.
- [x] **Refazer o `/entrar` para e-mail e senha.** Substituir os campos atuais de
  nome e e-mail por e-mail e senha, validando contra `lib/accounts.ts`. Em caso de
  falha, mensagem genérica — "e-mail ou senha inválidos" — sem revelar qual dos
  dois errou nem se o e-mail existe.
- [x] **Mostrar e ocultar a senha, e cooperar com gerenciadores.** Botão de olho
  com `aria-pressed` e rótulo que muda; `autocomplete="email"`,
  `autocomplete="current-password"` no login e `autocomplete="new-password"` no
  cadastro; `name` e `id` nos campos para que gerenciadores de senha reconheçam
  o formulário.
- [x] **Bloqueio após tentativas erradas.** Cinco falhas no mesmo e-mail bloqueiam
  novas tentativas por 15 minutos, persistido em `electronica:lockouts`, com
  contagem regressiva visível e as tentativas restantes exibidas antes de travar.
- [x] **Sessão com validade em `electronica:session`.** Guardar apenas o id da
  conta e um carimbo de expiração de 7 dias, renovado a cada uso. Sessão vencida
  cai para visitante e redireciona ao `/entrar` preservando o destino pretendido.
- [x] **Alterar senha em `/perfil`.** Exige a senha atual, valida a nova pelo
  mesmo medidor de força, impede repetir a anterior e regrava salt e hash.
  Confirmar com toast e manter a sessão ativa.
- [x] **Recuperação de senha mocada em `/recuperar`.** Como não existe envio de
  e-mail, gerar um código de 6 dígitos exibido na própria tela, válido por 10
  minutos e persistido; conferido o código, permite definir uma senha nova.
  Deixar explícito na interface que o código aparece ali por ser uma simulação.
- [x] **Migrar quem já estava "logado" pelo mock antigo.** Sessões gravadas no
  formato anterior viram uma conta sem senha; ao abrir o site, pedir uma vez que
  o usuário defina uma senha, sem perder pedidos, favoritos nem endereços já
  associados àquele e-mail.
- [x] **Preservar a compra como visitante.** Revisar checkout, carrinho,
  favoritos e `/pedidos` para que nenhum passe a exigir conta. Ao final de um
  pedido feito sem login, oferecer criar conta aproveitando os dados já
  preenchidos, com o pedido sendo vinculado se o usuário aceitar.
- [x] **Ligar o vendedor à conta.** O `sellerId` deixa de ser escolhido no
  `/entrar` e passa a ser um atributo da conta, definido em `/perfil`. As rotas
  `/vendedor/*` exigem conta com `sellerId` e mostram uma tela explicativa em vez
  de erro para quem não tiver.
- [x] **Testar `lib/crypto.ts` e `lib/accounts.ts`.** Com o runner da Fase 14:
  hash determinístico para o mesmo par de senha e salt, salts diferentes gerando
  hashes diferentes para a mesma senha, verificação correta aceitando e
  rejeitando, unicidade de e-mail e expiração de sessão.

### Fase 22 — Funcionalidades novas

Tudo continua sem backend e sem dependência nova. As APIs de navegador usadas
aqui (`SpeechRecognition`, `BarcodeDetector`, `Geolocation`) são nativas e
precisam de degradação elegante: se não existirem, a funcionalidade some da
interface em vez de quebrar.

- [x] **Avisar quando voltar ao estoque.** O alerta de preço em `lib/alerts.ts`
  só observa preço. Adicionar um segundo tipo para produto ou variação esgotada,
  com botão no `ProductDetail` quando o estoque for zero, listado em `/alertas`
  em uma aba própria e notificando pelo sino do `Navbar`.
 - [x] **Listas personalizadas.** Hoje existe uma lista única de favoritos. Permitir
  criar várias listas nomeadas ("presentes", "setup novo"), mover e copiar itens
  entre elas, renomear e excluir, persistido em `electronica:lists`. A tela
  `/favoritos` passa a mostrar as listas.
- [x] **Compartilhar lista ou carrinho por link.** Codificar os ids e quantidades
  em base64 na própria URL — sem backend — gerando algo como
  `/lista?d=...`. Ao abrir, mostrar os itens e oferecer copiar para o próprio
  carrinho ou para uma lista. Avisar quando um item não existir mais.
- [x] **Busca por voz.** Botão de microfone no `Navbar` usando
  `webkitSpeechRecognition` em pt-BR, com estado de escuta, transcrição no campo
  e envio automático. Esconder o botão onde a API não existir.
- [x] **Leitor de código de barras.** Botão de câmera na busca usando
  `BarcodeDetector`, casando o código lido com um novo campo `ean` em
  `data/products.ts`. Onde a API faltar, oferecer digitar o código à mão.
- [x] **Retirada em ponto de coleta.** Base mocada em `src/data/pickup.ts` com 12
  pontos e seus horários. No checkout, alternativa à entrega: escolher o ponto
  mais próximo do CEP, com frete zerado e prazo próprio, refletido na confirmação
  e no rastreamento.
- [x] **Agendar a data de entrega.** Na etapa de entrega, calendário com os
  próximos 15 dias úteis, faixas de horário (manhã, tarde, noite) e taxa extra
  para entrega agendada, tudo somado ao total.
- [x] **Pagamento dividido em dois cartões.** No checkout, opção de repartir o
  total entre dois cartões salvos, com valor por cartão validado para fechar
  exatamente o total e parcelas calculadas separadamente.
- [x] **Cashback em reais.** Distinto das moedas: percentual por categoria
  creditado ao concluir o pedido, com extrato em `/cashback`, saldo aplicável
  como desconto no checkout e prazo de liberação de 30 dias após a entrega.
- [x] **Níveis de fidelidade.** Bronze, prata e ouro calculados pelo total gasto
  nos últimos 12 meses, com benefícios por nível (cashback maior, frete grátis a
  partir de valor menor), selo no `/perfil` e barra de progresso para o próximo
  nível.
- [x] **Novidades das lojas seguidas** em `/novidades`: feed cronológico com
  lançamentos, promoções e respostas das lojas que o usuário segue, gerado de
  forma determinística, com contador de não lidas no `Navbar`.
- [x] **Avaliar o vendedor.** Separado da avaliação do produto: nota de
  atendimento, embalagem e prazo, disponível em `/pedidos/:id` após a entrega,
  compondo a reputação exibida no `SellerBlock` e na `/loja/:id`.
- [x] **Denunciar anúncio.** Botão discreto no `ProductDetail` com motivos
  (preço enganoso, produto proibido, imagem indevida), protocolo persistido e
  confirmação. O anúncio denunciado fica marcado localmente para o usuário.
- [x] **Privacidade e dados em `/privacidade`.** Listar todas as chaves
  `electronica:` em uso e o que cada uma guarda; botão para exportar tudo em um
  JSON baixável via `Blob`; e botão para apagar categorias de dados ou tudo, com
  confirmação em duas etapas.
- [x] **Tour guiado na primeira visita.** Sobreposição em 5 passos apontando
  busca, categorias, carrinho, favoritos e conta, com "pular" sempre visível,
  navegação por teclado e marcação em `electronica:tourSeen` para não repetir.

### Fase 23 — Revisão final

Última tarefa do backlog. Só entra quando todas as anteriores estiverem `[x]`.

- [x] **Varredura geral de layout, espaçamento, lógica e responsividade em tudo
  que foi construído.** Percorrer **todas** as rotas registradas no `App.tsx` uma
  a uma — as 30 atuais mais as criadas pelas fases 16 a 22 —, com
  `npm run build && npm run preview`, nas larguras 360, 414, 768, 1024, 1440 e
  1920 px, e corrigir o que aparecer. Verificar em cada tela:
  - **Espaçamento e margem** — a escala de 24 / 40 / 64 px definida na Fase 6.1
    está aplicada de forma consistente entre seções e blocos; nenhum respiro
    solto fora dela; padding interno dos cards igual em toda a aplicação.
  - **Layout** — nada cortado, sobreposto ou escondido atrás do cabeçalho fixo;
    nenhuma rolagem horizontal indesejada; grades ocupando a largura do contêiner
    sem parar na metade; imagens com proporção reservada e sem salto ao carregar.
  - **Responsividade** — a grade densa cai de 6 para 2 colunas como manda a
    identidade visual; tabelas do painel do vendedor rolam ou viram cartões no
    celular; modais, drawers e o mega menu cabem na tela e são fecháveis; áreas
    de toque de no mínimo 44 px.
  - **Lógica** — totais, descontos, cupons empilhados, cashback, moedas e frete
    conferem em casos de borda (carrinho vazio, um item, estoque zerado, cupom
    expirado, sessão vencida); estados de carregamento, vazio e erro existem em
    toda lista; nenhum caminho leva a tela branca.
  - **Consistência** — preço, selos, botões e títulos com a mesma aparência em
    todas as telas; textos em português; foco visível em tudo que é focável.

  Abrir uma linha `- [ ]` nova nesta fase para cada defeito encontrado, corrigir
  um por vez seguindo as regras do loop, e só encerrar quando a varredura
  completa passar sem achados novos e `npm run check` estiver verde.

## Regras do loop

1. Execute **uma** tarefa por iteração — a primeira não marcada.
2. Leia os arquivos que vai alterar antes de editar.
3. Depois de editar, rode `npm run build`. Se falhar, conserte antes de encerrar.
4. Só marque `[x]` quando a tarefa estiver concluída **e** o build passar.
5. Não instale dependências novas.
6. Não reescreva o que já funciona; faça a menor mudança que resolve.
7. Interface em português.
