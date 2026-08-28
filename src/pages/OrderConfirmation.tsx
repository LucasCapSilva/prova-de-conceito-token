import { Link, useParams } from "react-router-dom";
import type { ElementType } from "react";
import { useMotion } from "../lib/motion";
import { getOrder } from "../lib/orders";
import { slotLabel } from "../lib/schedule";
import { formatBRL } from "../lib/format";
import SmartImage from "../components/SmartImage";

function etaLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const order = id ? getOrder(id) : undefined;
  const m = useMotion();
  const Panel: ElementType = m ? m.motion.div : "div";
  const Badge: ElementType = m ? m.motion.span : "span";

  if (!order) {
    return (
      <section className="mx-auto max-w-6xl px-4 pt-32 pb-12 text-center">
        <h1 className="text-2xl font-black text-ink">Pedido não encontrado</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Não achamos esse pedido. Ele pode ter sido criado em outro navegador.
        </p>
        <Link
          to="/produtos"
          className="mt-6 inline-block rounded-md bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Ver produtos
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-12 sm:pt-28">
      <Panel
        {...(m
          ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }
          : {})}
        className="card p-6"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Badge
            {...(m
              ? {
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  transition: { type: "spring", stiffness: 260, damping: 16 },
                }
              : {})}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-ship text-2xl text-white"
          >
            ✓
          </Badge>
          <h1 className="mt-4 text-2xl font-black text-ink">
            Pedido confirmado!
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Obrigado pela compra. Enviamos os detalhes por e-mail para{" "}
            {order.address.name}.
          </p>
          <span className="mt-3 rounded-full bg-brand-soft px-3 py-1 text-xs font-black text-brand">
            Nº {order.id}
          </span>
        </div>

        <div className="mb-5 grid gap-3 rounded-md border border-line p-3 sm:grid-cols-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-ink-soft">
              Status
            </p>
            <p className="text-sm font-bold text-ship">Pedido confirmado</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-ink-soft">
              {order.pickup
                ? "Pronto para retirada"
                : order.schedule
                  ? "Entrega agendada"
                  : "Entrega estimada"}
            </p>
            <p className="text-sm font-bold text-ink">
              {etaLabel(order.estimatedDate)}
              {order.schedule && (
                <span className="block text-xs font-medium text-ink-soft">
                  {slotLabel(order.schedule.slot)}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-ink-soft">
              Rastreio
            </p>
            <p className="text-sm font-bold text-ink">{order.tracking}</p>
          </div>
        </div>

        {order.pickup && (
          <div className="mb-5 rounded-md border border-line p-3">
            <p className="text-xs font-black uppercase tracking-wide text-ink-soft">
              Ponto de coleta
            </p>
            <p className="mt-1 text-sm font-bold text-ink">
              {order.pickup.point.name}
            </p>
            <p className="text-xs text-ink-soft">
              {order.pickup.point.street}, {order.pickup.point.number} —{" "}
              {order.pickup.point.neighborhood},{" "}
              {order.pickup.point.city}/{order.pickup.point.state} — CEP{" "}
              {order.pickup.point.cep}
            </p>
            <p className="text-xs text-ink-soft">
              Funcionamento: {order.pickup.point.hours}
            </p>
            <p className="mt-1 text-xs font-bold text-ship">
              Retire com um documento com foto. Frete grátis.
            </p>
          </div>
        )}

        {order.gift && (
          <div className="mb-5 rounded-md border border-brand/40 bg-brand-soft p-3">
            <p className="text-sm font-bold text-ink">
              🎁 Embrulho para presente
            </p>
            {order.gift.message ? (
              <p className="mt-1 text-xs italic text-ink-soft">
                “{order.gift.message}”
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-soft">
                O pedido será embalado como presente.
              </p>
            )}
          </div>
        )}

        <h2 className="mb-2 text-sm font-black text-ink">Itens do pedido</h2>
        <ul className="mb-5 divide-y divide-line rounded-md border border-line">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 p-3">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded bg-line">
                <SmartImage
                  src={it.image}
                  alt={it.name}
                  className="h-12 w-12 object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {it.name}
                </p>
                <p className="text-xs text-ink-soft">
                  {it.seller} · {it.qty} un
                </p>
              </div>
              <span className="text-sm font-bold text-ink">
                {formatBRL(it.price * it.qty)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mx-auto mb-6 max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="text-ink">{formatBRL(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-ship">
              <dt>Descontos</dt>
              <dd className="font-bold">−{formatBRL(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-soft">Frete</dt>
            <dd className="text-ink">
              {order.shipping > 0 ? formatBRL(order.shipping) : "Grátis"}
            </dd>
          </div>
          {order.gift && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Embrulho presente</dt>
              <dd className="text-ink">{formatBRL(order.gift.fee)}</dd>
            </div>
          )}
          {order.schedule && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Agendamento de entrega</dt>
              <dd className="text-ink">{formatBRL(order.schedule.fee)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-line pt-2 text-base">
            <dt className="font-black text-ink">Total</dt>
            <dd className="font-black text-brand">{formatBRL(order.total)}</dd>
          </div>
          <p className="pt-1 text-xs text-ink-soft">
            Pagamento: {order.payment}
          </p>
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/produtos"
            className="flex-1 rounded-md bg-brand px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Continuar comprando
          </Link>
          <Link
            to="/pedidos"
            className="flex-1 rounded-md border border-line px-5 py-2.5 text-center text-sm font-bold text-ink transition hover:border-brand/40"
          >
            Meus pedidos
          </Link>
        </div>
      </Panel>
    </div>
  );
}
