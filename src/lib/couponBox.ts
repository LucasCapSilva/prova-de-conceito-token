const KEY = "electronica:coupons";

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function persist(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* sem persistência */
  }
}

export function getCollected(): string[] {
  return load();
}

export function hasCollected(id: string): boolean {
  return load().includes(id);
}

export function collectCoupon(id: string): string[] {
  const all = load();
  if (!all.includes(id)) all.push(id);
  persist(all);
  return all;
}

export function uncollectCoupon(id: string): string[] {
  const all = load().filter((x) => x !== id);
  persist(all);
  return all;
}
