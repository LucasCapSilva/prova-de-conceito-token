import type { Address } from "./orders";
import { read, write } from "./storage";

const KEY = "addresses";

export function getAddresses(): Address[] {
  const raw = read<unknown>(KEY, []);
  return Array.isArray(raw) ? (raw as Address[]) : [];
}

export function addAddress(addr: Address): void {
  const list = getAddresses();
  list.unshift(addr);
  write(KEY, list);
}

export function removeAddress(index: number): Address[] {
  const list = getAddresses().filter((_, i) => i !== index);
  write(KEY, list);
  return list;
}
