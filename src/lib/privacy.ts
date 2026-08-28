import {
  allKeys,
  readRaw,
  remove,
  STORAGE_PREFIX,
} from "./storage.ts";

export interface PrivacyKey {
  key: string;
  label: string;
}

export interface PrivacyCategory {
  id: string;
  label: string;
  description: string;
  keys: PrivacyKey[];
}

export const PRIVACY_CATEGORIES: PrivacyCategory[] = [
  {
    id: "conta",
    label: "Conta e sessão",
    description:
      "Dados de acesso, tentativas de login, recuperação de senha e a sessão atual.",
    keys: [
      { key: "accounts", label: "Contas cadastradas" },
      { key: "session", label: "Sessão ativa" },
      { key: "lockouts", label: "Bloqueios de login" },
      { key: "recovery", label: "Códigos de recuperação" },
      { key: "user", label: "Usuário logado" },
      { key: "pwHint", label: "Avisos de senha" },
      { key: "accountPromptDismissed", label: "Avisos de conta ignorados" },
    ],
  },
  {
    id: "pedidos",
    label: "Pedidos e pós-venda",
    description:
      "Pedidos, devoluções, avaliações, denúncias e conversas com vendedores.",
    keys: [
      { key: "orders", label: "Pedidos" },
      { key: "returns", label: "Solicitações de devolução" },
      { key: "myreviews", label: "Suas avaliações" },
      { key: "sellerratings", label: "Suas avaliações de vendedores" },
      { key: "review:reports", label: "Denúncias de avaliações" },
      { key: "ad:reports", label: "Denúncias de anúncios" },
      { key: "questions", label: "Perguntas enviadas" },
      { key: "chat", label: "Conversas com vendedores" },
    ],
  },
  {
    id: "carrinho",
    label: "Carrinho e compra",
    description:
      "Itens do carrinho, salvos para depois, rascunho do checkout e cupons coletados.",
    keys: [
      { key: "cart", label: "Carrinho" },
      { key: "savelater", label: "Itens salvos para depois" },
      { key: "checkoutDraft", label: "Rascunho do checkout" },
      { key: "coupons", label: "Cupons coletados" },
    ],
  },
  {
    id: "fidelidade",
    label: "Fidelidade e recompensas",
    description: "Moedas, check-in diário e cashback acumulado.",
    keys: [
      { key: "coins", label: "Moedas de fidelidade" },
      { key: "checkin", label: "Check-in diário" },
      { key: "cashback", label: "Cashback" },
    ],
  },
  {
    id: "listas",
    label: "Favoritos, listas e lojas",
    description:
      "Favoritos, listas personalizadas, lojas seguidas e alertas de preço/estoque.",
    keys: [
      { key: "favorites", label: "Favoritos" },
      { key: "lists", label: "Listas personalizadas" },
      { key: "follows", label: "Lojas seguidas" },
      { key: "alerts", label: "Alertas de preço e estoque" },
    ],
  },
  {
    id: "navegacao",
    label: "Navegação e preferências",
    description:
      "Histórico de navegação, busca, filtros salvos, tema e preferências de notificação.",
    keys: [
      { key: "recent", label: "Vistos recentemente" },
      { key: "search:history", label: "Histórico de busca" },
      { key: "savedFilters", label: "Filtros salvos" },
      { key: "theme", label: "Tema escolhido" },
      { key: "textSize", label: "Tamanho do texto" },
      { key: "notif:prefs", label: "Preferências de notificação" },
      { key: "notifs:seen", label: "Notificações lidas" },
      { key: "novidades:seen", label: "Novidades lidas" },
    ],
  },
  {
    id: "pessoal",
    label: "Endereços e cartões",
    description: "Endereços salvos e dados de cartões salvos.",
    keys: [
      { key: "addresses", label: "Endereços" },
      { key: "cards", label: "Cartões salvos" },
    ],
  },
  {
    id: "vendedor",
    label: "Painel do vendedor",
    description:
      "Alterações de produtos, promoções, cupons, respostas e metas do seu painel de vendedor.",
    keys: [
      { key: "seller:overrides", label: "Alterações de produtos" },
      { key: "seller:customProducts", label: "Produtos cadastrados" },
      { key: "seller:promos", label: "Promoções" },
      { key: "seller:coupons", label: "Cupons do vendedor" },
      { key: "seller:replies", label: "Respostas a avaliações" },
      { key: "seller:goal", label: "Meta mensal" },
    ],
  },
  {
    id: "app",
    label: "Aplicativo",
    description: "Versão de dados interna do aplicativo.",
    keys: [{ key: "schema", label: "Versão de dados" }],
  },
];

export function keyExists(key: string): boolean {
  return readRaw(key) !== null;
}

export function exportAllData(): string {
  const out: Record<string, unknown> = {};
  for (const full of allKeys()) {
    const bare = full.startsWith(STORAGE_PREFIX)
      ? full.slice(STORAGE_PREFIX.length)
      : full;
    const raw = readRaw(bare);
    if (raw === null) continue;
    try {
      out[bare] = JSON.parse(raw);
    } catch {
      out[bare] = raw;
    }
  }
  return JSON.stringify(out, null, 2);
}

export function deleteCategoryKeys(cat: PrivacyCategory): void {
  for (const k of cat.keys) remove(k.key);
}

export function deleteAllData(): void {
  for (const full of allKeys()) {
    const bare = full.startsWith(STORAGE_PREFIX)
      ? full.slice(STORAGE_PREFIX.length)
      : full;
    remove(bare);
  }
}
