import test from "node:test";
import assert from "node:assert/strict";
import {
  quoteShipping,
  quoteShippingOptions,
  estimateDeliveryDate,
  FREE_SHIPPING_THRESHOLD,
} from "./shipping.ts";

const item = (free: boolean) => ({ freeShipping: free });

test("CEP inválido (menos de 8 dígitos) não cota", () => {
  assert.equal(quoteShipping("1234", [item(false)], 100), null);
  assert.equal(quoteShipping("", [item(false)], 100), null);
  assert.equal(quoteShipping("1234567", [item(false)], 100), null);
});

test("cálculo é determinístico e ignora pontuação do CEP", () => {
  const a = quoteShipping("01000-000", [item(false)], 500);
  const b = quoteShipping("01000000", [item(false)], 500);
  const c = quoteShipping(" 01000 000 ", [item(false)], 500);
  assert.ok(a && b && c);
  assert.equal(a.value, b.value);
  assert.equal(a.days, b.days);
  assert.equal(a.free, b.free);
  assert.equal(a.value, c.value);
  assert.equal(a.days, c.days);
  // CEP diferente muda o prazo
  const other = quoteShipping("30130-010", [item(false)], 500);
  assert.ok(other);
  assert.notEqual(a.days, other.days);
});

test("frete grátis acima da régua de R$ 999 (exatamente 999 não é grátis)", () => {
  assert.equal(FREE_SHIPPING_THRESHOLD, 999);
  const below = quoteShipping("01000-000", [item(false)], 999);
  assert.ok(below);
  assert.equal(below.free, false);
  assert.ok(below.value > 0);

  const above = quoteShipping("01000-000", [item(false)], 1000);
  assert.ok(above);
  assert.equal(above.free, true);
  assert.equal(above.value, 0);
});

test("frete grátis quando todos os itens são freeShipping", () => {
  const all = quoteShipping("01000-000", [item(true), item(true)], 50);
  assert.ok(all);
  assert.equal(all.free, true);
  assert.equal(all.value, 0);
});

test("frete pago quando nem todos os itens são freeShipping", () => {
  const mixed = quoteShipping("01000-000", [item(true), item(false)], 50);
  assert.ok(mixed);
  assert.equal(mixed.free, false);
  assert.ok(mixed.value > 0);
});

test("sem itens, só o subtotal decide o frete grátis", () => {
  const noItems = quoteShipping("01000-000", [], 50);
  assert.ok(noItems);
  assert.equal(noItems.free, false);
  const noItemsRich = quoteShipping("01000-000", [], 1000);
  assert.ok(noItemsRich);
  assert.equal(noItemsRich.free, true);
});

test("prazo e valor pagos ficam dentro das faixas esperadas", () => {
  for (const cep of ["01000-000", "30130-010", "99999-999"]) {
    const q = quoteShipping(cep, [item(false)], 100);
    assert.ok(q);
    assert.ok(q.days >= 2 && q.days <= 7);
    assert.ok(q.value >= 19.9 && q.value <= 49.9);
  }
});

test("três modalidades: econômico mais barato/lento, expresso mais caro/rápido", () => {
  const opts = quoteShippingOptions("01000-000", [item(false)], 500);
  assert.ok(opts);
  assert.equal(opts.length, 3);
  const eco = opts[0];
  const std = opts[1];
  const exp = opts[2];
  assert.equal(eco.id, "economic");
  assert.equal(std.id, "standard");
  assert.equal(exp.id, "express");
  // Padrão é a cota base
  assert.equal(std.value, 20.9);
  assert.equal(std.days, 3);
  // Econômico: mais barato e mais lento
  assert.equal(eco.value, 16.72);
  assert.equal(eco.days, std.days + 2);
  // Expresso: mais caro e mais rápido
  assert.equal(exp.value, 31.35);
  assert.ok(exp.days <= std.days);
  assert.ok(exp.value > std.value);
});

test("quando o frete é grátis, as três modalidades custam zero", () => {
  const opts = quoteShippingOptions("01000-000", [item(true)], 1000);
  assert.ok(opts);
  for (const o of opts) assert.equal(o.value, 0);
  const exp = opts[2];
  assert.ok(exp.days >= 1);
});

test("opções de frete retornam null para CEP inválido", () => {
  assert.equal(quoteShippingOptions("123", [item(false)], 100), null);
});

test("estimateDeliveryDate devolve hoje + prazo, e null para CEP inválido", () => {
  const q = quoteShipping("01000-000", [item(false)], 500);
  assert.ok(q);
  const date = estimateDeliveryDate("01000-000", [item(false)], 500);
  assert.ok(date);
  const expected = new Date();
  expected.setDate(expected.getDate() + q.days);
  assert.equal(date.getFullYear(), expected.getFullYear());
  assert.equal(date.getMonth(), expected.getMonth());
  assert.equal(date.getDate(), expected.getDate());
  assert.equal(estimateDeliveryDate("123", [item(false)], 500), null);
});
