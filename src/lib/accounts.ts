import { generateSalt, hashPassword, verifyPassword } from "./crypto.ts";
import { read, write } from "./storage.ts";

const STORAGE_KEY = "accounts";

export interface Account {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
  phone?: string;
  cpf?: string;
  birthdate?: string;
  sellerId?: string | null;
}

export type AccountPatch = Partial<
  Pick<Account, "name" | "phone" | "cpf" | "birthdate" | "sellerId">
>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function loadAll(): Account[] {
  const list = read<unknown>(STORAGE_KEY, []);
  return Array.isArray(list) ? (list as Account[]) : [];
}

export function listAccounts(): Account[] {
  return loadAll();
}

export function findAccountByEmail(email: string): Account | undefined {
  const target = normalizeEmail(email);
  return loadAll().find((a) => a.email === target);
}

export function findAccountById(id: string): Account | undefined {
  return loadAll().find((a) => a.id === id);
}

export async function createAccount(
  name: string,
  email: string,
  password: string
): Promise<Account> {
  const normalized = normalizeEmail(email);
  if (findAccountByEmail(normalized)) {
    throw new Error("Este e-mail já está cadastrado.");
  }
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const account: Account = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  write(STORAGE_KEY, [...loadAll(), account]);
  return account;
}

/**
 * Cria uma conta sem senha para quem migrou do login antigo (mock).
 * Sincrona porque não há senha para derivar. Se já existir uma conta
 * com o mesmo e-mail, devolve a existente.
 */
export function createLegacyAccount(
  name: string,
  email: string,
  patch?: AccountPatch
): Account {
  const normalized = normalizeEmail(email);
  const existing = findAccountByEmail(normalized);
  if (existing) return existing;
  const account: Account = {
    id: crypto.randomUUID(),
    name: name.trim() || normalized,
    email: normalized,
    salt: "",
    hash: "",
    createdAt: new Date().toISOString(),
    ...patch,
  };
  write(STORAGE_KEY, [...loadAll(), account]);
  return account;
}

export async function verifyLogin(
  email: string,
  password: string
): Promise<Account | null> {
  const account = findAccountByEmail(email);
  if (!account) return null;
  const ok = await verifyPassword(password, account.salt, account.hash);
  return ok ? account : null;
}

export async function setAccountPassword(
  accountId: string,
  newPassword: string,
): Promise<void> {
  const accounts = listAccounts();
  const index = accounts.findIndex((a) => a.id === accountId);
  if (index < 0) throw new Error("Conta não encontrada.");
  const salt = generateSalt();
  const hash = await hashPassword(newPassword, salt);
  accounts[index] = { ...accounts[index], salt, hash };
  write(STORAGE_KEY, accounts);
}

export async function changePassword(
  accountId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const accounts = listAccounts();
  const index = accounts.findIndex((a) => a.id === accountId);
  if (index < 0) throw new Error("Conta não encontrada.");
  const account = accounts[index];
  const currentOk = await verifyPassword(
    currentPassword,
    account.salt,
    account.hash
  );
  if (!currentOk) throw new Error("Senha atual incorreta.");
  const sameAsCurrent = await verifyPassword(
    newPassword,
    account.salt,
    account.hash
  );
  if (sameAsCurrent)
    throw new Error("A nova senha não pode ser igual à anterior.");
  const salt = generateSalt();
  const hash = await hashPassword(newPassword, salt);
  accounts[index] = { ...account, salt, hash };
  write(STORAGE_KEY, accounts);
}

export function updateAccount(accountId: string, patch: AccountPatch): void {
  const accounts = listAccounts();
  const index = accounts.findIndex((a) => a.id === accountId);
  if (index < 0) return;
  accounts[index] = { ...accounts[index], ...patch };
  write(STORAGE_KEY, accounts);
}
