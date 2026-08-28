import { read, write } from "./storage";

const KEY = "search:history";

function load(): string[] {
  const raw = read<unknown>(KEY, []);
  const arr = Array.isArray(raw) ? raw : [];
  return arr.filter((t): t is string => typeof t === "string").slice(0, 10);
}

function persist(next: string[]): string[] {
  write(KEY, next);
  return next;
}

export function getSearchHistory(): string[] {
  return load();
}

export function pushSearchHistory(term: string): string[] {
  const t = term.trim();
  if (!t) return load();
  const next = [
    t,
    ...load().filter((x) => x.toLowerCase() !== t.toLowerCase()),
  ].slice(0, 10);
  return persist(next);
}

export function removeSearchHistory(term: string): string[] {
  return persist(load().filter((x) => x !== term));
}

export function clearSearchHistory(): string[] {
  return persist([]);
}
