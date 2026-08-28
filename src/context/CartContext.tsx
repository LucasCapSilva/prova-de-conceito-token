import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../data/products";
import {
  CartContext,
  cartSubtotal,
  type CartItem,
  type CartContextValue,
} from "./cartCore";
import { maxQtyFor, unitPriceFor } from "../lib/variants";
import { read, write } from "../lib/storage";

const STORAGE_KEY = "cart";
const SAVED_KEY = "savelater";

function loadSaved(): CartItem[] {
  const raw = read<unknown>(SAVED_KEY, null);
  if (!Array.isArray(raw)) return [];
  return (raw as CartItem[])
    .filter((i) => i && typeof i === "object" && i.product && i.product.id)
    .map(normalize);
}

function normalize(item: CartItem): CartItem {
  const product = item.product;
  const variantKey = item.variantKey ?? null;
  return {
    lineId: item.lineId ?? `${product.id}::${variantKey ?? "-"}`,
    product,
    qty: item.qty,
    variantKey,
    addedAt:
      typeof item.addedAt === "number" && Number.isFinite(item.addedAt)
        ? item.addedAt
        : Date.now(),
    addedPrice:
      typeof item.addedPrice === "number" && Number.isFinite(item.addedPrice)
        ? item.addedPrice
        : unitPriceFor(product, variantKey),
  };
}

interface PersistedCart {
  items: CartItem[];
  sellerCoupons: Record<string, string>;
}

function loadFromStorage(): PersistedCart {
  const parsed = read<unknown>(STORAGE_KEY, null);
  if (parsed === null || parsed === undefined) {
    return { items: [], sellerCoupons: {} };
  }
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray((parsed as PersistedCart).items)
      ? (parsed as PersistedCart).items
      : null;
  if (!list) return { items: [], sellerCoupons: {} };
  const items = (list as CartItem[])
    .filter((i) => i && typeof i === "object" && i.product && i.product.id)
    .map(normalize);
  const sellerCoupons =
    parsed && !Array.isArray(parsed) && (parsed as PersistedCart).sellerCoupons &&
    typeof (parsed as PersistedCart).sellerCoupons === "object"
      ? ((parsed as PersistedCart).sellerCoupons as Record<string, string>)
      : {};
  return { items, sellerCoupons };
}

function lineKey(p: Product, variantKey: string | null): string {
  return `${p.id}::${variantKey ?? "-"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadFromStorage(), []);
  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [saved, setSaved] = useState<CartItem[]>(loadSaved);
  const [selected, setSelectedState] = useState<string[]>(() =>
    initial.items.map((i) => i.lineId)
  );
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [sellerCoupons, setSellerCoupons] = useState<Record<string, string>>(
    initial.sellerCoupons
  );

  useEffect(() => {
    write(STORAGE_KEY, { items, sellerCoupons });
  }, [items, sellerCoupons]);

  useEffect(() => {
    write(SAVED_KEY, saved);
  }, [saved]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = cartSubtotal(items);
    return {
      items,
      saved,
      selected,
      couponCode,
      sellerCoupons,
      count,
      subtotal,
      addItem: (p, qty = 1, variantKey = null) => {
        const key = lineKey(p, variantKey);
        const max = maxQtyFor(p, variantKey);
        if (max <= 0) return;
        setItems((prev) => {
          const found = prev.find(
            (i) => i.product.id === p.id && i.variantKey === variantKey
          );
          if (found) {
            return prev.map((i) =>
              i.lineId === found.lineId
                ? { ...i, qty: Math.min(max, i.qty + qty) }
                : i
            );
          }
          return [
            ...prev,
            {
              lineId: key,
              product: p,
              qty: Math.min(qty, max),
              variantKey,
              addedAt: Date.now(),
              addedPrice: unitPriceFor(p, variantKey),
            },
          ];
        });
        setSelectedState((prev) =>
          prev.includes(key) ? prev : [...prev, key]
        );
      },
      removeItem: (lineId) => {
        setItems((prev) => prev.filter((i) => i.lineId !== lineId));
        setSelectedState((prev) => prev.filter((x) => x !== lineId));
      },
      setQty: (lineId, qty) => {
        setItems((prev) => {
          if (qty <= 0) return prev.filter((i) => i.lineId !== lineId);
          return prev.map((i) => {
            if (i.lineId !== lineId) return i;
            return { ...i, qty: Math.min(qty, maxQtyFor(i.product, i.variantKey)) };
          });
        });
        if (qty <= 0)
          setSelectedState((prev) => prev.filter((x) => x !== lineId));
      },
      clear: () => {
        setItems([]);
        setSelectedState([]);
        setCouponCode(null);
        setSellerCoupons({});
      },
      saveForLater: (lineId) => {
        const it = items.find((i) => i.lineId === lineId);
        if (!it) return;
        const ex = saved.find((s) => s.lineId === lineId);
        const max = maxQtyFor(it.product, it.variantKey);
        setSaved(
          ex
            ? saved.map((s) =>
                s.lineId === lineId
                  ? { ...s, qty: Math.min(max, s.qty + it.qty) }
                  : s
              )
            : [...saved, it]
        );
        setItems((prev) => prev.filter((i) => i.lineId !== lineId));
        setSelectedState((prev) => prev.filter((x) => x !== lineId));
      },
      restoreFromSaved: (lineId) => {
        const it = saved.find((s) => s.lineId === lineId);
        if (!it) return;
        const max = maxQtyFor(it.product, it.variantKey);
        if (max <= 0) return;
        setSaved((prev) => prev.filter((s) => s.lineId !== lineId));
        const key = lineKey(it.product, it.variantKey);
        setItems((prev) => {
          const found = prev.find(
            (i) =>
              i.product.id === it.product.id && i.variantKey === it.variantKey
          );
          if (found) {
            return prev.map((i) =>
              i.lineId === found.lineId
                ? { ...i, qty: Math.min(max, i.qty + it.qty) }
                : i
            );
          }
          return [
            ...prev,
            {
              lineId: key,
              product: it.product,
              qty: Math.min(it.qty, max),
              variantKey: it.variantKey,
              addedAt: Date.now(),
              addedPrice: unitPriceFor(it.product, it.variantKey),
            },
          ];
        });
        setSelectedState((prev) =>
          prev.includes(key) ? prev : [...prev, key]
        );
      },
      removeSaved: (lineId) =>
        setSaved((prev) => prev.filter((s) => s.lineId !== lineId)),
      toggleSelect: (lineId) =>
        setSelectedState((prev) =>
          prev.includes(lineId)
            ? prev.filter((x) => x !== lineId)
            : [...prev, lineId]
        ),
      setSelected: (lineIds) => setSelectedState(lineIds),
      setCoupon: (code) => setCouponCode(code),
      setSellerCoupon: (sellerId, code) =>
        setSellerCoupons((prev) => {
          const next = { ...prev };
          if (code) next[sellerId] = code;
          else delete next[sellerId];
          return next;
        }),
    };
  }, [items, saved, selected, couponCode, sellerCoupons]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
