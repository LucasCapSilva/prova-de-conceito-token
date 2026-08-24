import { useMemo, useState } from "react";
import {
  ratingSummary,
  reviewsFor,
  type Review,
} from "../data/reviews";
import { myReviewsFor } from "../lib/myReviews";
import { formatDate } from "../lib/format";
import SmartImage from "./SmartImage";

const PER_PAGE = 3;
const STARS = [5, 4, 3, 2, 1];

function Stars({ n }: { n: number }) {
  return (
    <span className="text-xs text-star" aria-label={`${n} de 5 estrelas`}>
      {"★".repeat(n)}
    </span>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { total, avg, counts } = useMemo(
    () => ratingSummary(productId),
    [productId]
  );
  const all = useMemo(
    () => [...myReviewsFor(productId), ...reviewsFor(productId)],
    [productId]
  );
  const [star, setStar] = useState<number | "todos">("todos");
  const [page, setPage] = useState(0);
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  const filtered =
    star === "todos" ? all : all.filter((r) => r.rating === star);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const pickStar = (s: number | "todos") => {
    setStar(s);
    setPage(0);
  };
  const toggleHelp = (id: string) =>
    setVoted((v) => (v[id] ? v : { ...v, [id]: true }));
  const helpfulOf = (r: Review) => r.helpful + (voted[r.id] ? 1 : 0);

  return (
    <section className="card mt-10 rounded-lg p-5">
      <h2 className="text-lg font-bold text-ink">Avaliações do produto</h2>

      <div className="mt-4 grid gap-6 md:grid-cols-[220px_1fr]">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-extrabold text-ink">
              {avg.toFixed(1)}
            </span>
            <span className="pb-1 text-sm text-ink-soft">de 5</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {total} avaliação{total === 1 ? "" : "es"}
          </p>

          <div className="mt-4 space-y-2">
            {counts.map(({ star: s, count }) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickStar(star === s ? "todos" : s)}
                  aria-pressed={star === s}
                  aria-label={`${s} estrelas`}
                  className={`flex w-full items-center gap-2 text-xs transition ${
                    star === s ? "opacity-100" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <span className="w-6 text-right text-ink">{s}</span>
                  <Stars n={s} />
                  <span className="h-2 flex-1 overflow-hidden rounded bg-line">
                    <span
                      className="block h-full rounded bg-star"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-8 text-ink-soft">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <label htmlFor="filtro-avaliacao" className="text-sm text-ink-soft">
              Filtrar por:
            </label>
            <select
              id="filtro-avaliacao"
              value={String(star)}
              onChange={(e) =>
                pickStar(e.target.value === "todos" ? "todos" : Number(e.target.value))
              }
              className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
            >
              <option value="todos">Todas</option>
              {STARS.map((s) => (
                <option key={s} value={s}>
                  {s} ★
                </option>
              ))}
            </select>
          </div>

          <ul className="space-y-4">
            {visible.map((r) => (
              <li key={r.id} className="border-b border-line pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">
                    {r.author}
                  </span>
                  <Stars n={r.rating} />
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {formatDate(r.date)}
                </p>
                <p className="mt-2 text-sm text-ink">{r.comment}</p>
                {r.photos && r.photos.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {r.photos.map((ph) => (
                      <SmartImage
                        key={ph}
                        src={
                          ph.startsWith("http")
                            ? ph
                            : `https://loremflickr.com/80/80/${ph}`
                        }
                        alt={`Foto de avaliação`}
                        className="size-14 rounded object-cover"
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  disabled={!!voted[r.id]}
                  onClick={() => toggleHelp(r.id)}
                  className={`mt-2 text-xs font-medium ${
                    voted[r.id]
                      ? "cursor-default text-ship"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {voted[r.id]
                    ? `Ajudou ${helpfulOf(r)} pessoas`
                    : `Útil (${helpfulOf(r)})`}
                </button>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-sm">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
                className="rounded border border-line px-3 py-1 text-ink disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-ink-soft">
                {safePage + 1} / {pages}
              </span>
              <button
                type="button"
                disabled={safePage === pages - 1}
                onClick={() => setPage(safePage + 1)}
                className="rounded border border-line px-3 py-1 text-ink disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
