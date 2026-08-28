import { read, write } from "./storage";

export interface ChatMessage {
  id: string;
  sellerId: string;
  from: "user" | "seller";
  text: string;
  at: string;
}

const KEY = "chat";

function loadAll(): Record<string, ChatMessage[]> {
  const parsed: unknown = read<unknown>(KEY, null);
  if (!parsed || typeof parsed !== "object") return {};
  const out: Record<string, ChatMessage[]> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      out[k] = (v as ChatMessage[]).filter(
        (m) => m && typeof m.id === "string" && typeof m.text === "string"
      );
    }
  }
  return out;
}

function persistAll(all: Record<string, ChatMessage[]>) {
  write(KEY, all);
}

export function chatFor(sellerId: string): ChatMessage[] {
  return loadAll()[sellerId] ?? [];
}

export function appendChat(
  sellerId: string,
  msg: Omit<ChatMessage, "id" | "sellerId" | "at">
): ChatMessage {
  const full: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sellerId,
    text: msg.text,
    from: msg.from,
    at: new Date().toISOString(),
  };
  const all = loadAll();
  const list = all[sellerId] ? [...all[sellerId], full] : [full];
  all[sellerId] = list;
  persistAll(all);
  return full;
}

export const SELLER_AUTO_REPLIES = [
  "Olá! Obrigado por entrar em contato. Como posso ajudar?",
  "Sim, temos esse produto em estoque. Pode fechar o pedido normalmente.",
  "O prazo de envio é de 1 a 2 dias úteis após a confirmação.",
  "A garantia é de 12 meses contra defeitos de fabricação.",
  "Sim, emitimos nota fiscal em todos os pedidos.",
  "Qualquer dúvida, é só chamar! Estou à disposição.",
];

export function autoReplyFor(count: number): string {
  return SELLER_AUTO_REPLIES[count % SELLER_AUTO_REPLIES.length];
}
