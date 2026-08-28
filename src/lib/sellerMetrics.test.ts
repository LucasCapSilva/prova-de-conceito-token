import test from "node:test";
import assert from "node:assert/strict";
import type { Product } from "../data/products";
import type { Order, OrderItem, Address } from "./orders.ts";
import {
  sellerMetrics,
  simulatedVisits,
  NO_SALE_PERIOD_DAYS,
} from "./sellerMetrics.ts";

function mkProduct(id: string, name: string): Product {
  return {
    id,
    name,
    category: "audio",
    price: 100,
    rating: 4,
    reviews: 10,
    sold: 5,
    image: `https://picsum.photos/seed/${id}/400/400`,
    gallery: [],
    description: "Produto de teste.",
    highlights: ["Teste"],
    brand: "Teste",
    sellerId: "seller-teste",
    stock: 10,
    freeShipping: false,
    condition: "novo",
    warrantyMonths: 12,
    freeReturn: false,
    exchangeDays: 7,
    installments: { count: 10, value: 10 },
  };
}

const ADDRESS: Address = {
  name: "Cliente",
  cpf: "12345678909",
  cep: "01001000",
  street: "Rua A",
  number: "1",
  complement: "",
  city: "Cidade",
  state: "SP",
};

function mkOrder(overrides: {
  id: string;
  createdAt: string;
  items: OrderItem[];
  status?: Order["status"];
  total?: number;
}): Order {
  return {
    id: overrides.id,
    createdAt: overrides.createdAt,
    status: overrides.status ?? "delivered",
    items: overrides.items,
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: overrides.total ?? 0,
    payment: "pix",
    address: ADDRESS,
    deliveryDays: 3,
    tracking: "TRACK",
    estimatedDate: "2026-01-01",
  };
}

const SELLER = "Loja Teste";
const A = mkProduct("p-a", "Produto A");
const B = mkProduct("p-b", "Produto B");

const NOW = new Date("2026-08-25T12:00:00Z").getTime();

function item(id: string, qty: number, seller = SELLER): OrderItem {
  return { id, name: id, image: "", qty, price: 100, seller };
}

test("ticket médio é o total dividido pelos pedidos não cancelados", () => {
  const orders = [
    mkOrder({ id: "o1", createdAt: new Date(NOW).toISOString(), items: [item("p-a", 1)], total: 100 }),
    mkOrder({ id: "o2", createdAt: new Date(NOW).toISOString(), items: [item("p-b", 2)], total: 200 }),
    mkOrder({ id: "o3", createdAt: new Date(NOW).toISOString(), items: [item("p-a", 1)], status: "cancelled", total: 999 }),
  ];
  const m = sellerMetrics(SELLER, [A, B], orders, NOW);
  assert.equal(m.orderCount, 2);
  assert.ok(Math.abs(m.averageTicket - 150) < 1e-9);
  assert.ok(Math.abs(m.revenue - 300) < 1e-9);
});

test("conversão simulada é determinística e limitada a 100%", () => {
  const orders = [
    mkOrder({ id: "o1", createdAt: new Date(NOW).toISOString(), items: [item("p-a", 1)], total: 100 }),
  ];
  const m1 = sellerMetrics(SELLER, [A, B], orders, NOW);
  const m2 = sellerMetrics(SELLER, [A, B], orders, NOW);
  assert.equal(m1.conversionRate, m2.conversionRate);
  assert.ok(m1.visits > 0);
  assert.ok(m1.conversionRate <= 100);
  assert.ok(m1.conversionRate > 0);
});

test("produtos sem venda no período: itens fora dos 30 dias não contam", () => {
  const tenDays = new Date(NOW - 10 * 86400000).toISOString();
  const old = new Date(NOW - (NO_SALE_PERIOD_DAYS + 10) * 86400000).toISOString();
  const recent = [
    mkOrder({ id: "o1", createdAt: tenDays, items: [item("p-a", 1)], total: 100 }),
  ];
  let m = sellerMetrics(SELLER, [A, B], recent, NOW);
  assert.ok(!m.noSaleProductIds.includes("p-a"));
  assert.ok(m.noSaleProductIds.includes("p-b"));

  const oldOnly = [
    mkOrder({ id: "o2", createdAt: old, items: [item("p-a", 1)], total: 100 }),
  ];
  m = sellerMetrics(SELLER, [A, B], oldOnly, NOW);
  assert.deepEqual(m.noSaleProductIds, ["p-a", "p-b"]);
});

test("mais vendido usa a maior quantidade entre os pedidos", () => {
  const orders = [
    mkOrder({ id: "o1", createdAt: new Date(NOW).toISOString(), items: [item("p-a", 3)], total: 300 }),
    mkOrder({ id: "o2", createdAt: new Date(NOW).toISOString(), items: [item("p-b", 5)], total: 500 }),
  ];
  const m = sellerMetrics(SELLER, [A, B], orders, NOW);
  assert.equal(m.topProduct?.id, "p-b");
  assert.equal(m.topProduct?.qty, 5);
});

test("sem pedidos devolve zeros e tudo sem venda", () => {
  const m = sellerMetrics(SELLER, [A, B], [], NOW);
  assert.equal(m.orderCount, 0);
  assert.equal(m.averageTicket, 0);
  assert.equal(m.revenue, 0);
  assert.equal(m.topProduct, null);
  assert.deepEqual(m.noSaleProductIds, ["p-a", "p-b"]);
  assert.equal(m.conversionRate, 0);
});

test("simulatedVisits é determinístico por produto", () => {
  assert.equal(simulatedVisits([A, B]), simulatedVisits([A, B]));
  assert.ok(simulatedVisits([A]) < simulatedVisits([A, B]));
});

test("pedidos de outro vendedor não entram nas métricas", () => {
  const orders = [
    mkOrder({ id: "o1", createdAt: new Date(NOW).toISOString(), items: [item("p-a", 2, "Outra Loja")], total: 200 }),
  ];
  const m = sellerMetrics(SELLER, [A, B], orders, NOW);
  assert.equal(m.orderCount, 0);
  assert.equal(m.topProduct, null);
  assert.deepEqual(m.noSaleProductIds, ["p-a", "p-b"]);
});
