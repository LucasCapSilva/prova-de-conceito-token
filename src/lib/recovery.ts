import { findAccountByEmail, setAccountPassword } from "./accounts";
import { clearLockState } from "./lockouts";
import { read, remove, write } from "./storage";

const STORAGE_KEY = "recovery";

export const RECOVERY_TTL_MS = 10 * 60_000;

export interface RecoveryTicket {
  email: string;
  code: string;
  expiresAt: number;
}

function randomCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const n =
    bytes[0] * 0x1000000 + bytes[1] * 0x10000 + bytes[2] * 0x100 + bytes[3];
  return String(100000 + (n % 900000));
}

export function getRecovery(): RecoveryTicket | null {
  const raw = read<unknown>(STORAGE_KEY, null);
  if (typeof raw !== "object" || raw === null) return null;
  const t = raw as RecoveryTicket;
  if (
    typeof t.email !== "string" ||
    typeof t.code !== "string" ||
    typeof t.expiresAt !== "number"
  ) {
    return null;
  }
  if (t.expiresAt <= Date.now()) {
    remove(STORAGE_KEY);
    return null;
  }
  return t;
}

export function issueRecovery(email: string): RecoveryTicket | null {
  const account = findAccountByEmail(email);
  if (!account) return null;
  const ticket: RecoveryTicket = {
    email: account.email,
    code: randomCode(),
    expiresAt: Date.now() + RECOVERY_TTL_MS,
  };
  write(STORAGE_KEY, ticket);
  return ticket;
}

export function confirmRecoveryCode(email: string, code: string): boolean {
  const ticket = getRecovery();
  if (!ticket) return false;
  if (ticket.email !== email.trim().toLowerCase()) return false;
  return ticket.code === code.trim();
}

export async function completeRecovery(
  email: string,
  newPassword: string
): Promise<void> {
  const account = findAccountByEmail(email);
  if (!account) throw new Error("Conta não encontrada.");
  await setAccountPassword(account.id, newPassword);
  remove(STORAGE_KEY);
  clearLockState(account.email);
}
