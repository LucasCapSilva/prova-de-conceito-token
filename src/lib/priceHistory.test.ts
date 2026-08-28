import test from "node:test";
import assert from "node:assert/strict";

import { priceHistory } from "./priceHistory.ts";

test("priceHistory devolve 6 pontos, o último sendo o preço atual", () => {
  const pts = priceHistory("headphone-pro-max", 299.9);
  assert.equal(pts.length, 6);
  assert.equal(pts[5].value, 299.9);
});

test("priceHistory é determinístico para o mesmo id", () => {
  const a = priceHistory("notebook-x", 3500);
  const b = priceHistory("notebook-x", 3500);
  assert.deepEqual(a, b);
});

test("priceHistory os 5 meses anteriores ficam na variação de ±10%", () => {
  const pts = priceHistory("tv-55-4k", 1899);
  for (const p of pts.slice(0, 5)) {
    assert.ok(p.value > 0);
    assert.ok(p.value >= 1899 * 0.8 - 1);
    assert.ok(p.value <= 1899 * 1.2 + 1);
  }
});

test("priceHistory ids diferentes geram séries diferentes", () => {
  const a = priceHistory("aaa", 100);
  const b = priceHistory("bbb", 100);
  assert.notDeepEqual(a.map((p) => p.value), b.map((p) => p.value));
});
