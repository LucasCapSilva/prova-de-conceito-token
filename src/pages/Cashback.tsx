import { Link } from "react-router-dom";
import {
  CASHBACK_PERCENT,
  RELEASE_DAYS,
  cashbackStatement,
  categoryLabel,
} from "../lib/cashback";
import { formatBRL, formatDate } from "../lib/format";
import { CATEGORIES } from "../data/products.ts";

function dOnly(s: string) {
  return formatDate(new Date(`${s}T12:00:00`));
}

export default function Cashback() {
  const st = cashbackStatement();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-12 sm:pt-28">
      <h1 className="text-2xl font-black text-ink">Meu cashback</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Percentual por categoria creditado ao concluir cada pedido, liberado
        {RELEASE_DAYS} dias após a data de entrega estimada.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
        <section className="card p-5">
          <p className="text-xs font-black uppercase tracking-wide text-ink-soft">
            Saldo disponível
          </p>
          <p className="mt-2 text-3xl font-black text-brand">
            {formatBRL(st.availableCents / 100)}
          </p>
          <div className="mt-4 space-y-1 text-xs text-ink-soft">
            <p className="flex justify-between">
              <span>Total creditado</span>
              <span className="font-bold text-ink">
                {formatBRL(st.creditedCents / 100)}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Já utilizado</span>
              <span className="font-bold text-ink">
                {formatBRL(st.usedCents / 100)}
              </span>
            </p>
          </div>
          <Link
            to="/carrinho"
            className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Usar no checkout
          </Link>
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-ink-soft">
              Percentual por categoria
            </p>
            <ul className="space-y-1 text-xs text-ink-soft">
              {CATEGORIES.filter((c) => c.key !== "todos").map((c) => (
                <li key={c.key} className="flex justify-between">
                  <span>{c.label}</span>
                  <span className="font-bold text-ink">
                    {CASHBACK_PERCENT[c.key as Exclude<typeof c.key, "todos">]}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-lg font-black text-ink">Extrato</h2>
          {st.entries.length === 0 ? (
            <div className="py-10 text-center">
              <svg
                className="mx-auto h-12 w-12 text-line"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <p className="mt-3 text-sm text-ink-soft">
                Você ainda não tem cashback creditado.
              </p>
              <Link
                to="/produtos"
                className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {st.entries.map((e) => {
                const released = e.releaseAt <= today;
                return (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {e.productName}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {categoryLabel(e.category)} · pedido{" "}
                        <span className="font-medium">{e.orderId}</span> ·
                        creditado em {formatDate(e.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-ship">
                        +{formatBRL(e.amountCents / 100)}
                      </p>
                      <p
                        className={`text-xs ${
                          released
                            ? "font-bold text-ship"
                            : "text-ink-soft"
                        }`}
                      >
                        {released
                          ? "Liberado"
                          : `Libera em ${dOnly(e.releaseAt)}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {st.uses.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <h3 className="mb-2 text-sm font-black text-ink">
                Usos no checkout
              </h3>
              <ul className="divide-y divide-line">
                {st.uses.map((u) => (
                  <li
                    key={u.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-ink-soft">
                      Pedido <span className="font-medium">{u.orderId}</span>{" "}
                      · {formatDate(u.createdAt)}
                    </span>
                    <span className="font-bold text-ink">
                      −{formatBRL(u.amountCents / 100)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
