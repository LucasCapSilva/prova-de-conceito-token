import { read, write } from "./storage";
import { PRODUCTS, type Product } from "../data/products";
import { getSeller, type Seller } from "../data/sellers";

export type NovidadeKind = "lancamento" | "promocao" | "resposta";

export interface Novidade {
  id: string;
  sellerId: string;
  kind: NovidadeKind;
  title: string;
  text: string;
  product?: Product;
  date: Date;
}

const KINDS: NovidadeKind[] = ["lancamento", "promocao", "resposta"];
const SEEN_KEY = "novidades:seen";

function seed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function feedFor(seller: Seller): Novidade[] {
  const products = PRODUCTS.filter((p) => p.sellerId === seller.id);
  if (products.length === 0) return [];
  const count = 3 + (seed(seller.id + ":n") % 3);
  const out: Novidade[] = [];
  for (let i = 0; i < count; i += 1) {
    const s = seed(`${seller.id}:${i}`);
    const product = products[s % products.length];
    const kind = KINDS[s % 3];
    const daysAgo = i + 1;
    const date = new Date(
      Date.now() - daysAgo * 86400000 - (s % 100) * 3600000,
    );
    const off = 10 + (s % 31);
    if (kind === "lancamento") {
      out.push({
        id: `${seller.id}-n${i}`,
        sellerId: seller.id,
        kind,
        title: `Novidade na loja: ${product.name}`,
        text: `${product.name} acabou de entrar no catálogo da ${seller.name}.`,
        product,
        date,
      });
    } else if (kind === "promocao") {
      out.push({
        id: `${seller.id}-n${i}`,
        sellerId: seller.id,
        kind,
        title: `${product.name} em promoção`,
        text: `${product.name} com ${off}% de desconto por tempo limitado na ${seller.name}.`,
        product,
        date,
      });
    } else {
      out.push({
        id: `${seller.id}-n${i}`,
        sellerId: seller.id,
        kind,
        title: `${seller.name} respondeu uma pergunta`,
        text: `A equipe da ${seller.name} respondeu às dúvidas dos clientes sobre o atendimento.`,
        product,
        date,
      });
    }
  }
  return out;
}

export function novidadesFeed(follows: string[]): Novidade[] {
  const all: Novidade[] = [];
  for (const id of follows) {
    const seller = getSeller(id);
    if (!seller) continue;
    all.push(...feedFor(seller));
  }
  return all.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function lastNovidadesSeen(): number {
  return read<number>(SEEN_KEY, 0);
}

export function markNovidadesSeen(): void {
  write(SEEN_KEY, Date.now());
}

export function isNovidadeUnread(n: Novidade, seen: number): boolean {
  return n.date.getTime() > seen;
}

export function unreadCount(follows: string[]): number {
  const seen = lastNovidadesSeen();
  return novidadesFeed(follows).filter((n) => isNovidadeUnread(n, seen)).length;
}
