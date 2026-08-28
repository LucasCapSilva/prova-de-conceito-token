import type { Product, VariantOption } from "../data/products";

export type VariantSelection = Record<string, string>;

export function variantKeyFromSelection(
  product: Product,
  selection: VariantSelection
): string | null {
  const parts: string[] = [];
  for (const g of product.variants ?? []) {
    const oid = selection[g.id];
    if (oid) parts.push(`${g.id}:${oid}`);
  }
  return parts.length ? parts.join("|") : null;
}

export function parseVariantKey(
  key: string | null
): VariantSelection {
  const sel: VariantSelection = {};
  if (!key) return sel;
  for (const part of key.split("|")) {
    const [gid, oid] = part.split(":");
    if (gid && oid) sel[gid] = oid;
  }
  return sel;
}

export function optionsForSelection(
  product: Product,
  selection: VariantSelection
): VariantOption[] {
  const out: VariantOption[] = [];
  for (const g of product.variants ?? []) {
    const oid = selection[g.id];
    if (!oid) continue;
    const o = g.options.find((x) => x.id === oid);
    if (o) out.push(o);
  }
  return out;
}

export function isSelectionComplete(
  product: Product,
  selection: VariantSelection
): boolean {
  return (product.variants ?? []).every((g) => Boolean(selection[g.id]));
}

export function missingGroups(
  product: Product,
  selection: VariantSelection
): string[] {
  return (product.variants ?? [])
    .filter((g) => !selection[g.id])
    .map((g) => g.label);
}

export function selectionPriceDelta(
  product: Product,
  selection: VariantSelection
): number {
  return optionsForSelection(product, selection).reduce(
    (acc, o) => acc + (o.priceDelta ?? 0),
    0
  );
}

export function stockForSelection(
  product: Product,
  selection: VariantSelection
): number {
  return Math.min(
    product.stock,
    ...optionsForSelection(product, selection).map((o) => o.stock)
  );
}

export function unitPriceFor(product: Product, variantKey: string | null): number {
  return product.price + selectionPriceDelta(
    product,
    parseVariantKey(variantKey)
  );
}

export function maxQtyFor(product: Product, variantKey: string | null): number {
  return stockForSelection(product, parseVariantKey(variantKey));
}

export function describeSelection(
  product: Product,
  variantKey: string | null
): string {
  const sel = parseVariantKey(variantKey);
  const parts: string[] = [];
  for (const g of product.variants ?? []) {
    const o = g.options.find((x) => x.id === sel[g.id]);
    if (o) parts.push(o.name);
  }
  return parts.join(" · ");
}

export interface PriceChange {
  added: number;
  current: number;
  delta: number;
}

export function priceChange(added: number, current: number): PriceChange | null {
  if (!Number.isFinite(added) || added <= 0) return null;
  const delta = Math.round((current - added) * 100) / 100;
  if (delta === 0) return null;
  return { added, current, delta };
}
