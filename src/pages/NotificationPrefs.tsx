import { useState } from "react";
import {
  getNotifPrefs,
  setNotifPref,
  type NotifKind,
} from "../lib/notifs";

const ROWS: { kind: NotifKind; label: string; desc: string }[] = [
  {
    kind: "promocoes",
    label: "Promoções",
    desc: "Cupons, ofertas relâmpago e descontos da loja.",
  },
  {
    kind: "pedidos",
    label: "Pedidos",
    desc: "Status do pedido, envio e frete.",
  },
  {
    kind: "mensagens",
    label: "Mensagens",
    desc: "Novas mensagens de vendedores e perguntas.",
  },
];

export default function NotificationPrefs() {
  const [prefs, setPrefs] = useState(() => getNotifPrefs());

  const toggle = (kind: NotifKind) => {
    setPrefs(setNotifPref(kind, !prefs[kind]));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Preferências de notificação
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Escolha o que aparece no sino do topo. As alterações valem na hora.
        </p>
      </div>

      <div className="card divide-y divide-line">
        {ROWS.map((row) => {
          const on = prefs[row.kind];
          return (
            <div
              key={row.kind}
              className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
            >
              <div>
                <p className="text-sm font-bold text-ink">{row.label}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{row.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={on}
                aria-label={row.label}
                onClick={() => toggle(row.kind)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  on ? "bg-brand" : "bg-line"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                    on ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
