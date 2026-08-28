import {
  PRODUCTS,
  CATEGORIES,
  BRANDS,
  type Category,
  type Product,
} from "../data/products.ts";
import { getSeller } from "../data/sellers.ts";
import { searchMatch } from "./search.ts";

export type SortKey =
  | "relevancia"
  | "menor-preco"
  | "mais-vendidos"
  | "maior-preco"
  | "maior-desconto"
  | "avaliacao";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "mais-vendidos", label: "Mais vendidos" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "maior-desconto", label: "Maior desconto" },
  { value: "avaliacao", label: "Melhor avaliados" },
];

export function discountPct(p: Product): number {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return ((p.oldPrice - p.price) / p.oldPrice) * 100;
}

export interface CatalogState {
  q: string;
  cat: Category | "todos";
  min: string;
  max: string;
  rating: string;
  condition: "novo" | "usado" | "todos";
  brand: string;
  freeShip: boolean;
  official: boolean;
  discountOnly: boolean;
  installments: "" | "6" | "10";
  sort: SortKey;
  page: number;
}

const SORT_VALUES: SortKey[] = [
  "relevancia",
  "menor-preco",
  "mais-vendidos",
  "maior-preco",
  "maior-desconto",
  "avaliacao",
];
const CAT_KEYS = CATEGORIES.map((c) => c.key);

export const DEFAULT_STATE: CatalogState = {
  q: "",
  cat: "todos",
  min: "",
  max: "",
  rating: "",
  condition: "todos",
  brand: "",
  freeShip: false,
  official: false,
  discountOnly: false,
  installments: "",
  sort: "relevancia",
  page: 1,
};

export function parseState(params: URLSearchParams): CatalogState {
  const cat = params.get("cat") ?? "todos";
  const cond = params.get("cond") ?? "todos";
  const sort = SORT_VALUES.includes(params.get("sort") as SortKey)
    ? (params.get("sort") as SortKey)
    : "relevancia";
  const inst = params.get("install");
  return {
    q: params.get("q") ?? "",
    cat: (CAT_KEYS.includes(cat as Category) ? cat : "todos") as
      | Category
      | "todos",
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    rating: params.get("rating") ?? "",
    condition: cond === "novo" || cond === "usado" ? cond : "todos",
    brand: params.get("brand") ?? "",
    freeShip: params.get("ship") === "1",
    official: params.get("official") === "1",
    discountOnly: params.get("discount") === "1",
    installments: inst === "6" || inst === "10" ? inst : "",
    sort,
    page: Math.max(1, Number(params.get("page") ?? 1) || 1),
  };
}

export function buildParams(s: CatalogState): URLSearchParams {
  const next = new URLSearchParams();
  if (s.q.trim()) next.set("q", s.q.trim());
  if (s.cat !== "todos") next.set("cat", s.cat);
  if (s.min) next.set("min", s.min);
  if (s.max) next.set("max", s.max);
  if (s.rating) next.set("rating", s.rating);
  if (s.condition !== "todos") next.set("cond", s.condition);
  if (s.brand) next.set("brand", s.brand);
  if (s.freeShip) next.set("ship", "1");
  if (s.official) next.set("official", "1");
  if (s.discountOnly) next.set("discount", "1");
  if (s.installments) next.set("install", s.installments);
  if (s.sort !== "relevancia") next.set("sort", s.sort);
  if (s.page > 1) next.set("page", String(s.page));
  return next;
}

export function sortProducts(items: Product[], sort: SortKey): Product[] {
  const list = [...items];
  if (sort === "menor-preco") list.sort((a, b) => a.price - b.price);
  else if (sort === "mais-vendidos") list.sort((a, b) => b.sold - a.sold);
  else if (sort === "maior-preco") list.sort((a, b) => b.price - a.price);
  else if (sort === "maior-desconto")
    list.sort((a, b) => discountPct(b) - discountPct(a));
  else if (sort === "avaliacao") list.sort((a, b) => b.rating - a.rating);
  return list;
}

function matchProducts(state: CatalogState): Product[] {
  const q = state.q.trim().toLowerCase();
  const min = state.min ? Number(state.min) : 0;
  const max = state.max ? Number(state.max) : 0;
  const rating = state.rating ? Number(state.rating) : 0;
  return PRODUCTS.filter((p) => {
    if (state.cat !== "todos" && p.category !== state.cat) return false;
    if (min > 0 && p.price < min) return false;
    if (max > 0 && p.price > max) return false;
    if (rating > 0 && p.rating < rating) return false;
    if (state.condition !== "todos" && p.condition !== state.condition) return false;
    if (state.brand && p.brand !== state.brand) return false;
    if (state.freeShip && !p.freeShipping) return false;
    if (state.official && !getSeller(p.sellerId)?.isOfficial) return false;
    if (state.discountOnly && discountPct(p) <= 0) return false;
    if (state.installments && p.installments.count < Number(state.installments))
      return false;
    if (q && !searchMatch(`${p.name} ${p.category} ${p.description}`, q))
      return false;
    return true;
  });
}

const filterCache = new Map<string, Product[]>();

export function filterProducts(state: CatalogState): Product[] {
  const key = [
    state.q.trim().toLowerCase(),
    state.cat,
    state.min,
    state.max,
    state.rating,
    state.condition,
    state.brand,
    state.freeShip,
    state.official,
    state.discountOnly,
    state.installments,
    state.sort,
  ].join("|");
  const hit = filterCache.get(key);
  if (hit) return hit;
  const result = sortProducts(matchProducts(state), state.sort);
  if (filterCache.size >= 64) {
    const oldest = filterCache.keys().next().value;
    if (oldest !== undefined) filterCache.delete(oldest);
  }
  filterCache.set(key, result);
  return result;
}

export interface FacetCounts {
  brands: Record<string, number>;
  cats: Record<string, number>;
  total: number;
}

export function facetCounts(state: CatalogState): FacetCounts {
  const byBrand = matchProducts({ ...state, brand: "" });
  const brands: Record<string, number> = {};
  for (const b of BRANDS) brands[b] = byBrand.filter((p) => p.brand === b).length;
  const all = matchProducts({ ...state, cat: "todos" });
  const cats: Record<string, number> = {};
  for (const c of CATEGORIES)
    cats[c.key] = all.filter((p) => p.category === c.key).length;
  return { brands, cats, total: matchProducts(state).length };
}

export const PAGE_SIZE = 12;

export function paginate<T>(items: T[], page: number): T[] {
  const p = Math.max(1, Math.floor(page));
  return items.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
}

export function countActiveFilters(s: CatalogState): number {
  let n = 0;
  if (s.min) n++;
  if (s.max) n++;
  if (s.rating) n++;
  if (s.condition !== "todos") n++;
  if (s.brand) n++;
  if (s.freeShip) n++;
  if (s.official) n++;
  if (s.discountOnly) n++;
  if (s.installments) n++;
  return n;
}
