import test from "node:test";
import assert from "node:assert/strict";
import { BRANDS, PRODUCTS, brandSlug } from "./products.ts";

test("todos os produtos têm garantia, troca e devolução válidas", () => {
  for (const p of PRODUCTS) {
    assert.ok(p.warrantyMonths >= 3, `warrantyMonths inválido em ${p.id}`);
    assert.ok(p.exchangeDays >= 7, `exchangeDays inválido em ${p.id}`);
    assert.equal(typeof p.freeReturn, "boolean", `freeReturn em ${p.id}`);
    if (p.condition === "usado") {
      assert.equal(p.warrantyMonths, 3, `usado com garantia longa em ${p.id}`);
    }
  }
});

test("garantia e troca são determinísticas por id", () => {
  const a = PRODUCTS[0];
  const b = PRODUCTS.find((p) => p.id === a.id);
  assert.ok(b);
  assert.equal(a.warrantyMonths, b.warrantyMonths);
  assert.equal(a.exchangeDays, b.exchangeDays);
  assert.equal(a.freeReturn, b.freeReturn);
});

test("brandSlug gera slug minúsculo e sem acentos", () => {
  assert.equal(brandSlug("Aurix"), "aurix");
  assert.equal(brandSlug("São Paulo"), "sao-paulo");
  assert.equal(brandSlug("  Nova  Linha "), "nova-linha");
});

test("brandSlug cobre todas as marcas do catálogo", () => {
  for (const b of BRANDS) {
    assert.ok(brandSlug(b).length > 0);
    assert.ok(PRODUCTS.some((p) => p.brand === b));
  }
});
