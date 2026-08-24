export type NotifKind = "promocoes" | "pedidos" | "mensagens";

export interface NotifPrefs {
  promocoes: boolean;
  pedidos: boolean;
  mensagens: boolean;
}

export const NOTIF_PREFS_EVENT = "electronica:notif-prefs";

const KEY = "electronica:notif:prefs";

export function getNotifPrefs(): NotifPrefs {
  let data: Partial<Record<NotifKind, boolean>> = {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        data = parsed as Partial<Record<NotifKind, boolean>>;
      }
    }
  } catch {
    data = {};
  }
  return {
    promocoes: data.promocoes !== false,
    pedidos: data.pedidos !== false,
    mensagens: data.mensagens !== false,
  };
}

export function setNotifPref(kind: NotifKind, on: boolean): NotifPrefs {
  const next: NotifPrefs = { ...getNotifPrefs(), [kind]: on };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* sem storage */
  }
  try {
    window.dispatchEvent(new CustomEvent(NOTIF_PREFS_EVENT));
  } catch {
    /* sem eventos */
  }
  return next;
}
