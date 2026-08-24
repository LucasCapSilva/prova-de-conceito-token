import { createContext, useContext } from "react";

export interface User {
  name: string;
  email: string;
  sellerId?: string | null;
  phone?: string;
  cpf?: string;
  birthdate?: string;
}

export interface AuthContextValue {
  user: User | null;
  login: (name: string, email: string, sellerId?: string | null) => void;
  setSeller: (sellerId: string | null) => void;
  updateUser: (patch: Partial<Omit<User, "sellerId">>) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
