import { getOrders } from "./orders.ts";

export type LoyaltyLevelId = "bronze" | "prata" | "ouro";

export interface LoyaltyTier {
  id: LoyaltyLevelId;
  label: string;
  min: number;
  cashbackBonus: number;
  freeShipAt: number;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { id: "bronze", label: "Bronze", min: 0, cashbackBonus: 0, freeShipAt: 999 },
  { id: "prata", label: "Prata", min: 1000, cashbackBonus: 1, freeShipAt: 799 },
  { id: "ouro", label: "Ouro", min: 5000, cashbackBonus: 2, freeShipAt: 599 },
];

const YEAR_MS = 365 * 86400000;

/** Total gasto nos últimos 12 meses, somando pedidos não cancelados. */
export function spentLast12Months(): number {
  const cutoff = Date.now() - YEAR_MS;
  return getOrders()
    .filter((o) => o.status !== "cancelled")
    .filter((o) => new Date(o.createdAt).getTime() >= cutoff)
    .reduce((acc, o) => acc + o.total, 0);
}

export interface LoyaltyStatus {
  level: LoyaltyTier;
  next: LoyaltyTier | null;
  spent: number;
  progress: number;
  toNext: number;
}

export function loyaltyStatus(): LoyaltyStatus {
  const spent = spentLast12Months();
  let level = LOYALTY_TIERS[0];
  for (const tier of LOYALTY_TIERS) {
    if (spent >= tier.min) level = tier;
  }
  const next = LOYALTY_TIERS.find((t) => t.min > level.min) ?? null;
  const range = next ? next.min - level.min : 1;
  const progress = next
    ? Math.min(1, Math.max(0, spent / range))
    : 1;
  const toNext = next ? Math.max(0, next.min - spent) : 0;
  return { level, next, spent, progress, toNext };
}

/** Pontos percentuais de cashback extra do nível atual. */
export function cashbackBonusPercent(): number {
  return loyaltyStatus().level.cashbackBonus;
}

/** Limite de subtotal para frete grátis do nível atual. */
export function freeShipThreshold(): number {
  return loyaltyStatus().level.freeShipAt;
}
