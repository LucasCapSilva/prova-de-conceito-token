import test from "node:test";
import assert from "node:assert/strict";
import { remove, write } from "./storage.ts";
import type { Order, OrderItem } from "./orders.ts";
import {
  spentLast12Months,
  loyaltyStatus,
  cashbackBonusPercent,
  freeShipThreshold,
  LOYALTY_TIERS,
} from "./loyalty.ts";
import { CASHBACK_PERCENT, creditCashback } from "./cashback.ts";
import { quoteShipping } from "./shipping.ts";
import { PRODUCTS } from "../data/products.ts";

function mkItem(id: string, price: number, qty = 1): OrderItem {
  return { id, name: "Item teste", image: "", qty, price, seller: "seller-teste" };
}

function mkOrder(
  id: string,
  total: number,
  createdAt: string,
  status: Order["status"] = "confirmed"
): Order {
  return {
    id,
    createdAt,
    status,
    items: [],
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
    estimatedDate: "2026-09-10",
  };
}

function reset() {
  remove("orders");
  remove("cashback");
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

test("sem pedidos fica no bronze sem bônus e limiar padrão", () => {
  reset();
  assert.equal(spentLast12Months(), 0);
  const st = loyaltyStatus();
  assert.equal(st.level.id, "bronze");
  assert.equal(st.next?.id, "prata");
  assert.equal(st.toNext, 1000);
  assert.equal(st.progress, 0);
  assert.equal(cashbackBonusPercent(), 0);
  assert.equal(freeShipThreshold(), 999);
});

test("soma apenas pedidos dos últimos 12 meses e ignora cancelados", () => {
  reset();
  write("orders", [
    mkOrder("lo-1", 1500, daysAgo(10)),
    mkOrder("lo-2", 9999, daysAgo(5), "cancelled"),
    mkOrder("lo-3", 5000, daysAgo(400)),
  ]);
  assert.equal(spentLast12Months(), 1500);
});

test("troca de nível exatamente nos mínimos de prata e ouro", () => {
  reset();
  write("orders", [mkOrder("lo-999", 999, daysAgo(1))]);
  assert.equal(loyaltyStatus().level.id, "bronze");

  write("orders", [mkOrder("lo-1000", 1000, daysAgo(1))]);
  assert.equal(loyaltyStatus().level.id, "prata");

  write("orders", [mkOrder("lo-4999", 4999.99, daysAgo(1))]);
  assert.equal(loyaltyStatus().level.id, "prata");

  write("orders", [mkOrder("lo-5000", 5000, daysAgo(1))]);
  assert.equal(loyaltyStatus().level.id, "ouro");
});

test("progresso e diferença para o próximo nível", () => {
  reset();
  write("orders", [mkOrder("lo-p", 1500, daysAgo(1))]);
  const st = loyaltyStatus();
  assert.equal(st.next?.id, "ouro");
  assert.equal(st.toNext, 3500);
  assert.equal(st.progress, 1500 / 4000);

  write("orders", [mkOrder("lo-max", 6000, daysAgo(1))]);
  const top = loyaltyStatus();
  assert.equal(top.next, null);
  assert.equal(top.progress, 1);
  assert.equal(top.toNext, 0);
});

test("benefícios por nível: bônus de cashback e limiar de frete", () => {
  reset();
  assert.equal(cashbackBonusPercent(), 0);
  assert.equal(freeShipThreshold(), 999);

  write("orders", [mkOrder("lo-prata", 1200, daysAgo(1))]);
  assert.equal(cashbackBonusPercent(), 1);
  assert.equal(freeShipThreshold(), 799);

  write("orders", [mkOrder("lo-ouro", 5200, daysAgo(1))]);
  assert.equal(cashbackBonusPercent(), 2);
  assert.equal(freeShipThreshold(), 599);
  assert.equal(LOYALTY_TIERS.length, 3);
});

test("cashback credita com o bônus do nível ativo", () => {
  reset();
  write("orders", [mkOrder("lo-prata", 1200, daysAgo(1))]);
  const audio = PRODUCTS.find((p) => p.category === "audio");
  if (!audio) throw new Error("sem produto de áudio no catálogo");
  const price = 279.9;
  const order = mkOrder("lo-cb", price, daysAgo(1));
  order.items = [mkItem(audio.id, price)];
  const credited = creditCashback(order);
  const percent = CASHBACK_PERCENT.audio + 1;
  assert.equal(percent, 6);
  assert.equal(credited, Math.round(price * 0.06 * 100));
});

test("frete grátis usa o limiar do nível ativo", () => {
  reset();
  write("orders", [mkOrder("lo-prata", 1200, daysAgo(1))]);
  const inRange = quoteShipping("12345678", [], 850);
  assert.equal(inRange?.free, true);

  reset();
  const bronze = quoteShipping("12345678", [], 850);
  assert.equal(bronze?.free, false);
});
