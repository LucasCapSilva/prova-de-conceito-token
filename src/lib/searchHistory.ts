const KEY = "electronica:search:history";

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t) => typeof t === "string").slice(0, 10);
  } catch {
    return [];
  }
}

function persist(next: string[]): string[] {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* sem storage */
  }
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
