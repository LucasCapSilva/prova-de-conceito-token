import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import SellerGate from "../components/SellerGate";
import { PRODUCTS } from "../data/products";
import { reviewsFor, type Review } from "../data/reviews";
import { myReviewsFor } from "../lib/myReviews";
import { getReply, saveReply } from "../lib/reviewReplies";
import { formatDate } from "../lib/format";
import { useToasts } from "../context/toastsCore";

const PER_PAGE = 8;

function Stars({ n }: { n: number }) {
  return (
    <span className="text-xs text-star" aria-label={`${n} de 5 estrelas`}>
      {"★".repeat(Math.max(0, Math.min(5, n)))}
    </span>
  );
}

interface Entry {
  review: Review;
  product: string;
}

export default function SellerReviews() {
  const { user } = useAuth();
  const { toast } = useToasts();
  const [star, setStar] = useState<number | "todos">("todos");
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [, setTick] = useState(0);

  const seller = user?.sellerId ? getSeller(user.sellerId) : undefined;

  const all: Entry[] = useMemo(() => {
    if (!seller) return [];
    const out: Entry[] = [];
    for (const p of PRODUCTS.filter((x) => x.sellerId === seller.id)) {
      for (const r of [...myReviewsFor(p.id), ...reviewsFor(p.id)]) {
        out.push({ review: r, product: p.name });
      }
    }
    out.sort((a, b) => b.review.date.localeCompare(a.review.date));
    return out;
  }, [seller]);

  const filtered =
    star === "todos"
      ? all
      : all.filter((e) => e.review.rating === star);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const slice = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  if (!user?.sellerId || !seller) {
    return (
      <SellerGate
        icon="⭐"
        title="Avaliações recebidas"
        description="Veja as avaliações dos seus produtos e responda publicamente."
      />
    );
  }

  function replyFor(id: string): string {
    return drafts[id] ?? getReply(id)?.text ?? "";
  }

  function submitReply(reviewId: string) {
    const text = replyFor(reviewId);
    if (!text.trim()) {
      toast.error("Escreva a resposta antes de salvar.");
      return;
    }
    saveReply(seller!.id, reviewId, text);
    setDrafts((d) => {
      const next = { ...d };
      delete next[reviewId];
      return next;
    });
    setTick((t) => t + 1);
    toast.success("Resposta publicada sob a avaliação.");
  }

  function clearReply(reviewId: string) {
    saveReply(seller!.id, reviewId, "");
    setDrafts((d) => {
      const next = { ...d };
      delete next[reviewId];
      return next;
    });
    setTick((t) => t + 1);
    toast.info("Resposta removida.");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">
          Painel do vendedor
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Avaliações recebidas
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Avaliações dos produtos de {seller.name}. Suas respostas aparecem
          publicamente sob cada avaliação.
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
            to="/vendedor/pedidos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Pedidos
          </Link>
          <Link
            to="/vendedor/perguntas"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Perguntas
          </Link>
          <Link
            to="/vendedor/promos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Promoções
          </Link>
          <Link
            to="/vendedor/cupons"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Cupons
          </Link>
        </nav>
      </header>

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
        <p className="text-sm text-ink-soft">
          <span className="font-bold text-ink">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "avaliação" : "avaliações"}
        </p>
        <label className="text-[11px] font-semibold text-ink-soft">
          Filtrar por nota
          <select
            value={String(star)}
            onChange={(e) => {
              const v = e.target.value;
              setStar(v === "todos" ? "todos" : Number(v));
              setPage(1);
            }}
            className="mt-1 rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
          >
            <option value="todos">Todas</option>
            <option value="5">5 estrelas</option>
            <option value="4">4 estrelas</option>
            <option value="3">3 estrelas</option>
            <option value="2">2 estrelas</option>
            <option value="1">1 estrela</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="card rounded-lg p-12 text-center text-sm text-ink-soft">
          Nenhuma avaliação com esse filtro.
        </div>
      ) : (
        <div className="space-y-4">
          {slice.map(({ review: r, product }) => {
            const existing = getReply(r.id);
            const draft = drafts[r.id];
            return (
              <article key={r.id} className="card rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Stars n={r.rating} />
                    <p className="mt-1 text-xs text-ink-soft">
                      {r.author} · {formatDate(r.date)}
                    </p>
                  </div>
                  <Link
                    to={`/produto/${r.productId}`}
                    className="max-w-[260px] truncate text-xs font-semibold text-brand hover:underline"
                    title={product}
                  >
                    {product}
                  </Link>
                </div>
                <p className="mt-2 text-sm text-ink">{r.comment}</p>
                {r.photos && r.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.photos.map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 rounded-[3px] border border-line object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="mt-3 border-t border-line pt-3">
                  <label className="text-[11px] font-semibold text-ink-soft">
                    Resposta pública da loja
                    <textarea
                      value={draft ?? existing?.text ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                      }
                      rows={2}
                      placeholder="Escreva uma resposta (aparece sob a avaliação)…"
                      className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
                    />
                  </label>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => submitReply(r.id)}
                      className="btn-brand rounded-[6px] px-3 py-1.5 text-xs font-bold"
                    >
                      {existing ? "Atualizar resposta" : "Publicar resposta"}
                    </button>
                    {existing && (
                      <button
                        type="button"
                        onClick={() => clearReply(r.id)}
                        className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-red-400 hover:text-red-600"
                      >
                        Remover resposta
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {pages > 1 && (
            <nav
              className="flex flex-wrap items-center justify-center gap-2"
              aria-label="Paginação de avaliações"
            >
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === safePage ? "page" : undefined}
                  className={`h-8 min-w-8 rounded-[6px] border px-2 text-xs font-bold transition ${
                    n === safePage
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white text-ink hover:border-brand hover:text-brand"
                  }`}
                >
                  {n}
                </button>
              ))}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
