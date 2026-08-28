import { readRaw, writeRaw } from "./storage";

const KEY = "coins";

export function getCoins(): number {
  const raw = readRaw(KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function persist(n: number): number {
  const v = Math.max(0, Math.round(n));
  writeRaw(KEY, String(v));
  return v;
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
