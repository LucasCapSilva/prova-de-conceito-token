import type { Category, Product } from "../data/products.ts";
import { PRODUCTS } from "../data/products.ts";

function hashStr(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const COMPANION_CATEGORIES: Record<Category, Category[]> = {
  audio: ["mobile", "gamer"],
  mobile: ["audio", "wearables"],
  computadores: ["audio", "gamer"],
  wearables: ["audio", "mobile"],
  gamer: ["audio", "computadores"],
  casa: ["mobile", "audio"],
};

export interface BundleSet {
  anchor: Product;
  companions: Product[];
  total: number;
}

export function frequentlyBoughtWith(product: Product): Product[] {
  const cats = COMPANION_CATEGORIES[product.category];
  const candidates = PRODUCTS.filter(
    (p) => p.id !== product.id && cats.includes(p.category)
  );
  const ranked = candidates
    .map((p) => ({ p, h: hashStr(`${product.id}:${p.id}`) }))
    .sort((a, b) => a.h - b.h);
  const count = 2 + (hashStr(`count:${product.id}`) % 2);
  return ranked.slice(0, Math.min(count, ranked.length)).map((r) => r.p);
}

export function bundleSet(product: Product): BundleSet | null {
  const companions = frequentlyBoughtWith(product);
  if (companions.length === 0) return null;
  const total =
    Math.round(
      (product.price +
        companions.reduce((acc, p) => acc + p.price, 0)) *
        100
    ) / 100;
  return { anchor: product, companions, total };
}
