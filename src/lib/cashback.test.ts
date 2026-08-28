import test from "node:test";
import assert from "node:assert/strict";
import { remove } from "./storage.ts";
import type { Order, OrderItem } from "./orders.ts";
import {
  CASHBACK_PERCENT,
  creditCashback,
  availableCashback,
  applyCashback,
  cashbackStatement,
} from "./cashback.ts";

const AUDIO_ID = "headphone-open-air";
const MOBILE_ID = "smartphone-nova-x";

function mkItem(id: string, price: number, qty = 1): OrderItem {
  return { id, name: "Item teste", image: "", qty, price, seller: "seller-teste" };
}

function mkOrder(id: string, items: OrderItem[], estimatedDate: string): Order {
  const total = items.reduce((a, i) => a + i.price * i.qty, 0);
  return {
    id,
    createdAt: "2026-01-01T12:00:00.000Z",
    status: "confirmed",
    items,
    subtotal: total,
    discount: 0,
    shipping: 0,
    total,
    payment: "pix",
    address: {
      name: "Teste",
      cpf: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      city: "",
      state: "",
    },
    deliveryDays: 5,
    tracking: id.toUpperCase(),
    estimatedDate,
  };
}

test("credita o percentual da categoria de cada item do pedido", () => {
  remove("cashback");
  const price = 279.9;
  const order = mkOrder("ord-cb-1", [
    mkItem(AUDIO_ID, price, 1),
    mkItem(MOBILE_ID, 3299.9, 1),
  ], "2026-09-10");
  const credited = creditCashback(order);
  assert.equal(credited, 14600);
  const st = cashbackStatement();
  assert.equal(st.creditedCents, 14600);
  assert.equal(st.entries.length, 2);
  const audio = st.entries.find((e) => e.productId === AUDIO_ID);
  const mobile = st.entries.find((e) => e.productId === MOBILE_ID);
  assert.equal(audio?.percent, CASHBACK_PERCENT.audio);
  assert.equal(audio?.amountCents, Math.round(price * 0.05 * 100));
  assert.equal(mobile?.percent, CASHBACK_PERCENT.mobile);
  assert.equal(mobile?.amountCents, Math.round(3299.9 * 0.04 * 100));
});

test("libera o crédito 30 dias após a data estimada de entrega", () => {
  remove("cashback");
  const order = mkOrder("ord-cb-2", [mkItem(AUDIO_ID, 279.9, 1)], "2026-09-10");
  creditCashback(order);
  const st = cashbackStatement();
  assert.equal(st.entries[0].releaseAt, "2026-10-10");
});

test("crédito futuro não entra no saldo disponível", () => {
  remove("cashback");
  const order = mkOrder("ord-cb-3", [mkItem(AUDIO_ID, 279.9, 1)], "2026-09-10");
  creditCashback(order);
  assert.equal(availableCashback(), 0);
  assert.equal(cashbackStatement().availableCents, 0);
});

test("crédito vencido entra no saldo e o uso fica limitado a ele", () => {
  remove("cashback");
  const order = mkOrder("ord-cb-4", [mkItem(AUDIO_ID, 279.9, 1)], "2026-01-10");
  creditCashback(order);
  assert.equal(availableCashback(), 1400);
  const used = applyCashback("ord-cb-4", 5000);
  assert.equal(used, 1400);
  assert.equal(availableCashback(), 0);
  const st = cashbackStatement();
  assert.equal(st.usedCents, 1400);
  assert.equal(st.availableCents, 0);
  assert.equal(st.uses.length, 1);
});

test("uso zero ou negativo não gera lançamento", () => {
  remove("cashback");
  assert.equal(applyCashback("ord-none", 0), 0);
  assert.equal(applyCashback("ord-none", -100), 0);
  assert.equal(cashbackStatement().uses.length, 0);
});

test("pedido sem produtos válidos não credita nada", () => {
  remove("cashback");
  const order = mkOrder("ord-cb-5", [
    mkItem("produto-inexistente", 100, 1),
  ], "2026-09-10");
  assert.equal(creditCashback(order), 0);
  assert.equal(cashbackStatement().creditedCents, 0);
});
