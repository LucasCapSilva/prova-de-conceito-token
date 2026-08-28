export type StorageErrorKind = "unavailable" | "quota";

type Listener = (kind: StorageErrorKind) => void;

export const STORAGE_PREFIX = "electronica:";

const memory = new Map<string, string>();
const listeners = new Set<Listener>();
const warned = new Set<StorageErrorKind>();
let persistent: boolean | null = null;

function probe(): boolean {
  if (persistent !== null) return persistent;
  try {
    const probeKey = STORAGE_PREFIX + "__probe__";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    persistent = true;
  } catch {
    persistent = false;
  }
  return persistent;
}

export function isPersistent(): boolean {
  return probe();
}

export function onStorageError(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notify(kind: StorageErrorKind) {
  if (warned.has(kind)) return;
  warned.add(kind);
  for (const cb of listeners) {
    try {
      cb(kind);
    } catch {
      /* listener com defeito não derruba o storage */
    }
  }
}

function isQuotaError(e: unknown): boolean {
  if (e instanceof DOMException) {
    return (
      e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED"
    );
  }
  return false;
}

export function readRaw(key: string): string | null {
  if (isPersistent()) {
    try {
      return localStorage.getItem(STORAGE_PREFIX + key);
    } catch {
      notify("unavailable");
      persistent = false;
    }
  }
  return memory.get(key) ?? null;
}

export function writeRaw(key: string, value: string): boolean {
  if (isPersistent()) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value);
      return true;
    } catch (e) {
      notify(isQuotaError(e) ? "quota" : "unavailable");
    }
  }
  memory.set(key, value);
  return false;
}

export function read<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): boolean {
  return writeRaw(key, JSON.stringify(value));
}

export function remove(key: string) {
  if (isPersistent()) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      /* já sem persistência */
    }
  }
  memory.delete(key);
}

export function allKeys(): string[] {
  const keys: string[] = [];
  if (isPersistent()) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
  } else {
    for (const k of memory.keys()) keys.push(STORAGE_PREFIX + k);
  }
  return keys;
}

/** Chaves lidas hoje por algum módulo; as demais são órfãs. */
export const KNOWN_KEYS: readonly string[] = [
  "accounts",
  "accountPromptDismissed",
  "ad:reports",
  "alerts",
  "addresses",
  "cards",
  "cart",
  "chat",
  "checkin",
  "checkoutDraft",
  "coins",
  "coupons",
  "favorites",
  "follows",
  "lists",
  "lockouts",
  "myreviews",
  "novidades:seen",
  "notifs:seen",
  "notif:prefs",
  "orders",
  "sellerratings",
  "pwHint",
  "questions",
  "recent",
  "recovery",
  "review:reports",
  "returns",
  "savedFilters",
  "savelater",
  "schema",
  "search:history",
  "seller:coupons",
  "seller:customProducts",
  "seller:goal",
  "seller:overrides",
  "seller:promos",
  "seller:replies",
  "session",
  "textSize",
  "theme",
  "tourSeen",
  "user",
];

export function cleanOrphanKeys(): void {
  const known = new Set<string>(KNOWN_KEYS);
  for (const key of allKeys()) {
    const bare = key.startsWith(STORAGE_PREFIX)
      ? key.slice(STORAGE_PREFIX.length)
      : key;
    if (!known.has(bare)) remove(bare);
  }
}

export const SCHEMA_VERSION = 1;

type Migration = () => void;

const migrations: Migration[] = [];

export function migrateSchema(): void {
  const stored = read<number>("schema", 0);
  const from =
    typeof stored === "number" && Number.isFinite(stored)
      ? Math.min(Math.max(Math.floor(stored), 0), SCHEMA_VERSION)
      : 0;
  for (let v = from; v < SCHEMA_VERSION; v += 1) {
    migrations[v]?.();
  }
  write("schema", SCHEMA_VERSION);
}

migrations[0] = cleanOrphanKeys;
