import { useState } from "react";
import { Link } from "react-router-dom";
import { getProduct } from "../data/products";
import {
  getPriceAlerts,
  getRestockAlerts,
  removeAlert,
  removeRestockAlert,
  type PriceAlert,
  type RestockAlert,
} from "../lib/alerts";
import {
  describeSelection,
  parseVariantKey,
  stockForSelection,
} from "../lib/variants";
import { formatBRL } from "../lib/format";
import EmptyState from "../components/EmptyState";

type Tab = "preco" | "estoque";

type PriceRow = {
  alert: PriceAlert;
  product: NonNullable<ReturnType<typeof getProduct>>;
};

type RestockRow = {
  alert: RestockAlert;
  product: NonNullable<ReturnType<typeof getProduct>>;
};

export default function Alerts() {
  const [tab, setTab] = useState<Tab>("preco");
  const [, setTick] = useState(0);

  const priceAlerts = getPriceAlerts();
  const restockAlerts = getRestockAlerts();

  const priceRows: PriceRow[] = priceAlerts.flatMap((a) => {
    const p = getProduct(a.productId);
    return p ? [{ alert: a, product: p }] : [];
  });

  const restockRows: RestockRow[] = restockAlerts.flatMap((a) => {
    const p = getProduct(a.productId);
    return p ? [{ alert: a, product: p }] : [];
  });

  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <h1 className="text-2xl font-black text-ink sm:text-3xl">Alertas</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {tab === "preco"
          ? priceRows.length === 0
            ? "Você ainda não está monitorando nenhum produto."
            : `Você está monitorando ${priceRows.length} produto${
                priceRows.length === 1 ? "" : "s"
              }.`
          : restockRows.length === 0
            ? "Você ainda não está aguardando reposição de nenhum produto."
            : `Você está aguardando ${restockRows.length} reposição${
                restockRows.length === 1 ? "" : "s"
              }.`}
      </p>

      <div
        className="mt-5 flex items-center gap-2"
        role="tablist"
        aria-label="Tipos de alerta"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "preco"}
          onClick={() => setTab("preco")}
          className={`rounded-[4px] px-3 py-1.5 text-sm font-semibold transition-colors ${
            tab === "preco"
              ? "bg-brand text-white"
              : "border border-line bg-surface text-ink hover:bg-brand-soft"
          }`}
        >
          🔔 Preço ({priceAlerts.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "estoque"}
          onClick={() => setTab("estoque")}
          className={`rounded-[4px] px-3 py-1.5 text-sm font-semibold transition-colors ${
            tab === "estoque"
              ? "bg-brand text-white"
              : "border border-line bg-surface text-ink hover:bg-brand-soft"
          }`}
        >
          📦 Estoque ({restockAlerts.length})
        </button>
      </div>

      <div className="mt-6">
        {tab === "preco" ? (
          <div role="tabpanel" aria-label="Alertas de preço">
            {priceRows.length === 0 ? (
              <EmptyState
                icon="bell"
                title="Nenhum alerta de preço"
                message='Abra um produto e toque em "Avisar-me quando baixar" para começar a monitorar o preço.'
                cta={{ to: "/produtos", label: "Explorar produtos" }}
              />
            ) : (
              <div className="space-y-3">
                {priceRows.map(({ alert, product }) => {
                  const diff =
                    product.price - alert.target;
                  const hit = product.price <= alert.target;
                  return (
                    <div
                      key={alert.productId}
                      className="card flex items-center gap-4 rounded-lg p-4"
                    >
                      <Link
                        to={`/produto/${product.id}`}
                        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[4px] border border-line bg-white"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          width={64}
                          height={64}
                          className="size-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/produto/${product.id}`}
                          className="block truncate font-semibold text-ink hover:text-brand"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-0.5 text-sm text-ink-soft">
                          {hit ? (
                            <>
                              <span className="font-semibold text-[#00A884]">
                                ✓ Chegou!
                              </span>{" "}
                              Está a{" "}
                              <strong className="text-brand">
                                {formatBRL(product.price)}
                              </strong>{" "}
                              abaixo do alvo.
                            </>
                          ) : (
                            <>
                              A {formatBRL(product.price)} · faltam{" "}
                              <strong className="text-ink">
                                {formatBRL(diff)}
                              </strong>{" "}
                              para o seu alvo de{" "}
                              <strong className="text-ink">
                                {formatBRL(alert.target)}
                              </strong>
                              .
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Link
                          to={`/produto/${product.id}`}
                          className="text-sm font-semibold text-brand hover:underline"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            removeAlert(alert.productId);
                            refresh();
                          }}
                          className="text-sm font-semibold text-ink-soft hover:text-ink hover:underline"
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
        ) : (
          <div role="tabpanel" aria-label="Alertas de estoque">
            {restockRows.length === 0 ? (
              <EmptyState
                icon="bell"
                title="Nenhum aviso de estoque"
                message='Abra um produto esgotado e toque em "Avisar quando voltar ao estoque" para ser avisado.'
                cta={{ to: "/produtos", label: "Explorar produtos" }}
              />
            ) : (
              <div className="space-y-3">
                {restockRows.map(({ alert, product }) => {
                  const backInStock =
                    stockForSelection(
                      product,
                      parseVariantKey(alert.variantKey)
                    ) > 0;
                  const label = describeSelection(
                    product,
                    alert.variantKey
                  );
                  return (
                    <div
                      key={`${alert.productId}:${alert.variantKey ?? ""}`}
                      className="card flex items-center gap-4 rounded-lg p-4"
                    >
                      <Link
                        to={`/produto/${product.id}`}
                        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[4px] border border-line bg-white"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          width={64}
                          height={64}
                          className="size-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/produto/${product.id}`}
                          className="block truncate font-semibold text-ink hover:text-brand"
                        >
                          {product.name}
                        </Link>
                        {label && (
                          <p className="truncate text-xs text-ink-soft">
                            {label}
                          </p>
                        )}
                        <p className="mt-0.5 text-sm">
                          {backInStock ? (
                            <span className="font-semibold text-[#00A884]">
                              ✓ De volta ao estoque!
                            </span>
                          ) : (
                            <span className="text-ink-soft">
                              Ainda esgotado — avisaremos assim que chegar.
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Link
                          to={`/produto/${product.id}`}
                          className="text-sm font-semibold text-brand hover:underline"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            removeRestockAlert(
                              alert.productId,
                              alert.variantKey
                            );
                            refresh();
                          }}
                          className="text-sm font-semibold text-ink-soft hover:text-ink hover:underline"
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
        )}
      </div>
    </div>
  );
}
