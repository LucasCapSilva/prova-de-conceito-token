interface Props {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

function pageNumbers(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, Math.min(page - 1, pages - 2));
  const end = Math.min(pages - 1, Math.max(page + 1, 2));
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

export default function Pagination({ page, pages, onChange }: Props) {
  if (pages <= 1) return null;
  const btn =
    "grid size-9 place-items-center rounded-[4px] border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const idle = `${btn} border-line bg-surface text-ink hover:border-brand hover:text-brand disabled:hover:border-line disabled:hover:text-ink`;
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Paginação">
      <button
        className={idle}
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        ‹
      </button>
      {pageNumbers(page, pages).map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-ink-soft">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={
              n === page
                ? `${btn} border-brand bg-brand text-white`
                : idle
            }
          >
            {n}
          </button>
        )
      )}
      <button
        className={idle}
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        aria-label="Próxima página"
      >
        ›
      </button>
    </nav>
  );
}
