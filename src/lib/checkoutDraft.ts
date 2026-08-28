import { read, write, remove } from "./storage.ts";
import type { Address } from "./orders";
import { nextBusinessDays, SCHEDULE_SLOTS } from "./schedule.ts";

export type DraftStep = 0 | 1 | 2 | 3;
export type DraftPayment = "pix" | "boleto" | "cartao";

export interface CheckoutDraft {
  step: DraftStep;
  address: Address;
  pickup: boolean;
  shippingId: string | null;
  payment: DraftPayment;
  installments: number;
  coinsUsed: number;
  scheduleMode: boolean;
  scheduleDate: string;
  scheduleSlot: string;
  savedAt: number;
}

const KEY = "checkoutDraft";

const PAYMENTS: DraftPayment[] = ["pix", "boleto", "cartao"];

function asAddress(v: unknown): Address | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const a = v as Record<string, unknown>;
  const str = (k: string) => (typeof a[k] === "string" ? a[k] : "");
  const neighborhood = str("neighborhood");
  return {
    name: str("name"),
    cpf: str("cpf"),
    cep: str("cep"),
    street: str("street"),
    number: str("number"),
    complement: str("complement"),
    city: str("city"),
    state: str("state"),
    ...(neighborhood !== "" ? { neighborhood } : {}),
  };
}

function asInt(v: unknown, fallback: number, min: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min
    ? Math.floor(v)
    : fallback;
}

export function loadDraft(): CheckoutDraft | null {
  const raw = read<Record<string, unknown> | null>(KEY, null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const stepRaw = asInt(raw.step, 0, 0);
  if (stepRaw > 3) return null;
  const address = asAddress(raw.address);
  const payment: DraftPayment = PAYMENTS.includes(raw.payment as DraftPayment)
    ? (raw.payment as DraftPayment)
    : "pix";
  const installments = asInt(raw.installments, 1, 1);
  const coinsUsed = asInt(raw.coinsUsed, 0, 0);
  const shippingId = typeof raw.shippingId === "string" ? raw.shippingId : null;
  const pickup = raw.pickup === true;
  const scheduleMode = raw.scheduleMode === true;
  const scheduleDate =
    typeof raw.scheduleDate === "string" &&
    nextBusinessDays(15).includes(raw.scheduleDate)
      ? raw.scheduleDate
      : "";
  const scheduleSlot =
    typeof raw.scheduleSlot === "string" &&
    SCHEDULE_SLOTS.some((s) => s.id === raw.scheduleSlot)
      ? raw.scheduleSlot
      : "";
  const savedAt = asInt(raw.savedAt, Date.now(), 0);
  const rawAddr =
    raw.address && typeof raw.address === "object" && !Array.isArray(raw.address)
      ? (raw.address as Record<string, unknown>)
      : null;
  const addressHasContent =
    rawAddr !== null &&
    Object.values(rawAddr).some(
      (v) => typeof v === "string" && v.trim() !== ""
    );
  const hasContent =
    addressHasContent ||
    stepRaw > 0 ||
    payment !== "pix" ||
    coinsUsed > 0 ||
    pickup ||
    scheduleDate !== "";
  if (!hasContent) return null;
  const step: DraftStep = (address === null ? 0 : stepRaw) as DraftStep;
  return {
    step,
    address: address ?? {
      name: "",
      cpf: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      city: "",
      state: "",
    },
    pickup,
    shippingId,
    payment,
    installments,
    coinsUsed,
    scheduleMode,
    scheduleDate,
    scheduleSlot,
    savedAt,
  };
}

export function saveDraft(draft: CheckoutDraft): void {
  write(KEY, draft);
}

export function clearDraft(): void {
  remove(KEY);
}
