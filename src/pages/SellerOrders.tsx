import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import {
  getOrders,
  advanceOrderStatus,
  nextStatusOf,
  type Order,
  type OrderStatus,
} from "../lib/orders";
import { formatBRL, formatDate } from "../lib/format";

const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: "Confirmado",
  processing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_CLS: Record<OrderStatus, string> = {
  confirmed: "bg-brand-soft text-brand",
  processing: "bg-star/40 text-ink",
  shipped: "bg-ship/15 text-ship",
  delivered: "bg-ship/15 text-ship",
  cancelled: "bg-line text-ink-soft",
};

function shortId(id: string) {
  return id.replace("ped-", "").toUpperCase();
}

function sellerItems(o: Order, sellerName: string) {
  return o.items.filter((it) => it.seller === sellerName);
}

export default function SellerOrders() {
  const { user } = useAuth();
  const [, setTick] = useState(0);

  const seller = user?.sellerId ? getSeller(user.sellerId) : undefined;

  const orders = seller
    ? getOrders().filter((o) =>
        o.items.some((it) => it.seller === seller.name),
      )
    : [];

  if (!user?.sellerId || !seller) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
        <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
          <span className="text-4xl" aria-hidden>
            🏪
          </span>
          <h1 className="text-lg font-black text-ink">Pedidos do vendedor</h1>
          <p className="max-w-sm text-sm text-ink-soft">
            Entre com uma conta de vendedor para acompanhar e atualizar os
            pedidos que contêm produtos da sua loja.
          </p>
          <Link
            to="/entrar"
            className="btn-brand mt-1 rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            Entrar como vendedor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">
          Painel do vendedor
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {orders.length} pedido(s) contêm produtos de {seller.name}
        </p>
        <nav className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/vendedor"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Painel
          </Link>
          <Link
            to="/vendedor/produtos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Meus produtos
          </Link>
          <Link
            to="/vendedor/perguntas"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Perguntas
          </Link>
        </nav>
      </header>

      {orders.length === 0 ? (
        <div className="card grid place-items-center gap-2 rounded-lg p-10 text-center">
          <span className="text-3xl" aria-hidden>
            🧾
          </span>
          <p className="text-sm text-ink-soft">
            Nenhum pedido com seus produtos ainda. Assim que um cliente comprar
            algo da sua loja, ele aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const mine = sellerItems(o, seller.name);
            const mineTotal = mine.reduce((acc, it) => acc + it.price * it.qty, 0);
            const next = nextStatusOf(o.status);
            return (
              <li key={o.id} className="card rounded-lg p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-ink">
                        #{shortId(o.id)}
                      </span>
                      <span
                        className={`rounded-[3px] px-2 py-0.5 text-[11px] font-bold ${STATUS_CLS[o.status]}`}
                      >
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {formatDate(o.createdAt)} · {mine.length} item(ns) da sua
                      loja · cliente {o.address.name}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-black text-ink">
                      {formatBRL(mineTotal)}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      subtotal do seu bloco
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/pedidos/${o.id}`}
                      className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                    >
                      Ver pedido
                    </Link>
                    {next ? (
                      <button
                        type="button"
                        onClick={() => {
                          advanceOrderStatus(o.id);
                          setTick((t) => t + 1);
                        }}
                        className="btn-brand rounded-[6px] px-3 py-1.5 text-xs font-bold"
                      >
                        Avançar para “{STATUS_LABEL[next]}”
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-ink-soft">
                        {o.status === "delivered"
                          ? "Concluído"
                          : "Encerrado"}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {mine.map((it) => (
                    <li key={it.id} className="flex items-center gap-2 text-[11px] text-ink-soft">
                      <img
                        src={it.image}
                        alt={it.name}
                        width={24}
                        height={24}
                        loading="lazy"
                        className="size-6 rounded border border-line object-cover"
                      />
                      <span className="line-clamp-1 max-w-44">
                        {it.qty}× {it.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
