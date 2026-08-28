import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders, type Order } from "../lib/orders";
import { formatBRL, formatDate } from "../lib/format";
import { getProduct } from "../data/products";
import { maxQtyFor } from "../lib/variants";
import { useCart } from "../context/cartCore";
import EmptyState from "../components/EmptyState";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmado",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export default function Orders() {
  const { addItem } = useCart();
  const orders = useMemo(() => getOrders(), []);
  const [buyMsg, setBuyMsg] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, number>>({});

  function buyAgain(o: Order) {
    let added = 0;
    let missing = 0;
    for (const it of o.items) {
      const p = getProduct(it.id);
      if (!p) {
        missing++;
        continue;
      }
      const key = it.variantKey ?? null;
      const max = maxQtyFor(p, key);
      if (max <= 0) {
        missing++;
        continue;
      }
      addItem(p, Math.min(it.qty, max), key);
      added++;
    }
    const parts: string[] = [];
    if (added > 0)
      parts.push(`${added} item${added === 1 ? "" : "s"} adicionado${added === 1 ? "" : "s"} ao carrinho`);
    if (missing > 0)
      parts.push(`${missing} sem estoque e não adicionado${missing === 1 ? "" : "s"}`);
    setBuyMsg((m) => ({
      ...m,
      [o.id]:
        parts.length > 0
          ? parts.join(" · ")
          : "Nenhum item pôde ser adicionado ao carrinho.",
    }));
    window.clearTimeout(timers.current[o.id]);
    timers.current[o.id] = window.setTimeout(() => {
      setBuyMsg((m) => {
        const n = { ...m };
        delete n[o.id];
        return n;
      });
    }, 8000);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Meus pedidos
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {orders.length === 0
            ? "Você ainda não fez nenhum pedido."
            : `${orders.length} pedido${orders.length === 1 ? "" : "s"} no total.`}
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="package"
          title="Nenhum pedido ainda"
          message="Quando você finalizar uma compra, ela aparece aqui para você acompanhar."
          cta={{ to: "/produtos", label: "Ver produtos" }}
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Link
                  to={`/pedidos/${o.id}`}
                  className="card flex min-w-0 flex-1 flex-col gap-3 rounded-lg p-4 transition hover:border-brand sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-ink-soft">
                        Nº {o.tracking}
                      </span>
                      <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                        {o.pickup &&
                        (o.status === "delivered" || o.status === "shipped")
                          ? "Retirado"
                          : STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-ink">
                      {formatBRL(o.total)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                      {formatDate(o.createdAt)} · {o.payment}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 4).map((it) => (
                        <img
                          key={it.id}
                          src={it.image}
                          alt=""
                          aria-hidden
                          width={900}
                          height={900}
                          loading="lazy"
                          decoding="async"
                          className="size-9 rounded object-cover ring-2 ring-white"
                        />
                      ))}
                    </div>
                    <span className="text-lg text-ink-soft">›</span>
                  </div>
                </Link>
                <button
                  onClick={() => buyAgain(o)}
                  className="btn-brand shrink-0 rounded-[6px] px-4 py-2 text-sm font-bold"
                >
                  Comprar novamente
                </button>
              </div>
              {buyMsg[o.id] && (
                <p className="px-1 text-xs text-ink-soft" role="status">
                  {buyMsg[o.id]}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
