import { getProduct, type Product } from "../data/products";

const KEY = "electronica:recent";
const MAX = 8;

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr.filter(Boolean) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage indisponível — ignora */
  }
}

/** Registra um produto como visto (topo da fila, sem duplicatas, máx. 8). */
export function addViewed(id: string) {
  const next = [id, ...read().filter((x) => x !== id)].slice(0, MAX);
  write(next);
}

/** Ids de produtos vistos, do mais recente ao mais antigo. */
export function getViewedIds(): string[] {
  return read();
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
  write([]);
}
