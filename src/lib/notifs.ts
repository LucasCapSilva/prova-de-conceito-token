import { read, write } from "./storage";

export type NotifKind = "promocoes" | "pedidos" | "mensagens";

export interface NotifPrefs {
  promocoes: boolean;
  pedidos: boolean;
  mensagens: boolean;
}

export const NOTIF_PREFS_EVENT = "electronica:notif-prefs";

const KEY = "notif:prefs";

export function getNotifPrefs(): NotifPrefs {
  const parsed: unknown = read<unknown>(KEY, null);
  const data: Partial<Record<NotifKind, boolean>> =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Partial<Record<NotifKind, boolean>>)
      : {};
  return {
    promocoes: data.promocoes !== false,
    pedidos: data.pedidos !== false,
    mensagens: data.mensagens !== false,
  };
}

export function setNotifPref(kind: NotifKind, on: boolean): NotifPrefs {
  const next: NotifPrefs = { ...getNotifPrefs(), [kind]: on };
  write(KEY, next);
  try {
    window.dispatchEvent(new CustomEvent(NOTIF_PREFS_EVENT));
  } catch {
    /* sem eventos */
  }
  return next;
}
