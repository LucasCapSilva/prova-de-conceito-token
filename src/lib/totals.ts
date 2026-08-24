import type { Coupon } from "../data/coupons";
import { formatBRL } from "./format";

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
