import { read, write } from "./storage";

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  holder: string;
  expiry: string;
  primary: boolean;
}

const KEY = "cards";

function load(): SavedCard[] {
  const raw = read<unknown>(KEY, []);
  return Array.isArray(raw) ? (raw as SavedCard[]) : [];
}

function persist(list: SavedCard[]) {
  write(KEY, list);
}

export function getCards(): SavedCard[] {
  return load();
}

export function detectBrand(number: string): string {
  const d = number.replace(/\D/g, "");
  if (d.startsWith("4")) return "Visa";
  if (d.startsWith("5") || d.startsWith("2")) return "Mastercard";
  if (d.startsWith("3")) return "Amex";
  if (d.startsWith("6")) return "Elo";
  return "Cartão";
}

export function addCard(input: {
  number: string;
  holder: string;
  expiry: string;
}): SavedCard[] {
  const d = input.number.replace(/\D/g, "");
  const list = load();
  const card: SavedCard = {
    id: `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    last4: d.slice(-4),
    brand: detectBrand(d),
    holder: input.holder.trim(),
    expiry: input.expiry,
    primary: list.length === 0,
  };
  const next = [...list, card];
  persist(next);
  return next;
}

export function removeCard(id: string): SavedCard[] {
  let list = load().filter((c) => c.id !== id);
  if (list.length > 0 && !list.some((c) => c.primary)) {
    list = list.map((c, i) => ({ ...c, primary: i === 0 }));
  }
  persist(list);
  return list;
}

export function setPrimary(id: string): SavedCard[] {
  const list = load().map((c) => ({ ...c, primary: c.id === id }));
  persist(list);
  return list;
}
