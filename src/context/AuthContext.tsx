import { useEffect, useState, type ReactNode } from "react";
import { read, remove, write } from "../lib/storage";
import {
  AuthContext,
  type AuthContextValue,
  type AuthResult,
  type User,
} from "./authCore";
import {
  changePassword as changeAccountPassword,
  createAccount,
  createLegacyAccount,
  findAccountByEmail,
  findAccountById,
  normalizeEmail,
  setAccountPassword,
  updateAccount,
  verifyLogin,
  type Account,
  type AccountPatch,
} from "../lib/accounts";
import {
  clearLockState,
  getLockState,
  registerFailedAttempt,
} from "../lib/lockouts";
import {
  clearSession,
  consumeExpiredSession,
  createSession,
  getSession,
  renewSession,
} from "../lib/session";
import { clearSearchHistory } from "../lib/searchHistory";

const STORAGE_KEY = "user";

function isUser(v: unknown): v is User {
  if (typeof v !== "object" || v === null) return false;
  return typeof (v as User).name === "string";
}

function legacyUser(): User | null {
  const raw = read<unknown>(STORAGE_KEY, null);
  if (!isUser(raw)) return null;
  return { ...raw, hasPassword: false };
}

function userFromAccount(account: Account): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    cpf: account.cpf,
    birthdate: account.birthdate,
    sellerId: account.sellerId ?? null,
    hasPassword: account.salt !== "",
  };
}

function userFromSession(): User | null {
  const session = getSession();
  if (!session) return null;
  const account = findAccountById(session.accountId);
  if (!account) return null;
  return userFromAccount(account);
}

function initialUser(): User | null {
  return userFromSession() ?? legacyUser();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionExpired] = useState<boolean>(consumeExpiredSession);
  const [user, setUser] = useState<User | null>(() => initialUser());

  useEffect(() => {
    if (getSession()) renewSession();
  }, []);

  // Migra sessões gravadas no login antigo (mock) para uma conta real sem
  // senha, preservando nome, e-mail e perfil. Roda uma vez na carga.
  useEffect(() => {
    const legacy = legacyUser();
    if (!legacy) return;
    remove(STORAGE_KEY);
    const patch: AccountPatch = {
      name: legacy.name,
      phone: legacy.phone,
      cpf: legacy.cpf,
      birthdate: legacy.birthdate,
      sellerId: legacy.sellerId ?? null,
    };
    const existing = findAccountByEmail(legacy.email);
    let account: Account;
    if (existing) {
      updateAccount(existing.id, patch);
      account = findAccountById(existing.id) ?? existing;
    } else {
      account = createLegacyAccount(legacy.name, legacy.email, patch);
    }
    createSession(account.id);
    setUser(userFromAccount(account));
  }, []);

  const register: AuthContextValue["register"] = async (
    name,
    email,
    password,
  ) => {
    try {
      const account = await createAccount(name, email, password);
      createSession(account.id);
      setUser(userFromAccount(account));
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error:
          e instanceof Error ? e.message : "Não foi possível criar a conta.",
      };
    }
  };

  const loginWithCredentials: AuthContextValue["loginWithCredentials"] = async (
    email,
    password,
  ) => {
    const normalized = normalizeEmail(email);
    if (getLockState(normalized).lockedUntil > Date.now()) {
      return {
        ok: false,
        error: "Muitas tentativas incorretas. Aguarde o fim do bloqueio.",
      };
    }
    try {
      const account = await verifyLogin(email, password);
      if (!account) {
        registerFailedAttempt(normalized);
        return { ok: false, error: "E-mail ou senha inválidos." };
      }
      clearLockState(normalized);
      createSession(account.id);
      setUser(userFromAccount(account));
      return { ok: true };
    } catch {
      return { ok: false, error: "E-mail ou senha inválidos." };
    }
  };

  const logout: AuthContextValue["logout"] = () => {
    clearSession();
    remove(STORAGE_KEY);
    clearSearchHistory();
    setUser(null);
  };

  const updateUser: AuthContextValue["updateUser"] = (patch) => {
    if (!user) return;
    const next: User = { ...user, ...patch };
    if (user.id) {
      const patchAccount: AccountPatch = {
        name: next.name,
        phone: next.phone,
        cpf: next.cpf,
        birthdate: next.birthdate,
      };
      updateAccount(user.id, patchAccount);
    } else {
      write(STORAGE_KEY, next);
    }
    setUser(next);
  };

  const setSeller: AuthContextValue["setSeller"] = (sellerId) => {
    if (!user) return;
    if (user.id) {
      updateAccount(user.id, { sellerId });
      setUser({ ...user, sellerId });
    } else {
      const next: User = { ...user, sellerId };
      write(STORAGE_KEY, next);
      setUser(next);
    }
  };

  const changePassword: AuthContextValue["changePassword"] = async (
    current,
    next,
  ) => {
    if (!user?.id) {
      return { ok: false, error: "Sua conta não possui senha." };
    }
    try {
      await changeAccountPassword(user.id, current, next);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error:
          e instanceof Error ? e.message : "Não foi possível alterar a senha.",
      };
    }
  };

  const setPassword: AuthContextValue["setPassword"] = async (next) => {
    if (!user?.id) {
      return { ok: false, error: "Sua conta não possui senha." };
    }
    try {
      await setAccountPassword(user.id, next);
      setUser((prev) => (prev ? { ...prev, hasPassword: true } : prev));
      return { ok: true };
    } catch {
      return { ok: false, error: "Não foi possível definir a senha." };
    }
  };

  const value: AuthContextValue = {
    user,
    sessionExpired,
    register,
    loginWithCredentials,
    logout,
    updateUser,
    setSeller,
    changePassword,
    setPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export type { AuthResult };
