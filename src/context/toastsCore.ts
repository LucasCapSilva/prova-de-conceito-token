import { createContext, useContext } from "react";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export interface ToastsContextValue {
  toasts: ToastItem[];
  toast: ToastApi;
  dismiss: (id: number) => void;
}

export const ToastsContext = createContext<ToastsContextValue | null>(null);

export function useToasts() {
  const ctx = useContext(ToastsContext);
  if (!ctx) throw new Error("useToasts deve ser usado dentro de ToastsProvider");
  return ctx;
}
