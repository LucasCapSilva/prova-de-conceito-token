import type { Coupon, CouponType } from "../data/coupons";
import { getCouponForSeller } from "../data/coupons.ts";
import { read, write } from "./storage.ts";

const KEY = "seller:coupons";

export interface SellerCouponDef {
  id: string;
  sellerId: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minValue: number;
  expiresAt: string;
  active: boolean;
  createdAt: number;
}

export interface NewSellerCouponInput {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minValue: number;
  expiresAt: string;
}

export interface SellerCouponPatch {
  code?: string;
  description?: string;
  value?: number;
  minValue?: number;
  expiresAt?: string;
}

function load(): Record<string, SellerCouponDef> {
  const raw = read<unknown>(KEY, {});
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, SellerCouponDef> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v && typeof v === "object" && "id" in v && "sellerId" in v) {
      out[id] = v as SellerCouponDef;
    }
  }
  return out;
}

function persist(map: Record<string, SellerCouponDef>) {
  write(KEY, map);
}

function makeId(sellerId: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `sc-${sellerId}-${Date.now().toString(36)}-${rand}`;
}

export function listSellerCoupons(): SellerCouponDef[] {
  return Object.values(load()).sort((a, b) => b.createdAt - a.createdAt);
}

export function sellerCouponsForSeller(sellerId: string): SellerCouponDef[] {
  return listSellerCoupons().filter((c) => c.sellerId === sellerId);
}

export function findSellerCouponByCode(
  code: string,
  sellerId: string
): SellerCouponDef | undefined {
  const norm = code.trim().toLowerCase();
  return listSellerCoupons().find(
    (c) => c.active && c.code.toLowerCase() === norm && c.sellerId === sellerId
  );
}

export function lookupSellerCoupon(
  code: string,
  sellerId: string
): Coupon | undefined {
  const own = findSellerCouponByCode(code, sellerId);
  if (own) {
    return {
      id: own.id,
      code: own.code,
      description: own.description,
      type: own.type,
      value: own.value,
      minValue: own.minValue,
      expiresAt: own.expiresAt,
      sellerId: own.sellerId,
    };
  }
  return getCouponForSeller(code, sellerId);
}

export function createSellerCoupon(
  sellerId: string,
  input: NewSellerCouponInput
): SellerCouponDef {
  const map = load();
  const code = input.code.trim().toUpperCase();
  const def: SellerCouponDef = {
    id: makeId(sellerId),
    sellerId,
    code,
    description:
      input.description.trim() || `Cupom da loja: ${headline(input.type, input.value)}`,
    type: input.type,
    value: input.type === "freeship" ? 100 : Math.max(0, input.value),
    minValue: Math.max(0, input.minValue),
    expiresAt: input.expiresAt,
    active: true,
    createdAt: Date.now(),
  };
  map[def.id] = def;
  persist(map);
  return def;
}

export function updateSellerCoupon(
  id: string,
  patch: SellerCouponPatch
): SellerCouponDef | undefined {
  const map = load();
  const cur = map[id];
  if (!cur) return undefined;
  const next: SellerCouponDef = {
    ...cur,
    ...(patch.code !== undefined
      ? { code: patch.code.trim().toUpperCase() }
      : {}),
    ...(patch.description !== undefined
      ? { description: patch.description.trim() }
      : {}),
    ...(patch.value !== undefined ? { value: patch.value } : {}),
    ...(patch.minValue !== undefined ? { minValue: patch.minValue } : {}),
    ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
  };
  map[id] = next;
  persist(map);
  return next;
}

export function setSellerCouponActive(
  id: string,
  active: boolean
): SellerCouponDef | undefined {
  const map = load();
  const cur = map[id];
  if (!cur) return undefined;
  const next: SellerCouponDef = { ...cur, active };
  map[id] = next;
  persist(map);
  return next;
}

export function removeSellerCoupon(id: string) {
  const map = load();
  if (!map[id]) return;
  delete map[id];
  persist(map);
}

export function couponCodeTaken(
  code: string,
  sellerId: string,
  exceptId?: string
): boolean {
  const norm = code.trim().toLowerCase();
  return listSellerCoupons().some(
    (c) =>
      c.id !== exceptId &&
      c.sellerId === sellerId &&
      c.code.toLowerCase() === norm
  );
}

export function headline(type: CouponType, value: number): string {
  if (type === "percent") return `−${value}%`;
  if (type === "freeship") return "Frete grátis";
  return `−R$ ${String(Math.round(value * 100) / 100).replace(".", ",")}`;
}
