import { getProduct, type Product } from "../data/products";
import { read, write } from "./storage";

const KEY = "recent";
const MAX = 8;

function load(): string[] {
  const raw = read<unknown>(KEY, []);
  const arr = Array.isArray(raw) ? raw : [];
  return arr.filter((x): x is string => typeof x === "string");
}

function persist(ids: string[]) {
  write(KEY, ids);
}

/** Registra um produto como visto (topo da fila, sem duplicatas, máx. 8). */
export function addViewed(id: string) {
  const next = [id, ...load().filter((x) => x !== id)].slice(0, MAX);
  persist(next);
}

/** Ids de produtos vistos, do mais recente ao mais antigo. */
export function getViewedIds(): string[] {
  return load();
}

/** Produtos vistos (ids resolvidos p/ `Product`), excluindo o opcional. */
export function getViewedProducts(excludeId?: string): Product[] {
  return getViewedIds()
    .filter((id) => id !== excludeId)
    .map(getProduct)
    .filter((p): p is Product => Boolean(p));
}

/** Limpa o histórico (útil p/ "esquecer" / privacidade). */
export function clearViewed() {
  persist([]);
}
