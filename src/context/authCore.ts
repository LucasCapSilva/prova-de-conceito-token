import { createContext, useContext } from "react";

export interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  birthdate?: string;
  sellerId?: string | null;
  hasPassword: boolean;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface AuthContextValue {
  user: User | null;
  sessionExpired: boolean;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  loginWithCredentials: (
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  setSeller: (sellerId: string | null) => void;
  changePassword: (current: string, next: string) => Promise<AuthResult>;
  setPassword: (next: string) => Promise<AuthResult>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
