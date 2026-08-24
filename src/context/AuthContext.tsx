import { useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSearchHistory } from "../lib/searchHistory";
import { AuthContext, type AuthContextValue, type User } from "./authCore";

const STORAGE_KEY = "electronica:user";

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (parsed && typeof parsed.name === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadUser());

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage indisponível — ignora */
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (name: string, email: string, sellerId?: string | null) =>
        setUser({ name, email, sellerId: sellerId ?? null }),
      setSeller: (sellerId: string | null) =>
        setUser((u) => (u ? { ...u, sellerId } : u)),
      updateUser: (patch: Partial<Omit<User, "sellerId">>) =>
        setUser((u) => (u ? { ...u, ...patch } : u)),
      logout: () => {
        clearSearchHistory();
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
