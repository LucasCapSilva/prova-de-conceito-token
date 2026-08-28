import { createContext, useContext } from "react";
import type { Product } from "../data/products";
import { unitPriceFor, priceChange, type PriceChange } from "../lib/variants";

export type { PriceChange };

export interface CartItem {
  lineId: string;
  product: Product;
  qty: number;
  variantKey: string | null;
  addedAt: number;
  addedPrice: number;
}

export function priceChangeFor(item: CartItem): PriceChange | null {
  return priceChange(item.addedPrice, unitPriceFor(item.product, item.variantKey));
}

export interface CartContextValue {
  items: CartItem[];
  saved: CartItem[];
  selected: string[];
  couponCode: string | null;
  sellerCoupons: Record<string, string>;
  count: number;
  subtotal: number;
  addItem: (p: Product, qty?: number, variantKey?: string | null) => void;
  removeItem: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clear: () => void;
  saveForLater: (lineId: string) => void;
  restoreFromSaved: (lineId: string) => void;
  removeSaved: (lineId: string) => void;
  toggleSelect: (lineId: string) => void;
  setSelected: (lineIds: string[]) => void;
  setCoupon: (code: string | null) => void;
  setSellerCoupon: (sellerId: string, code: string | null) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce(
    (acc, i) => acc + i.qty * unitPriceFor(i.product, i.variantKey),
    0
  );
}

export const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;

export function cartIsAbandoned(items: CartItem[], now: number): boolean {
  if (items.length === 0) return false;
  const oldest = items.reduce((acc, i) => Math.min(acc, i.addedAt), Infinity);
  return Number.isFinite(oldest) && now - oldest >= ABANDONED_AFTER_MS;
}
