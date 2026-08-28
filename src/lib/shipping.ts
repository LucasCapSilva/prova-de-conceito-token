import { freeShipThreshold } from "./loyalty.ts";

export interface ShippingQuote {
  value: number;
  days: number;
  free: boolean;
}

export type ShippingOptionId = "economic" | "standard" | "express";

export interface ShippingOption {
  id: ShippingOptionId;
  name: string;
  days: number;
  value: number;
}

export interface HasFreeShipping {
  freeShipping: boolean;
}

export const FREE_SHIPPING_THRESHOLD = 999;

export function quoteShipping(
  cepRaw: string,
  items: HasFreeShipping[],
  subtotal: number
): ShippingQuote | null {
  const digits = cepRaw.replace(/\D/g, "");
  if (digits.length < 8) return null;

  const sum = digits.split("").reduce((acc, c) => acc + Number(c), 0);
  const allFree = items.length > 0 && items.every((i) => i.freeShipping);
  const free = subtotal > freeShipThreshold() || allFree;
  const days = 2 + (sum % 6);

  if (free) return { value: 0, days, free: true };

  const value = Math.round((19.9 + (sum % 30)) * 100) / 100;
  return { value, days, free: false };
}

/** Data de entrega estimada (hoje + prazo) para o CEP, ou null sem CEP válido. */
export function estimateDeliveryDate(
  cepRaw: string,
  items: HasFreeShipping[],
  subtotal: number
): Date | null {
  const q = quoteShipping(cepRaw, items, subtotal);
  if (!q) return null;
  const d = new Date();
  d.setDate(d.getDate() + q.days);
  return d;
}

/** As três opções de entrega (econômico, padrão e expresso) para o CEP. */
export function quoteShippingOptions(
  cepRaw: string,
  items: HasFreeShipping[],
  subtotal: number
): ShippingOption[] | null {
  const quote = quoteShipping(cepRaw, items, subtotal);
  if (!quote) return null;

  const base = quote.free ? 0 : quote.value;
  const r = (n: number) => Math.round(n * 100) / 100;

  return [
    {
      id: "economic",
      name: "Econômico",
      days: quote.days + 2,
      value: r(base * 0.8),
    },
    {
      id: "standard",
      name: "Padrão",
      days: quote.days,
      value: base,
    },
    {
      id: "express",
      name: "Expresso",
      days: Math.max(1, quote.days - 2),
      value: quote.free ? 0 : r(base * 1.5),
    },
  ];
}
