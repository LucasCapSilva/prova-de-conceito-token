import { useState } from "react";
import { Link } from "react-router-dom";
import { getSeller } from "../data/sellers";
import { getFollows } from "../lib/follows";
import {
  lastNovidadesSeen,
  isNovidadeUnread,
  markNovidadesSeen,
  novidadesFeed,
} from "../lib/novidades";
import { formatDate, formatBRL } from "../lib/format";
import { useToasts } from "../context/toastsCore";
import SmartImage from "../components/SmartImage";
import EmptyState from "../components/EmptyState";

const KIND_LABEL: Record<string, string> = {
  lancamento: "Lançamento",
  promocao: "Promoção",
  resposta: "Atendimento",
};

export default function Novidades() {
  const [follows] = useState<string[]>(() => getFollows());
  const [seen, setSeen] = useState<number>(() => lastNovidadesSeen());
  const { toast } = useToasts();

  const feed = novidadesFeed(follows);
  const unread = feed.filter((n) => isNovidadeUnread(n, seen)).length;

  const markAll = () => {
    markNovidadesSeen();
    setSeen(lastNovidadesSeen());
    toast.success("Tudo marcado como lido.");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">Minha conta</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Novidades das lojas seguidas
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Lançamentos, promoções e respostas das lojas que você segue.
        </p>
      </header>

      {follows.length === 0 ? (
        <EmptyState
          icon="store"
          title="Nenhuma loja seguida"
          message="Siga lojas para ver lançamentos, promoções e novidades delas aqui."
          cta={{ to: "/lojas-seguidas", label: "Ver lojas seguidas" }}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-ink-soft">
              {unread > 0 ? `${unread} novidade(s) não lida(s)` : "Tudo lido"}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                Marcar tudo como lido
              </button>
            )}
          </div>
          <ol className="space-y-3">
            {feed.map((n) => {
              const seller = getSeller(n.sellerId);
              const fresh = isNovidadeUnread(n, seen);
              return (
                <li
                  key={n.id}
                  className={`card rounded-lg p-4 ${
                    fresh ? "ring-1 ring-brand/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {seller && (
                      <SmartImage
                        src={seller.logo}
                        alt={seller.name}
                        width={200}
                        height={200}
                        className="size-11 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold text-ink">
                          {seller?.name ?? "Loja"}
                        </p>
                        <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold text-brand">
                          {KIND_LABEL[n.kind]}
                        </span>
                        {fresh && (
                          <span className="size-2 rounded-full bg-brand" aria-label="Não lida" />
                        )}
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-ink">
                        {n.title}
                      </h3>
                      <p className="mt-1 text-xs text-ink-soft">{n.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <time className="text-[11px] text-ink-soft">
                          {formatDate(n.date)}
                        </time>
                        {n.product && (
                          <Link
                            to={`/produto/${n.product.id}`}
                            className="text-xs font-semibold text-brand hover:text-brand-dark"
                          >
                            Ver produto
                          </Link>
                        )}
                        {n.kind === "promocao" && n.product?.oldPrice && (
                          <span className="text-xs font-bold text-brand">
                            {formatBRL(n.product.price)}
                            <span className="ml-1 font-normal text-ink-soft line-through">
                              {formatBRL(n.product.oldPrice)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
