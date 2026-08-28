import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ratingSummary,
  reviewsFor,
  type Review,
} from "../data/reviews";
import Modal from "./Modal";
import { myReviewsFor } from "../lib/myReviews";
import { getReply } from "../lib/reviewReplies";
import { sortReviews, type ReviewSort } from "../lib/reviewSort";
import { getSeller } from "../data/sellers";
import { formatDate } from "../lib/format";
import SmartImage from "./SmartImage";
import { useToasts } from "../context/toastsCore";
import {
  REPORT_REASONS,
  reportReview,
  reportedIds,
  type ReportReason,
} from "../lib/reviewReports";
import { commentMentions, frequentTerms } from "../lib/reviewSummary";

const PER_PAGE = 3;
const STARS = [5, 4, 3, 2, 1];
const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "top", label: "Maior nota" },
  { value: "low", label: "Menor nota" },
  { value: "helpful", label: "Mais úteis" },
];

function photoUrl(ph: string, size: number) {
  return ph.startsWith("http")
    ? ph
    : `https://loremflickr.com/${size}/${size}/${ph}`;
}

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
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [term, setTerm] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const { toast } = useToasts();
  const [reported, setReported] = useState<Set<string>>(() => reportedIds());
  const [reporting, setReporting] = useState<string | null>(null);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [comment, setComment] = useState("");
  const [viewer, setViewer] = useState<{
    reviewId: string;
    index: number;
  } | null>(null);

  const viewerReview = viewer
    ? all.find((r) => r.id === viewer.reviewId)
    : undefined;
  const viewerPhotos = viewerReview?.photos ?? [];

  const step = useCallback(
    (dir: 1 | -1) =>
      setViewer((v) => {
        if (!v) return v;
        const n = all.find((r) => r.id === v.reviewId)?.photos?.length ?? 0;
        if (n === 0) return null;
        return { ...v, index: (v.index + dir + n) % n };
      }),
    [all]
  );

  useEffect(() => {
    if (!viewer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewer, step]);

  const verifiedIds = useMemo(
    () => new Set(myReviewsFor(productId).map((r) => r.id)),
    [productId]
  );
  const visibleComments = useMemo(
    () => all.filter((r) => !reported.has(r.id)).map((r) => r.comment),
    [all, reported]
  );
  const tags = useMemo(
    () => frequentTerms(visibleComments, 10),
    [visibleComments]
  );
  const filtered = all.filter(
    (r) =>
      !reported.has(r.id) &&
      (star === "todos" || r.rating === star) &&
      (!onlyPhotos || (r.photos?.length ?? 0) > 0) &&
      (!term || commentMentions(term, r.comment))
  );
  const sorted = useMemo(() => sortReviews(filtered, sort), [filtered, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const visible = sorted.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const pickStar = (s: number | "todos") => {
    setStar(s);
    setPage(0);
  };
  const pickSort = (s: ReviewSort) => {
    setSort(s);
    setPage(0);
  };
  const pickTerm = (w: string) => {
    setTerm((t) => (t === w ? null : w));
    setPage(0);
  };
  const toggleHelp = (id: string) =>
    setVoted((v) => (v[id] ? v : { ...v, [id]: true }));
  const helpfulOf = (r: Review) => r.helpful + (voted[r.id] ? 1 : 0);
  const openReport = (id: string) => {
    setReporting(id);
    setReason(REPORT_REASONS[0]);
    setComment("");
  };
  const submitReport = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reporting) return;
    const report = reportReview(productId, reporting, reason, comment);
    if (report) {
      setReported((s) => new Set(s).add(report.reviewId));
      toast.success("Denúncia enviada. A avaliação foi ocultada.");
    }
    setReporting(null);
    setComment("");
  };

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
          <div className="mb-3 flex flex-wrap items-center gap-2">
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
            <label htmlFor="ordem-avaliacao" className="text-sm text-ink-soft">
              Ordenar por:
            </label>
            <select
              id="ordem-avaliacao"
              value={sort}
              onChange={(e) => pickSort(e.target.value as ReviewSort)}
              className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={onlyPhotos}
                onChange={(e) => {
                  setOnlyPhotos(e.target.checked);
                  setPage(0);
                }}
                className="size-3.5 accent-[#EE4D2D]"
              />
              Somente com foto
            </label>
          </div>

          {tags.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink-soft">Mencionam:</span>
              {tags.map((t) => (
                <button
                  key={t.word}
                  type="button"
                  onClick={() => pickTerm(t.word)}
                  aria-pressed={term === t.word}
                  className={`rounded-[2px] border px-2 py-0.5 text-xs transition ${
                    term === t.word
                      ? "border-brand bg-brand font-semibold text-white"
                      : "border-line bg-white text-ink hover:border-brand hover:text-brand"
                  }`}
                >
                  {t.word}
                  <span className="ml-1 opacity-60">({t.count})</span>
                </button>
              ))}
              {term && (
                <button
                  type="button"
                  onClick={() => {
                    setTerm(null);
                    setPage(0);
                  }}
                  className="text-xs text-ink-soft underline underline-offset-2 transition hover:text-ink"
                >
                  limpar
                </button>
              )}
            </div>
          )}

          <ul className="space-y-4">
            {visible.map((r) => (
              <li key={r.id} className="border-b border-line pb-4 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {r.author}
                    {verifiedIds.has(r.id) && (
                      <span
                        className="rounded-[2px] border border-ship/40 bg-ship/10 px-1.5 py-0.5 text-[10px] font-semibold text-ship"
                        title="Avaliação de um pedido confirmado"
                      >
                        ✓ Compra verificada
                      </span>
                    )}
                  </span>
                  <Stars n={r.rating} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-ink-soft">{formatDate(r.date)}</p>
                  <button
                    type="button"
                    onClick={() => openReport(r.id)}
                    aria-expanded={reporting === r.id}
                    className="text-[11px] text-ink-soft/70 transition hover:text-ink"
                  >
                    ⚑ Denunciar
                  </button>
                </div>
                {reporting === r.id && (
                  <form
                    onSubmit={submitReport}
                    className="mt-2 rounded-[3px] border border-line bg-brand-soft/30 p-2.5"
                  >
                    <label
                      htmlFor={`motivo-denuncia-${r.id}`}
                      className="text-xs font-semibold text-ink"
                    >
                      Motivo da denúncia
                    </label>
                    <select
                      id={`motivo-denuncia-${r.id}`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value as ReportReason)}
                      className="mt-1 w-full rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                    >
                      {REPORT_REASONS.map((rs) => (
                        <option key={rs} value={rs}>
                          {rs}
                        </option>
                      ))}
                    </select>
                    <label
                      htmlFor={`detalhe-denuncia-${r.id}`}
                      className="mt-2 block text-xs text-ink-soft"
                    >
                      Descreva o problema (opcional)
                    </label>
                    <textarea
                      id={`detalhe-denuncia-${r.id}`}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReporting(null)}
                        className="rounded border border-line px-3 py-1 text-xs text-ink-soft transition hover:text-ink"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="rounded bg-brand px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-dark"
                      >
                        Enviar denúncia
                      </button>
                    </div>
                  </form>
                )}
                <p className="mt-2 text-sm text-ink">{r.comment}</p>
                {r.photos && r.photos.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {r.photos.map((ph, i) => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => setViewer({ reviewId: r.id, index: i })}
                        aria-label={`Ampliar foto ${i + 1} da avaliação de ${r.author}`}
                        className="block"
                      >
                        <SmartImage
                          src={photoUrl(ph, 80)}
                          alt={`Foto de avaliação de ${r.author}`}
                          width={80}
                          height={80}
                          className="size-14 rounded object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                {(() => {
                  const reply = getReply(r.id);
                  if (!reply) return null;
                  const shop = getSeller(reply.sellerId)?.name;
                  return (
                    <div className="mt-2 rounded-[3px] border border-line bg-brand-soft/40 px-3 py-2">
                      <p className="text-[11px] font-bold text-ink-soft">
                        Resposta da loja{shop ? ` · ${shop}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-ink">{reply.text}</p>
                    </div>
                  );
                })()}
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

      <Modal
        open={!!viewer && viewerPhotos.length > 0}
        onClose={() => setViewer(null)}
        title={
          viewerReview
            ? `Fotos da avaliação de ${viewerReview.author}`
            : "Fotos da avaliação"
        }
        maxW="max-w-2xl"
      >
        {viewer && viewerPhotos.length > 0 && (
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Foto anterior"
                className="card shrink-0 rounded-lg px-3 py-4 text-lg font-bold text-ink transition hover:text-brand"
              >
                ‹
              </button>
              <div className="flex min-w-0 flex-1 items-center justify-center bg-black/5">
                <SmartImage
                  src={photoUrl(viewerPhotos[viewer.index], 800)}
                  alt={`Foto ampliada da avaliação de ${viewerReview?.author ?? ""}`}
                  width={800}
                  height={800}
                  className="max-h-[70vh] w-auto rounded object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Próxima foto"
                className="card shrink-0 rounded-lg px-3 py-4 text-lg font-bold text-ink transition hover:text-brand"
              >
                ›
              </button>
            </div>
            <p className="mt-3 text-center text-sm text-ink-soft">
              {viewer.index + 1} de {viewerPhotos.length}
            </p>
          </div>
        )}
      </Modal>
    </section>
  );
}
