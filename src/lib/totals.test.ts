import test from "node:test";
import assert from "node:assert/strict";
import type { Coupon } from "../data/coupons.ts";
import { computeCoupon, computePixDiscount, suggestBestCoupon, kitTierFor, kitDiscount, kitNext } from "./totals.ts";

const TODAY = "2026-08-25";

const percentCoupon: Coupon = {
  id: "cpn-test-pct",
  code: "PCT10",
  description: "10% off",
  type: "percent",
  value: 10,
  minValue: 100,
  expiresAt: "2026-12-31",
};

const fixedCoupon: Coupon = {
  id: "cpn-test-fix",
  code: "FIX50",
  description: "R$ 50 off",
  type: "fixed",
  value: 50,
  minValue: 300,
  expiresAt: "2026-12-31",
};

const fixedBigCoupon: Coupon = {
  id: "cpn-test-fixbig",
  code: "FIX100",
  description: "R$ 100 off",
  type: "fixed",
  value: 100,
  minValue: 50,
  expiresAt: "2026-12-31",
};

const freeshipCoupon: Coupon = {
  id: "cpn-test-frete",
  code: "FRETE0",
  description: "Frete grátis",
  type: "freeship",
  value: 0,
  minValue: 0,
  expiresAt: "2026-12-31",
};

test("cupom percentual aplica a porcentagem sobre o subtotal", () => {
  const r = computeCoupon(percentCoupon, 200, TODAY);
  assert.equal(r.ok, true);
  assert.equal(r.discount, 20);
  assert.equal(r.freeShip, false);
  assert.ok(r.label?.includes("PCT10"));
});

test("cupom percentual exige o valor mínimo", () => {
  const r = computeCoupon(percentCoupon, 99.99, TODAY);
  assert.equal(r.ok, false);
  assert.equal(r.discount, 0);
  assert.ok(r.label?.includes("mínimo"));
});

test("cupom fixo desconta o valor definido", () => {
  const r = computeCoupon(fixedCoupon, 600, TODAY);
  assert.equal(r.ok, true);
  assert.equal(r.discount, 50);
});

test("cupom fixo nunca desconta mais que o subtotal", () => {
  const r = computeCoupon(fixedBigCoupon, 50, TODAY);
  assert.equal(r.ok, true);
  assert.equal(r.discount, 50);
});

test("cupom de frete grátis não desconta, só libera frete", () => {
  const r = computeCoupon(freeshipCoupon, 10, TODAY);
  assert.equal(r.ok, true);
  assert.equal(r.discount, 0);
  assert.equal(r.freeShip, true);
});

test("cupom expirado não aplica", () => {
  const expired: Coupon = { ...fixedCoupon, expiresAt: "2026-01-01" };
  const r = computeCoupon(expired, 600, TODAY);
  assert.equal(r.ok, false);
  assert.equal(r.discount, 0);
  assert.ok(r.label?.includes("expirou"));
});

test("sem cupom não há desconto", () => {
  const r = computeCoupon(undefined, 600, TODAY);
  assert.equal(r.ok, false);
  assert.equal(r.discount, 0);
  assert.equal(r.label, null);
});

test("desconto Pix é 5% do total, arredondado em centavos", () => {
  assert.equal(computePixDiscount(0), 0);
  assert.equal(computePixDiscount(100), 5);
  assert.equal(computePixDiscount(33.33), 1.67);
});

test("cupom de plataforma e de vendedor empilham seus descontos", () => {
  const platform = computeCoupon(percentCoupon, 500, TODAY);
  const seller: Coupon = {
    id: "cpn-test-seller",
    code: "VEND50",
    description: "R$ 50 off do vendedor",
    type: "fixed",
    value: 50,
    minValue: 300,
    expiresAt: "2026-12-31",
    sellerId: "seller-volttech",
  };
  const fromSeller = computeCoupon(seller, 500, TODAY);
  assert.equal(platform.ok, true);
  assert.equal(fromSeller.ok, true);
  const total = platform.discount + fromSeller.discount;
  assert.equal(total, 100);
  assert.equal(500 - total, 400);
});

test("sem cupons coletados não há sugestão", () => {
  assert.equal(suggestBestCoupon([], 500, TODAY), null);
});

test("sugere o cupom com o maior desconto", () => {
  const best = suggestBestCoupon(
    [fixedCoupon, percentCoupon, fixedBigCoupon],
    600,
    TODAY
  );
  assert.ok(best);
  assert.equal(best.coupon.code, "FIX100");
  assert.equal(best.result.discount, 100);
});

test("ignora cupom expirado na sugestão", () => {
  const expired: Coupon = { ...fixedBigCoupon, expiresAt: "2026-01-01" };
  const best = suggestBestCoupon([expired, fixedCoupon], 600, TODAY);
  assert.ok(best);
  assert.equal(best.coupon.code, "FIX50");
});

test("ignora cupom com valor mínimo não atingido na sugestão", () => {
  const highMin: Coupon = { ...fixedBigCoupon, minValue: 500 };
  const best = suggestBestCoupon([highMin, fixedCoupon], 400, TODAY);
  assert.ok(best);
  assert.equal(best.coupon.code, "FIX50");
  assert.equal(best.result.discount, 50);
});

test("frete grátis vence empate com desconto zero", () => {
  const best = suggestBestCoupon([freeshipCoupon], 100, TODAY);
  assert.ok(best);
  assert.equal(best.coupon.code, "FRETE0");
  assert.equal(best.result.freeShip, true);
  assert.equal(best.result.discount, 0);
});

test("empate de desconto prefere o código menor", () => {
  const a: Coupon = { ...fixedCoupon, code: "AAA50" };
  const b: Coupon = { ...fixedCoupon, code: "ZZZ50" };
  const best = suggestBestCoupon([b, a], 600, TODAY);
  assert.ok(best);
  assert.equal(best.coupon.code, "AAA50");
});

test("kit sem quantidade suficiente não tem tier", () => {
  assert.equal(kitTierFor(0), null);
  assert.equal(kitTierFor(1), null);
});

test("kit de 2 itens ativa o tier de 10%", () => {
  const t = kitTierFor(2);
  assert.ok(t);
  assert.equal(t.percent, 10);
});

test("kit de 3+ itens ativa o tier de 15%", () => {
  const t = kitTierFor(3);
  assert.ok(t);
  assert.equal(t.percent, 15);
  const t5 = kitTierFor(5);
  assert.ok(t5);
  assert.equal(t5.percent, 15);
});

test("kitDiscount aplica o percentual do tier e arredonda em centavos", () => {
  assert.equal(kitDiscount(1, 200), 0);
  assert.equal(kitDiscount(2, 200), 20);
  assert.equal(kitDiscount(3, 300), 45);
  assert.equal(kitDiscount(2, 100.05), 10.01);
  assert.equal(kitDiscount(2, 99.99), 10);
  assert.equal(kitDiscount(3, 0), 0);
});

test("kitNext aponta o tier seguinte e quantos faltam", () => {
  const n0 = kitNext(0);
  assert.ok(n0);
  assert.equal(n0.tier, 2);
  assert.equal(n0.missing, 2);
  assert.equal(n0.percent, 10);
  const n1 = kitNext(1);
  assert.ok(n1);
  assert.equal(n1.tier, 2);
  assert.equal(n1.missing, 1);
  const n2 = kitNext(2);
  assert.ok(n2);
  assert.equal(n2.tier, 3);
  assert.equal(n2.missing, 1);
  assert.equal(n2.percent, 15);
  assert.equal(kitNext(3), null);
  assert.equal(kitNext(10), null);
});
