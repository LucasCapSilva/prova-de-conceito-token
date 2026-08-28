import { read, write } from "./storage";

const KEY = "coupons";

function load(): string[] {
  const raw = read<unknown>(KEY, []);
  const arr = Array.isArray(raw) ? raw : [];
  return arr.filter((v): v is string => typeof v === "string");
}

function persist(ids: string[]) {
  write(KEY, ids);
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
