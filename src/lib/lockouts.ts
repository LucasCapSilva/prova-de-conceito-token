import { normalizeEmail } from "./accounts";
import { read, remove, write } from "./storage";

export const LOCKOUT_MAX_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

const STORAGE_KEY = "lockouts";

type LockoutEntry = { count: number; lockedUntil: number };
type LockoutMap = Record<string, LockoutEntry>;

export interface LockState {
  count: number;
  lockedUntil: number;
}

function load(): LockoutMap {
  const raw = read<unknown>(STORAGE_KEY, {});
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {};
  }
  return raw as LockoutMap;
}

function save(map: LockoutMap) {
  if (Object.keys(map).length === 0) {
    remove(STORAGE_KEY);
  } else {
    write(STORAGE_KEY, map);
  }
}

function keyFor(email: string): string {
  return normalizeEmail(email);
}

const EMPTY: LockState = { count: 0, lockedUntil: 0 };

export function getLockState(email: string): LockState {
  const k = keyFor(email);
  if (k.length === 0) return EMPTY;
  const map = load();
  const entry = map[k];
  if (!entry) return EMPTY;
  if (entry.lockedUntil > 0 && entry.lockedUntil <= Date.now()) {
    delete map[k];
    save(map);
    return EMPTY;
  }
  return {
    count: typeof entry.count === "number" ? entry.count : 0,
    lockedUntil:
      typeof entry.lockedUntil === "number" ? entry.lockedUntil : 0,
  };
}

export function registerFailedAttempt(email: string): LockState {
  const k = keyFor(email);
  if (k.length === 0) return EMPTY;
  const map = load();
  const now = Date.now();
  const entry = map[k];
  if (entry && entry.lockedUntil > now) {
    return { count: entry.count, lockedUntil: entry.lockedUntil };
  }
  const count = (entry?.count ?? 0) + 1;
  const lockedUntil =
    count >= LOCKOUT_MAX_ATTEMPTS
      ? now + LOCKOUT_MINUTES * 60_000
      : 0;
  map[k] = { count, lockedUntil };
  save(map);
  return { count, lockedUntil };
}

export function clearLockState(email: string): void {
  const k = keyFor(email);
  if (k.length === 0) return;
  const map = load();
  if (!map[k]) return;
  delete map[k];
  save(map);
}

export function msUntilUnlock(email: string): number {
  const { lockedUntil } = getLockState(email);
  const remaining = lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}
