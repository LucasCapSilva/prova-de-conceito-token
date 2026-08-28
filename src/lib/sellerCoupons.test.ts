import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  createSellerCoupon,
  couponCodeTaken,
  findSellerCouponByCode,
  headline,
  lookupSellerCoupon,
  removeSellerCoupon,
  sellerCouponsForSeller,
  setSellerCouponActive,
  updateSellerCoupon,
} from "./sellerCoupons.ts";

const SELLER = "seller-volttech";
const OTHER = "seller-gamerzone";

test("createSellerCoupon normaliza código e lista por vendedor", () => {
  const def = createSellerCoupon(SELLER, {
    code: " loja10 ",
    description: " ",
    type: "percent",
    value: 10,
    minValue: 100,
    expiresAt: "2026-12-31",
  });
  assert.equal(def.code, "LOJA10");
  assert.equal(def.active, true);
  assert.equal(def.sellerId, SELLER);
  assert.ok(def.description.length > 0);

  const own = sellerCouponsForSeller(SELLER);
  assert.ok(own.some((c) => c.code === "LOJA10"));
  assert.ok(sellerCouponsForSeller(OTHER).every((c) => c.sellerId === OTHER));
});

test("createSellerCoupon força valor 100 para freeship", () => {
  const def = createSellerCoupon(SELLER, {
    code: "FRETALOJA",
    description: "frete grátis da loja",
    type: "freeship",
    value: 0,
    minValue: 0,
    expiresAt: "2026-12-31",
  });
  assert.equal(def.value, 100);
  assert.equal(def.type, "freeship");
});

test("lookupSellerCoupon prefere o cupom próprio e cai no da plataforma", () => {
  createSellerCoupon(SELLER, {
    code: "VOLT15",
    description: "sombra do cupom da plataforma",
    type: "percent",
    value: 5,
    minValue: 0,
    expiresAt: "2026-12-31",
  });

  // cupom próprio do mesmo seller faz sombra do da base de dados
  const own = lookupSellerCoupon("volt15", SELLER);
  assert.ok(own);
  assert.equal(own.type, "percent");
  assert.equal(own.value, 5);

  // sem cupom próprio, cai no cupom do vendedor na base de dados
  const platform = lookupSellerCoupon("GAMER50", OTHER);
  assert.ok(platform);
  assert.equal(platform.id, "cpn-gamerzone");

  const missing = lookupSellerCoupon("NAO-EXISTE", SELLER);
  assert.equal(missing, undefined);
});

test("cupom desativado some da busca por código", () => {
  const def = createSellerCoupon(SELLER, {
    code: "PAGA5",
    description: "5 reais off",
    type: "fixed",
    value: 5,
    minValue: 50,
    expiresAt: "2026-12-31",
  });

  assert.ok(findSellerCouponByCode("PAGA5", SELLER));

  const off = setSellerCouponActive(def.id, false);
  assert.ok(off);
  assert.equal(off.active, false);
  assert.equal(findSellerCouponByCode("PAGA5", SELLER), undefined);

  const back = setSellerCouponActive(def.id, true);
  assert.ok(back);
  assert.equal(back.active, true);
  assert.ok(findSellerCouponByCode("paga5", SELLER));
});

test("updateSellerCoupon troca campos e removeSellerCoupon exclui", () => {
  const def = createSellerCoupon(SELLER, {
    code: "EDITA1",
    description: "antes",
    type: "percent",
    value: 10,
    minValue: 0,
    expiresAt: "2026-12-31",
  });

  const updated = updateSellerCoupon(def.id, {
    description: "depois",
    minValue: 150,
    expiresAt: "2027-01-31",
  });
  assert.ok(updated);
  assert.equal(updated.description, "depois");
  assert.equal(updated.minValue, 150);
  assert.equal(updated.expiresAt, "2027-01-31");
  assert.equal(updated.value, 10);

  removeSellerCoupon(def.id);
  assert.ok(
    !sellerCouponsForSeller(SELLER).some((c) => c.id === def.id)
  );
});

test("couponCodeTaken compara por vendedor e ignora o próprio id", () => {
  const def = createSellerCoupon(OTHER, {
    code: "GAMER10",
    description: "10% gamer",
    type: "percent",
    value: 10,
    minValue: 0,
    expiresAt: "2026-12-31",
  });

  assert.ok(couponCodeTaken("gamer10", OTHER));
  // excluindo o próprio id (edição), o código fica "livre"
  assert.ok(!couponCodeTaken("GAMER10", OTHER, def.id));
  assert.ok(!couponCodeTaken("gamer10", SELLER));
  assert.ok(!couponCodeTaken("OUTRO-CODE", OTHER));
});

test("headline formata os três tipos", () => {
  assert.equal(headline("percent", 15), "−15%");
  assert.equal(headline("freeship", 100), "Frete grátis");
  assert.equal(headline("fixed", 50), "−R$ 50");
});
