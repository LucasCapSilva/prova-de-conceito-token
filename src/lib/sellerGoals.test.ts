import test from "node:test";
import assert from "node:assert/strict";

import {
  clearGoal,
  getGoal,
  monthInfo,
  monthRevenueFor,
  projectMonthEnd,
  setGoal,
} from "./sellerGoals.ts";
import type { Order, OrderItem, OrderStatus } from "./orders.ts";

function mkItem(
  id: string,
  name: string,
  seller: string,
  qty: number,
  price: number,
): OrderItem {
  return { id, name, image: "", qty, price, seller };
}

interface OrderInput {
  id: string;
  createdAt: string;
  status?: OrderStatus;
  items: OrderItem[];
  total: number;
}

function mkOrder(input: OrderInput): Order {
  const address = {
    name: "",
    cpf: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
  };
  return {
    id: input.id,
    createdAt: input.createdAt,
    status: input.status ?? "delivered",
    items: input.items,
    subtotal: input.total,
    discount: 0,
    shipping: 0,
    total: input.total,
    payment: "pix",
    address,
    deliveryDays: 0,
    tracking: "",
    estimatedDate: "",
  };
}

test("setGoal/getGoal faz o round-trip e clearGoal remove", () => {
  const before = getGoal("seller-a");
  const saved = setGoal("seller-a", 5000);
  try {
    assert.equal(saved, 5000);
    assert.equal(getGoal("seller-a"), 5000);
    clearGoal("seller-a");
    assert.equal(getGoal("seller-a"), null);
  } finally {
    if (before === null) clearGoal("seller-a");
    else setGoal("seller-a", before);
  }
});

test("setGoal ignora valores inválidos", () => {
  const before = getGoal("seller-bad");
  setGoal("seller-bad", 100);
  try {
    const after = setGoal("seller-bad", -10);
    assert.equal(after, 100);
    setGoal("seller-bad", Number.NaN);
    assert.equal(getGoal("seller-bad"), 100);
  } finally {
    clearGoal("seller-bad");
    void before;
  }
});

test("monthRevenueFor soma só o mês calendário atual e ignora cancelados", () => {
  const now = new Date(2026, 7, 25).getTime();
  const orders = [
    mkOrder({
      id: "o1",
      createdAt: new Date(2026, 7, 3).toISOString(),
      items: [mkItem("p1", "Fone", "Loja A", 1, 100)],
      total: 120,
    }),
    mkOrder({
      id: "o2",
      createdAt: new Date(2026, 6, 30).toISOString(),
      items: [mkItem("p2", "Mouse", "Loja A", 1, 80)],
      total: 80,
    }),
    mkOrder({
      id: "o3",
      createdAt: new Date(2026, 7, 10).toISOString(),
      status: "cancelled",
      items: [mkItem("p3", "Teclado", "Loja A", 1, 300)],
      total: 300,
    }),
    mkOrder({
      id: "o4",
      createdAt: new Date(2026, 7, 15).toISOString(),
      items: [mkItem("p4", "Monitor", "Loja B", 1, 400)],
      total: 400,
    }),
  ];
  assert.equal(monthRevenueFor("Loja A", orders, now), 120);
  assert.equal(monthRevenueFor("Loja B", orders, now), 400);
  assert.equal(monthRevenueFor("Loja Z", orders, now), 0);
});

test("monthInfo traz os dias do mês e a fração decorrida", () => {
  const now = new Date(2026, 7, 25).getTime();
  const info = monthInfo(now);
  assert.equal(info.year, 2026);
  assert.equal(info.month, 7);
  assert.equal(info.dayOfMonth, 25);
  assert.equal(info.daysInMonth, 31);
  assert.equal(info.daysLeft, 6);
  assert.ok(Math.abs(info.fraction - 25 / 31) < 1e-9);
});

test("projectMonthEnd extrapola linearmente o acumulado", () => {
  const now = new Date(2026, 7, 25).getTime();
  assert.equal(projectMonthEnd(250, now), (250 * 31) / 25);
  assert.equal(projectMonthEnd(0, now), 0);
  const first = new Date(2026, 7, 1).getTime();
  assert.equal(projectMonthEnd(100, first), 100 * 31);
});
