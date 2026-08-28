import { read, write } from "./storage.ts";
import type { Order } from "./orders.ts";

const KEY = "seller:goal";

type GoalMap = Record<string, number>;

function load(): GoalMap {
  const raw = read<unknown>(KEY, null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: GoalMap = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return out;
}

function persist(map: GoalMap): void {
  write(KEY, map);
}

/** Meta mensal (em reais) definida pelo vendedor, ou `null` se ainda não houver. */
export function getGoal(sellerId: string): number | null {
  return load()[sellerId] ?? null;
}

/** Define a meta mensal; ignora valores inválidos. */
export function setGoal(sellerId: string, amount: number): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return getGoal(sellerId);
  const map = load();
  map[sellerId] = Math.round(amount * 100) / 100;
  persist(map);
  return map[sellerId];
}

/** Remove a meta do vendedor. */
export function clearGoal(sellerId: string): void {
  const map = load();
  delete map[sellerId];
  persist(map);
}

/** Faturamento do vendedor no mês calendário atual (pedidos não cancelados). */
export function monthRevenueFor(
  sellerName: string,
  orders: Order[],
  now: number = Date.now(),
): number {
  const d = new Date(now);
  const year = d.getFullYear();
  const month = d.getMonth();
  return orders
    .filter(
      (o) =>
        o.status !== "cancelled" &&
        o.items.some((it) => it.seller === sellerName),
    )
    .filter((o) => {
      const c = new Date(o.createdAt);
      return (
        Number.isFinite(c.getTime()) &&
        c.getFullYear() === year &&
        c.getMonth() === month
      );
    })
    .reduce((acc, o) => acc + o.total, 0);
}

/** Informações do mês calendário da data informada. */
export function monthInfo(now: number = Date.now()) {
  const d = new Date(now);
  const year = d.getFullYear();
  const month = d.getMonth();
  const dayOfMonth = d.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return {
    year,
    month,
    dayOfMonth,
    daysInMonth,
    daysLeft: daysInMonth - dayOfMonth,
    fraction: dayOfMonth / daysInMonth,
  };
}

/**
 * Projeção linear do faturamento até o fim do mês: extrapola o acumulado
 * pela fração do mês já decorrida.
 */
export function projectMonthEnd(
  monthRevenue: number,
  now: number = Date.now(),
): number {
  const { fraction } = monthInfo(now);
  if (fraction <= 0) return 0;
  return monthRevenue / fraction;
}
