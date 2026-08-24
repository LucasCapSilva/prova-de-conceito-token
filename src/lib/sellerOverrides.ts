import { PRODUCTS, type Product } from "../data/products";

const KEY = "electronica:seller:overrides";

export interface SellerOverride {
  price?: number;
  stock?: number;
  featured?: boolean;
}

export type OverridesMap = Record<string, SellerOverride>;

function load(): OverridesMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OverridesMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persist(map: OverridesMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* sem persistência disponível */
  }
}

export function getOverrides(): OverridesMap {
  return load();
}

export function getOverride(productId: string): SellerOverride | undefined {
  return load()[productId];
}

export function hasOverride(productId: string): boolean {
  return productId in load();
}

export function saveOverride(
  productId: string,
  patch: SellerOverride,
): void {
  const map = load();
  map[productId] = { ...map[productId], ...patch };
  persist(map);
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return;
  if (patch.price !== undefined) p.price = patch.price;
  if (patch.stock !== undefined) p.stock = patch.stock;
  if (patch.featured !== undefined) p.featured = patch.featured;
}

// Aplica os overrides salvos aos objetos compartilhados do catálogo,
// para que todo o site enxergue as mudanças imediatamente.
for (const [pid, o] of Object.entries(load())) {
  const p = PRODUCTS.find((x) => x.id === pid);
  if (!p) continue;
  if (o.price !== undefined) p.price = o.price;
  if (o.stock !== undefined) p.stock = o.stock;
  if (o.featured !== undefined) p.featured = o.featured;
}

export type { Product };
