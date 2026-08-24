const KEY = "electronica:coins";

export function getCoins(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function persist(n: number) {
  try {
    const v = Math.max(0, Math.round(n));
    localStorage.setItem(KEY, String(v));
    return v;
  } catch {
    return 0;
  }
}

export function earnCoins(n: number): number {
  const base = getCoins();
  return persist(base + Math.max(0, Math.round(n)));
}

export function spendCoins(n: number): boolean {
  const base = getCoins();
  const amount = Math.max(0, Math.round(n));
  if (amount > base) return false;
  persist(base - amount);
  return true;
}
