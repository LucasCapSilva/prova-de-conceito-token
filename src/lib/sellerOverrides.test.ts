import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCTS } from "../data/products.ts";
import {
  addPromo,
  isPromoActive,
  listPromos,
  promoStatus,
  removePromo,
  type SellerPromo,
} from "./sellerOverrides.ts";

function promo(partial: Partial<SellerPromo> = {}): SellerPromo {
  return {
    productId: "p1",
    percent: 15,
    startsAt: "2020-01-01",
    endsAt: "2100-01-01",
    createdAt: 1700000000000,
    ...partial,
  };
}

test("isPromoActive cobre o intervalo fechado", () => {
  const p = promo({ startsAt: "2026-08-01", endsAt: "2026-08-15" });
  assert.equal(isPromoActive(p, "2026-07-31"), false);
  assert.equal(isPromoActive(p, "2026-08-01"), true);
  assert.equal(isPromoActive(p, "2026-08-08"), true);
  assert.equal(isPromoActive(p, "2026-08-15"), true);
  assert.equal(isPromoActive(p, "2026-08-16"), false);
});

test("promoStatus classifica agendada, ativa e encerrada", () => {
  const p = promo({ startsAt: "2026-08-01", endsAt: "2026-08-15" });
  assert.equal(promoStatus(p, "2026-07-31"), "agendada");
  assert.equal(promoStatus(p, "2026-08-10"), "ativa");
  assert.equal(promoStatus(p, "2026-08-16"), "encerrada");
});

test("addPromo vigente reflete o desconto no catálogo e removePromo reverte", () => {
  const p = PRODUCTS[0];
  const base = p.price;
  const prevOld = p.oldPrice;
  const id = p.id;

  removePromo(id);
  addPromo({ productId: id, percent: 10, startsAt: "2020-01-01", endsAt: "2100-01-01" });

  assert.ok(p.oldPrice !== undefined);
  assert.equal(p.oldPrice, base);
  assert.equal(p.price, Math.round(base * 0.9 * 100) / 100);

  removePromo(id);
  assert.equal(p.price, base);
  assert.equal(p.oldPrice, prevOld);
});

test("addPromo encerrada persiste sem tocar no catálogo", () => {
  const p = PRODUCTS[0];
  const base = p.price;
  const prevOld = p.oldPrice;
  const id = p.id;

  removePromo(id);
  addPromo({ productId: id, percent: 20, startsAt: "2020-01-01", endsAt: "2020-12-31" });

  assert.ok(listPromos().some((x) => x.productId === id));
  assert.equal(p.price, base);
  assert.equal(p.oldPrice, prevOld);

  removePromo(id);
  assert.ok(!listPromos().some((x) => x.productId === id));
});
