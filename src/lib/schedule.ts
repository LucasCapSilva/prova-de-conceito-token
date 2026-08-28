export type ScheduleSlot = "manha" | "tarde" | "noite";

export interface DeliverySchedule {
  date: string;
  slot: ScheduleSlot;
  fee: number;
}

export const SCHEDULE_FEE = 19.9;

export const SCHEDULE_SLOTS: { id: ScheduleSlot; label: string }[] = [
  { id: "manha", label: "Manhã (8h–12h)" },
  { id: "tarde", label: "Tarde (12h–18h)" },
  { id: "noite", label: "Noite (18h–22h)" },
];

export function slotLabel(slot: string): string {
  return SCHEDULE_SLOTS.find((s) => s.id === slot)?.label ?? "";
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Próximos `count` dias úteis (segunda a sexta), começando depois de `from`. */
export function nextBusinessDays(count: number, from: Date = new Date()): string[] {
  const days: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(toISODate(d));
  }
  return days;
}
