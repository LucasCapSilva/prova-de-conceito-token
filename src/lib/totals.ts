import type { Coupon } from "../data/coupons";
import { formatBRL } from "./format.ts";

export interface CouponResult {
  discount: number;
  freeShip: boolean;
  ok: boolean;
  label: string | null;
}

export function computeCoupon(
  coupon: Coupon | undefined,
  selectedSubtotal: number,
  today: string
): CouponResult {
  if (!coupon) return { discount: 0, freeShip: false, ok: false, label: null };
  if (coupon.expiresAt < today)
    return { discount: 0, freeShip: false, ok: false, label: "Este cupom expirou." };
  if (selectedSubtotal < coupon.minValue)
    return {
      discount: 0,
      freeShip: false,
      ok: false,
      label: `Cupom ${coupon.code} não aplicado: mínimo de ${formatBRL(coupon.minValue)}.`,
    };
  if (coupon.type === "freeship")
    return {
      discount: 0,
      freeShip: true,
      ok: true,
      label: `Cupom ${coupon.code} aplicado: frete grátis.`,
    };
  const discount =
    coupon.type === "percent"
      ? (selectedSubtotal * coupon.value) / 100
      : Math.min(coupon.value, selectedSubtotal);
  return {
    discount,
    freeShip: false,
    ok: true,
    label: `Cupom ${coupon.code} aplicado (−${formatBRL(discount)}).`,
  };
}

export function computePixDiscount(goodsTotal: number): number {
  return Math.round(goodsTotal * 0.05 * 100) / 100;
}

export interface KitTier {
  tier: number;
  percent: number;
}

export const KIT_TIER_1: KitTier = { tier: 2, percent: 10 };
export const KIT_TIER_2: KitTier = { tier: 3, percent: 15 };

export const KIT_TIERS: KitTier[] = [KIT_TIER_1, KIT_TIER_2];

export function kitTierFor(qty: number): KitTier | null {
  let best: KitTier | null = null;
  for (const t of KIT_TIERS) {
    if (qty >= t.tier && (!best || t.percent > best.percent)) best = t;
  }
  return best;
}

export function kitDiscount(qty: number, subtotal: number): number {
  const t = kitTierFor(qty);
  if (!t || subtotal <= 0) return 0;
  return Math.round(subtotal * t.percent) / 100;
}

export function kitNext(
  qty: number
): { tier: number; percent: number; missing: number } | null {
  let best: KitTier | null = null;
  for (const t of KIT_TIERS) {
    if (qty < t.tier && (!best || t.tier < best.tier)) best = t;
  }
  return best ? { ...best, missing: best.tier - qty } : null;
}

export interface CouponSuggestion {
  coupon: Coupon;
  result: CouponResult;
}

export function suggestBestCoupon(
  collected: Coupon[],
  selectedSubtotal: number,
  today: string
): CouponSuggestion | null {
  let best: CouponSuggestion | null = null;
  for (const coupon of collected) {
    const result = computeCoupon(coupon, selectedSubtotal, today);
    if (!result.ok) continue;
    const cand: CouponSuggestion = { coupon, result };
    const sameDiscount =
      best !== null && cand.result.discount === best.result.discount;
    const better =
      best === null ||
      cand.result.discount > best.result.discount ||
      (sameDiscount && cand.result.freeShip && !best.result.freeShip) ||
      (sameDiscount &&
        cand.result.freeShip === best.result.freeShip &&
        cand.coupon.code < best.coupon.code);
    if (better) best = cand;
  }
  return best;
}
