import { useState } from "react";
import { Link } from "react-router-dom";
import { getProduct } from "../data/products";
import {
  getAlerts,
  removeAlert,
  type PriceAlert,
} from "../lib/alerts";
import { formatBRL } from "../lib/format";

type Row = {
  alert: PriceAlert;
  product: NonNullable<ReturnType<typeof getProduct>>;
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => getAlerts());

  const rows: Row[] = alerts
    .map((alert) => {
      const product = getProduct(alert.productId);
      return product ? { alert, product } : null;
    })
    .filter((r): r is Row => r !== null);

  const remove = (productId: string) => {
    removeAlert(productId);
    setAlerts(getAlerts());
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Alertas de preço
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {rows.length === 0
            ? "Você ainda não está monitorando nenhum produto."
            : `Você está monitorando ${rows.length} produto${rows.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
          <span className="text-4xl">🔔</span>
          <p className="text-sm font-semibold text-ink">
            Nenhum alerta ativo
          </p>
          <p className="max-w-xs text-xs text-ink-soft">
            Abra um produto e toque em "Avisar quando o preço baixar" para
            acompanhar uma redução.
          </p>
          <Link
            to="/produtos"
            className="btn-brand mt-1 rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            Explorar produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ alert, product }) => {
            const reached = product.price <= alert.target;
            return (
              <div
                key={alert.productId}
                className="card flex items-center gap-4 rounded-lg p-4"
              >
                <Link to={`/produto/${product.id}`} className="shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-20 rounded-[4px] border border-line object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/produto/${product.id}`}
                    className="line-clamp-1 font-semibold text-ink hover:text-brand"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">
                    Preço atual:{" "}
                    <span className="font-semibold text-ink">
                      {formatBRL(product.price)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    Avisar quando for ≤{" "}
                    <span className="font-semibold text-ink">
                      {formatBRL(alert.target)}
                    </span>
                  </p>
                  {reached && (
                    <span className="mt-1 inline-block rounded-[4px] bg-ship/15 px-2 py-0.5 text-xs font-bold text-ship">
                      ✓ Preço-alvo alcançado
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link
                    to={`/produto/${product.id}`}
                    className="rounded-[4px] border border-brand px-3 py-1.5 text-center text-sm font-semibold text-brand hover:bg-brand-soft"
                  >
                    Ver produto
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(alert.productId)}
                    className="text-xs font-semibold text-ink-soft hover:text-brand"
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
