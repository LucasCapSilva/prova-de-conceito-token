import { Link } from "react-router-dom";
import {
  effectiveStatus,
  getReturns,
  RETURN_STATUS_LABEL,
  returnTimeline,
  type ReturnRequest,
} from "../lib/returns";
import { formatDate } from "../lib/format";
import SmartImage from "../components/SmartImage";
import EmptyState from "../components/EmptyState";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ r }: { r: ReturnRequest }) {
  const s = effectiveStatus(r);
  const tone: Record<string, string> = {
    aberta: "bg-brand-soft text-brand",
    analise: "bg-star/40 text-ink",
    aprovada: "bg-ship/15 text-ship",
    concluida: "bg-line text-ink-soft",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-[11px] font-bold ${tone[s]}`}
    >
      {RETURN_STATUS_LABEL[s]}
    </span>
  );
}

export default function Returns() {
  const returns = getReturns();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Minhas devoluções
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {returns.length === 0
            ? "Você ainda não solicitou nenhuma devolução."
            : `${returns.length} solicitação${returns.length === 1 ? "" : "ões"} no total.`}
        </p>
      </div>

      {returns.length === 0 ? (
        <EmptyState
          icon="return"
          title="Nenhuma devolução ainda"
          message="Quando você solicitar a devolução de um item de um pedido entregue, ela aparece aqui com o protocolo e a linha do tempo."
          cta={{ to: "/pedidos", label: "Ver meus pedidos" }}
        />
      ) : (
        <ul className="space-y-3">
          {returns.map((r) => (
            <li key={r.id} className="card rounded-lg p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-md">
                    <SmartImage
                      src={r.image}
                      alt={r.itemName}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-ink-soft">
                        Protocolo {r.protocol}
                      </span>
                      <StatusBadge r={r} />
                    </div>
                    <Link
                      to={`/produto/${r.productId}`}
                      className="mt-1 block truncate text-sm font-bold text-ink hover:text-brand"
                    >
                      {r.itemName}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      Motivo: {r.reason} · Solicitada em {formatDate(r.createdAt)}
                    </p>
                    <Link
                      to={`/pedidos/${r.orderId}`}
                      className="mt-1 inline-block text-xs font-semibold text-brand hover:underline"
                    >
                      Ver pedido →
                    </Link>
                  </div>
                </div>
                <ol className="w-full shrink-0 space-y-2 sm:w-56">
                  {returnTimeline(r).map((ev) => (
                    <li key={ev.label} className="flex items-start gap-2">
                      <span
                        className={`mt-1 size-2 shrink-0 rounded-full ${
                          ev.done ? "bg-ship" : "bg-line"
                        }`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold ${
                            ev.done ? "text-ink" : "text-ink-soft/60"
                          }`}
                        >
                          {ev.label}
                        </p>
                        <p className="text-[11px] text-ink-soft">
                          {formatDate(ev.date)} às {timeOf(ev.date)}
                          {!ev.done && " · previsto"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
