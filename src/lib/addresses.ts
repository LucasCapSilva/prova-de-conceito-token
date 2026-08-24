import type { Address } from "./orders";

const KEY = "electronica:addresses";

export function getAddresses(): Address[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Address[]) : [];
  } catch {
    return [];
  }
}

export function addAddress(addr: Address): void {
  const list = getAddresses();
  list.unshift(addr);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage indisponível — ignora */
  }
}

export function removeAddress(index: number): Address[] {
  const list = getAddresses().filter((_, i) => i !== index);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage indisponível — ignora */
  }
  return list;
}
