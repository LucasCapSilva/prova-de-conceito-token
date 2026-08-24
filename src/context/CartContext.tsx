import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../data/products";
import {
  CartContext,
  cartSubtotal,
  type CartItem,
  type CartContextValue,
} from "./cartCore";
import { maxQtyFor } from "../lib/variants";

const STORAGE_KEY = "electronica:cart";
const SAVED_KEY = "electronica:savelater";

function loadSaved(): CartItem[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return (list as CartItem[])
      .filter((i) => i && typeof i === "object" && i.product && i.product.id)
      .map(normalize);
  } catch {
    return [];
  }
}

function normalize(item: CartItem): CartItem {
  const product = item.product;
  const variantKey = item.variantKey ?? null;
  return {
    lineId: item.lineId ?? `${product.id}::${variantKey ?? "-"}`,
    product,
    qty: item.qty,
    variantKey,
  };
}

interface PersistedCart {
  items: CartItem[];
  sellerCoupons: Record<string, string>;
}

function loadFromStorage(): PersistedCart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], sellerCoupons: {} };
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && Array.isArray(parsed.items)
        ? parsed.items
        : null;
    if (!list) return { items: [], sellerCoupons: {} };
    const items = (list as CartItem[])
      .filter((i) => i && typeof i === "object" && i.product && i.product.id)
      .map(normalize);
    const sellerCoupons =
      parsed && !Array.isArray(parsed) && parsed.sellerCoupons &&
      typeof parsed.sellerCoupons === "object"
        ? (parsed.sellerCoupons as Record<string, string>)
        : {};
    return { items, sellerCoupons };
  } catch {
    return { items: [], sellerCoupons: {} };
  }
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
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, sellerCoupons })
      );
    } catch {
      /* storage indisponível — ignora */
    }
  }, [items, sellerCoupons]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      /* storage indisponível — ignora */
    }
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
