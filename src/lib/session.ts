import { read, remove, write } from "./storage.ts";

const STORAGE_KEY = "session";

export const SESSION_DAYS = 7;

export interface Session {
  accountId: string;
  expiresAt: string;
}

function nowPlusDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export function createSession(accountId: string): void {
  write<Session>(STORAGE_KEY, { accountId, expiresAt: nowPlusDays(SESSION_DAYS) });
}

export function renewSession(): void {
  const s = read<Session | null>(STORAGE_KEY, null);
  if (!s || typeof s.accountId !== "string" || s.accountId === "") return;
  write<Session>(STORAGE_KEY, { accountId: s.accountId, expiresAt: nowPlusDays(SESSION_DAYS) });
}

export function consumeExpiredSession(): boolean {
  const s = read<Session | null>(STORAGE_KEY, null);
  if (!s || typeof s.accountId !== "string" || s.accountId === "") return false;
  const exp = new Date(s.expiresAt).getTime();
  if (Number.isNaN(exp) || exp < Date.now()) {
    remove(STORAGE_KEY);
    return true;
  }
  return false;
}

export function getSession(): Session | null {
  const s = read<Session | null>(STORAGE_KEY, null);
  if (!s || typeof s.accountId !== "string" || s.accountId === "") return null;
  const exp = new Date(s.expiresAt).getTime();
  if (Number.isNaN(exp) || exp < Date.now()) {
    remove(STORAGE_KEY);
    return null;
  }
  return s;
}

export function clearSession(): void {
  remove(STORAGE_KEY);
}
