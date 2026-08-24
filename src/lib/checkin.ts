import { earnCoins } from "./coins";

const KEY = "electronica:checkin";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

function persist(days: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(days));
  } catch {
    /* ignora */
  }
}

export function getCheckins(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function hasCheckedToday(): boolean {
  return getCheckins().includes(todayKey());
}

export function streak(): number {
  const days = new Set(getCheckins());
  const d = new Date();
  let n = 0;
  while (days.has(dayKey(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const CHECKIN_REWARDS = [5, 10, 15, 20, 25, 30, 35] as const;

export function rewardForDay(day: number): number {
  return CHECKIN_REWARDS[Math.min(day, CHECKIN_REWARDS.length) - 1];
}

export function checkInToday(): number | null {
  const days = getCheckins();
  if (hasCheckedToday()) return null;
  const next = [...days, todayKey()];
  persist(next);
  const newStreak = streak();
  const reward = rewardForDay(newStreak);
  earnCoins(reward);
  return reward;
}
