import { read, write } from "./storage.ts";
import {
  CATEGORIES,
  getProduct,
  type Category,
  type Product,
} from "../data/products.ts";
import type { Order } from "./orders.ts";
import { cashbackBonusPercent } from "./loyalty.ts";

export interface CashbackEntry {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  category: Category;
  percent: number;
  amountCents: number;
  createdAt: string;
  releaseAt: string;
}

export interface CashbackUse {
  id: string;
  orderId: string;
  amountCents: number;
  createdAt: string;
}

interface CashbackState {
  entries: CashbackEntry[];
  uses: CashbackUse[];
}

const KEY = "cashback";

export const RELEASE_DAYS = 30;

export const CASHBACK_PERCENT: Record<Category, number> = {
  audio: 5,
  mobile: 4,
  computadores: 3,
  wearables: 2,
  gamer: 4,
  casa: 2,
};

function loadState(): CashbackState {
  const raw = read<CashbackState | null>(KEY, null);
  return {
    entries: Array.isArray(raw?.entries) ? raw.entries : [],
    uses: Array.isArray(raw?.uses) ? raw.uses : [],
  };
}

function saveState(state: CashbackState) {
  write(KEY, state);
}

export function categoryLabel(category: Category): string {
  return CATEGORIES.find((c) => c.key === category)?.label ?? category;
}

function addDays(dateOnly: string, days: number): string {
  const d = new Date(`${dateOnly}T12:00:00`);
  if (!Number.isFinite(d.getTime())) {
    return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  }
  d.setTime(d.getTime() + days * 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Credita o cashback por categoria para cada item de um pedido concluído. */
export function creditCashback(order: Order): number {
  const state = loadState();
  let credited = 0;
  for (const item of order.items) {
    const product: Product | undefined = getProduct(item.id);
    if (!product) continue;
    const percent =
      (CASHBACK_PERCENT[product.category] ?? 0) + cashbackBonusPercent();
    if (percent <= 0) continue;
    const amountCents = Math.round(item.price * item.qty * (percent / 100) * 100);
    if (amountCents <= 0) continue;
    credited += amountCents;
    state.entries.push({
      id:
        "cb-" +
        order.id +
        "-" +
        item.id +
        "-" +
        Math.random().toString(36).slice(2, 6),
      orderId: order.id,
      productId: item.id,
      productName: item.name,
      category: product.category,
      percent,
      amountCents,
      createdAt: order.createdAt,
      releaseAt: addDays(order.estimatedDate, RELEASE_DAYS),
    });
  }
  if (credited > 0) saveState(state);
  return credited;
}

function releasedTotal(state: CashbackState): number {
  const today = new Date().toISOString().slice(0, 10);
  return state.entries
    .filter((e) => e.releaseAt <= today)
    .reduce((acc, e) => acc + e.amountCents, 0);
}

function usedTotal(state: CashbackState): number {
  return state.uses.reduce((acc, u) => acc + u.amountCents, 0);
}

/** Saldo em centavos: créditos liberados menos o já utilizado. */
export function availableCashback(): number {
  const state = loadState();
  return Math.max(0, releasedTotal(state) - usedTotal(state));
}

/** Consome saldo disponível para um pedido, limitado ao que houver. */
export function applyCashback(orderId: string, amountCents: number): number {
  const state = loadState();
  const amount = Math.min(
    Math.max(0, Math.round(amountCents)),
    Math.max(0, releasedTotal(state) - usedTotal(state))
  );
  if (amount <= 0) return 0;
  state.uses.push({
    id: "cbu-" + orderId + "-" + Math.random().toString(36).slice(2, 6),
    orderId,
    amountCents: amount,
    createdAt: new Date().toISOString(),
  });
  saveState(state);
  return amount;
}

export interface CashbackStatement {
  entries: CashbackEntry[];
  uses: CashbackUse[];
  availableCents: number;
  creditedCents: number;
  usedCents: number;
}

export function cashbackStatement(): CashbackStatement {
  const state = loadState();
  const entries = [...state.entries].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const uses = [...state.uses].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  return {
    entries,
    uses,
    availableCents: availableCashback(),
    creditedCents: entries.reduce((acc, e) => acc + e.amountCents, 0),
    usedCents: uses.reduce((acc, u) => acc + u.amountCents, 0),
  };
}
