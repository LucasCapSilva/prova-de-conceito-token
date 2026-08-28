import type { Product } from "../data/products";
import type { Order } from "./orders.ts";

export interface TopProduct {
  id: string;
  name: string;
  qty: number;
}

export interface SellerMetrics {
  orderCount: number;
  revenue: number;
  averageTicket: number;
  visits: number;
  conversionRate: number;
  noSaleProductIds: string[];
  topProduct: TopProduct | null;
}

/** Período considerado para "produtos sem venda". */
export const NO_SALE_PERIOD_DAYS = 30;

export function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

/** Visitas simuladas e determinísticas por loja. */
export function simulatedVisits(products: Product[]): number {
  return products.reduce(
    (acc, p) => acc + 40 + (hashStr(`visits:${p.id}`) % 120),
    0,
  );
}

/**
 * Métricas derivadas dos pedidos gravados: ticket médio, conversão simulada,
 * produtos sem venda no período e o mais vendido.
 */
export function sellerMetrics(
  sellerName: string,
  products: Product[],
  orders: Order[],
  now: number = Date.now(),
): SellerMetrics {
  const sellerOrders = orders.filter(
    (o) =>
      o.status !== "cancelled" &&
      o.items.some((it) => it.seller === sellerName),
  );

  const orderCount = sellerOrders.length;
  const revenue = sellerOrders.reduce((acc, o) => acc + o.total, 0);
  const averageTicket = orderCount > 0 ? revenue / orderCount : 0;

  const visits = simulatedVisits(products);
  const conversionRate =
    visits > 0 ? Math.min(100, (orderCount / visits) * 100) : 0;

  const periodStart = now - NO_SALE_PERIOD_DAYS * 86400000;
  const periodSales = new Map<string, number>();
  const totalSales = new Map<string, number>();
  for (const o of sellerOrders) {
    const inPeriod = new Date(o.createdAt).getTime() >= periodStart;
    for (const it of o.items) {
      if (it.seller !== sellerName) continue;
      totalSales.set(it.id, (totalSales.get(it.id) ?? 0) + it.qty);
      if (inPeriod) {
        periodSales.set(it.id, (periodSales.get(it.id) ?? 0) + it.qty);
      }
    }
  }

  const noSaleProductIds = products
    .filter((p) => (periodSales.get(p.id) ?? 0) === 0)
    .map((p) => p.id);

  let topProduct: TopProduct | null = null;
  if (totalSales.size > 0) {
    for (const p of products) {
      const qty = totalSales.get(p.id) ?? 0;
      if (qty > 0 && qty > (topProduct?.qty ?? 0)) {
        topProduct = { id: p.id, name: p.name, qty };
      }
    }
  }

  return {
    orderCount,
    revenue,
    averageTicket,
    visits,
    conversionRate,
    noSaleProductIds,
    topProduct,
  };
}
